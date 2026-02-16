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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-design-master error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
