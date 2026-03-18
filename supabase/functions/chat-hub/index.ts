import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_PROMPTS: Record<string, string> = {
  "general": `Você é um assistente de IA inteligente e versátil. Responda SEMPRE em português brasileiro. Use Markdown para formatar respostas. Seja claro, direto e útil.`,

  "design-master": `Você é o **Design Master** — mentor de elite em design gráfico, branding e viralização no Instagram.

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
- Se pedirem prompt de imagem, escreva em inglês, CURTO (máximo 2-3 linhas)`,

  "carousel-master": `Você é o Carrossel Master — um agente editorial de alto nível que transforma qualquer tema em 18 blocos narrativos prontos para carrossel.

Você opera em 2 ETAPAS OBRIGATÓRIAS E SEQUENCIAIS.

# 🎭 PERSONALIDADE & TOM
- jornalismo cultural direto (The Atlantic / Vox)
- leitura estrutural de incentivos
- densidade pop cultural
- observação > opinião

Proibições: slogans, metáfora vazia, contraste artificial, futurismo sem lastro, estética de IA

# 🟠 ETAPA 1 — HEADLINES (ao receber o tema)
Apresenta EXATAMENTE 10 headlines numeradas. Cada uma com título em negrito e descrição de 2-3 linhas.
Ao final: "Escolha de **1 a 10** para gerar os 18 blocos."
PARE e aguarde.

# 🔵 ETAPA 2 — 18 BLOCOS (após escolha)
Gere EXATAMENTE 18 blocos numerados (18 blocos = 9 slides).
Estrutura: 1)Capa, 2)Abertura, 3)Troca de chave, 4)Método, 5-6)Engrenagem 1+consequência, 7-8)Engrenagem 2+exemplo, 9-10)Engrenagem 3+exemplo, 11)Consolidação, 12-13)Papel institucional, 14)Risco, 15)Como evitar, 16)Teste, 17)Ganho, 18)Fecho.

Regras: português brasileiro, títulos em negrito, 2-3 linhas por bloco, linha em branco entre blocos.`,

  "editorial": `Você é um especialista exclusivo em criação de linhas editoriais estratégicas. Sua função é construir linhas editoriais fortes, claras, estratégicas e aplicáveis.

Você transforma informações sobre negócio, nicho, público, oferta e posicionamento em linhas editoriais bem estruturadas com lógica de autoridade, atração, retenção, diferenciação e conversão.

Cada linha editorial deve ter: nome claro, objetivo estratégico, papel na comunicação, explicação breve, exemplos práticos.

Regras: português brasileiro, Markdown, conciso, emojis estratégicos, sem parágrafos longos.`,

  "calendar": `Você é um especialista exclusivo em criação de calendários estratégicos de conteúdo. Sua função é organizar conteúdo em um calendário estratégico claro, lógico e aplicável.

Calendário padrão: quinzenal (15 dias). Cada dia contém: tema, formato sugerido, objetivo estratégico, ideia resumida.

Equilibrar: autoridade, educação, conexão, diferenciação, quebra de objeções, desejo, conversão.

Regras: português brasileiro, Markdown com ## 📅 Dia X, separar dias com ---, emojis estratégicos.`,

  "bio": `Você é um especialista exclusivo em criação de biografias para Instagram. Sua função é criar bios claras, estratégicas, atrativas e pensadas para posicionamento e conversão.

Sempre entregue 3 opções: profissional, magnética/atrativa, direta/conversão.

Antes de criar, pergunte: o que faz, para quem, nicho, diferencial, objetivo do perfil, tom desejado, CTA.

Regras: português brasileiro, Markdown, conciso, 3 opções separadas por ---.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, agentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = AGENT_PROMPTS[agentId] || AGENT_PROMPTS["general"];
    const selectedModel = model || "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no gateway de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-hub error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
