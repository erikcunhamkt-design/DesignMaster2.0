// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_SYSTEM = `Ultra realistic commercial product photography of the original product.

CRITICAL INSTRUCTIONS:
- If a reference image is provided, use it ONLY to understand the product's exact shape, proportions, colors and branding — then CREATE A COMPLETELY NEW professional photograph of that product.
- DO NOT simply reproduce, copy, or slightly modify the reference image. The output must be an entirely new composition.
- Maintain the exact shape, proportions, colors and branding of the real item.

Photography requirements:
- Professional studio photo, photographed with a high-end DSLR camera and macro lens.
- Natural lighting setup with soft shadows, subtle reflections and realistic highlights.
- Enhance the product beauty while preserving authenticity.
- Textures must look natural and tactile (plastic, metal, paper, fabric or glass exactly as in real life).
- Include small natural imperfections, micro-texture, slight lighting falloff and real material behavior.
- Avoid any CGI or AI-render look.
- No plastic, waxy, overly smooth or hyper-polished surfaces.
- The image must look like a real photograph taken for an e-commerce catalog or premium advertising campaign.
- Neutral background, soft gradient or lifestyle surface depending on the product type.
- Balanced composition, sharp focus on the product, shallow depth of field.
- Photorealistic, professional product photography, natural color science, realistic contrast, real-world materials.
- NO real humans in the image.
- The artwork MUST fill the ENTIRE canvas edge to edge — no blur borders, no letterboxing, no empty space, no padding.`;

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

async function generateWithGoogle(parts: any[], googleApiKey: string, model: string) {
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
    if (response.status === 429) throw { status: 429, message: "Rate limit excedido. Aguarde." };
    throw { status: 500, message: `Erro na API: ${response.status}` };
  }

  const data = await response.json();
  let imageUrl: string | null = null;
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return imageUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { studioType, googleApiKey, referenceImages = [], aiModel } = body;

    if (!googleApiKey || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Model selection: pro = gemini-3.1-pro-preview, flash = gemini-3.1-flash-image-preview
    const model = aiModel === "flash" ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";

    let systemPrompt = "";
    let userInstructions = "";

    if (studioType === "products") {
      const { productName, productType, lighting, background, extra } = body;
      systemPrompt = PRODUCT_SYSTEM;
      userInstructions = `Product name: ${productName}`;
      if (productType) userInstructions += `\nProduct type: ${productType}`;
      if (lighting) userInstructions += `\nLighting style: ${lighting}`;
      if (background) userInstructions += `\nBackground: ${background}`;
      if (extra) userInstructions += `\n\n⚠️ MANDATORY USER INSTRUCTIONS (YOU MUST FOLLOW THESE EXACTLY):\n${extra}`;
    } else if (studioType === "covers") {
      const { theme, character, style, elements, extra } = body;
      systemPrompt = COVERS_SYSTEM;
      userInstructions = `Theme/Concept: ${theme}`;
      if (character) userInstructions += `\nCharacter/Animal: ${character}`;
      if (style) userInstructions += `\nVisual style: ${style}`;
      if (elements) userInstructions += `\nGraphic elements: ${elements}`;
      if (extra) userInstructions += `\n\n⚠️ MANDATORY USER INSTRUCTIONS (YOU MUST FOLLOW THESE EXACTLY):\n${extra}`;
    } else {
      return new Response(
        JSON.stringify({ error: "studioType inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullPrompt = `${systemPrompt}\n\n--- USER SPECIFICATIONS (HIGHEST PRIORITY) ---\n${userInstructions}\n\n--- END OF SPECIFICATIONS ---\nRemember: The user's specific instructions above are the HIGHEST PRIORITY. Follow them exactly.`;

    // Build parts — reference images FIRST
    const parts: any[] = [];
    for (const refImg of referenceImages.slice(0, 3)) {
      const match = refImg.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }
    if (parts.length > 0) {
      parts.push({ text: "The image(s) above are REFERENCE ONLY — showing the product's appearance. DO NOT replicate them. Instead, create a completely new professional studio photograph of this product following ALL instructions below (especially any MANDATORY USER INSTRUCTIONS):\n\n" + fullPrompt });
    } else {
      parts.push({ text: fullPrompt });
    }

    const imageUrl = await generateWithGoogle(parts, googleApiKey, model);

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem gerada." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ imageUrl }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("specialist-generate error:", error);
    const status = error?.status || 500;
    const message = error?.message || (error instanceof Error ? error.message : "Erro desconhecido");
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
