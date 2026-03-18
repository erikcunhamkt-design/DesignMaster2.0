// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════
// FOTÓGRAFO PROFISSIONAL — Internal Photography Knowledge Base
// Silently expands user config into hyper-detailed photographic prompts
// using professional camera, lens, angle, composition & lighting data.
// ══════════════════════════════════════════════════════════════

const PHOTOSHOOT_SYSTEM = `You are FOTÓGRAFO PROFISSIONAL — an elite internal photography prompt engine.
You receive a portrait configuration and SILENTLY transform it into a hyper-detailed, cinematic, professional photography prompt.

You have deep knowledge of professional photography equipment and techniques:

═══ CAMERAS ═══
- Canon EOS 5D Mark IV: DSLR full frame, fidelidade de cor, ótima performance em ISO alto — retratos, moda, estúdio.
- Nikon D850: Altíssima resolução, amplo alcance dinâmico — editoriais, produtos, texturas.
- Sony Alpha a7R IV: Mirrorless full-frame, nitidez extrema, cores consistentes — ensaios externos.
- Fujifilm GFX 100: Médio formato 102MP — campanhas publicitárias, fine art, profundidade tonal.
- Leica M10-R: Visual minimalista, look analógico sofisticado — documental, estilo refinado.
- Hasselblad H6D-100c: Médio formato top — moda de luxo, precisão em tons, contraste, nitidez.
- Canon EOS R5: Mirrorless, foco ultrarrápido — retratos contemporâneos, campanhas modernas.
- Sony FX3: Atmosfera cinematográfica — direção de arte experimental.
- Nikon Z7 II: Mirrorless full-frame, reprodução de cor precisa — leveza e qualidade premium.
- Panasonic Lumix S1R: Alta resolução — moda, arquitetura, fine art.

═══ LENSES ═══
- 50mm f/1.4: Clássica versátil, campo de visão natural, desfoque suave — retratos, lifestyle.
- 85mm f/1.2: Separação de fundo extrema, bokeh cremoso — closes com emoção, estética cinematográfica.
- 35mm f/1.4: Grande angular com distorção natural — moda urbana, documentário.
- 24mm f/1.4: Ampla cobertura — cenas abertas, interiores, arquitetura.
- 70-200mm f/2.8: Zoom telefoto — eventos, editoriais à distância, retratos comprimidos.
- 100mm f/2.8 Macro: Detalhes e closes extremos — produtos, joias, texturas.
- 135mm f/2.0: Compressão suave, separação excelente — retratos editoriais, campanhas.
- 24-70mm f/2.8: Zoom equilibrado — estúdios, moda, produtos.

═══ ANGLES ═══
- Eye-level: Altura dos olhos, igualdade e naturalidade, conexão direta.
- High angle: De cima, sujeito menor, vulnerabilidade.
- Low angle: De baixo, autoridade, imponência, poder.
- Overhead: Vista vertical aérea, padrões gráficos.
- Worm's-eye view: Do chão, dramaticidade extrema.
- Dutch angle: Inclinado, desequilíbrio, tensão psicológica.
- Side view: Perfil, linhas, formas, silhuetas.
- Close-up: Rosto, emoções, detalhes.
- Extreme close-up: Olhos, dedos, textura, elementos sensoriais.
- Wide shot: Cena completa, contexto, espaço.
- Medium long shot (Americano): Joelhos para cima, moda, expressão corporal.

═══ COMPOSITION ═══
- Rule of thirds: Elementos nas interseções, equilíbrio visual.
- Centered: Estabilidade, simetria, destaque imediato.
- Symmetry: Elementos espelhados, ordem, perfeição.
- Layered depth: Múltiplos planos, profundidade narrativa.
- Leading lines: Linhas naturais conduzem o olhar.
- Full frame fill: Objeto ocupa todo quadro, textura e expressividade.
- Negative space: Área vazia valoriza foco, leveza ou isolamento.
- Natural framing: Portas, janelas como moldura interna.
- Depth perspective: Sensação tridimensional.
- Intentional asymmetry: Tensão visual, impacto estético moderno.

═══ LIGHTING ═══
- Soft light: Dispersa, sem sombras marcadas — retratos delicados, clean.
- Hard light: Direta e intensa, sombras nítidas — formas, texturas, drama.
- Backlight: Atrás do sujeito, brilhos, silhuetas, etéreo.
- Rim light: Bordas iluminadas, separação do fundo.
- Split lighting: Meia luz, contraste intenso, cinematográfico.
- Rembrandt (triangular): Triângulo de luz sob olho oposto — retratos expressivos.
- Butterfly: De cima frontal, sombra sob nariz — beleza, traços simétricos.
- Natural ambient: Luz disponível, sol, janelas — autêntico, orgânico.
- Studio setup: Luzes artificiais, softboxes, refletores — controle total.
- Cinematic: Sombras dramáticas, cores específicas, narrativa visual.
- Creative colored: Filtros coloridos — artístico, futurista, conceitual.

YOUR TASK:
Given the user's portrait configuration, create a SINGLE continuous prompt in English that:
1. Describes the subject with vivid physical and emotional detail
2. Selects the BEST camera + lens combination for this specific portrait style
3. Defines precise lighting setup with modifiers and ratios
4. Specifies camera angle, composition technique and framing
5. Adds deep texture commands: skin pores, hair strands, fabric fiber, volumetric lighting
6. Adds realism tokens: 8K, HDR, extreme sharpness, depth of field
7. Ends with negative commands: no text, no watermark, no distortion, no cartoon

RULES:
- Output ONLY the expanded prompt as a single continuous paragraph in English
- Be ULTRA specific about camera model, exact lens, and aperture
- Match lighting to the mood (dramatic = hard light setups, gentle = soft diffused)
- Choose composition that enhances the portrait style
- NO commentary, NO labels, NO explanations
- Include the clothing/outfit details if provided
- Always include deep texture and realism commands`;

