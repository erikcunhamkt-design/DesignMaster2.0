/**
 * FootballPromptAgent — Football Creator Prompt Engine
 *
 * Converts football creator form fields into a rich, professional
 * sports design prompt. Zero visible prompt to the user.
 */

import { FootballConfig } from '@/types/footballConfig';

export interface FootballGenerationRequest {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
  referenceImages?: string[];
}

// ── Dimension map ──
const DIMENSIONS: Record<string, { width: number; height: number; ratio: string }> = {
  stories:          { width: 1080, height: 1920, ratio: '9:16 vertical' },
  horizontal:       { width: 1920, height: 1080, ratio: '16:9 horizontal' },
  'feed-quadrado':  { width: 1080, height: 1080, ratio: '1:1 square' },
  'feed-retrato':   { width: 1080, height: 1350, ratio: '4:5 portrait' },
};

// ── Visual Style map ──
const STYLE_VFX: Record<string, string> = {
  matchday:          'matchday football graphic design, stadium atmosphere, dramatic pre-match energy, professional sports club branding',
  pre_jogo:          'pre-match buildup design, anticipation and tension, dark dramatic tones, countdown energy, tactical atmosphere',
  pos_jogo:          'post-match celebration design, victory glow, confetti particles, emotional intense lighting',
  jogador_destaque:  'player spotlight hero shot, individual athlete showcase, clean editorial composition, premium sports magazine quality',
  final_decisao:     'championship final decision artwork, maximum dramatic tension, cinematic epic lighting, historic match atmosphere',
};

// ── Match Mood map ──
const MOOD_VFX: Record<string, string> = {
  epico:                'epic cinematic atmosphere, heroic lighting, dramatic rim light, powerful composition',
  tenso:                'tense dramatic mood, high contrast dark shadows, psychological pressure, intense close composition',
  vitoria:              'victory celebration mood, warm golden triumphant light, euphoric energy, dynamic upward composition',
  rivalidade:           'fierce rivalry atmosphere, opposing force tension, dual energy collision, battle composition',
  profissional_clean:   'clean professional sports design, corporate football branding, balanced neutral aesthetic, premium club quality',
};

// ── Subject type descriptions ──
const SUBJECT_DESC: Record<string, string> = {
  jogador_unico:   'single football player as hero subject, full athletic presence',
  dois_jogadores:  'two football players, dynamic duel composition, interaction between athletes',
  time_completo:   'full football team group, collective squad energy, professional team photo style',
  sem_pessoas:     'no people, football club crest, ball, stadium elements, abstract sports symbols',
};

// ── Base football style (always injected) ──
const BASE_FOOTBALL_STYLE = [
  'professional football club design quality',
  'premium sports graphics comparable to official club materials',
  'cinematic stadium lighting — dramatic rim light with soft fill',
  'high contrast with deep blacks and vivid accent colors',
  'ultra sharp focus on subject',
  'photorealistic 8K quality',
  'polished post-production sports design',
  'no generic or amateur look',
  'sports texture — jersey fabric detail, turf reflection',
  'dynamic athletic energy',
].join(', ');

const BASE_NEGATIVE = [
  'low quality, blurry, amateur design, generic stock photo',
  'watermark, text artifacts, logo artifacts',
  'bad anatomy, deformed limbs, extra fingers',
  'plastic skin, overprocessed, ugly noise',
  'boring composition, flat lighting',
  'cartoon-style unless specified',
  'out of frame, cropped subject',
].join(', ');

