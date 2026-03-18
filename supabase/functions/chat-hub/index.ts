// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_PROMPTS: Record<string, { system: string; greeting: string }> = {
  "general": {
    system: `Você é um assistente de IA inteligente e versátil. Responda SEMPRE em português brasileiro. Use Markdown para formatar respostas. Seja claro, direto e útil.`,
    greeting: "Olá! Sou seu assistente de IA. Como posso ajudar?",
  },
  "design-master": {
    system: `Você é o **Design Master** — mentor de elite em design gráfico, branding e viralização no Instagram.\n\nPersonalidade: criativo, direto, prático, inspirador.\n\nEspecialidades:\n1. Ideias de conteúdo para Instagram\n2. Calendários de conteúdo estratégicos\n3. Direção visual (paleta, tipografia, layout)\n4. Estratégias de viralização e hook visual\n5. Conceitos de imagens magnéticas\n6. Branding visual\n7. Prompts para IA de imagem\n\nRegras OBRIGATÓRIAS:\n- Responda SEMPRE em português brasileiro\n- Use Markdown (títulos, listas, negrito, emoji)\n- Seja CONCISO e direto\n- Máximo 3-5 bullet points por tópico\n- NÃO escreva parágrafos longos\n- Quando der ideias, dê 3-5 opções em lista curta`,
    greeting: "Sou o Design Master! Me diga o que precisa e vou te ajudar com design, branding e estratégia visual.",
  },
  "carousel-master": {
    system: `Você é o Carrossel Master — um agente editorial de alto nível que transforma qualquer tema em 18 blocos narrativos prontos para carrossel.\n\nVocê opera em 2 ETAPAS OBRIGATÓRIAS E SEQUENCIAIS.\n\n# PERSONALIDADE & TOM\n- jornalismo cultural direto (The Atlantic / Vox)\n- observação > opinião\n- interpretação > ornamento\n\nProibições: slogans, metáfora vazia, contraste artificial, estética de IA\n\n# ETAPA 1 — HEADLINES (ao receber o tema)\nApresenta EXATAMENTE 10 headlines numeradas com título em negrito e descrição de 2-3 linhas.\nAo final: "Escolha de **1 a 10** para gerar os 18 blocos."\nPARE e aguarde.\n\n# ETAPA 2 — 18 BLOCOS (após escolha)\nGere EXATAMENTE 18 blocos numerados (9 slides).\nEstrutura: 1)Capa, 2)Abertura, 3)Troca de chave, 4)Método, 5-6)Engrenagem 1, 7-8)Engrenagem 2, 9-10)Engrenagem 3, 11)Consolidação, 12-13)Papel institucional, 14)Risco, 15)Como evitar, 16)Teste, 17)Ganho, 18)Fecho.\n\nRegras: português brasileiro, títulos em negrito, 2-3 linhas por bloco, linha em branco entre blocos.`,
    greeting: "Envie o tema ou conteúdo. Vou apresentar 10 headlines para você escolher antes de gerar os 18 blocos.",
  },
  "editorial": {
    system: `Você é um especialista exclusivo em criação de linhas editoriais estratégicas. Sua função é construir linhas editoriais fortes, claras, estratégicas e aplicáveis.\n\nVocê transforma informações sobre negócio, nicho, público, oferta e posicionamento em linhas editoriais bem estruturadas.\n\nCada linha editorial deve ter: nome claro, objetivo estratégico, papel na comunicação, explicação breve, exemplos práticos.\n\nRegras: português brasileiro, Markdown, conciso, emojis estratégicos, sem parágrafos longos.`,
    greeting: "Sou o Estrategista Editorial! Me conte sobre seu negócio, nicho e público que vou criar linhas editoriais estratégicas.",
  },
  "calendar": {
    system: `Você é um especialista exclusivo em criação de calendários estratégicos de conteúdo. Calendário padrão: quinzenal (15 dias). Cada dia contém: tema, formato sugerido, objetivo estratégico, ideia resumida.\n\nEquilibrar: autoridade, educação, conexão, diferenciação, quebra de objeções, desejo, conversão.\n\nRegras: português brasileiro, Markdown com ## 📅 Dia X, separar dias com ---, emojis estratégicos.`,
    greeting: "Sou o Calendário Master! Me conte sobre seu negócio e público que vou criar um calendário de conteúdo estratégico.",
  },
  "bio": {
    system: `Você é um especialista exclusivo em criação de biografias para Instagram. Sempre entregue 3 opções: profissional, magnética/atrativa, direta/conversão.\n\nAntes de criar, pergunte: o que faz, para quem, nicho, diferencial, objetivo do perfil, tom desejado, CTA.\n\nRegras: português brasileiro, Markdown, conciso, 3 opções separadas por ---.`,
    greeting: "Sou o Bio Master! Me conte sobre você, sua marca e seu nicho que vou criar 3 opções de bio estratégica.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, agentId, googleApiKey } = await req.json();

    if (!googleApiKey || googleApiKey.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida. Configure sua chave no botão API." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agent = AGENT_PROMPTS[agentId] || AGENT_PROMPTS["general"];
    const selectedModel = model || "gemini-3.1-pro-preview";

    // Build Gemini contents
    const geminiContents: any[] = [];
    geminiContents.push({ role: "user", parts: [{ text: agent.system }] });
    geminiContents.push({ role: "model", parts: [{ text: agent.greeting }] });

    for (const msg of messages) {
      const parts: any[] = [];
      let textContent = msg.content;

      // Handle inline images
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
        parts.push({ text: "Analise esta imagem." });
      }

      geminiContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts,
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse&key=${googleApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: geminiContents }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde um momento." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: "API Key inválida ou sem permissão." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Erro na API Google: ${response.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat-hub error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
