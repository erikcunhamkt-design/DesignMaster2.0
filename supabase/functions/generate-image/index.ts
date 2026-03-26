// Deno.serve used below

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
const PROMPT_ARCHITECT_SYSTEM = `You are PROMPT ARCHITECT PRO, a faithful prompt enhancement engine for AI image generation.

Your ONLY job is to take the user's idea and add TECHNICAL QUALITY TOKENS — you must NEVER change, replace, or reinterpret the user's core concept.

ABSOLUTE RULES:
1. PRESERVE the user's EXACT scenario, clothing, setting, action, and every specific detail they mentioned
2. Do NOT invent new scenarios, locations, outfits, or actions that the user did not describe
3. Do NOT replace the user's simple idea with a "more cinematic" version — keep their vision intact
4. ONLY add: camera/lens specs, lighting setup, texture quality tokens, realism tokens
5. If the user says "white shirt in a cafe with laptop" — the output MUST show exactly that: white shirt, cafe, laptop
6. NEVER add elements the user didn't mention (weapons, props, different clothing, different location)

WHAT YOU ADD (technical enhancement only):
- Camera: specific lens (85mm f/1.4, etc.), shot type, depth of field
- Lighting: natural/studio lighting description, rim light, fill light
- Quality: 8K, ultra HD, photorealistic, sharp focus, skin texture detail
- Negative: no text, no watermark, no logo, no signature, no border
- Texture: skin pores visible, fabric fiber detail, volumetric lighting, HDR

OUTPUT FORMAT:
- Single continuous line in English
- Start with the user's EXACT concept, then append technical tokens
- No commentary, no explanation, no labels
- Do NOT translate scenarios — convert faithfully to English`;

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

async function createPromptWithArchitect(locked: string, expandable: string, googleApiKey: string): Promise<{ final: string; architectOutput: string }> {
  const safeLocked = sanitizePrompt(locked);
  const safeExpandable = sanitizePrompt(expandable);

  // Preserve ALL app instructions mechanically in the final prompt.
  // The LLM only enriches the creative context, but sidebar selections must remain literal.
  const preservedInstructions = [safeLocked.trim(), safeExpandable.trim()].filter(Boolean).join(", ");

  if (!safeExpandable.trim()) {
    return { final: preservedInstructions, architectOutput: "" };
  }

  const model = "gemini-3.1-pro-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${PROMPT_ARCHITECT_SYSTEM}\n\nCREATIVE CONTEXT:\n${safeExpandable}` }]
      }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    console.error("Architect prompt creation failed, using raw input:", response.status);
    return { final: preservedInstructions, architectOutput: "" };
  }

  const data = await response.json();
  const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || safeExpandable;
  const sanitizedArchitect = sanitizePrompt(rawOutput);
  const finalPrompt = [preservedInstructions, sanitizedArchitect].filter(Boolean).join(", ");

  return { final: finalPrompt, architectOutput: sanitizedArchitect };
}

