import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, negativePrompt, referenceImages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages for the image generation model
    const userContent: any[] = [
      {
        type: "text",
        text: `Generate this image. ${prompt}${negativePrompt ? `\n\nAvoid: ${negativePrompt}` : ""}`,
      },
    ];

    // Add reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      for (const refImg of referenceImages) {
        userContent.push({
          type: "image_url",
          image_url: { url: refImg },
        });
      }
    }

    // Try generation with references first, then without on failure
    async function callModel(refs: any[]): Promise<Response> {
      const content: any[] = [
        {
          type: "text",
          text: `Generate this image. ${prompt}${negativePrompt ? `\n\nAvoid: ${negativePrompt}` : ""}`,
        },
        ...refs,
      ];

      console.log(`Calling Nano Banana Pro (${refs.length} refs)...`);

      return fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content }],
            modalities: ["image", "text"],
          }),
        }
      );
    }

    // Build ref entries (limit size)
    const refEntries: any[] = [];
    if (referenceImages && referenceImages.length > 0) {
      for (const refImg of referenceImages.slice(0, 3)) {
        refEntries.push({ type: "image_url", image_url: { url: refImg } });
      }
    }

    // Attempt 1: with references
    let response = await callModel(refEntries);

    // If failed with refs, retry without
    if (!response.ok && refEntries.length > 0) {
      console.log("Retrying without reference images...");
      response = await callModel([]);
    }

    // If still failed, one more retry
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Final retry after short delay
      await new Promise(r => setTimeout(r, 2000));
      response = await callModel([]);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Final AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erro na geração: ${response.status}. Tente novamente.` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente novamente com outro prompt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, text: textResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
