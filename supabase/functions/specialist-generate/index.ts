import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_SYSTEM = `You are the world's best product photography specialist for e-commerce and premium packshots.
Generate a professional product photograph with the following requirements:
- Studio-quality lighting setup (three-point or specified)
- Controlled shadows for depth and dimension
- Faithful material representation (textures, reflections, transparency)
- Clean, distraction-free composition
- E-commerce ready framing with proper negative space
- Ultra-sharp focus on the product
- Professional post-production quality
- 8K photorealistic rendering, no AI artifacts
- NO real humans in the image
- Output should look like a real studio photograph, not AI-generated
- The artwork MUST fill the ENTIRE canvas edge to edge — no blur borders, no letterboxing, no empty space, no padding`;

const COVERS_SYSTEM = `You are a specialist in creating magnetic, attention-grabbing cover images.
Generate a powerful cover image with the following requirements:
- NO real human beings - use animals, characters, mascots, or graphic elements only
- Maximum visual impact and composition
- Bold, eye-catching design that stops scrolling
- Clean text-safe areas in the upper or lower third for typography overlay
- Cinematic quality with dramatic lighting
- Rich detail on animals/characters (fur texture, scales, feathers)
- Powerful, magnetic atmosphere
- Professional quality suitable for social media covers, thumbnails, and banners
- Ultra-realistic animal rendering if applicable
- 8K quality, sharp focus, no artifacts
- The artwork MUST fill the ENTIRE canvas edge to edge — no blur borders, no letterboxing, no empty space, no padding`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { studioType, googleApiKey, referenceImages = [] } = body;

    if (!googleApiKey || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let prompt = "";

    if (studioType === "products") {
      const { productName, productType, lighting, background, extra } = body;
      prompt = `${PRODUCT_SYSTEM}\n\nProduct: ${productName}`;
      if (productType) prompt += `\nProduct type: ${productType}`;
      if (lighting) prompt += `\nLighting: ${lighting}`;
      if (background) prompt += `\nBackground: ${background}`;
      if (extra) prompt += `\nAdditional: ${extra}`;
    } else if (studioType === "covers") {
      const { theme, character, style, elements, extra } = body;
      prompt = `${COVERS_SYSTEM}\n\nTheme/Concept: ${theme}`;
      if (character) prompt += `\nCharacter/Animal: ${character}`;
      if (style) prompt += `\nVisual style: ${style}`;
      if (elements) prompt += `\nGraphic elements: ${elements}`;
      if (extra) prompt += `\nAdditional: ${extra}`;
    } else {
      return new Response(
        JSON.stringify({ error: "studioType inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build parts
    const parts: any[] = [{ text: prompt }];

    for (const refImg of referenceImages.slice(0, 3)) {
      const match = refImg.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }

    const model = "gemini-3-pro-image-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

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
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Erro na API: ${response.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let imageUrl: string | null = null;
    const candidates = data.candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem gerada." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ imageUrl }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("specialist-generate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
