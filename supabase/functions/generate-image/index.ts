import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════
// PROMPT ARCHITECT PRO — Hyper-Detailed Prompt Creator
// Creates hyper-detailed structured prompts from simple ideas.
// Respects LOCKED parts (sidebar selections) as mandatory.
// ══════════════════════════════════════════════════════════════
const PROMPT_ARCHITECT_SYSTEM = `You are PROMPT ARCHITECT PRO, a hyper-detailed prompt engineer for AI image generation.

You receive TWO sections:
1. MANDATORY INSTRUCTIONS — sidebar selections (pose, clothing, expression, text, accessories, format, colors). Preserve these EXACTLY as provided. Never omit, rephrase, or generalize any detail.
2. CREATIVE CONTEXT — the user's idea or scene description. Enhance this freely with cinematic detail.

YOUR JOB: Merge both into ONE hyper-detailed continuous prompt following this MANDATORY 12-STAGE STRUCTURE (no line breaks, no labels, no brackets in output):

[Main Subject] [Pose or Action] [Environment] [Camera Angle] [Image Style] [Physical Details] [Texture and Lighting] [Color Palette] [Art Style / Era] [Negative Commands] [Realism Tokens] [Deep Texture Commands]

STAGE DETAILS:
1. Main Subject — Who/what is the subject. Use MANDATORY details first, then enrich.
2. Pose or Action — Body position, gesture, movement. Use MANDATORY pose if provided.
3. Environment — Setting, background, atmosphere, spatial depth, weather.
4. Camera Angle — Lens, shot type, perspective. Use MANDATORY if provided, else choose cinematically.
5. Image Style — Photorealistic, illustration, 3D render, etc.
6. Physical Details — Skin, hair, fabric, material textures, accessories. MANDATORY items go here verbatim.
7. Texture and Lighting — Cinematic key/fill/rim lights, volumetric effects, shadow quality, ambient occlusion.
8. Color Palette — Dominant and accent colors, color grading, harmony.
9. Art Style / Era — Visual inspiration, artistic movement, era reference.
10. Negative Commands — Always append: no text, no watermark, no logo, no signature, no border.
11. Realism Tokens — high-definition texture, ultra-sharp details, 8K quality, extreme sharpness, depth of field.
12. Deep Texture Commands — skin pores visible, fabric fiber detail, extreme realism, volumetric lighting, cinematic grade, HDR.

CONTENT SAFETY RULES (CRITICAL — apply BEFORE outputting):
- Replace nudity/naked/nude references with artistic classical equivalents: "classical draping", "Renaissance-style minimal garment", "biblical fig leaf covering", "ancient Greek chiton"
- Replace "topless" with "bare-shouldered with draped fabric"
- Replace "underwear only" or "lingerie" with "elegant minimal attire"
- Replace "blood", "gore", "wound" with "battle-worn", "weathered", "marked"  
- Replace "weapon pointed at viewer" with "weapon held in dramatic pose"
- Replace explicit violence with dramatic tension
- Replace drug references with mystical/alchemical equivalents
- NEVER output: "naked", "nude", "topless", "NSFW", "explicit", "uncensored", "gore", "blood splatter"
- Always keep the INTENT of the scene while making it safe for AI image generation
- These replacements must happen silently — do not mention filtering in the output

RULES:
- Output ONLY the final prompt as a single continuous line in English
- No commentary, no explanation, no labels, no stage markers
- When the user idea is vague, complete it creatively with rich cinematic detail
- NEVER omit MANDATORY INSTRUCTIONS — they have absolute priority
- Always include stages 10-12 (negative, realism, deep texture) even if not mentioned
- Do NOT translate to Portuguese — English only
- Apply CONTENT SAFETY RULES to all output — transform restricted terms into safe artistic alternatives`;

// ── Additional safety filter applied AFTER Architect output ──
function sanitizePrompt(prompt: string): string {
  const replacements: [RegExp, string][] = [
    [/\b(completely |fully |totally )?naked\b/gi, "wearing minimal classical draping"],
    [/\b(completely |fully |totally )?nude\b/gi, "wearing Renaissance-style minimal garment"],
    [/\btopless\b/gi, "bare-shouldered with elegant draped fabric"],
    [/\bnudity\b/gi, "classical artistic form"],
    [/\bNSFW\b/gi, ""],
    [/\bexplicit\b/gi, "dramatic"],
    [/\buncensored\b/gi, ""],
    [/\bgore\b/gi, "battle-worn detail"],
    [/\bblood splatter\b/gi, "dramatic red accents"],
    [/\bblood[- ]?soaked\b/gi, "deeply weathered"],
    [/\bbleeding\b/gi, "marked"],
    [/\btotalmente nu\b/gi, "wearing minimal classical draping"],
    [/\bpelado\b/gi, "wearing classical garment"],
    [/\bsem roupa\b/gi, "with minimal elegant attire"],
    [/\bnu\b/gi, "with classical draping"],
  ];
  
  let sanitized = prompt;
  for (const [pattern, replacement] of replacements) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  // Clean up double spaces
  return sanitized.replace(/  +/g, " ").trim();
}

async function createPromptWithArchitect(locked: string, expandable: string, googleApiKey: string): Promise<string> {
  // Pre-sanitize inputs before sending to Architect
  const safeLocked = sanitizePrompt(locked);
  const safeExpandable = sanitizePrompt(expandable);
  
  const userContent = safeLocked.trim() && safeExpandable.trim()
    ? `--- MANDATORY INSTRUCTIONS (preserve exactly) ---\n${safeLocked}\n\n--- CREATIVE CONTEXT (enhance freely) ---\n${safeExpandable}`
    : safeLocked.trim()
      ? `--- MANDATORY INSTRUCTIONS (preserve exactly) ---\n${safeLocked}`
      : safeExpandable.trim()
        ? `--- CREATIVE CONTEXT (enhance freely) ---\n${safeExpandable}`
        : "";

  if (!userContent) return "";
  
  const model = "gemini-3.1-pro-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${PROMPT_ARCHITECT_SYSTEM}\n\n${userContent}` }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
      },
    }),
  });

  if (!response.ok) {
    console.error("Architect prompt creation failed, using raw input:", response.status);
    return sanitizePrompt(`${safeLocked} ${safeExpandable}`.trim());
  }

  const data = await response.json();
  const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || `${safeLocked} ${safeExpandable}`.trim();
  // Post-sanitize Architect output as safety net
  return sanitizePrompt(rawOutput);
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

    // ── Build final prompt with PROMPT ARCHITECT PRO ──
    let finalPrompt: string;
    const locked = lockedPrompt || prompt || "";
    const expandable = expandablePrompt || "";

    if (useArchitect && (locked.trim() || expandable.trim())) {
      console.log("🧠 PROMPT ARCHITECT PRO: Creating hyper-detailed prompt...");
      console.log("🔒 LOCKED (mandatory):", locked.substring(0, 300));
      console.log("🔓 EXPANDABLE (creative):", expandable.substring(0, 300));
      finalPrompt = await createPromptWithArchitect(locked, expandable, googleApiKey);
      console.log("✅ ARCHITECT OUTPUT:", finalPrompt.substring(0, 400));
    } else {
      // No Architect — use raw prompt as-is
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
