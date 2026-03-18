import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PORTRAIT_SYSTEM_PROMPT = `You are PORTRAIT MASTER — the world's most elite portrait photography AI.

You generate ULTRA-REALISTIC professional studio portraits that are indistinguishable from photographs taken by master photographers like Annie Leibovitz, Peter Lindbergh, Mario Testino, and Helmut Newton.

ABSOLUTE QUALITY STANDARDS:
- Skin texture: visible pores, natural micro-imperfections, subsurface scattering, NO plastic/waxy/airbrushed look
- Hair: individual strands visible, natural flow and volume, realistic highlights and shadows
- Eyes: perfectly symmetrical, natural catchlights, realistic iris detail, correct pupil size
- Mouth/Lips: natural lip texture, correct proportions, no distortion
- Facial features: anatomically correct proportions, natural asymmetry, realistic bone structure
- Lighting: professional 3-point studio lighting (key, fill, rim), natural falloff, volumetric quality
- Depth of field: professional bokeh, sharp focus on eyes, natural focus falloff
- Color science: cinema-grade color grading, natural skin tones, no oversaturation

PHOTOGRAPHY TECHNICAL STANDARDS:
- Shot as if with a Phase One IQ4 150MP or Hasselblad X2D
- Professional studio lighting with modifiers (softboxes, beauty dishes, strip lights)
- Tethered shooting quality — maximum sharpness and dynamic range
- Print-ready resolution and detail

CRITICAL RULES:
- NEVER generate cartoon, illustration, or AI-looking images
- NEVER produce plastic skin, waxy appearance, or uncanny valley effects
- ALWAYS maintain anatomical correctness
- ALWAYS produce catchlights in eyes
- ALWAYS ensure natural skin texture with visible pores at close range`;

