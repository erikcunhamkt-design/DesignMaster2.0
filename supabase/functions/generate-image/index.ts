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
    const { prompt, negativePrompt, referenceImages, googleApiKey } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256 || googleApiKey.split(' ').length > 5) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida. Verifique se você colou apenas a chave." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const model = "gemini-3.1-pro-image-preview";
    const hasReferenceImages = referenceImages && referenceImages.length > 0;

    const edgeFillInstruction = "CRITICAL FRAMING RULE: The generated image MUST fill 100% of the canvas from edge to edge. There must be ZERO empty space, ZERO solid color bars, ZERO letterboxing, ZERO padding, ZERO blank areas at top, bottom, left or right. The subject and background must extend fully to every single edge of the image. If the image has a background scene, it must continue all the way to every border. Never crop the image short or leave any portion unfilled.";

    const fullPrompt = hasReferenceImages
      ? `${edgeFillInstruction}\n\n${prompt}${negativePrompt ? `\n\nAvoid: ${negativePrompt}` : ""}`
      : `${edgeFillInstruction}\n\n${prompt}${negativePrompt ? `\n\nAvoid: ${negativePrompt}` : ""}`;

    // Build parts: images FIRST (if any), then text — required for image editing
    const parts: any[] = [];

    if (hasReferenceImages) {
      for (const refImg of referenceImages.slice(0, 3)) {
        const match = refImg.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
    }

    parts.push({ text: fullPrompt });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    console.log(`Calling Google Gemini ${model} directly...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
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
      if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: "Requisição inválida. Verifique o prompt e tente novamente." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API Key sem permissão. Verifique se a key tem acesso à API Gemini." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Erro na API do Google: ${response.status}. Tente novamente.` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Extract image from Google's response format
    let imageUrl: string | null = null;
    let textResponse = "";

    const candidates = data.candidates;
    if (candidates && candidates.length > 0) {
      const contentParts = candidates[0]?.content?.parts || [];
      for (const part of contentParts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        if (part.text) {
          textResponse += part.text;
        }
      }
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente com outro prompt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, text: textResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
