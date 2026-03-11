import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════
// PROMPT ARCHITECT PRO — Cinematic Context Enhancer
// Only enhances EXPANDABLE context. LOCKED parts pass through untouched.
// ══════════════════════════════════════════════════════════════
const PROMPT_ARCHITECT_SYSTEM = `You are PROMPT ARCHITECT PRO — a cinematic context enhancer for AI image generation.

You will receive an EXPANDABLE CONTEXT section. Your job is to ENHANCE it with cinematic quality — better lighting descriptions, richer environment details, texture realism, and quality tokens.

IMPORTANT: You are NOT rewriting the full prompt. You are ONLY enhancing the expandable context section. The user's specific choices (clothing, pose, expression, text, accessories) are handled separately and will NOT be passed to you.

ENHANCEMENT STAGES:
- Environment: Enrich spatial context, atmosphere, background depth
- Lighting: Layer cinematic key/fill/rim lights, volumetric effects
- Textures: Add micro-realism (skin pores, fabric fiber, material detail)
- Quality: Add render tokens (8K, sharp focus, HDR, cinematic grade)
- Color: Enhance color harmony and grading

RULES:
- Output ONLY the enhanced context as a single continuous line
- No commentary, no explanation, no labels
- Do NOT invent new subject details, clothing, poses, or expressions
- Only enhance atmosphere, lighting, textures, and quality
- Write in English only`;

async function expandContextWithAI(expandablePrompt: string, googleApiKey: string): Promise<string> {
  if (!expandablePrompt?.trim()) return "";
  
  const model = "gemini-3.1-pro-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${PROMPT_ARCHITECT_SYSTEM}\n\n--- EXPANDABLE CONTEXT TO ENHANCE ---\n${expandablePrompt}` }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    console.error("Context expansion failed, using raw context:", response.status);
    return expandablePrompt;
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || expandablePrompt;
}

async function generateWithGoogle(parts: any[], googleApiKey: string, model: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;
  console.log(`Calling Google Gemini ${model} for image generation...`);

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, lockedPrompt, expandablePrompt, negativePrompt, referenceImages, googleApiKey, aiModel, useArchitect = true } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256 || googleApiKey.split(' ').length > 5) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida. Verifique se você colou apenas a chave." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Model selection
    const model = aiModel === "flash" ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";

    // ── Build final prompt with LOCKED + EXPANDED approach ──
    let finalPrompt: string;
    const locked = lockedPrompt || prompt || "";
    const expandable = expandablePrompt || "";

    if (useArchitect && expandable.trim()) {
      console.log("🧠 PROMPT ARCHITECT PRO: Enhancing expandable context...");
      console.log("🔒 LOCKED (untouched):", locked.substring(0, 300));
      console.log("🔓 EXPANDABLE (to enhance):", expandable.substring(0, 300));
      const enhancedContext = await expandContextWithAI(expandable, googleApiKey);
      console.log("✅ ENHANCED CONTEXT:", enhancedContext.substring(0, 300));
      // Locked parts FIRST (highest priority), then enhanced context
      finalPrompt = `${locked}\n\n${enhancedContext}`;
    } else {
      // No Architect or no expandable — use full prompt as-is
      finalPrompt = locked + (expandable ? `\n\n${expandable}` : "");
    }

    const finalNegative = negativePrompt || "distorted anatomy, blurry areas, compression artifacts, plastic skin, waxy appearance, low quality, watermark, text artifacts";

    const edgeFillInstruction = "CRITICAL FRAMING RULE: The generated image MUST fill 100% of the canvas from edge to edge. There must be ZERO empty space, ZERO solid color bars, ZERO letterboxing, ZERO padding, ZERO blank areas at top, bottom, left or right. The subject and background must extend fully to every single edge of the image.";

    const fullPrompt = `${edgeFillInstruction}\n\n${finalPrompt}\n\nAvoid: ${finalNegative}`;

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

    const result = await generateWithGoogle(parts, googleApiKey, model);

    if (!result.imageUrl) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente com outro prompt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl: result.imageUrl, text: result.textResponse, expandedPrompt: useArchitect ? finalPrompt : undefined }),
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