function normalizeAspectRatio(aspectRatio?: string): string | undefined {
  if (!aspectRatio) return undefined;
  const normalized = aspectRatio.trim();
  const allowed = new Set(["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]);
  return allowed.has(normalized) ? normalized : undefined;
}

async function generateWithGoogle(parts: any[], googleApiKey: string, model: string, aspectRatio?: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;
  const normalizedAspectRatio = normalizeAspectRatio(aspectRatio);
  console.log(`Calling Google Gemini ${model} for image generation... aspectRatio=${normalizedAspectRatio || "default"}`);

  const generationConfig: Record<string, unknown> = { responseModalities: ["TEXT", "IMAGE"] };
  if (normalizedAspectRatio) {
    generationConfig.imageConfig = { aspectRatio: normalizedAspectRatio };
  }

  const requestBody = JSON.stringify({
    contents: [{ parts }],
    generationConfig,
  });

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });

    if (response.ok) {
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

    const errorText = await response.text();

    if (response.status === 429 && attempt < MAX_RETRIES) {
      // Extract retry delay from response, default to 15s
      const retryMatch = errorText.match(/"retryDelay":\s*"(\d+)s"/);
      const waitSec = retryMatch ? Math.min(parseInt(retryMatch[1], 10), 30) : 15;
      console.warn(`⏳ Rate limited (429). Retrying in ${waitSec}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }

    console.error("Google API error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Limite de requisições excedido na API do Google. Aguarde até 1 minuto e tente novamente." };
    if (response.status === 400) throw { status: 400, message: "Requisição inválida. Verifique o prompt e tente novamente." };
    if (response.status === 403) throw { status: 403, message: "API Key sem permissão. Verifique se a key tem acesso à API Gemini." };
    throw { status: 500, message: `Erro na API do Google: ${response.status}. Tente novamente.` };
  }

  throw { status: 429, message: "Limite de requisições excedido após tentativas automáticas. Aguarde 1 minuto e tente novamente." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, lockedPrompt, expandablePrompt, negativePrompt, aspectRatio, subjectImages, styleReferenceImages, referenceNotes, referenceImages, googleApiKey, aiModel, useArchitect = true } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256 || googleApiKey.split(' ').length > 5) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida. Verifique se você colou apenas a chave." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Model selection
    const model = aiModel === "flash" ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";

    const hasSubjectPhotos = subjectImages && subjectImages.length > 0;

    // ── Build final prompt ──
    // When subject photos exist, SKIP architect to maximize identity fidelity
    let finalPrompt: string;
    const locked = lockedPrompt || prompt || "";
    const expandable = expandablePrompt || "";

    let expandedPromptForUI: string | undefined;
    const shouldUseArchitect = useArchitect && !hasSubjectPhotos && (locked.trim() || expandable.trim());
    
    if (shouldUseArchitect) {
      console.log("🧠 PROMPT ARCHITECT PRO: Enhancing prompt (no subject photos)...");
      const result = await createPromptWithArchitect(locked, expandable, googleApiKey);
      finalPrompt = result.final;
      expandedPromptForUI = result.architectOutput || undefined;
    } else {
      // Direct mode: concatenate locked + expandable without AI rewriting
      finalPrompt = [locked.trim(), expandable.trim()].filter(Boolean).join(". ");
      if (hasSubjectPhotos) {
        console.log("🔒 IDENTITY MODE: Skipping Architect to preserve subject fidelity");
      }
    }
    console.log("✅ FINAL PROMPT:", finalPrompt.substring(0, 400));

    const finalNegative = negativePrompt || "distorted anatomy, blurry areas, compression artifacts, plastic skin, waxy appearance, low quality, watermark, text artifacts";

    const edgeFillInstruction = "CRITICAL FRAMING RULE: The generated image MUST fill 100% of the canvas from edge to edge. There must be ZERO empty space, ZERO solid color bars, ZERO letterboxing, ZERO padding, ZERO blank areas at top, bottom, left or right. The subject and background must extend fully to every single edge of the image.";

    // ── Extract gender from locked prompt for identity reinforcement ──
    const isFemale = /female|feminino/i.test(locked);
    const genderWord = isFemale ? "woman/female" : "man/male";

    // ── Build parts with CLEAR SEPARATION of subject vs style references ──
    const parts: any[] = [];
    const hasSubject = subjectImages && subjectImages.length > 0;
    const hasStyleRef = styleReferenceImages && styleReferenceImages.length > 0;
    const hasLegacyRef = referenceImages && referenceImages.length > 0;

    // 1. Subject photos FIRST with ultra-strict identity preservation instruction
    if (hasSubject) {
      parts.push({ text: `[SUBJECT IDENTITY LOCK — HIGHEST PRIORITY. The following photos define the EXACT person who must appear in the final image. Preserve the exact same face identity: face shape, eyes, eyebrows, nose, lips, jawline, skin tone, hairline, hair color, hairstyle, age impression, and ethnicity. Do NOT redesign, beautify, replace, randomize, or reinterpret the person. Do NOT create a similar person. Create the SAME person from these photos. Keep the exact same gender. Facial identity is more important than style. CRITICAL INTEGRATION: The face must be ORGANICALLY integrated into the body — match lighting direction, color temperature, and shadow angles between face and body. The neck/shoulder transition must be seamless with continuous skin tone. Head size must be anatomically proportional to body (1/7.5 ratio). The result must look like ONE continuous photograph, NOT a face pasted onto a body. Apply the SAME color grading to face and body.]` });
      for (const img of subjectImages.slice(0, 5)) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
      parts.push({ text: `[FINAL REMINDER ABOUT IDENTITY: the generated subject must be the exact same person from the uploaded photos, not a variation, not a lookalike, not a different model.]` });
    }

    // 2. Style/pose reference photos with clear "reference only" instruction
    if (hasStyleRef) {
      const notesList = (referenceNotes || []).filter((n: string) => n?.trim());
      const notesText = notesList.length > 0 ? ` Specifically use for: ${notesList.join('; ')}.` : '';
      parts.push({ text: `[STYLE/POSE REFERENCE ONLY — These images are ONLY for pose, composition, framing, lighting, and styling inspiration. COMPLETELY IGNORE the person's face and identity in these reference photos. The person in the final image MUST be the person from the SUBJECT IDENTITY photos above, never the person from these references.${notesText}]` });
      for (const img of styleReferenceImages.slice(0, 8)) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
    }

    // 3. Legacy fallback (old format without separation)
    if (!hasSubject && !hasStyleRef && hasLegacyRef) {
      for (const refImg of referenceImages.slice(0, 8)) {
        const match = refImg.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
    }

    // 4. Main prompt text AFTER images with identity reinforcement
    let identityReminder = "";
    if (hasSubject) {
      identityReminder = `\n\nABSOLUTE IDENTITY LOCK: Reproduce the exact uploaded person with the same facial identity and same gender. Do not change the person, do not swap facial features, do not generate a different model, do not reinterpret the face. CRITICAL: The face must be ORGANICALLY part of the body — match lighting, shadows, color temperature, and skin tone seamlessly between face, neck, and body. The head must be proportional to the body. NO "pasted head" effect — generate as ONE unified photograph.`;
      if (hasStyleRef) {
        identityReminder += ` Style references are ONLY for pose, framing, and lighting — never for facial identity.`;
      }
    }
    const fullPrompt = `${edgeFillInstruction}\n\n${finalPrompt}${identityReminder}\n\nAvoid: ${finalNegative}`;
    parts.push({ text: fullPrompt });

    const result = await generateWithGoogle(parts, googleApiKey, model, aspectRatio);

    if (!result.imageUrl) {
      const reason = result.textResponse?.trim() 
        ? `O modelo respondeu sem imagem: "${result.textResponse.slice(0, 200)}"`
        : "Nenhuma imagem foi gerada. O prompt pode ter sido bloqueado por filtros de segurança. Tente reformular.";
      console.warn("⚠️ No image returned. Text response:", result.textResponse || "(empty)");
      return new Response(
        JSON.stringify({ error: reason }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl: result.imageUrl, text: result.textResponse, expandedPrompt: expandedPromptForUI }),
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
