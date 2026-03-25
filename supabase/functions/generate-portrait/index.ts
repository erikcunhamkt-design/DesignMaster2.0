const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════
// FOTÓGRAFO PROFISSIONAL v3 — Elite Portrait Engine
// ══════════════════════════════════════════════════════════════

const PHOTOSHOOT_SYSTEM = `You are FOTÓGRAFO PROFISSIONAL — the world's most elite portrait photography prompt architect.

You receive a portrait configuration and transform it into a hyper-detailed, cinematic, studio-grade photography prompt.

═══ YOUR KNOWLEDGE BASE ═══

CAMERAS: Canon EOS R5, Sony A1, Hasselblad X2D 100C, Phase One IQ4, Fujifilm GFX 100 II, Leica SL3
LENSES: 85mm f/1.2L (classic portrait king), 105mm f/1.4E (perfect compression), 135mm f/2L (maximum bokeh separation), 50mm f/1.2 (environmental portrait), 70-200mm f/2.8 (editorial versatility)
LIGHTING SETUPS: Rembrandt (triangle), Butterfly/Paramount, Split, Loop, Broad, Short, Clamshell, Beauty dish + rim, 3-point studio, Natural window + reflector

═══ OUTPUT RULES ═══
1. Output ONLY a single continuous English prompt paragraph — NO labels, NO commentary
2. Start with subject description, then lighting, then camera/lens, then composition, then texture/quality tokens
3. Be ULTRA specific: exact camera model, exact lens with aperture, exact lighting modifier names (softbox, beauty dish, strip light, barn doors)
4. Include MANDATORY quality tokens at the end: "shot on [camera], [lens] at f/[aperture], 8K resolution, RAW file quality, extreme skin detail with visible pores and micro-textures, individual hair strands, catchlights in eyes, professional color grading, depth of field, volumetric lighting"
5. NEVER mention text, watermarks, or UI elements in the prompt
6. Temperature and light color must be specified in Kelvin
7. Minimum 200 words`;

const IDENTITY_LOCK_BLOCK = `
═══ ABSOLUTE IDENTITY PRESERVATION PROTOCOL ═══

You are performing a FACE TRANSPLANT operation. This means:

1. FACE GEOMETRY: Reproduce the EXACT bone structure — jaw line, cheekbone prominence, chin shape, forehead height and width. These are NON-NEGOTIABLE anatomical landmarks.

2. EYES: Same eye shape (round/almond/hooded/monolid), same eye color, same distance between eyes (interpupillary distance), same eyebrow shape/thickness/arch. Reproduce the EXACT iris pattern and color.

3. NOSE: Same nose bridge width, nostril shape, tip angle (upturned/straight/downturned), same profile.

4. MOUTH: Same lip fullness ratio (upper vs lower), same lip color, same mouth width, same smile lines.

5. SKIN: Same skin tone (exact melanin level), same texture, same any visible freckles/moles/beauty marks. Do NOT lighten or darken the skin.

6. HAIR: Same hair color, same texture (straight/wavy/curly/coily), same approximate length and style.

7. ETHNICITY & GENDER: These are IMMUTABLE. A Black woman stays a Black woman. An Asian man stays an Asian man. A Latino person stays Latino. ZERO ethnic drift. ZERO gender swap.

8. AGE: Maintain the apparent age of the subject. Do NOT age up or down.

QUALITY STANDARD: The output portrait must be so faithful that the subject's mother, partner, or close friend would IMMEDIATELY recognize them without hesitation.

FAILURE MODE: If you cannot preserve identity with confidence, prioritize the face/eyes/skin tone over all other creative elements.`;

