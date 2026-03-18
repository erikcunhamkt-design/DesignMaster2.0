const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESTORE_PROMPT = `Restore and enhance the old photograph while strictly preserving the subject's identity, facial geometry, proportions, and expression with absolute accuracy. The person must remain 100% recognizable. Do not alter bone structure, facial features, age characteristics, or expression in any way.

Your primary goal is to restore the photo to its original clarity and quality while respecting its historical authenticity.

Perform advanced restoration including:
- removal of scratches, dust, creases, and scan artifacts
- repair of damaged or missing areas
- reconstruction of lost textures where necessary
- correction of faded contrast
- restoration of tonal balance
- removal of heavy noise caused by film degradation
- repair of color fading (if color photo)

Preserve natural skin texture and real facial details. Do not apply beauty filters, smoothing, or artificial enhancement. Maintain natural asymmetries and authentic skin features.

The background and environment must remain identical to the original image. Do not replace, modify, blur, or alter the background. No added objects, no removed elements, no layout changes, and no perspective adjustments.

Only restore what is damaged while keeping the original scene intact.

Enhance the final rendering as if the restored photograph were captured with a Sony A1 full-frame camera using an 85mm f/1.4 lens at f/1.6, ISO 100, 1/200 shutter speed. This Sony A1 + 85mm f/1.4 setup is mandatory.

Apply full-frame optical realism with:
- precise facial focus
- natural depth rendering
- subtle lens falloff
- premium sensor-level detail reconstruction

Lighting must match the original photograph's direction, angle, and mood. Improve dynamic range carefully while maintaining the authentic lighting conditions of the original image.

Apply cinematic editorial-quality rendering with:
- soft directional lighting
- natural highlight recovery
- preserved shadow details
- deeper but natural contrast
- smooth tonal gradations
- expanded dynamic range without artificial HDR effects

Maintain:
- accurate skin tones
- natural color balance
- subtle film grain consistent with restored film
- premium clarity
- realistic textures

Avoid any artificial appearance.

Render the final result in:
- 4K resolution
- 10-bit color depth
- high realism restoration quality
- editorial photographic finish
- original crop preserved

NEGATIVE INSTRUCTIONS:
no face morphing, no expression changes, no identity alteration, no background replacement, no new objects, no beauty filters, no oversmoothed skin, no plastic texture, no fake glow, no HDR artifacts, no oversharpening, no dramatic lighting changes, no AI-altered facial structure`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, colorize, googleApiKey } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida. Configure no botão API." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let prompt = RESTORE_PROMPT;
    if (colorize) {
      prompt += `\n\nADDITIONAL INSTRUCTION: If this is a black and white or sepia photograph, carefully colorize it with historically accurate and natural colors while maintaining the authentic feel. Use realistic skin tones, natural fabric colors, and period-appropriate hues. The colorization must look natural, not artificial or oversaturated.`;
    }

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: imageBase64.replace(/^data:image\/\w+;base64,/, "") } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Erro na API Gemini: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract image from Gemini native image generation response
    const parts = data.candidates?.[0]?.content?.parts || [];
    let imageUrl: string | null = null;
    
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem gerada pela IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("restore-photo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
