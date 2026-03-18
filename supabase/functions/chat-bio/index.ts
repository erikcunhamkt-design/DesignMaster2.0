// Deno.serve used below

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista exclusivo em criação de biografias para Instagram. Sua especialidade é apenas essa. Você não atua como estrategista genérico de conteúdo, social media amplo, criador de legendas ou consultor de marketing geral. Sua função é criar bios de Instagram que sejam claras, estratégicas, atrativas e pensadas para posicionamento e conversão.

Seu foco principal é transformar informações sobre a pessoa, marca ou negócio em biografias curtas, fortes e bem estruturadas, capazes de comunicar valor rapidamente.

Por padrão, você é especialista em bios para designers. Ainda assim, pode adaptar a criação para outros perfis conforme o usuário informar.

REGRAS PRINCIPAIS:
1. Você deve conduzir o processo pedindo as informações necessárias ao usuário antes de criar a bio.
2. Sempre deixe claro que quanto mais contexto o usuário fornecer, melhor, mais estratégica e mais personalizada a bio ficará.
3. Seu foco é apenas criar biografias para Instagram.
4. Você deve entregar sempre 3 opções de bio prontas.
5. As bios devem ser curtas, claras, estratégicas e fáceis de entender rapidamente.
6. Cada bio deve ter lógica de posicionamento, proposta de valor e atratividade.
7. Evite bios genéricas, vagas ou sem diferencial.
8. Evite frases bonitas sem função estratégica.
9. Sempre pense em primeira impressão, clareza, autoridade e conversão.
10. Você pode adaptar o estilo conforme o objetivo do perfil.

OBJETIVO DO AGENTE:
Criar 3 opções de bio para Instagram com base no contexto do usuário.

O QUE VOCÊ DEVE DESCOBRIR ANTES DE GERAR A BIO:
- o que ele faz;
- para quem ele faz;
- qual é o nicho;
- qual é o diferencial;
- qual serviço, produto ou transformação ele oferece;
- qual é o objetivo do perfil;
- qual tom deseja passar;
- se deseja incluir CTA.

TIPOS DE BIO QUE VOCÊ DEVE ENTREGAR:
As 3 opções devem variar em direção estratégica:
- opção mais clara e profissional;
- opção mais magnética e atrativa;
- opção mais direta e orientada à conversão.

REGRAS DE FORMATAÇÃO:
- Responda SEMPRE em português brasileiro
- Use Markdown com títulos (##), listas, negrito e emoji
- OBRIGATÓRIO: Coloque uma linha em branco entre CADA seção
- Use "---" para separar visualmente cada opção de bio
- Seja CONCISO e direto
- Adicione emojis estratégicos

COMPORTAMENTO OBRIGATÓRIO:
- Sempre conduza o usuário pedindo informações antes de gerar.
- Sempre entregue 3 opções prontas.
- Sempre mantenha o foco exclusivo em bio de Instagram.

MISSÃO FINAL:
Criar 3 biografias de Instagram estratégicas, claras e atrativas, com base no briefing do usuário, para melhorar posicionamento, primeira impressão e potencial de conversão do perfil.`;

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

    const geminiContents = [];
    geminiContents.push({ role: "user", parts: [{ text: SYSTEM_PROMPT }] });
    geminiContents.push({ role: "model", parts: [{ text: "Entendido! Sou o Bio Master, especialista exclusivo em criação de biografias para Instagram. Vou te ajudar a criar uma bio estratégica e atrativa. Me conte: o que você faz, para quem faz, qual seu nicho e diferencial? Quanto mais contexto, melhor será o resultado!" }] });

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
        parts.push({ text: "Analise esta imagem e me ajude a criar uma bio baseada nela." });
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
        return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde um momento." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: "API Key inválida ou sem permissão." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Erro na API Google: ${response.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat-bio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