export function buildFootballRequest(config: FootballConfig): FootballGenerationRequest {
  const parts: string[] = [];
  const negativeParts: string[] = [BASE_NEGATIVE];
  const dim = config.dimension ? DIMENSIONS[config.dimension] : DIMENSIONS['feed-quadrado'];

  // ─── 1. DIMENSION ───
  parts.push(`${dim.ratio} aspect ratio, professional social media sports graphic`);

  // ─── 2. SAFE ZONES (text space) ───
  if (config.verticalPosition === 'cima') {
    parts.push('subject in upper 55% of frame, clean negative space bottom 40% for text overlay');
  } else if (config.verticalPosition === 'baixo') {
    parts.push('subject in lower 55% of frame, clean negative space top 40% for text overlay');
  } else {
    parts.push('subject centered, clean bottom 25% safe zone for text');
  }

  // ─── 3. SUBJECT TYPE ───
  parts.push(SUBJECT_DESC[config.subjectType] || SUBJECT_DESC.jogador_unico);

  // ─── 4. SUBJECT POSITION ───
  if (config.subjectPosition === 'esquerda') {
    parts.push('subject positioned left third, rule of thirds composition');
  } else if (config.subjectPosition === 'direita') {
    parts.push('subject positioned right third, rule of thirds composition');
  } else if (config.subjectPosition === 'zoom_dramatico') {
    parts.push('dramatic zoom close composition, athletic tension, intense crop');
  } else {
    parts.push('subject centered, powerful symmetrical sports composition');
  }

  // ─── 5. FRAMING ───
  if (config.framing === 'closeup') {
    parts.push('close-up shot, face and chest, intense athlete portrait');
  } else if (config.framing === 'plano-medio') {
    parts.push('medium shot waist up, dynamic athletic framing');
  } else {
    parts.push('full body american shot, complete athlete presence, knees to head');
  }

  // ─── 6. VISUAL STYLE ───
  if (config.visualStyle) {
    const styleFX = STYLE_VFX[config.visualStyle] || config.visualStyle;
    parts.push(`visual style: ${styleFX}`);
  }

  // ─── 7. MATCH MOOD ───
  if (config.matchMood) {
    const moodFX = MOOD_VFX[config.matchMood] || config.matchMood;
    parts.push(`mood and atmosphere: ${moodFX}`);
  }

  // ─── 8. INTENSITY ───
  if (config.intensity >= 80) {
    parts.push('maximum visual impact, explosive VFX, particle effects, energy streams, cinematic fire or sparks');
  } else if (config.intensity >= 50) {
    parts.push('bold dynamic composition, strong VFX accents, controlled energy effects');
  } else {
    parts.push('clean restrained sports aesthetic, minimal VFX, premium understated design');
  }

  // ─── 9. COLORS ───
  if (config.colorMode === 'manual' || config.colorMode === 'time') {
    parts.push(`primary team color: ${config.primaryTeamColor}, secondary team color: ${config.secondaryTeamColor}`);
    parts.push('team colors reflected in lighting, gradients and environment');
  } else {
    parts.push('professional sports color palette, deep blacks, dramatic rim lighting, saturated accent glow');
  }

  // ─── 10. ENVIRONMENT ───
  if (config.environment) {
    parts.push(`environment: ${config.environment}`);
  } else {
    parts.push('stadium environment — crowd blur, pitch lighting, sports arena atmosphere');
  }

  // ─── 11. VFX EFFECTS ───
  const vfxParts: string[] = [];
  if (config.useGlow) vfxParts.push('controlled light glow on athlete, energy aura');
  if (config.useSideGradient) vfxParts.push('lateral gradient color wash on edges');
  if (config.useBlur) vfxParts.push('beautiful bokeh background, shallow depth of field, subject isolation');
  if (config.useGrain) vfxParts.push('subtle cinematic grain texture, film quality');
  if (vfxParts.length > 0) parts.push(vfxParts.join(', '));

  // ─── 12. TEXT HANDLING ───
  if (!config.textEnabled || config.textMode === 'camada') {
    parts.push('NO embedded text in the image, clean areas for post-production typography overlay');
    negativeParts.push('any text, letters, words, numbers, watermarks embedded in image');
  } else {
    if (config.text01) parts.push(`bold headline text: "${config.text01}", bold sports typography, high readability`);
    if (config.text02) parts.push(`supporting text: "${config.text02}", secondary hierarchy`);
    if (config.cta) parts.push(`call-to-action text: "${config.cta}", visually distinct`);
    negativeParts.push('garbled text, misspelled words, distorted typography');
  }

  // ─── 13. ADDITIONAL PROMPT ───
  if (config.additionalPromptEnabled && config.additionalPrompt) {
    parts.push(config.additionalPrompt);
  }

  // ─── ULTRA REALISM (for human subjects) ───
  if (config.subjectType !== 'sem_pessoas') {
    parts.push('ultra photorealistic athlete, extreme realism, natural skin texture, realistic jersey fabric detail strand-by-strand, sharp eyes with natural catchlight, realistic hair, athletic body proportions, no plastic skin');
    negativeParts.push('plastic skin, waxy look, over-smoothed, uncanny valley, bad proportions, deformed joints');
  }

  // ─── BASE STYLE (always) ───
  parts.push(BASE_FOOTBALL_STYLE);

  return {
    prompt: parts.join('. ') + '.',
    negative_prompt: negativeParts.join(', '),
    width: dim.width,
    height: dim.height,
  };
}
