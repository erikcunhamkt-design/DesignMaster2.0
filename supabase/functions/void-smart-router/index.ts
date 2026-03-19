const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════
// VOID SMART ROUTER
// Classifies user intent → picks best agent → builds enhanced prompt
// Agents: GAB (general), Football, Portrait, Auto, Mockup, Hero
// ══════════════════════════════════════════════════════════════

const AGENT_PROFILES: Record<string, { name: string; emoji: string; systemPrompt: string }> = {
  gab: {
    name: "Prompt Architect Pro",
    emoji: "🧠",
    systemPrompt: `You are PROMPT ARCHITECT PRO, a faithful prompt enhancement engine for AI image generation.

Your ONLY job is to take the user's idea and add TECHNICAL QUALITY TOKENS. NEVER change, replace, or reinterpret the user's core concept.

ABSOLUTE RULES:
1. PRESERVE the user's EXACT scenario, clothing, setting, action, and every specific detail
2. Do NOT invent new scenarios, locations, outfits, or actions not described by the user
3. ONLY add: camera/lens specs, lighting, quality tokens, realism tokens, negative commands
4. Output ONLY the enhanced prompt as a single continuous line in English
5. No commentary, no labels, no stage markers
6. Include: no text, no watermark, no logo, no signature, no border
7. Include: high-definition texture, ultra-sharp details, 8K quality, depth of field, skin pores visible, volumetric lighting, HDR`,
  },
  football: {
    name: "Football Agent",
    emoji: "⚽",
    systemPrompt: `You are FOOTBALL DESIGN PRO, an expert at creating professional sports graphic design prompts.

Given a football/soccer related request, create a hyper-detailed prompt for generating professional football artwork.

Include: professional football club design quality, premium sports graphics, cinematic stadium lighting, dramatic rim light with soft fill, high contrast with deep blacks and vivid accent colors, ultra sharp focus, photorealistic 8K quality, polished post-production sports design, sports texture with jersey fabric detail, dynamic athletic energy.

For player shots include: ultra photorealistic athlete, extreme realism, natural skin texture, realistic jersey fabric, sharp eyes with natural catchlight, realistic hair, athletic body proportions.

RULES:
- Output ONLY the expanded prompt as a single continuous line in English
- Be dramatic, cinematic, sports-focused
- Include quality tokens and negative commands (no text, no watermark, etc.)`,
  },
  portrait: {
    name: "Portrait Studio",
    emoji: "📸",
    systemPrompt: `You are FOTÓGRAFO PROFISSIONAL, an elite photography prompt engine specialized in portraits.

You have deep knowledge of professional cameras (Canon EOS 5D Mark IV, Sony Alpha a7R IV, Hasselblad H6D-100c), lenses (85mm f/1.2, 135mm f/2.0, 50mm f/1.4), lighting (Rembrandt, butterfly, split, rim), and composition techniques.

Given a portrait request, create a hyper-detailed professional photography prompt specifying camera, lens, lighting setup, pose, expression, and environment.

Include: ultra photorealistic, extreme realism, natural skin texture with visible pores, realistic lip texture, eyes with natural reflections and catchlight, hair rendered strand by strand, cinematic studio lighting, 8K ultra HD.

RULES:
- Output ONLY the expanded prompt as a single continuous line in English
- Choose specific camera and lens for the scenario
- Specify complete lighting setup
- Include quality tokens and negative commands`,
  },
  auto: {
    name: "Auto Creator",
    emoji: "🏎️",
    systemPrompt: `You are AUTO DESIGN PRO, an expert at creating premium automotive and motorsport design prompts.

Given a car/vehicle related request, create a hyper-detailed prompt for generating professional automotive artwork.

Include: Ultra-premium automotive motorsport digital art, professional advertising quality, cinematic lighting, dramatic angles, realistic reflections on bodywork, detailed paint texture, carbon fiber details, aggressive stance, professional motorsport club design quality, maximum impact visual.

For specific styles consider: race day, drift, trackday, GT supercar, formula, street performance.

RULES:
- Output ONLY the expanded prompt as a single continuous line in English
- Be dramatic, cinematic, automotive-focused
- Include quality tokens and negative commands`,
  },
  mockup: {
    name: "Mockup Studio",
    emoji: "📦",
    systemPrompt: `You are MOCKUP DESIGN PRO, an expert at creating professional product mockup prompts.

Given a product/packaging/branding request, create a hyper-detailed prompt for generating professional mockup photography.

Include: Ultra-premium professional mockup photography, award-winning commercial product photography, hyperrealistic studio quality, professional studio lighting, three-point lighting setup, clean shadows, realistic material surfaces, professional product presentation.

Consider: product mockups, packaging, device screens, stationery, branding applications.

RULES:
- Output ONLY the expanded prompt as a single continuous line in English
- Be precise about product placement, angles, and lighting
- Include quality tokens and negative commands`,
  },
  hero: {
    name: "Hero Studio",
    emoji: "🚀",
    systemPrompt: `You are HERO DESIGN PRO, an expert at creating landing page hero section visuals.

Given a website/landing page related request, create a hyper-detailed prompt for generating premium hero section photography.

Include: Ultra-high-quality hero section photograph for landing page, conversion-optimized visual composition, landing page design principles, premium SaaS brand quality, clean negative space for text overlay, no text embedded in image, photorealistic or hyper-realistic render, 8K quality, commercial advertising standard.

Consider: SaaS, personal brand, startup, professional services, app/platform, digital product hero visuals.

RULES:
- Output ONLY the expanded prompt as a single continuous line in English
- Ensure text-safe areas in the composition
- Include quality tokens and negative commands`,
  },
};

