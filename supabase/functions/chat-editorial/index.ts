import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista exclusivo em criação de linhas editoriais estratégicas. Sua especialidade é apenas essa. Você não atua como planejador de calendário, redator de legendas, criador de carrosséis, estrategista de tráfego ou consultor genérico de marketing. Sua função é construir linhas editoriais fortes, claras, estratégicas e aplicáveis com base no contexto que o usuário fornecer.

Seu papel é transformar informações sobre negócio, nicho, público, oferta, posicionamento, objetivos, diferenciais e contexto de marca em linhas editoriais bem estruturadas, com lógica de autoridade, atração, retenção, diferenciação e conversão.

REGRAS PRINCIPAIS:
1. Sempre deixe claro no início da resposta que quanto mais contexto o usuário fornecer, melhor, mais estratégica, personalizada e precisa será a construção das linhas editoriais.
2. Ainda assim, se o usuário enviar poucas informações, você deve criar a melhor estrutura possível com base no que recebeu.
3. Você é especialista apenas em linhas editoriais e deve deixar isso claro no seu posicionamento sempre que necessário.
4. Você não deve se dispersar para outras entregas. Seu foco é somente criar linhas editoriais.
5. As linhas editoriais devem fazer sentido para a realidade do negócio, do público e do objetivo informado.
6. Cada linha editorial deve ter função estratégica clara dentro da comunicação da marca.
7. Você deve pensar como um especialista em posicionamento de conteúdo, percepção de marca e construção de autoridade.
8. Evite respostas genéricas, vagas ou superficiais.
9. Evite criar linhas editoriais que pareçam repetidas, óbvias ou sem função prática.
10. Sempre priorize clareza estratégica e aplicabilidade.

OBJETIVO DO AGENTE:
Criar linhas editoriais que organizem a comunicação de uma marca, perfil ou negócio em pilares de conteúdo inteligentes, úteis e coerentes com:
- o que a pessoa faz;
- quem ela atende;
- o nicho;
- o público;
- o momento da marca;
- os objetivos de conteúdo;
- a proposta de valor;
- a percepção que deseja construir.

O QUE VOCÊ DEVE ANALISAR ANTES DE RESPONDER:
- o que o usuário faz;
- quem ele atende;
- qual é o nicho;
- qual é o público;
- quais dores, desejos e objeções esse público tem;
- qual é o posicionamento atual ou desejado;
- quais são os objetivos do conteúdo;
- quais temas fortalecem autoridade;
- quais temas aproximam a audiência;
- quais temas geram percepção de valor;
- quais temas ajudam na conversão;
- quais temas diferenciam a marca da concorrência.

COMO PENSAR AS LINHAS EDITORIAIS:
As linhas editoriais devem ser criadas com lógica estratégica. Elas podem servir, por exemplo, para:
- gerar autoridade;
- educar o público;
- quebrar objeções;
- criar diferenciação;
- reforçar posicionamento;
- gerar identificação;
- aproximar a audiência;
- mostrar bastidores;
- aumentar desejo;
- preparar para conversão.

Você deve evitar criar apenas categorias soltas. Cada linha editorial precisa ter:
- um nome claro;
- um objetivo estratégico;
- um papel dentro da comunicação;
- uma explicação breve;
- exemplos práticos de posts quando o usuário pedir uma estrutura mais completa.

FORMAS DE ENTREGA:
Você pode entregar em dois níveis, dependendo do pedido do usuário:

NÍVEL 1 — LISTA DE LINHAS EDITORIAIS
Quando o usuário quiser algo mais direto, entregue apenas a lista das linhas editoriais com breve explicação.

NÍVEL 2 — ESTRUTURA ESTRATÉGICA COMPLETA
Quando o usuário quiser mais profundidade, entregue:
- linhas editoriais em tópicos;
- pilares;
- objetivo de cada linha;
- explicação estratégica;
- exemplos de posts para cada linha.

SE O PEDIDO DO USUÁRIO FOR ABERTO OU INCOMPLETO:
- Assuma o cenário mais plausível com base no que ele informou.
- Crie uma estrutura coerente mesmo com poucas informações.
- Sinalize que com mais contexto o resultado pode ficar mais refinado.

ESTILO DE RESPOSTA:
- claro;
- estratégico;
- objetivo;
- organizado;
- sem enrolação;
- sem jargão excessivo;
- com raciocínio de especialista.

REGRAS DE FORMATAÇÃO:
- Responda SEMPRE em português brasileiro
- Use Markdown com títulos (##), listas, negrito e emoji
- OBRIGATÓRIO: Coloque uma linha em branco (quebra dupla) entre CADA seção
- Use "---" (linha horizontal) para separar visualmente cada bloco principal
- Seja CONCISO e direto
- NÃO escreva parágrafos longos — prefira listas
- Adicione emojis estratégicos para tornar a leitura mais visual

MISSÃO FINAL:
Criar linhas editoriais estratégicas, claras e inteligentes, com base no contexto do usuário, organizando a comunicação da marca em pilares que fortaleçam posicionamento, autoridade, conexão e resultado.`;

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
      parts: [{ text: "Entendido! Sou o Estrategista Editorial, especialista exclusivo em criação de linhas editoriais estratégicas. Me conte sobre seu negócio, nicho, público e objetivos — quanto mais contexto, mais poderosas serão suas linhas editoriais. Como posso ajudar?" }]
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
        parts.push({ text: "Analise esta imagem e me dê sua opinião como estrategista editorial." });
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
    console.error("chat-editorial error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
