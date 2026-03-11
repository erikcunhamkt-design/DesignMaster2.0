import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, environment, visualStyle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const context = [
      niche && `nicho: ${niche}`,
      environment && `ambiente: ${environment}`,
      visualStyle && `estilo visual: ${visualStyle}`,
    ].filter(Boolean).join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          {
            role: "system",
            content: `Você é um diretor de arte especializado em paletas de cores para anúncios cinematográficos. Responda APENAS com JSON válido, sem markdown.`,
          },
          {
            role: "user",
            content: `Gere uma paleta de 3 cores (hex) para um anúncio com estas características: ${context || "uso geral, moderno e profissional"}.

Retorne JSON exato:
{"ambient":"#HEXHEX","rim":"#HEXHEX","fill":"#HEXHEX","rationale":"explicação curta em pt-BR"}

As cores devem ser harmônicas, com bom contraste para iluminação cinematográfica (ambient = cor dominante do ambiente, rim = luz de recorte/contorno, fill = luz complementar de preenchimento).`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido, tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const palette = JSON.parse(jsonMatch[0]);

    // Validate hex colors
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(palette.ambient) || !hexRegex.test(palette.rim) || !hexRegex.test(palette.fill)) {
      throw new Error("Invalid hex colors from AI");
    }

    return new Response(JSON.stringify(palette), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-palette error:", e);
    // Fallback palette
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
