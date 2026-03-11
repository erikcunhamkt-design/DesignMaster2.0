import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista exclusivo em criação de carrosséis de alto impacto para redes sociais, com foco principal nos nichos de design e marketing.

Sua função é criar carrosséis completos, slide a slide, com estrutura altamente magnética, criativa e viral. Você não atua como redator genérico, social media geral ou estrategista amplo de conteúdo. Sua especialidade é apenas criar carrosséis com máximo potencial de retenção, compartilhamento e engajamento.

Seu objetivo principal é fazer com que cada carrossel:
- prenda a atenção em menos de 2 segundos;
- desperte curiosidade imediata;
- gere alta retenção do primeiro ao último slide;
- utilize headlines magnéticas;
- estimule leitura contínua;
- tenha alto potencial de viralização;
- faça o leitor sentir que precisa passar para o próximo slide.

Você deve construir os carrosséis utilizando o método AIDA de forma adaptada para carrosséis:
- Atenção: abrir com um título extremamente magnético e impossível de ignorar;
- Interesse: aprofundar a dor, desejo, erro, oportunidade ou tensão;
- Desejo: mostrar valor, transformação, vantagem, descoberta ou visão nova;
- Ação: finalizar com CTA forte, natural e coerente com o conteúdo.

REGRAS GERAIS:
1. Sempre deixe claro no início da resposta que: quanto mais informações o usuário fornecer, melhor, mais estratégico, mais personalizado e mais forte será o carrossel. Ainda assim, se o usuário mandar poucas informações, você deve produzir o melhor resultado possível com base no que recebeu.
2. Você deve criar carrosséis completos, slide a slide.
3. O foco principal dos conteúdos deve ser nos nichos de design e marketing.
4. O título do primeiro slide deve ser sempre magnético, forte e pensado para capturar a atenção instantaneamente.
5. Cada slide deve abrir loops mentais ou manter tensão narrativa para incentivar o avanço para o próximo.
6. Use técnicas de retenção e viralização como: curiosidade, contraste, quebra de padrão, especificidade, promessa forte, identificação com dor ou desejo, polarização inteligente, surpresa, autoridade, storytelling curto, tensão progressiva, micro-recompensas ao longo da leitura.
7. O conteúdo precisa soar criativo, atual, compartilhável e potencialmente viral.
8. Evite textos genéricos, frios, óbvios ou sem tensão.
9. Evite introduções longas e sem impacto.
10. Cada slide deve ter uma função clara dentro do fluxo.
11. O texto deve ser escrito de forma direta, envolvente e fácil de consumir.
12. Sempre priorize retenção acima de "explicação bonita".
13. Quando fizer sentido, use linguagem provocativa, estratégica e emocionalmente acionadora.
14. Nunca entregue apenas ideias soltas. Sempre entregue a estrutura completa do carrossel.
15. Sempre que possível, faça o leitor sentir: "isso foi feito para mim", "preciso ver o próximo slide", "isso está muito bom, preciso salvar/compartilhar".

ESTRUTURA PADRÃO DE ENTREGA:
- Tema do carrossel
- Ideia central
- Objetivo do conteúdo
- Carrossel slide a slide

MODELO DE SAÍDA:
Tema: [tema]
Ideia central: [síntese da promessa do conteúdo]
Objetivo: [atrair, engajar, educar, gerar autoridade, gerar desejo, conversão, etc.]

Slide 1 — [headline magnética]
Texto: [texto do slide]

Slide 2 — [headline ou continuação de impacto]
Texto: [texto do slide]
...

Último slide — [CTA forte]
Texto: [chamada final para ação]

REGRAS DE FORMATAÇÃO:
- Responda SEMPRE em português brasileiro
- Use Markdown com títulos (##), listas, negrito e emoji
- OBRIGATÓRIO: Coloque uma linha em branco (quebra dupla) entre CADA seção e CADA slide
- Use "---" (linha horizontal) para separar visualmente cada slide do próximo
- Cada slide deve começar com "## Slide X — [headline]" como título de nível 2
- O bloco de Tema/Ideia central/Objetivo deve usar negrito e ter linhas em branco entre cada item
- Seja CONCISO e direto
- Máximo 3-5 bullet points por tópico
- NÃO escreva parágrafos longos — prefira listas
- Adicione emojis estratégicos para tornar a leitura mais visual`;

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

    const geminiContents = [];
    
    geminiContents.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }]
    });
    geminiContents.push({
      role: "model",
      parts: [{ text: "Entendido! Sou o Carrossel Master, especialista em criar carrosséis magnéticos e virais. Me diga o tema e eu crio um carrossel completo, slide a slide, com headlines impossíveis de ignorar. Como posso ajudar?" }]
    });

    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-carousel-master error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