const REFERENCE_REPLICATION_BLOCK = `
═══ REFERENCE IMAGE REPLICATION PROTOCOL ═══

When reference images are provided alongside a subject photo, your task is SURGICAL:

1. FROM THE REFERENCE: Extract the EXACT pose, body position, framing, composition, background/environment, lighting setup, color grading, clothing style, accessories, props, atmosphere, and overall visual aesthetic.

2. FROM THE SUBJECT PHOTO: Extract ONLY the face, skin tone, ethnicity, gender, hair characteristics, and physical identity.

3. MERGE OPERATION: Place the subject's face/identity INTO the reference's scene, pose, and aesthetic. The result should look like the subject was the original model in the reference photo's shoot.

4. LIGHTING MATCH: The lighting on the face must be consistent with the reference's lighting direction and quality. If the reference has rim light from the left, the subject's face must show the same rim light.

5. SCALE & PROPORTION: The subject's head size must match the proportions shown in the reference. Do not shrink or enlarge the head unnaturally.

THE GOLD STANDARD: A viewer looking at the reference and the output side by side should think "same photoshoot, same photographer, same setup — just a different model."`;

function buildConfigDescription(config: {
  gender: string;
  lighting: string;
  background: string;
  expression: string;
  cameraAngle: string;
  lens: string;
  clothing: string;
  freePrompt: string;
}): string {
  const genderLabel = config.gender === 'female' ? 'woman' : config.gender === 'male' ? 'man' : 'person';
  const parts = [`Professional studio portrait of a ${genderLabel}`];

  if (config.expression?.trim()) parts.push(`Expression: ${config.expression}`);
  if (config.lighting?.trim()) parts.push(`Lighting style: ${config.lighting}`);
  if (config.background?.trim()) parts.push(`Background: ${config.background}`);
  if (config.cameraAngle?.trim()) parts.push(`Camera angle: ${config.cameraAngle}`);
  if (config.lens?.trim()) parts.push(`Preferred lens: ${config.lens}`);
  if (config.clothing?.trim()) parts.push(`Wearing: ${config.clothing.trim()}`);
  if (config.freePrompt?.trim()) parts.push(`MANDATORY USER INSTRUCTIONS (HIGHEST PRIORITY — override everything else): ${config.freePrompt.trim()}`);

  return parts.join('. ') + '.';
}

