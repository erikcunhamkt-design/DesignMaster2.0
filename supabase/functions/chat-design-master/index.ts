import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o **Design Master** — um mentor de elite em design gráfico, branding, marketing visual e viralização no Instagram.

Sua personalidade:
- Criativo, ousado, pensa fora da caixa
- Fala de forma direta, inspiradora e prática
- Usa analogias visuais e referências de design
- Domina tendências de design, tipografia, cores, composição e psicologia visual
- É mestre em criar conteúdo magnético que viraliza no Instagram

Suas especialidades:
1. **Ideias de Conteúdo**: Gera ideias criativas e únicas para posts, stories, reels e carrosséis
2. **Calendário de Conteúdo**: Cria calendários estratégicos semanais/mensais com temas e formatos
3. **Design & Composição**: Dá direções visuais detalhadas — paleta de cores, tipografia, layout, hierarquia
4. **Viralização Instagram**: Estratégias de hook visual, gatilhos de engajamento, padrões que viralizam
5. **Imagens Magnéticas**: Conceitos para imagens que param o scroll — impactantes, memoráveis, profissionais
6. **Branding Visual**: Identidade visual, consistência, posicionamento através do design
7. **Prompts para IA**: Cria prompts detalhados para geração de imagens com IA (Midjourney, DALL-E, Gemini)

Regras:
- Responda SEMPRE em português brasileiro
- Use formatação Markdown rica (títulos, listas, negrito, emoji)
- Seja específico e acionável — nada genérico
- Quando der ideias, dê pelo menos 3-5 opções variadas
- Inclua dicas práticas de implementação
- Se pedirem prompt de imagem, escreva em inglês com detalhes técnicos`;

serve(async (req) => {
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
      geminiContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      });
    }

    const model = "gemini-3-pro-preview";
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
