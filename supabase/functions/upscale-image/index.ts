const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════════════════
// ULTRA UPSCALE ENGINE V2 — Inspired by ComfyUI Ultimate Upscale V5
//
// Key techniques adapted from the ComfyUI workflow:
// 1. MULTI-PASS: First structural upscale, then detail refinement
// 2. LOW INTERVENTION: Like denoise 0.15-0.25 — barely change, only enhance
// 3. TILE-AWARE: Process thinking in 1024×1024 regions for consistency
// 4. FACE DETAILING: Dedicated face preservation pass
// 5. TEXTURE FIDELITY: Photorealistic texture reconstruction (skin, fabric, surfaces)
// 6. CONTROLNET PHILOSOPHY: Structure-first, detail-second
// ══════════════════════════════════════════════════════════════════════════

function buildPass1Prompt(resolution: string, diagnosticCorrections?: string): string {
  const resLabel = resolution === '4K' ? '3840×2160' : '2560×1440';

  let prompt = `ROLE: You are a professional image upscaling pipeline, equivalent to a 4xRealWebPhoto neural upscaler followed by a controlled diffusion refinement at denoise strength 0.15.

TASK: Upscale this image to ${resLabel} resolution with ABSOLUTE PIXEL FIDELITY. This is a RESTORATION task, NOT a generation task.

═══ PIPELINE STAGE 1: STRUCTURAL UPSCALE ═══

Think of this as running a dedicated upscale model (like 4xRealWebPhoto_v3) on the image:

1. RESOLUTION RECONSTRUCTION:
   - Reconstruct every pixel to fill ${resLabel} with genuine detail
   - Use intelligent interpolation — NOT bicubic stretching
   - Each 1024×1024 tile region must have consistent detail density
   - Fill sub-pixel information with contextually appropriate detail

2. ARTIFACT REMOVAL (pre-upscale cleanup):
   - Remove JPEG blocking, banding, and mosquito noise
   - Eliminate compression artifacts BEFORE upscaling them
   - Clean posterization in gradients
   - Remove any prior low-quality upscale artifacts (haloing, ringing)

3. STRUCTURAL INTEGRITY (ControlNet-like fidelity):
   - The edge map of the output must match the input EXACTLY
   - All contours, shapes, boundaries remain pixel-accurate
   - No structural drift, warping, or geometric distortion
   - Depth relationships between elements preserved perfectly

═══ PIPELINE STAGE 2: DETAIL REFINEMENT (denoise 0.20) ═══

Like a KSampler at 12 steps with denoise 0.20 — minimal creative intervention:

4. TEXTURE RECONSTRUCTION (realistic LoRA-level quality):
   - Skin: reconstruct pores, fine lines, natural imperfections — NOT smooth/plastic
   - Fabric: rebuild cotton weave, silk sheen, leather grain, stitching
   - Hair: individual strand detail, natural highlights, volume
   - Surfaces: metal reflections, glass transparency, wood grain
   - Environment: foliage leaves, water ripples, cloud wisps, concrete texture

5. SHARPNESS & MICRO-DETAIL:
   - Apply frequency-aware sharpening on genuine detail only
   - Enhance edge definition without haloing (like unsharp mask r=1 amount=0.3)
   - Recover micro-textures lost to compression
   - Typography and patterns must be crisp and readable

6. DYNAMIC RANGE & COLOR:
   - Recover shadow detail naturally (lift shadows max 5%)
   - Restore highlight information without clipping
   - Improve local contrast for depth (like clarity +10, not +50)
   - Color fidelity: correct only obvious casts, preserve artistic intent
   - Smooth color gradients without banding (10-bit quality)

═══ PIPELINE STAGE 3: FACE DETAILING ═══

Like FaceDetailer with SAM segmentation — dedicated face enhancement:

7. FACE PRESERVATION (CRITICAL):
   - Detect all faces in the image
   - For each face: enhance at higher detail level than surrounding areas
   - Preserve EXACT identity: same eyes, nose, mouth, jaw, expression
   - Rebuild skin texture naturally (pores visible, not airbrushed)
   - Sharpen eyes, eyebrows, lips with extra precision
   - Hair around face: individual strand detail
   - NO beauty filters, NO skin smoothing, NO age changes

═══ INTERVENTION LIMITS (denoise ceiling: 0.25) ═══

These limits ensure the output is the SAME image, not a regeneration:
• Color shift tolerance: < 3% per channel
• Structural deviation: 0% (edge map must match)
• Identity deviation: 0% (same person, same expression)
• Composition change: 0% (same framing, same crop)
• Style change: 0% (same mood, same aesthetic)
• Element addition/removal: STRICTLY FORBIDDEN

═══ QUALITY TARGET ═══
The output must look like it was captured natively at ${resLabel} with a Phase One IQ4 150MP — genuine sharpness and detail at every pixel, not AI-smoothed or over-processed. Think "professional remaster" not "AI enhancement".`;

  if (diagnosticCorrections) {
    prompt += `\n\n═══ DIAGNOSTIC-GUIDED CORRECTIONS ═══\nAI analysis detected these specific issues — apply targeted fixes:\n${diagnosticCorrections}`;
  }

  prompt += `\n\nNEGATIVE: face morphing, identity change, beauty filter, skin smoothing, plastic/waxy skin, oversaturation, HDR artifacts, oversharpening haloes, ringing artifacts, AI generation artifacts, different composition, added/removed elements, style change, color shift, blurry upscale, bicubic artifacts`;

  return prompt;
}

