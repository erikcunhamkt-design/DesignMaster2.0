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
    const { refinementPrompt, imageDataUrl, googleApiKey } = await req.json();

    if (!refinementPrompt || typeof refinementPrompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt de refinamento não fornecido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Imagem não fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemInstruction = `You are an expert image editor. Apply the requested changes to the provided image while preserving the overall composition, subject, style, and quality. The image MUST fill the entire canvas edge to edge — no blank space, no letterboxing. Only apply the described modifications and nothing else.`;

    const fullPrompt = `${systemInstruction}\n\nChanges to apply: ${refinementPrompt}`;

    // Extract base64 from data URL
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    const parts: any[] = [];
    if (match) {
      parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }
    parts.push({ text: fullPrompt });

    const model = "gemini-3.1-flash-image-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    console.log(`Calling Google Gemini ${model} for image refinement...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API Key sem permissão." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Erro ao refinar imagem: ${response.status}. Tente novamente.` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let imageUrl: string | null = null;
    let textResponse = "";

    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        if (part.text) textResponse += part.text;
      }
    }

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada no refinamento. Tente com outro prompt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, text: textResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("refine-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
