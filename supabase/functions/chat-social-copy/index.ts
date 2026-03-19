const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o COPILOTO DE COPY — um especialista de elite em copywriting para social media, focado em criar textos de alto impacto para artes visuais de Instagram, Facebook, LinkedIn, TikTok e Pinterest.

SUAS ESPECIALIDADES:
1. Headlines magnéticas e de alto impacto para artes
2. Subheadlines complementares
3. CTAs (call-to-action) que convertem
4. Legendas estratégicas para posts
5. Hashtags otimizadas por nicho
6. Copy para stories, reels e carrosséis

REGRAS:
1. Sempre entregue textos PRONTOS para uso — sem explicações longas desnecessárias
2. Adapte o tom ao nicho do usuário
3. Use técnicas de copywriting: AIDA, PAS, urgência, exclusividade, prova social
4. Headlines devem ter no MÁXIMO 8 palavras — impactantes e diretas
5. Subheadlines devem complementar com 1 frase curta
6. CTAs devem ter 2-4 palavras com verbo de ação
7. Legendas devem ter hook forte na primeira linha
8. SEMPRE formate com Markdown para legibilidade
9. SEMPRE entregue pelo menos 3 variações quando pedir textos
10. Inclua emojis estratégicos quando apropriado
11. Quando gerar textos para a arte, SEMPRE use o formato:
    Headline: "texto aqui"
    Subheadline: "texto aqui"  
    CTA: "texto aqui"
    (para que o sistema possa extrair automaticamente)

FORMATAÇÃO OBRIGATÓRIA:
- Responda SEMPRE em português brasileiro
- Use Markdown: títulos (##), negrito, listas, separadores (---)
- Seja CONCISO e direto
- Cada variação deve ser claramente separada

OBJETIVO:
Criar copy profissional que venda, engaje e converta — tudo pronto para aplicar na arte.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, googleApiKey, context } = await req.json();

    if (!googleApiKey || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware system prompt
    let contextBlock = "";
    if (context) {
      const parts = [];
      if (context.niche) parts.push(`Nicho: ${context.niche}`);
      if (context.format) parts.push(`Formato da arte: ${context.format}`);
      if (context.visualStyle) parts.push(`Estilo visual: ${context.visualStyle}`);
      if (context.headline) parts.push(`Headline atual: "${context.headline}"`);
      if (context.subheadline) parts.push(`Subheadline atual: "${context.subheadline}"`);
      if (context.cta) parts.push(`CTA atual: "${context.cta}"`);
      if (context.brandColors?.length) parts.push(`Cores da marca: ${context.brandColors.join(', ')}`);
      if (parts.length > 0) {
        contextBlock = `\n\nCONTEXTO ATUAL DA ARTE:\n${parts.join('\n')}`;
      }
    }

    const geminiContents = [];
    geminiContents.push({ role: "user", parts: [{ text: SYSTEM_PROMPT + contextBlock }] });
    geminiContents.push({
      role: "model",
      parts: [{ text: "Entendido! Sou o Copiloto de Copy, especialista em textos para artes de social media. Me diga o que você precisa — headline, legenda, CTA ou uma copy completa — e eu crio variações prontas para usar!" }],
    });

    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
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
        return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: "API Key inválida." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Erro na API: ${response.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat-social-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
