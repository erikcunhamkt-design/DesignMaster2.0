import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════
// PROMPT ARCHITECT PRO — Cinematic Prompt Compiler Engine
// ══════════════════════════════════════════════════════════════
const PROMPT_ARCHITECT_SYSTEM = `You are PROMPT ARCHITECT PRO — a deterministic cinematic prompt compiler for AI image generation.

Your task: take the user's raw prompt and EXPAND it into a visually coherent, cinematic-grade prompt following this 13-stage pipeline. Output ONLY the final expanded prompt, nothing else.

PIPELINE STAGES (apply internally):

1. SUBJECT EXTRACTION — Identify the primary subject/object. If multiple, determine dominant focal subject.

2. ACTION/POSE — Determine how the subject interacts with the scene. If none specified, assign a visually expressive pose.

3. ENVIRONMENT — Construct a believable environment: spatial context, atmospheric elements, background structure.

4. CAMERA DESIGN — Select cinematic perspective: hero shot (low angle), portrait (tight framing), wide cinematic, aerial, over-the-shoulder. Add depth cues: shallow DOF, foreground framing, background blur.

5. VISUAL STYLE — Determine style: hyper-realistic, cinematic photography, dark fantasy, anime cinematic, baroque oil painting, concept art.

6. PHYSICAL DETAIL — Expand subject with material realism: skin pores, metal scratches, cloth fiber texture, stone erosion.

7. TEXTURE/MATERIAL SIMULATION — Add microtexture: weathered surfaces, moisture, dust particles, snow accumulation.

8. LIGHTING ENGINEERING — Layer: Key Light, Fill Light, Rim Light, Ambient Light. Styles: dramatic cinematic, soft natural, neon glow, volumetric fog.

9. COLOR PALETTE — Define hierarchy: dominant colors + accent color.

10. ARTISTIC INFLUENCES — Attach aesthetic references (epic fantasy concept art, renaissance, modern cinematic, dark souls aesthetic).

11. NEGATIVE SUPPRESSION — Prevent artifacts: no distorted anatomy, no blurry areas, no compression artifacts.

12. RENDER COMMANDS — Quality tokens: ultra detailed, 8K resolution, sharp focus, HDR, cinematic rendering quality.

13. MICRO REALISM — Add: visible skin pores, microscopic material texture, physically accurate lighting, volumetric light diffusion.

OUTPUT FORMAT: Single continuous prompt line following order: [Subject] [Action/Pose] [Environment] [Camera] [Style] [Physical Detail] [Textures] [Lighting] [Colors] [Influences] [Render Commands] [Micro Realism].

RULES:
- Output ONLY the expanded prompt as a single continuous line
- No commentary, no explanation, no labels
- Preserve ALL specific details from the user's original prompt
- Enhance and expand, never remove or contradict user intent
- If the user specified colors, lighting, style — honor them and enhance
- Write in English only`;

async function expandPromptWithAI(rawPrompt: string, negativePrompt: string, googleApiKey: string): Promise<{ expandedPrompt: string; expandedNegative: string }> {
  const model = "gemini-3.1-pro-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${PROMPT_ARCHITECT_SYSTEM}\n\n--- RAW PROMPT TO EXPAND ---\n${rawPrompt}\n\n${negativePrompt ? `User wants to AVOID: ${negativePrompt}` : ""}` }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    console.error("Prompt expansion failed, using raw prompt:", response.status);
    return { expandedPrompt: rawPrompt, expandedNegative: negativePrompt };
  }

  const data = await response.json();
  const expanded = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || rawPrompt;

  return {
    expandedPrompt: expanded,
    expandedNegative: negativePrompt || "distorted anatomy, blurry areas, compression artifacts, plastic skin, waxy appearance, low quality, watermark, text artifacts",
  };
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
    const { prompt, negativePrompt, referenceImages, googleApiKey, aiModel, useArchitect = true } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256 || googleApiKey.split(' ').length > 5) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida. Verifique se você colou apenas a chave." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Model selection
    const model = "gemini-3.1-flash-image-preview";

    // ── PROMPT ARCHITECT PRO expansion ──
    let finalPrompt = prompt;
    let finalNegative = negativePrompt || "";

    if (useArchitect) {
      console.log("🧠 PROMPT ARCHITECT PRO: Expanding prompt...");
      const expanded = await expandPromptWithAI(prompt, negativePrompt || "", googleApiKey);
      finalPrompt = expanded.expandedPrompt;
      finalNegative = expanded.expandedNegative;
      console.log("✅ Prompt expanded successfully");
    }

    const edgeFillInstruction = "CRITICAL FRAMING RULE: The generated image MUST fill 100% of the canvas from edge to edge. There must be ZERO empty space, ZERO solid color bars, ZERO letterboxing, ZERO padding, ZERO blank areas at top, bottom, left or right. The subject and background must extend fully to every single edge of the image.";

    const fullPrompt = `${edgeFillInstruction}\n\n${finalPrompt}${finalNegative ? `\n\nAvoid: ${finalNegative}` : ""}`;

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
