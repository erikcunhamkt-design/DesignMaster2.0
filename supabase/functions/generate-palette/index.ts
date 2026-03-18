const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, environment, visualStyle, googleApiKey } = await req.json();

    if (!googleApiKey) {
      return new Response(JSON.stringify({ error: "API Key do Google não fornecida." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = [
      niche && `nicho: ${niche}`,
      environment && `ambiente: ${environment}`,
      visualStyle && `estilo visual: ${visualStyle}`,
    ].filter(Boolean).join(", ");

    const systemPrompt = `Você é um diretor de arte especializado em paletas de cores para anúncios cinematográficos. Responda APENAS com JSON válido, sem markdown.`;
    const userPrompt = `Gere uma paleta de 3 cores (hex) para um anúncio com estas características: ${context || "uso geral, moderno e profissional"}.

Retorne JSON exato:
{"ambient":"#HEXHEX","rim":"#HEXHEX","fill":"#HEXHEX","rationale":"explicação curta em pt-BR"}

As cores devem ser harmônicas, com bom contraste para iluminação cinematográfica (ambient = cor dominante do ambiente, rim = luz de recorte/contorno, fill = luz complementar de preenchimento).`;

    const model = "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido, tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const palette = JSON.parse(jsonMatch[0]);

    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(palette.ambient) || !hexRegex.test(palette.rim) || !hexRegex.test(palette.fill)) {
      throw new Error("Invalid hex colors from AI");
    }

    return new Response(JSON.stringify(palette), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-palette error:", e);
    const fallback = {
      ambient: "#8B5CF6",
      rim: "#3B82F6",
      fill: "#F59E0B",
      rationale: "Paleta padrão cinematográfica (violeta/azul/âmbar).",
    };
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
