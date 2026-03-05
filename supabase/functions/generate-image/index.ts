import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateWithGoogleDirect(prompt: string, parts: any[], googleApiKey: string) {
  const model = "gemini-3.1-pro-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  console.log(`Calling Google Gemini ${model} directly...`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google API error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Limite de requisições excedido na API do Google. Aguarde e tente novamente." };
    if (response.status === 400) throw { status: 400, message: "Requisição inválida. Verifique o prompt e tente novamente." };
    if (response.status === 403) throw { status: 403, message: "API Key sem permissão. Verifique se a key tem acesso à API Gemini." };
    throw { status: 500, message: `Erro na API do Google: ${response.status}. Tente novamente.` };
  }

  const data = await response.json();
  let imageUrl: string | null = null;
  let textResponse = "";
  const candidates = data.candidates;
  if (candidates && candidates.length > 0) {
    for (const part of (candidates[0]?.content?.parts || [])) {
      if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      if (part.text) textResponse += part.text;
    }
  }
  return { imageUrl, textResponse };
}

async function generateWithLovableGateway(prompt: string, referenceImages: string[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw { status: 500, message: "LOVABLE_API_KEY não configurado." };

  console.log("Calling Lovable AI Gateway with gemini-2.5-flash-image...");

  const content: any[] = [];
  // Add reference images first
  for (const refImg of (referenceImages || []).slice(0, 3)) {
    if (refImg.startsWith("data:")) {
      content.push({ type: "image_url", image_url: { url: refImg } });
    }
  }
  content.push({ type: "text", text: prompt });

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI gateway error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Limite de requisições excedido. Aguarde e tente novamente." };
    if (response.status === 402) throw { status: 402, message: "Créditos insuficientes. Adicione créditos ao workspace." };
    throw { status: 500, message: `Erro no gateway de IA: ${response.status}. Tente novamente.` };
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
  const textResponse = data.choices?.[0]?.message?.content || "";
  return { imageUrl, textResponse };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, negativePrompt, referenceImages, googleApiKey, aiModel } = await req.json();
    const useFlash = aiModel === "flash";

    // For pro model, require Google API key
    if (!useFlash) {
      if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256 || googleApiKey.split(' ').length > 5) {
        return new Response(
          JSON.stringify({ error: "API Key do Google não fornecida ou inválida. Verifique se você colou apenas a chave." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const edgeFillInstruction = "CRITICAL FRAMING RULE: The generated image MUST fill 100% of the canvas from edge to edge. There must be ZERO empty space, ZERO solid color bars, ZERO letterboxing, ZERO padding, ZERO blank areas at top, bottom, left or right. The subject and background must extend fully to every single edge of the image.";

    const fullPrompt = `${edgeFillInstruction}\n\n${prompt}${negativePrompt ? `\n\nAvoid: ${negativePrompt}` : ""}`;

    let result: { imageUrl: string | null; textResponse: string };

    if (useFlash) {
      result = await generateWithLovableGateway(fullPrompt, referenceImages || []);
    } else {
      // Build parts for Google direct API
      const parts: any[] = [];
      if (referenceImages && referenceImages.length > 0) {
        for (const refImg of referenceImages.slice(0, 3)) {
          const match = refImg.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          }
        }
      }
      parts.push({ text: fullPrompt });
      result = await generateWithGoogleDirect(fullPrompt, parts, googleApiKey);
    }

    if (!result.imageUrl) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente com outro prompt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl: result.imageUrl, text: result.textResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("generate-image error:", error);
    const status = error?.status || 500;
    const message = error?.message || (error instanceof Error ? error.message : "Erro desconhecido");
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
