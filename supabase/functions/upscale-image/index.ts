const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════════════════
// ULTRA UPSCALE ENGINE — True image enhancement, not regeneration
// Uses the image as INLINE DATA so the model enhances the EXACT pixels
// ══════════════════════════════════════════════════════════════════════════

function buildUpscalePrompt(resolution: string, diagnosticCorrections?: string): string {
  const resLabel = resolution === '4K' ? '4K (3840×2160)' : '2K (2560×1440)';

  let prompt = `You are a professional image restoration and upscaling specialist. Your task is to ENHANCE this exact image to ${resLabel} resolution while preserving ABSOLUTE PIXEL FIDELITY.

THIS IS NOT AN IMAGE GENERATION TASK. You must return the EXACT SAME IMAGE with dramatically improved quality. The output must be the same scene, same composition, same everything — only the technical quality changes.

═══ CRITICAL IDENTITY PRESERVATION ═══
• The subject's face, body, pose, clothing, accessories must remain 100% IDENTICAL
• The background, objects, setting must remain 100% IDENTICAL
• The composition, framing, camera angle, crop must remain 100% IDENTICAL
• The lighting direction, color temperature, mood must remain 100% IDENTICAL
• The color palette, saturation, hue balance must remain 100% IDENTICAL

═══ ENHANCEMENT OPERATIONS (what you MUST do) ═══

1. RESOLUTION UPSCALE TO ${resLabel}:
   - Intelligently reconstruct sub-pixel detail to fill the higher resolution
   - Generate sharp, natural detail at the new resolution — no blurry upscaling
   - Every pixel must carry meaningful information at the target resolution

2. SHARPNESS & DETAIL RECOVERY:
   - Recover micro-textures: skin pores, fabric weave, hair strands, surface grain
   - Apply frequency-aware sharpening — enhance real detail, not noise
   - Restore edge definition without haloing or ringing artifacts
   - Reconstruct fine typography, patterns, and geometric details

3. NOISE & ARTIFACT ELIMINATION:
   - Remove JPEG/WebP compression blocking and banding
   - Eliminate color noise and luminance noise
   - Remove mosquito noise around high-contrast edges
   - Clean up posterization in gradients
   - Remove any existing upscale artifacts from prior low-quality upscaling

4. DYNAMIC RANGE ENHANCEMENT:
   - Recover shadow detail without lifting blacks unnaturally
   - Restore highlight information without clipping
   - Improve local contrast for added depth and dimensionality
   - Enhance tonal separation between similar values

5. COLOR FIDELITY:
   - Correct any color cast or white balance drift
   - Restore natural saturation without oversaturating
   - Improve color depth and bit-depth rendering
   - Ensure smooth color gradients without banding

6. TEXTURE RECONSTRUCTION:
   - Rebuild fabric textures (cotton weave, silk sheen, leather grain)
   - Reconstruct skin texture naturally (pores, fine lines, natural imperfections)
   - Restore material surfaces (metal reflections, glass transparency, wood grain)
   - Rebuild environmental textures (foliage detail, water surface, clouds)

═══ QUALITY STANDARD ═══
The final result must look like it was originally captured at ${resLabel} with a Phase One IQ4 150MP medium format camera — not like a low-res image that was stretched. Every millimeter must carry genuine, sharp, detailed information.

═══ STRICTLY FORBIDDEN ═══
• DO NOT change the person's identity, face, features, expression, age, or appearance
• DO NOT change clothing, accessories, hairstyle, or any visible objects
• DO NOT add or remove ANY elements from the scene
• DO NOT change the art style, aesthetic, or visual mood
• DO NOT relight, recolor, or restyle the image
• DO NOT apply beauty filters, skin smoothing, or glamour effects
• DO NOT generate a "similar" or "inspired" image — enhance THIS EXACT image
• DO NOT add lens flare, bokeh, vignette, or any effects not in the original
• DO NOT crop, rotate, or change the aspect ratio`;

  if (diagnosticCorrections) {
    prompt += `\n\n═══ DIAGNOSTIC-GUIDED CORRECTIONS ═══\nBased on AI analysis of this specific image, pay extra attention to:\n${diagnosticCorrections}`;
  }

  prompt += `\n\nNEGATIVE: face morphing, identity change, different person, beauty filter, oversaturation, HDR artifacts, oversharpening, haloing, ringing, plastic skin, waxy texture, AI generation artifacts, different composition, added elements, removed elements`;

  return prompt;
}

async function upscaleImage(imageBase64: string, googleApiKey: string, resolution: string, diagnosticCorrections?: string) {
  const model = "gemini-3-pro-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  // Strip data URI prefix
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  
  // Detect mime type
  let mimeType = "image/jpeg";
  if (imageBase64.startsWith("data:image/png")) mimeType = "image/png";
  else if (imageBase64.startsWith("data:image/webp")) mimeType = "image/webp";

  const prompt = buildUpscalePrompt(resolution, diagnosticCorrections);

  console.log(`🔍 Upscaling image to ${resolution} using ${model}...`);

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            // Image FIRST as inline data — this is critical for the model to enhance it
            { inline_data: { mime_type: mimeType, data: base64Data } },
            // Then the enhancement instructions
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
          console.log(`✅ Upscale ${resolution} successful`);
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      // No image in response
      const textResponse = parts.map((p: any) => p.text).filter(Boolean).join(" ");
      console.warn("⚠️ No image returned. Text:", textResponse?.slice(0, 200));
      throw { status: 422, message: textResponse?.trim() ? `Modelo respondeu sem imagem: "${textResponse.slice(0, 150)}"` : "Nenhuma imagem gerada. O prompt pode ter sido bloqueado." };
    }

    const errorText = await response.text();

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryMatch = errorText.match(/"retryDelay":\s*"(\d+)s"/);
      const waitSec = retryMatch ? Math.min(parseInt(retryMatch[1], 10), 30) : 15;
      console.warn(`⏳ Rate limited. Retrying in ${waitSec}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }

    console.error("Gemini API error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Rate limit excedido. Aguarde 1 minuto e tente novamente." };
    if (response.status === 400) throw { status: 400, message: "Requisição inválida. A imagem pode ser muito grande." };
    throw { status: 500, message: `Erro na API: ${response.status}` };
  }

  throw { status: 429, message: "Rate limit excedido após tentativas. Aguarde e tente novamente." };
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