async function expandWithPhotoshootAgent(configDescription: string, googleApiKey: string, hasReferences: boolean): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const referenceContext = hasReferences
    ? "\n\nIMPORTANT: Reference images are being provided. Your prompt must EXPLICITLY instruct the image generator to replicate the reference's pose, composition, environment, and aesthetic while preserving the subject's identity."
    : "";

  console.log("📸 FOTÓGRAFO PROFISSIONAL v3: Expanding portrait config...");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${PHOTOSHOOT_SYSTEM}${referenceContext}\n\nPORTRAIT CONFIGURATION:\n${configDescription}` }]
      }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 1500,
      },
    }),
  });

  if (!response.ok) {
    console.error("Fotógrafo Profissional expansion failed:", response.status);
    return configDescription;
  }

  const data = await response.json();
  const expanded = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!expanded) {
    console.warn("Fotógrafo Profissional returned empty, using raw config");
    return configDescription;
  }

  console.log("✅ FOTÓGRAFO PROFISSIONAL expanded:", expanded.substring(0, 400));
  return expanded;
}

async function generateWithGoogle(parts: any[], googleApiKey: string, model: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;
  console.log(`🎨 Generating portrait with ${model}...`);

  const requestBody = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
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
    const { config, subjectImage, googleApiKey, aiModel, referenceImages } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const model = aiModel === "flash" ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";
    const hasRefs = referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0;

    // Step 1: Build config description
    const configDescription = buildConfigDescription(config);
    console.log("📋 Config:", configDescription.substring(0, 300));

    // Step 2: Expand with Fotógrafo Profissional v3
    const expandedPrompt = await expandWithPhotoshootAgent(configDescription, googleApiKey, hasRefs);

    const genderLabel = config.gender === 'female' ? 'woman/female' : config.gender === 'male' ? 'man/male' : 'person';

    // Step 3: Build parts array with strategic ordering
    const parts: any[] = [];

    // 3a: Subject photo FIRST — this is the identity anchor
    if (subjectImage) {
      parts.push({
        text: `[SUBJECT IDENTITY PHOTO — THIS IS THE PERSON]\n${IDENTITY_LOCK_BLOCK}\n\nThis is a ${genderLabel}. Study this face with forensic precision. Every facial feature, skin detail, and ethnic characteristic MUST appear in the output.`
      });

      if (subjectImage.startsWith("data:")) {
        const match = subjectImage.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
    }

    // 3b: Reference images — visual style targets
    if (hasRefs) {
      parts.push({ text: REFERENCE_REPLICATION_BLOCK });

      for (let i = 0; i < referenceImages.length; i++) {
        const ref = referenceImages[i];
        const noteLabel = ref.note?.trim() || 'pose, composition, environment, lighting, clothing, and overall aesthetic';
        parts.push({
          text: `[REFERENCE IMAGE ${i + 1}/${referenceImages.length}]\nREPLICATE from this reference: ${noteLabel}.\n${subjectImage ? 'DO NOT use this person\'s face — use ONLY the subject identity photo\'s face. Extract everything EXCEPT the face/identity from this reference.' : 'Replicate this entire aesthetic.'}`
        });
        if (ref.url && ref.url.startsWith("data:")) {
          const match = ref.url.match(/^data:(.*?);base64,(.*)$/);
          if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          }
        }
      }
      console.log(`📎 Added ${referenceImages.length} reference(s)`);
    }

    // 3c: Final generation instruction
    const edgeFill = "CRITICAL FRAMING: The image MUST fill 100% of the canvas edge to edge. ZERO empty space, ZERO solid color bars, ZERO letterboxing, ZERO blank margins.";

    const qualityTokens = "Ultra-realistic professional photograph. 8K resolution. RAW file quality. Visible skin pores and micro-textures. Individual hair strands catching light. Natural catchlights in eyes. Professional color grading with rich tonal range. Shallow depth of field with creamy bokeh. Volumetric lighting with atmospheric depth. No text. No watermark. No artifacts. No AI-looking features. No plastic skin. No uncanny valley.";

    let finalInstruction: string;

    if (subjectImage && hasRefs) {
      // FACE SWAP MODE: Subject identity + reference aesthetic
      finalInstruction = `GENERATION MODE: IDENTITY + REFERENCE FUSION

${expandedPrompt}

${qualityTokens}
${edgeFill}

FINAL DIRECTIVE: Generate a portrait that looks EXACTLY like the reference image(s) in terms of pose, composition, lighting, environment, and clothing — but with the EXACT face and identity of the subject photo. The result must look like the subject was the original model in the reference photoshoot. Gender is ${genderLabel} — this is IMMUTABLE.`;

    } else if (subjectImage) {
      // IDENTITY MODE: Subject identity + config settings
      finalInstruction = `GENERATION MODE: IDENTITY PORTRAIT

${expandedPrompt}

${qualityTokens}
${edgeFill}

ABSOLUTE IDENTITY LOCK: The person in the output MUST be the EXACT ${genderLabel} from the subject photo. Same face, same features, same ethnicity, same gender. This is the #1 priority above all creative decisions.`;

    } else {
      // CREATIVE MODE: No subject photo
      finalInstruction = `GENERATION MODE: CREATIVE PORTRAIT

${expandedPrompt}

${qualityTokens}
${edgeFill}`;
    }

    parts.push({ text: finalInstruction });

    // Step 4: Generate
    const result = await generateWithGoogle(parts, googleApiKey, model);

    if (!result.imageUrl) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente novamente com configurações diferentes." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl: result.imageUrl, text: result.textResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("generate-portrait error:", error);
    const status = error?.status || 500;
    const message = error?.message || "Erro desconhecido na geração do retrato.";
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
