// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, replicateOptions, extraInstruction, googleApiKey } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build focus instruction based on user selections
    const focusMap: Record<string, string> = {
      tudo: "Extract EVERYTHING: subject, background, style, lighting, composition, colors, textures, camera, mood, typography, objects.",
      personagem: "Focus on the CHARACTER/SUBJECT only: anatomy, pose, expression, clothing, accessories, skin detail, hair. Ignore background.",
      background: "Focus on the BACKGROUND/ENVIRONMENT only: scenery, architecture, atmosphere, depth, sky, ground. Ignore the main subject.",
      estilo: "Focus on the ARTISTIC STYLE only: rendering technique, art movement, digital vs traditional, level of realism, stylization approach.",
      "iluminação": "Focus on LIGHTING only: light sources, direction, color temperature, shadows, highlights, rim light, volumetric effects, time of day.",
      "composição": "Focus on COMPOSITION only: framing, rule of thirds, leading lines, symmetry, negative space, depth of field, focal point placement.",
      paleta: "Focus on COLOR PALETTE only: dominant colors (with hex codes if possible), color harmony, saturation levels, contrast, color grading.",
      texturas: "Focus on TEXTURES only: surface materials, fabric, skin, metal, wood, glass, roughness, reflectivity, tactile quality.",
      camera: "Focus on CAMERA/LENS only: focal length estimate, aperture/bokeh, perspective distortion, angle (low/eye/high), distance (close-up/medium/wide).",
      mood: "Focus on MOOD/ATMOSPHERE only: emotional tone, narrative feeling, cinematic quality, tension, warmth, eeriness, energy level.",
      objetos: "Focus on OBJECTS/PROPS only: every item visible, their placement, scale, material, condition, relevance to scene.",
      tipografia: "Focus on TYPOGRAPHY only: fonts, text content, placement, size, color, effects (shadow, glow, 3D), hierarchy.",
    };

    let focusInstructions = "";
    if (replicateOptions && replicateOptions.length > 0) {
      const focuses = replicateOptions
        .map((opt: string) => focusMap[opt] || `Focus on: ${opt}`)
        .join("\n- ");
      focusInstructions = `\n\n## EXTRACTION FOCUS (MANDATORY)\nThe user wants you to focus SPECIFICALLY on:\n- ${focuses}\n\nPrioritize these aspects above all else. Be 10x more detailed on these focused areas.`;
    }

    const extraHint = extraInstruction
      ? `\n\n## USER CUSTOM INSTRUCTION (HIGHEST PRIORITY)\n"${extraInstruction}"\nFollow this instruction precisely. It overrides default behavior.`
      : "";

    const systemPrompt = `You are the world's most precise AI image prompt reverse-engineer. You have deep expertise in photography, cinematography, digital art, graphic design, and AI image generation (Midjourney, Stable Diffusion, DALL-E, Flux, Ideogram).

## YOUR MISSION
Analyze the provided image with forensic-level precision and produce a prompt that would recreate this image with 95%+ fidelity when fed to an AI image generator.

## ANALYSIS METHODOLOGY
Follow this exact order for maximum accuracy:

### 1. SUBJECT IDENTIFICATION
- What is the main subject? Describe with extreme specificity (not "a woman" but "a young East Asian woman in her mid-20s with shoulder-length black hair, soft bangs, wearing a cream silk blouse")
- Pose, expression, gesture, body language
- Every visible accessory, clothing item, texture of fabrics

### 2. ENVIRONMENT & BACKGROUND
- Setting type (studio, outdoor, interior, abstract)
- Every visible element in the background with spatial relationships
- Depth and layering of the scene
- Atmospheric effects (fog, rain, dust particles, bokeh)

### 3. LIGHTING ANALYSIS (Critical for realism)
- Primary light source: direction, intensity, color temperature (in Kelvin if possible)
- Secondary/fill lights
- Rim/back lighting
- Shadow characteristics (hard/soft, direction, density)
- Specular highlights and their placement
- Global illumination quality

### 4. CAMERA & LENS TECHNICAL
- Estimated focal length (24mm, 35mm, 50mm, 85mm, 135mm, 200mm+)
- Aperture estimate (f/1.4 shallow DoF vs f/11 deep)
- Camera angle and height relative to subject
- Perspective distortion characteristics
- Motion blur presence

### 5. COLOR SCIENCE
- Dominant color palette with approximate hex values
- Color grading/LUT style (teal-orange, desaturated, vibrant, pastel)
- White balance characterization
- Contrast ratio (low/medium/high)

### 6. STYLE & RENDERING
- Art style classification (photorealistic, digital painting, 3D render, illustration, vector, etc.)
- Rendering quality markers
- Post-processing effects (grain, vignette, chromatic aberration, lens flare)
- Identifiable aesthetic influences (specific photographers, artists, design movements)

### 7. COMPOSITION
- Aspect ratio
- Rule of thirds / golden ratio alignment
- Leading lines and visual flow
- Negative space usage
- Layering and depth planes

## OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:
{
  "prompt": "<A single, masterfully crafted prompt paragraph. Write it as you would for Midjourney v6 or Flux Pro: start with subject, then scene, then style modifiers, then technical parameters. Use specific technical terms. Be exhaustive but coherent. Minimum 150 words.>",
  "negative_prompt": "<Specific artifacts to avoid based on what you see IS correct in the image. Include technical issues that would degrade this specific type of image.>",
  "suggested_settings": {
    "width": <number based on apparent aspect ratio>,
    "height": <number based on apparent aspect ratio>,
    "quality": "ultra",
    "style_tags": ["<tag1>", "<tag2>", "..."]
  },
  "notes": ["<Technical observation 1>", "<Observation 2>", "..."]
}

## STYLE TAGS (choose all that apply)
ultra realista, glow, glassmorphism, cartoon, gamer, cinematic, editorial, retrato profissional, minimalista, tecnológico, elegante, lúdico, neon, vintage, dark moody, high fashion, anime, concept art, product photography, flat design, isometric, watercolor, oil painting, pencil sketch, pixel art, vaporwave, cyberpunk, fantasy, sci-fi, noir, pop art, surreal, abstract, architectural, food photography, macro, aerial, street photography, double exposure, long exposure, HDR, infrared, tilt-shift

## QUALITY RULES
- NEVER be vague. Replace "beautiful lighting" with "soft diffused key light from upper-left at 5600K with subtle warm fill from lower-right"
- NEVER use filler words. Every word must add information.
- Describe what you SEE, not what you assume.
- Include technical camera/lens terms when the image shows photographic qualities.
- The prompt must be self-contained: someone reading ONLY the prompt should be able to visualize the exact image.${focusInstructions}${extraHint}`;

    // Extract base64 data from data URL
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    const parts: any[] = [{ text: systemPrompt }];

    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    } else {
      // If it's already raw base64 or a URL, send as text reference
      parts.push({ text: `Analyze this image: ${imageBase64.substring(0, 100)}...` });
    }

    const model = "gemini-3.1-pro-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    console.log(`Calling Google Gemini ${model} for prompt extraction...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido na API do Google. Aguarde e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API Key sem permissão. Verifique se a key tem acesso à API Gemini." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Erro na API do Google: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let extracted;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Não foi possível analisar a imagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(extracted),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-prompt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
