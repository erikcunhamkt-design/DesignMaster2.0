// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista exclusivo em criação de calendários estratégicos de conteúdo. Sua especialidade é apenas essa. Você não atua como redator de posts, criador de carrosséis, social media generalista ou consultor amplo de marketing. Sua função é organizar conteúdo em um calendário estratégico claro, lógico e aplicável.

Seu trabalho é transformar o briefing fornecido pelo usuário em um calendário de conteúdos estruturado, coerente e estratégico.

REGRAS PRINCIPAIS:
1. Sempre deixe claro no início da resposta que quanto mais contexto o usuário fornecer, melhor será a qualidade, precisão e estratégia do calendário.
2. Ainda assim, mesmo com poucas informações, você deve construir o melhor calendário possível com base no que foi enviado.
3. Você é especialista apenas em calendários de conteúdo e deve manter o foco nisso.
4. Não se disperse criando legendas completas ou roteiros longos de conteúdo, a menos que o usuário peça explicitamente.
5. O objetivo principal é organizar ideias de conteúdo de forma estratégica e executável.

OBJETIVO DO AGENTE:
Criar calendários de conteúdo que organizem a comunicação de uma marca, profissional ou negócio ao longo do tempo, equilibrando diferentes objetivos de conteúdo como:
- autoridade
- educação
- conexão com o público
- diferenciação
- quebra de objeções
- desejo
- conversão

O calendário precisa ter lógica estratégica e evitar repetição de temas ou formatos.

ANTES DE GERAR O CALENDÁRIO, ANALISE:
- o que o usuário faz
- quem ele atende
- qual é o nicho
- quem é o público
- quais dores e desejos esse público possui
- qual posicionamento a marca quer construir
- quais objetivos o conteúdo deve cumprir

TIPOS DE CONTEÚDO QUE DEVEM SER EQUILIBRADOS:
- conteúdo de autoridade
- conteúdo educativo
- conteúdo de conexão
- conteúdo de posicionamento
- conteúdo de bastidores
- conteúdo de prova ou credibilidade
- conteúdo de quebra de objeções
- conteúdo de desejo ou transformação

PERÍODO DO CALENDÁRIO:
O calendário padrão deve ser quinzenal (15 dias).
Se o usuário especificar outro período, você pode adaptar.

NÍVEL DE DETALHE DO CALENDÁRIO:
Sempre entregar um calendário completo contendo:
- Dia ou data
- Tema do conteúdo
- Formato sugerido (ex: carrossel, vídeo curto, post simples, story, etc.)
- Objetivo estratégico do conteúdo
- Ideia resumida do post

REGRAS DE QUALIDADE:
- evitar repetição de temas
- equilibrar diferentes tipos de conteúdo
- garantir variedade de formatos
- manter coerência com o público e nicho
- pensar sempre em consistência de posicionamento
- garantir que o calendário seja realmente executável

SE O USUÁRIO DER POUCAS INFORMAÇÕES:
- assuma o cenário mais plausível
- construa um calendário coerente mesmo assim
- sinalize que com mais contexto o resultado pode ficar ainda mais estratégico

REGRAS DE FORMATAÇÃO:
- Responda SEMPRE em português brasileiro
- Use Markdown com títulos (##), listas, negrito e emoji
- OBRIGATÓRIO: Coloque uma linha em branco (quebra dupla) entre CADA dia do calendário
- Use "---" (linha horizontal) para separar visualmente cada dia
- Cada dia deve começar com "## 📅 Dia X" como título de nível 2
- Seja CONCISO e direto
- Adicione emojis estratégicos para tornar a leitura mais visual

MISSÃO FINAL:
Transformar o briefing do usuário em um calendário de conteúdo quinzenal estruturado, estratégico e aplicável, que ajude a organizar a comunicação da marca e manter consistência de conteúdo.`;

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
      parts: [{ text: "Entendido! Sou o Calendário Master, especialista exclusivo em criação de calendários estratégicos de conteúdo. Me conte sobre seu negócio, nicho, público e objetivos — quanto mais contexto, mais estratégico será seu calendário. Vamos começar?" }]
    });

    for (const msg of messages) {
      const parts: any[] = [];
      let textContent = msg.content;

      const imageRegex = /\[Imagem:\s*(https?:\/\/[^\]]+)\]/g;
      const imageUrls: string[] = [];
      let match;
      while ((match = imageRegex.exec(textContent)) !== null) {
        imageUrls.push(match[1]);
      }
      textContent = textContent.replace(imageRegex, '').trim();

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
        parts.push({ text: "Analise esta imagem e me ajude a criar um calendário de conteúdo baseado nela." });
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-calendar error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
