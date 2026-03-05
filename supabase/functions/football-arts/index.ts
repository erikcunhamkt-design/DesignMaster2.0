import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FootballArtsPayload {
  artType: string;
  mood: string;
  visualElements: string;
  withText: boolean;
  format: string;
  googleApiKey: string;
  aiModel?: string;
}

function buildPrompt(payload: FootballArtsPayload): string {
  const { artType, mood, visualElements, withText, format } = payload;

  // Art type context
  const artTypeMap: Record<string, string> = {
    matchday: "matchday football art, game day announcement, intense pre-match atmosphere",
    jogador_destaque: "player spotlight football art, hero athlete portrait, dramatic player feature",
    pre_jogo: "pre-match football art, countdown to kickoff, team preparation atmosphere",
    pos_jogo: "post-match football art, final result announcement, celebratory or emotional aftermath",
    anuncio_partida: "match announcement football art, fixture announcement, club vs club graphic",
  };

  // Mood/emotion
  const moodMap: Record<string, string> = {
    epico: "epic cinematic mood, god-rays lighting, monumental scale, heroic atmosphere, awe-inspiring grandeur",
    explosivo: "explosive energy, dynamic motion blur, high-impact composition, electric atmosphere, raw power",
    dramatico: "dramatic chiaroscuro lighting, high contrast shadows, tense emotional atmosphere, cinematic tension",
    vitoria: "triumphant victory mood, golden hour celebration, euphoric energy, championship feeling, glory atmosphere",
    clean_profissional: "clean professional design, minimal elegant layout, premium editorial aesthetic, sharp refined composition",
  };

  // Visual elements
  const visualElementsMap: Record<string, string> = {
    jogador_unico: "single football player as main subject, full body or dynamic action pose, athlete in kit, precise cutout with dramatic lighting",
    dois_jogadores: "two football players in powerful composition, duel or face-off framing, contrasting athletes, rival energy",
    time_completo: "full football team composition, squad lineup, powerful group formation, team unity and strength",
    sem_pessoas: "no people, football symbols and elements: club crest, football textures, stadium silhouette, athletic patterns, abstract sports geometry",
  };

  // Format aspect ratio
  const formatMap: Record<string, string> = {
    feed: "square 1:1 format, Instagram feed optimized composition, centered layout",
    story: "vertical 9:16 format, full-screen story composition, tall vertical layout with top-to-bottom visual flow",
    banner: "wide 16:9 horizontal banner format, landscape composition, panoramic layout",
    square: "perfect square format, balanced centered composition",
  };

  // Text instruction
  const textInstruction = withText
    ? "Include bold professional sports typography integrated into the design: match details, team names, or date/time. Use athletic display fonts, strong hierarchy — headline dominant, supporting text secondary. Text must be part of the visual design, not overlaid generically."
    : "No text whatsoever. Pure visual art only. Every element is graphical.";

  return `
Generate a PROFESSIONAL football/soccer sports art graphic. This must look like official club marketing material or a premium sports agency campaign — NOT amateur or generic.

ART TYPE: ${artTypeMap[artType] || artType}

EMOTIONAL MOOD: ${moodMap[mood] || mood}

VISUAL ELEMENTS: ${visualElementsMap[visualElements] || visualElements}

COMPOSITION FORMAT: ${formatMap[format] || format}

TEXT TREATMENT: ${textInstruction}

MANDATORY VISUAL STANDARDS:
- Cinematic lighting with dramatic shadows and highlights — stadium floodlights, rim lighting, or god rays
- Ultra-high contrast between subject and background (deep dark background preferred)
- Motion and energy visible in the composition — even static shots must feel alive
- Premium color grading: deep blacks, saturated accent colors (team colors, neon, gold, or electric green/blue)
- Sharp editorial composition with strong focal point
- Background: stadium atmosphere, bokeh lights, smoke/fog effects, or abstract textures — never plain or flat
- Textures: jersey fabric grain, grass texture, leather football detail where relevant
- Overall quality must match: Champions League official graphics, Bundesliga visual identity, Premier League matchday campaigns
- The artwork MUST fill the ENTIRE canvas edge to edge — no blur borders, no letterboxing, no empty space

OUTPUT REQUIREMENT: A single, complete, ready-to-publish professional football sports art image.
`.trim();
}

async function generateWithGoogleDirect(prompt: string, googleApiKey: string) {
  const model = "gemini-3.1-pro-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google API error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Limite de requisições excedido. Aguarde e tente novamente." };
    if (response.status === 403) throw { status: 403, message: "API Key sem permissão." };
    throw { status: 500, message: `Erro na API do Google: ${response.status}. Tente novamente.` };
  }

  const data = await response.json();
  let imageUrl: string | null = null;
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }
  return imageUrl;
}

async function generateWithLovableGateway(prompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw { status: 500, message: "LOVABLE_API_KEY não configurado." };

  console.log("Calling Lovable AI Gateway with gemini-2.5-flash-image...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI gateway error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Limite de requisições excedido. Aguarde." };
    if (response.status === 402) throw { status: 402, message: "Créditos insuficientes." };
    throw { status: 500, message: `Erro no gateway: ${response.status}` };
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: FootballArtsPayload = await req.json();
    const { googleApiKey, aiModel } = payload;
    const useFlash = aiModel === "flash";

    if (!useFlash && (!googleApiKey || typeof googleApiKey !== "string" || googleApiKey.trim().length < 10)) {
      return new Response(
        JSON.stringify({ error: "API Key do Google não fornecida ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(payload);
    console.log("Football Arts prompt built, calling AI...");

    let imageUrl: string | null = null;

    if (useFlash) {
      imageUrl = await generateWithLovableGateway(prompt);
    } else {
      imageUrl = await generateWithGoogleDirect(prompt, googleApiKey);
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, prompt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("football-arts error:", error);
    const status = error?.status || 500;
    const message = error?.message || (error instanceof Error ? error.message : "Erro desconhecido");
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