const PORTRAIT_SYSTEM_PROMPT = `You are PORTRAIT MASTER — the world's most elite portrait photography AI.
You generate ULTRA-REALISTIC professional studio portraits indistinguishable from master photographers.

CRITICAL RULES:
- NEVER generate cartoon, illustration, or AI-looking images
- NEVER produce plastic skin, waxy appearance, or uncanny valley effects
- ALWAYS maintain anatomical correctness
- ALWAYS produce catchlights in eyes
- ALWAYS ensure natural skin texture with visible pores`;

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
  const genderLabel = config.gender === 'female' ? 'woman' : 'man';

  const parts = [
    `Professional studio portrait of a ${genderLabel}`,
    `Expression: ${config.expression}`,
    `Lighting style: ${config.lighting}`,
    `Background: ${config.background}`,
    `Camera angle: ${config.cameraAngle}`,
    `Preferred lens: ${config.lens}`,
  ];

  if (config.clothing?.trim()) parts.push(`Wearing: ${config.clothing.trim()}`);
  if (config.freePrompt?.trim()) parts.push(`Additional instructions (HIGHEST PRIORITY): ${config.freePrompt.trim()}`);

  return parts.join('. ') + '.';
}

async function expandWithPhotoshootAgent(configDescription: string, googleApiKey: string): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  console.log("📸 FOTÓGRAFO PROFISSIONAL: Expanding portrait config into detailed prompt...");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${PHOTOSHOOT_SYSTEM}\n\nPORTRAIT CONFIGURATION:\n${configDescription}` }]
      }],
      generationConfig: {
        temperature: 0.4,
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
  console.log(`🎨 Calling Google Gemini ${model} for portrait generation...`);

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
    const { config, subjectImage, googleApiKey, aiModel } = await req.json();

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10 || googleApiKey.trim().length > 256) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const model = aiModel === "flash" ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";

    // Step 1: Build config description from user selections
    const configDescription = buildConfigDescription(config);
    console.log("📋 Config description:", configDescription.substring(0, 300));

    // Step 2: Silently expand with Fotógrafo Profissional
    const expandedPrompt = await expandWithPhotoshootAgent(configDescription, googleApiKey);

    const genderLabel = config.gender === 'female' ? 'woman/female' : 'man/male';

    // Step 3: Build parts for Google Gemini image generation
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

    const edgeFill = "CRITICAL FRAMING RULE: The generated image MUST fill 100% of the canvas from edge to edge. ZERO empty space, ZERO solid color bars, ZERO letterboxing.";

    const finalText = subjectImage
      ? `${PORTRAIT_SYSTEM_PROMPT}\n\n${expandedPrompt}\n\n${edgeFill}\n\nABSOLUTE RULE — IDENTITY LOCK: The generated person MUST be the EXACT ${genderLabel} from the SUBJECT IDENTITY photo. Same face, same features, same gender (${genderLabel}). This is NON-NEGOTIABLE.`
      : `${PORTRAIT_SYSTEM_PROMPT}\n\n${expandedPrompt}\n\n${edgeFill}`;

    parts.push({ text: finalText });

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