function buildPortraitPrompt(config: {
  gender: string;
  lighting: string;
  background: string;
  expression: string;
  cameraAngle: string;
  lens: string;
  clothing: string;
  freePrompt: string;
  hasReference: boolean;
}): string {
  const genderLabel = config.gender === 'female' ? 'woman' : 'man';

  const lightingMap: Record<string, string> = {
    'rembrandt': 'Rembrandt lighting with dramatic triangular shadow on one cheek, deep chiaroscuro, warm key light at 45 degrees with minimal fill',
    'butterfly': 'Butterfly/Paramount lighting with key light directly above and in front, creating a butterfly-shaped shadow under the nose, glamorous Hollywood style',
    'split': 'Split lighting with one half of the face illuminated and the other in deep shadow, dramatic and mysterious mood',
    'loop': 'Loop lighting with key light slightly above and to the side creating a small shadow loop beside the nose, flattering and natural',
    'broad': 'Broad lighting illuminating the wider side of the face, creating a bright open look with soft fill light',
    'natural': 'Natural window light with soft diffusion, gentle shadows, organic and authentic feel',
    'dramatic': 'Dramatic low-key lighting with deep shadows, single hard key light, cinematic noir atmosphere',
    'high-key': 'High-key lighting with bright even illumination, minimal shadows, clean and modern fashion editorial style',
  };

  const backgroundMap: Record<string, string> = {
    'seamless-white': 'pure white seamless paper background, clean and professional',
    'seamless-black': 'deep black seamless background, dramatic and elegant',
    'seamless-gray': 'medium gray seamless background, neutral and classic',
    'studio-gradient': 'smooth gradient studio backdrop transitioning from dark to light',
    'textured-wall': 'textured concrete or stone wall background with depth and character',
    'bokeh': 'completely blurred background with beautiful circular bokeh lights',
    'outdoor-golden': 'outdoor golden hour with warm backlight and natural bokeh',
    'urban': 'urban environment with architectural elements and natural depth',
  };

  const expressionMap: Record<string, string> = {
    'confident': 'confident and powerful expression with direct gaze into camera, subtle self-assured smile',
    'serious': 'serious and intense expression with piercing focused eyes, strong jaw set',
    'gentle-smile': 'gentle natural smile with warmth reaching the eyes, approachable and authentic',
    'contemplative': 'contemplative and thoughtful expression with soft distant gaze, intellectual mood',
    'powerful': 'powerful commanding expression radiating authority and strength, unbreakable gaze',
    'mysterious': 'mysterious and enigmatic expression with subtle Mona Lisa smile, captivating ambiguity',
    'joyful': 'genuinely joyful expression with bright natural smile showing teeth, authentic happiness',
    'neutral': 'neutral composed expression with calm steady gaze, editorial model pose',
  };

  const cameraMap: Record<string, string> = {
    'eye-level': 'shot at eye level for natural and direct connection',
    'slightly-above': 'camera slightly above eye level for flattering downward angle',
    'slightly-below': 'camera slightly below eye level for powerful and imposing feel',
    'three-quarter': 'three-quarter view with face turned 30-45 degrees from camera',
    'profile': 'profile view showing the elegant silhouette of the face',
    'close-up': 'extreme close-up focusing on eyes and upper face',
  };

  const lensMap: Record<string, string> = {
    '85mm': '85mm f/1.4 — classic portrait lens with beautiful bokeh and natural compression',
    '105mm': '105mm f/2 — medium telephoto with elegant background separation and flattering compression',
    '135mm': '135mm f/2 — long portrait lens with maximum background blur and cinematic compression',
    '50mm': '50mm f/1.2 — environmental portrait with context and natural perspective',
    '70-200mm': '70-200mm f/2.8 at 135mm — versatile zoom at portrait sweet spot',
  };

  const lighting = lightingMap[config.lighting] || lightingMap['rembrandt'];
  const background = backgroundMap[config.background] || backgroundMap['seamless-gray'];
  const expression = expressionMap[config.expression] || expressionMap['confident'];
  const camera = cameraMap[config.cameraAngle] || cameraMap['eye-level'];
  const lens = lensMap[config.lens] || lensMap['85mm'];

  let prompt = `Ultra-realistic professional studio portrait photograph of a ${genderLabel}`;

  if (config.clothing?.trim()) {
    prompt += `, wearing ${config.clothing.trim()}`;
  }

  prompt += `. ${expression}. ${camera}. Shot with ${lens}. ${lighting}. ${background}.`;

  prompt += ` Hyper-detailed skin texture with visible pores and natural micro-imperfections, individual hair strands visible with natural highlights, perfectly detailed eyes with realistic iris patterns and natural catchlights, natural lip texture. Professional retouching preserving all natural skin detail — NO airbrushing, NO plastic skin, NO waxy appearance. Cinematic color grading with natural skin tones. Shot on Phase One IQ4 150MP equivalent, tethered studio quality. 8K resolution, extreme sharpness, HDR, volumetric lighting.`;

  prompt += ` CRITICAL FRAMING RULE: The generated image MUST fill 100% of the canvas from edge to edge. ZERO empty space, ZERO solid color bars, ZERO letterboxing.`;

  prompt += ` Avoid: distorted anatomy, blurry areas, compression artifacts, plastic skin, waxy appearance, low quality, watermark, text, cartoon, illustration, AI-looking, uncanny valley, extra fingers, deformed hands.`;

  if (config.freePrompt?.trim()) {
    prompt = `MANDATORY USER INSTRUCTIONS (HIGHEST PRIORITY — do NOT omit any detail): ${config.freePrompt.trim()}\n\n${prompt}`;
  }

  return prompt;
}

async function generateWithGoogle(parts: any[], googleApiKey: string, model: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;
  console.log(`📸 Calling Google Gemini ${model} for portrait generation...`);

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config, subjectImage, googleApiKey, aiModel } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const model = aiModel === "flash" ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";
    const prompt = buildPortraitPrompt(config);
    console.log("📸 Portrait prompt:", prompt.substring(0, 500));

    const genderLabel = config.gender === 'female' ? 'woman/female' : 'man/male';

    // Build parts for Google Gemini API
    const parts: any[] = [];

    if (subjectImage) {
      parts.push({ text: `[SUBJECT IDENTITY — THIS IS THE ${genderLabel.toUpperCase()} who MUST appear in the generated portrait. You MUST faithfully reproduce this EXACT person: same face shape, same eyes, same nose, same mouth, same skin tone, same hair color and style, same ethnicity. This is a ${genderLabel}. Do NOT change the gender. Do NOT generate a different person. The output MUST be recognizable as this specific individual.]` });

      if (subjectImage.startsWith("data:")) {
        const match = subjectImage.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
    }

    const finalText = subjectImage
      ? `${PORTRAIT_SYSTEM_PROMPT}\n\n${prompt}\n\nABSOLUTE RULE — IDENTITY LOCK: The generated person MUST be the EXACT ${genderLabel} from the SUBJECT IDENTITY photo. Same face, same features, same gender (${genderLabel}). This is NON-NEGOTIABLE.`
      : `${PORTRAIT_SYSTEM_PROMPT}\n\n${prompt}`;

    parts.push({ text: finalText });

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