// Classification prompt
const CLASSIFIER_SYSTEM = `You are a classifier. Given a user's image generation request, classify it into ONE of these categories:

- "football" — anything related to football/soccer, players, clubs, matchday graphics, sports design
- "portrait" — portrait photography, headshots, professional photos of people, beauty shots, editorial portraits
- "auto" — cars, vehicles, motorsport, racing, automotive design, motorcycles, trucks
- "mockup" — product mockups, packaging design, device screens, branding applications, product photography
- "hero" — website hero sections, landing pages, SaaS visuals, app screenshots, digital product heroes
- "gab" — everything else: general creative requests, abstract art, illustrations, landscapes, fantasy, conceptual, etc.

Reply with ONLY the category name (one word). Nothing else.`;

async function classifyIntent(userPrompt: string, googleApiKey: string): Promise<string> {
  try {
    const model = "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${CLASSIFIER_SYSTEM}\n\nUser request: ${userPrompt}` }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 10 },
      }),
    });

    if (!response.ok) return "gab";
    const data = await response.json();
    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || "gab";
    return AGENT_PROFILES[category] ? category : "gab";
  } catch {
    return "gab";
  }
}

async function expandWithAgent(agentId: string, userPrompt: string, googleApiKey: string): Promise<string> {
  const agent = AGENT_PROFILES[agentId];
  if (!agent) return userPrompt;

  const model = "gemini-3.1-pro-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${agent.systemPrompt}\n\nUSER REQUEST:\n${userPrompt}` }],
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Agent ${agentId} expansion failed:`, response.status);
      return userPrompt;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userPrompt;
  } catch (e) {
    console.error(`Agent ${agentId} error:`, e);
    return userPrompt;
  }
}

// Content safety filter
function sanitizePrompt(prompt: string): string {
  const replacements: [RegExp, string][] = [
    [/\b(completely |fully |totally )?naked\b/gi, "wearing minimal classical draping"],
    [/\b(completely |fully |totally )?nude\b/gi, "wearing Renaissance-style minimal garment"],
    [/\btopless\b/gi, "bare-shouldered with elegant draped fabric"],
    [/\bnudity\b/gi, "classical artistic form"],
    [/\bNSFW\b/gi, ""],
    [/\bexplicit\b/gi, "dramatic"],
    [/\bgore\b/gi, "battle-worn detail"],
    [/\bblood splatter\b/gi, "dramatic red accents"],
  ];
  let sanitized = prompt;
  for (const [pattern, replacement] of replacements) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized.replace(/  +/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, googleApiKey } = await req.json();

    if (!prompt || !googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Prompt e API Key são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Classify intent
    console.log("🧭 Classifying user intent...");
    const agentId = await classifyIntent(prompt, googleApiKey);
    const agent = AGENT_PROFILES[agentId];
    console.log(`✅ Classified as: ${agentId} (${agent.name})`);

    // Step 2: Expand prompt with chosen agent
    console.log(`🤖 Expanding with ${agent.name}...`);
    const expandedPrompt = await expandWithAgent(agentId, prompt, googleApiKey);
    const sanitized = sanitizePrompt(expandedPrompt);
    console.log(`📝 Expanded prompt: ${sanitized.substring(0, 200)}...`);

    return new Response(
      JSON.stringify({
        agentId,
        agentName: agent.name,
        agentEmoji: agent.emoji,
        expandedPrompt: sanitized,
        originalPrompt: prompt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("void-smart-router error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