async function callGeminiImage(imageBase64: string, mimeType: string, prompt: string, googleApiKey: string): Promise<string> {
  const model = "gemini-3-pro-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }

      const textResponse = parts.map((p: any) => p.text).filter(Boolean).join(" ");
      console.warn("⚠️ No image returned. Text:", textResponse?.slice(0, 200));
      throw { status: 422, message: textResponse?.trim() ? `Modelo respondeu sem imagem: "${textResponse.slice(0, 150)}"` : "Nenhuma imagem gerada." };
    }

    const errorText = await response.text();

    if ((response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
      const retryMatch = errorText.match(/"retryDelay":\s*"(\d+)s"/);
      const baseSec = retryMatch ? parseInt(retryMatch[1], 10) : (attempt + 1) * 5;
      const waitSec = Math.min(baseSec, 30);
      console.warn(`⏳ ${response.status} — retrying in ${waitSec}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }

    console.error("Gemini API error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Rate limit excedido. Aguarde 1 minuto e tente novamente." };
    if (response.status === 400) throw { status: 400, message: "Requisição inválida. A imagem pode ser muito grande." };
    throw { status: 500, message: `Erro na API: ${response.status}` };
  }

  throw { status: 429, message: "Rate limit excedido após tentativas." };
}

async function upscaleImage(imageBase64Raw: string, googleApiKey: string, resolution: string, diagnosticCorrections?: string) {
  // Strip data URI prefix
  const base64Data = imageBase64Raw.replace(/^data:image\/\w+;base64,/, "");

  // Detect mime type
  let mimeType = "image/jpeg";
  if (imageBase64Raw.startsWith("data:image/png")) mimeType = "image/png";
  else if (imageBase64Raw.startsWith("data:image/webp")) mimeType = "image/webp";

  console.log(`🔬 Ultra Upscale V2 — ${resolution} — multi-pass pipeline starting...`);

  // ── PASS 1: Structural upscale + detail refinement + face detailing ──
  console.log("📐 Pass 1: Structural upscale with detail refinement...");
  const pass1Prompt = buildPass1Prompt(resolution, diagnosticCorrections);
  const pass1Result = await callGeminiImage(base64Data, mimeType, pass1Prompt, googleApiKey);

  // ── PASS 2: Polish pass — like a second KSampler at denoise 0.10 ──
  console.log("✨ Pass 2: Polish & micro-detail refinement...");
  const pass2Prompt = `ROLE: Final quality polish pass on an already-upscaled image. You are the last step in a professional remastering pipeline.

This image has already been upscaled. Your job is a VERY LIGHT refinement pass (equivalent to denoise 0.10 — almost invisible intervention):

1. MICRO-SHARPNESS: Apply the finest level of sharpening to bring out:
   - Eyelash detail, iris texture, pupil reflections
   - Individual hair strands and eyebrow hairs
   - Skin pore texture (subtle, natural)
   - Fabric thread patterns
   - Text and typography crispness

2. NOISE CLEANUP: Remove any artifacts introduced by the upscale:
   - Smooth any remaining banding in gradients
   - Clean any subtle haloing around edges
   - Remove any grain inconsistencies between regions

3. TONAL POLISH:
   - Ensure consistent tonal quality across the entire image
   - Verify shadow-highlight transition smoothness
   - Confirm color accuracy and natural saturation

CRITICAL RULES:
- This is a POLISH pass — changes must be nearly imperceptible individually
- The image is already good — you are making it PERFECT
- DO NOT change identity, composition, colors, mood, or style
- Maximum intervention: equivalent to denoise 0.10
- If in doubt, do LESS not more

NEGATIVE: identity change, color shift, style change, composition change, over-processing, over-sharpening, smoothing, beauty filters`;

  const pass2Result = await callGeminiImage(pass1Result, "image/png", pass2Prompt, googleApiKey);

  console.log("✅ Ultra Upscale V2 complete — 2-pass pipeline finished");
  return `data:image/png;base64,${pass2Result}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, resolution = "4K", diagnosticCorrections, googleApiKey } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!googleApiKey || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageUrl = await upscaleImage(imageBase64, googleApiKey, resolution, diagnosticCorrections);

    return new Response(
      JSON.stringify({ imageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("upscale-image error:", error);
    const status = error?.status || 500;
    const message = error?.message || "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
