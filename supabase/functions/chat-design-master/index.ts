// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o **Design Master** — mentor de elite em design gráfico, branding e viralização no Instagram.

Personalidade: criativo, direto, prático, inspirador.

Especialidades:
1. Ideias de conteúdo para Instagram (posts, stories, reels, carrosséis)
2. Calendários de conteúdo estratégicos
3. Direção visual (paleta, tipografia, layout)
4. Estratégias de viralização e hook visual
5. Conceitos de imagens magnéticas
6. Branding visual
7. Prompts para IA de imagem

Regras OBRIGATÓRIAS:
- Responda SEMPRE em português brasileiro
- Use Markdown (títulos, listas, negrito, emoji)
- Seja CONCISO e direto — respostas curtas e acionáveis
- Máximo 3-5 bullet points por tópico
- NÃO escreva parágrafos longos — prefira listas
- Quando der ideias, dê 3-5 opções em formato de lista curta
- Se pedirem prompt de imagem, escreva em inglês, CURTO (máximo 2-3 linhas), focado nos elementos essenciais
- Quando o usuário enviar uma imagem, analise-a visualmente e dê feedback como especialista em design (composição, cores, tipografia, impacto visual, melhorias)`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, googleApiKey } = await req.json();

    if (!googleApiKey || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida. Configure sua chave no botão API." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert chat messages to Gemini format
    const geminiContents = [];
    
    // Add system prompt as first user message context
    geminiContents.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }]
    });
    geminiContents.push({
      role: "model",
      parts: [{ text: "Entendido! Sou o Design Master, pronto para ajudar com design, viralização e conteúdo magnético. Como posso ajudar?" }]
    });

    for (const msg of messages) {
      const parts: any[] = [];
      let textContent = msg.content;

      // Extract image URLs for multimodal support
      const imageRegex = /\[Imagem:\s*(https?:\/\/[^\]]+)\]/g;
      const imageUrls: string[] = [];
      let match;
      while ((match = imageRegex.exec(textContent)) !== null) {
        imageUrls.push(match[1]);
      }
      // Remove image tags from text
      textContent = textContent.replace(imageRegex, '').trim();

      // Fetch images and add as inlineData (before text per Gemini spec)
      for (const imageUrl of imageUrls) {
        try {
          const imgResp = await fetch(imageUrl);
          if (imgResp.ok) {
            const arrayBuf = await imgResp.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
            const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
            const mimeType = contentType.split(';')[0].trim();
            parts.push({ inlineData: { mimeType, data: base64 } });
          }
        } catch (e) {
          console.error("Failed to fetch image:", imageUrl, e);
        }
      }

      if (textContent) {
        parts.push({ text: textContent });
      } else if (imageUrls.length > 0) {
        parts.push({ text: "Analise esta imagem e me dê sua opinião como especialista." });
      }

      geminiContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts
      });
    }

    const model = "gemini-3.1-pro-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${googleApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: geminiContents }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Aguarde um momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API Key inválida ou sem permissão." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Erro na API Google: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the SSE response back to the client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-design-master error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
