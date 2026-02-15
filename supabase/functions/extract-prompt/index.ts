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
    const { imageBase64, replicateOptions, extraInstruction, googleApiKey } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const replicateHints = replicateOptions && replicateOptions.length > 0
      ? `\nFocus especially on extracting: ${replicateOptions.join(", ")}.`
      : "";

    const extraHint = extraInstruction
      ? `\nAdditional user instruction: ${extraInstruction}`
      : "";

    const systemPrompt = `You are an expert image prompt analyst. Given an image, analyze it in extreme detail and produce a structured JSON response describing how to recreate it with an AI image generator.

Your response MUST be a valid JSON object with exactly these fields:
{
  "prompt": "A detailed prompt describing the image: subject, scene, lighting, composition, camera lens/angle, colors, mood, textures, style, effects. Be very specific and technical.",
  "negative_prompt": "Things to avoid to get a clean result similar to this image.",
  "suggested_settings": {
    "width": <number>,
    "height": <number>,
    "quality": "high",
    "style_tags": ["tag1", "tag2", ...]
  },
  "notes": ["Any observations about the image that would help recreate it."]
}

Style tags should be from: ultra realista, glow, glassmorphism, cartoon, gamer, cinematic, editorial, retrato profissional, minimalista, tecnológico, elegante, lúdico.${replicateHints}${extraHint}

Respond ONLY with the JSON object, no markdown, no code blocks.`;

    // Extract base64 data from data URL
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    const parts: any[] = [{ text: systemPrompt }];

    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    } else {
      // If it's already raw base64 or a URL, send as text reference
      parts.push({ text: `Analyze this image: ${imageBase64.substring(0, 100)}...` });
    }

    const model = "gemini-3-pro-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    console.log(`Calling Google Gemini ${model} for prompt extraction...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido na API do Google. Aguarde e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API Key sem permissão. Verifique se a key tem acesso à API Gemini." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Erro na API do Google: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let extracted;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Não foi possível analisar a imagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(extracted),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-prompt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
