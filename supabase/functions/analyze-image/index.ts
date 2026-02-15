import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional image quality analyst. Analyze the provided image and return a JSON assessment. Be concise and precise. Answer in Portuguese (BR).

Return ONLY valid JSON with this exact structure:
{
  "quality_score": <number 1-10>,
  "resolution_estimate": "<e.g. 720p, 1080p, low>",
  "issues": ["<issue1>", "<issue2>"],
  "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
  "details": {
    "sharpness": "<baixa|média|alta>",
    "noise_level": "<baixo|médio|alto>",
    "lighting": "<subexposta|equilibrada|superexposta>",
    "colors": "<desbotadas|naturais|saturadas>",
    "compression": "<sem artefatos|artefatos leves|artefatos visíveis>"
  }
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image quality in detail." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde." }), {
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
      return new Response(JSON.stringify({ error: "Erro na análise." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse analysis JSON:", content);
      analysis = {
        quality_score: 5,
        resolution_estimate: "desconhecida",
        issues: ["Não foi possível analisar completamente"],
        suggestions: ["Tente enviar a imagem novamente"],
        details: {
          sharpness: "média",
          noise_level: "médio",
          lighting: "equilibrada",
          colors: "naturais",
          compression: "artefatos leves"
        }
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
