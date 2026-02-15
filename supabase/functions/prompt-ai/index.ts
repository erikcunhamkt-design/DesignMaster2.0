import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { mode } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const promptText = data.choices?.[0]?.message?.content || "";

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
