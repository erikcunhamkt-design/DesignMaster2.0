// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUILD_SYSTEM = `You are a world-class prompt engineer specializing in image generation prompts for AI models like Midjourney, DALL-E, and Gemini.

Given the user's inputs (subject, environment, styles, categories, extras), generate a single, comprehensive, highly detailed prompt that will produce professional, stunning results.

Rules:
- Write the prompt in English
- Include: subject description, environment/setting, lighting, composition, camera angle, color palette, mood, quality descriptors
- End with technical quality tags (8K, photorealistic, ultra sharp, etc.)
- Be specific and vivid — avoid generic terms
- Return ONLY the prompt text, nothing else`;

const MARKDOWN_SYSTEM = `You are a prompt engineering specialist. Generate image generation prompts in well-structured Markdown format.

For each variation, create a complete prompt with:
- ## Variation N: [descriptive title]
- **Prompt:** the full prompt text
- **Negative Prompt:** what to avoid
- **Suggested Settings:** dimensions, quality, style tags

Rules:
- Write prompts in English
- Each variation should have a meaningfully different approach (different lighting, angle, mood, etc.)
- Be specific, detailed, and professional
- Include technical quality descriptors
- Return formatted Markdown only`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { mode, googleApiKey } = body;

    if (!googleApiKey || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userMessage = "";

    if (mode === "build") {
      const { subject, environment, styles, categories, extra } = body;
      systemPrompt = BUILD_SYSTEM;
      userMessage = `Subject: ${subject}`;
      if (environment) userMessage += `\nEnvironment: ${environment}`;
      if (styles?.length) userMessage += `\nVisual styles: ${styles.join(", ")}`;
      if (categories?.length) userMessage += `\nCategories: ${categories.join(", ")}`;
      if (extra) userMessage += `\nExtra instructions: ${extra}`;
    } else if (mode === "markdown") {
      const { topic, variations = 3, extra } = body;
      systemPrompt = MARKDOWN_SYSTEM;
      userMessage = `Topic: ${topic}\nGenerate ${variations} variations.`;
      if (extra) userMessage += `\nExtra: ${extra}`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const model = "gemini-3.1-pro-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Aguarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Erro na API: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const promptText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ prompt: promptText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("prompt-ai error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
