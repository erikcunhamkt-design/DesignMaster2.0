/**
 * PromptAgent — Invisible Cinematic Ad Magnetic Mode
 * 
 * Converts zero-prompt form fields into a rich generation request.
 * The user NEVER sees the final prompt.
 */

import { ProjectConfig } from '@/types/project';

export interface GenerationRequest {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
  references: ReferenceEntry[];
  quality: 'high' | 'ultra';
  reserved_text_area: ReservedArea | null;
  layout_plan: string;
}

export interface ReferenceEntry {
  url: string;
  role: 'identity' | 'scenery' | 'inspiration';
  strength: number;
  preserve_identity: boolean;
  attributes?: string[];
}

export interface ReservedArea {
  position: 'top' | 'bottom' | 'center-bottom';
  percentage: number;
}

// ── Dimension map ──
const DIMENSIONS: Record<string, { width: number; height: number; ratio: string }> = {
  stories:        { width: 1080, height: 1920, ratio: '9:16 vertical' },
  horizontal:     { width: 1920, height: 1080, ratio: '16:9 horizontal' },
  'feed-quadrado': { width: 1080, height: 1080, ratio: '1:1 square' },
  'feed-retrato':  { width: 1080, height: 1350, ratio: '4:5 portrait' },
};

// ── Style VFX map ──
const STYLE_VFX: Record<string, string> = {
  'Clássico':             'classic elegant timeless aesthetic, warm tonal grading',
  'Formal':               'formal corporate look, clean neutral palette, sharp lines',
  'Elegante':             'elegant sophisticated luxury feel, soft golden tones, silk textures',
  'Sexy':                 'sensual attractive glamorous style, warm contrast, sultry lighting',
  'Institucional':        'institutional corporate clean design, balanced composition, trustworthy',
  'Tecnológico':          'technological futuristic digital aesthetic, neon accents, circuit motifs, dark metallic tones',
  'Glassmorphism':        'translucent glass layers, soft blur, specular highlights, frosted glass effect, light refraction',
  'Interface UI':         'UI design interface mockup style, flat clean elements, modern digital',
  'Minimalista':          'minimalist clean simple composition, vast negative space, monochromatic tendency',
  'Lúdico':              'playful colorful fun vibrant style, rounded shapes, joyful palette',
  'Cartoon':              'clean outlines, consistent shading, high readability composition, cartoon illustration',
  'Infoproduto':          'digital product marketing professional thumbnail, bold typography space, persuasive layout',
  'Jovial':               'youthful energetic dynamic fresh style, bright saturated colors, movement',
  'Gamer':                'neon accents, glow controlled, cinematic haze, esports dark aggressive style, RGB lighting',
  'Retrato Profissional': 'professional portrait headshot photography, studio backdrop, beauty lighting',
  'Ultra Realista':       'realistic cinematic grade, subtle grain optional, ultra realistic photorealistic 8K photography',
  'Glow':                 'glowing luminous light effects ethereal, controlled bloom, light particles',
};

// ── BASE STYLE (always injected) ──
const BASE_STYLE = [
  'cinematic commercial advertising photography, premium high-end production quality',
  'cinematic directional lighting with well-defined key light, rim light and subtle fill light',
  'realistic depth of field with natural lens focus, no plastic or artificial look',
  'hero subject clearly visible and intentionally placed, no unwanted crops on head, hands or feet',
  'clean editorial composition with breathing space for text overlay',
  'subtle controlled VFX: light flare, particles, smoke or glow only when contextually appropriate, never exaggerated',
  'polished post-production grade, filmic contrast, high clarity, sharp focus on subject',
  'suitable for premium advertising campaigns, landing pages, product launches and high-impact covers',
].join(', ');

// ── DEFAULT NEGATIVE ──
const BASE_NEGATIVE = 'low-res, blurry, noise, watermark, text artifacts, logo artifacts, bad anatomy, deformed hands, extra fingers, duplicated face, plastic skin, overprocessed HDR, ugly noise, compression artifacts, cropped head, out of frame, letterboxing, blur borders, empty padding, illustration style, cartoon look, CGI cheap look, artificial, overly processed, plastic skin, waxy skin';

const TEXT_NEGATIVE = 'garbled text, misspelled words, distorted typography, unreadable text, broken letters, overlapping characters';

// ── ULTRA REALISM (human subjects — ABSOLUTE RULE) ──
const HUMAN_REALISM_BOOST = [
  'ultra photorealistic extreme realism, professional camera photography, shot on high-end DSLR or mirrorless',
  'highly detailed skin texture with visible pores, natural micro imperfections, realistic natural skin tone variation',
  'natural healthy lip texture, correct lip anatomy with natural fissures, organic volume, no artificial look',
  'eyes extremely striking with natural reflections, real depth, controlled natural catchlight, sharp iris detail',
  'hair rendered strand by strand with thickness variation, natural light and shadow',
  'realistic beard and mustache with individual visible strands, natural density and volume',
  'cinematic studio lighting: key light, rim light and fill light correctly applied to face and body volumes',
  '8K ultra HD, ultra sharp, masterpiece quality, absolutely no plastic or AI-smooth skin look',
].join(', ');

const HUMAN_NEGATIVE_BOOST = 'cracked lips, overly dry lips, deformed mouth, weird teeth, extra teeth, asymmetrical eyes, uncanny face, plastic skin, waxy skin, over-smoothed skin, blurry eyes, low detail skin, mushy hair, artifacts, low quality, illustration, CGI, cartoon face';

const HUMAN_LIPS_BOOST = 'natural healthy lip texture, correct lip contour and anatomy, no artificial appearance, organic fissures, realistic softness';

// Styles that should NOT receive the ultra-realism boost
const NON_REALIST_STYLES = new Set([
  'Cartoon', 'Lúdico', 'Interface UI',
]);

/** Returns true when the prompt context implies a real human subject */
function isHumanSubject(config: ProjectConfig): boolean {
  // The app always has a gendered subject; if subjectPhotos exist it's clearly a person
  return config.subjectPhotos.length > 0 || !!config.poseDescription || !!config.expression || !!config.expressionCustom;
}

/** Returns true when the user picked a non-realistic visual style */
function isNonRealistStyle(config: ProjectConfig): boolean {
  if (!config.visualStyleEnabled || !config.visualStyle) return false;
  return NON_REALIST_STYLES.has(config.visualStyle);
}

// ── Main builder ──
export function buildGenerationRequest(config: ProjectConfig): GenerationRequest {
  // Prompt Livre — ignorar o resto
  if (config.ignoreRest && config.freePrompt?.trim()) {
    const dim = DIMENSIONS[config.dimension ?? 'stories'];
    return {
      prompt: config.freePrompt.trim(),
      negative_prompt: BASE_NEGATIVE,
      width: dim.width,
      height: dim.height,
      references: [],
      quality: 'high',
      reserved_text_area: null,
      layout_plan: '',
    };
  }
  const parts: string[] = [];
  const negativeParts: string[] = [BASE_NEGATIVE];
  const dim = config.dimension ? DIMENSIONS[config.dimension] : DIMENSIONS['feed-quadrado'];

  // ─── 1. DIMENSION & ASPECT RATIO (highest priority) ───
  parts.push(`${dim.ratio} aspect ratio, professional social media advertisement`);

  // ─── 2. RESERVED TEXT AREA (safe zones) ───
  let reservedArea: ReservedArea | null = null;
  let layoutPlan = '';

  if (config.verticalPosition === 'cima') {
    reservedArea = { position: 'bottom', percentage: 40 };
    layoutPlan = 'subject upper 55%, clean negative space bottom 40%';
    parts.push('subject positioned in the upper 55% of the frame');
    parts.push('clean negative space in the bottom 35-45% of the image, minimal details in lower area, safe margins for typography overlay');
  } else if (config.verticalPosition === 'baixo') {
    reservedArea = { position: 'top', percentage: 40 };
    layoutPlan = 'subject lower 55%, clean negative space top 40%';
    parts.push('subject positioned in the lower 55% of the frame');
    parts.push('clean negative space in the top 35-45% of the image, minimal details in upper area, safe margins for typography overlay');
  } else {
    reservedArea = { position: 'center-bottom', percentage: 25 };
    layoutPlan = 'subject centered, clean space bottom 25%';
    parts.push('subject centered in the frame');
    parts.push('clean negative space in the bottom 20-30% of the image for text overlay, safe margins for typography');
  }

  // ─── 3. SUBJECT IDENTITY (second priority) ───
  const genderLabel = config.gender === 'masculino' ? 'male' : 'female';
  parts.push(`${genderLabel} hero subject, main focus of the composition`);

  if (config.poseDescription) {
    parts.push(`pose: ${config.poseDescription}`);
  }

  // ─── CHARACTER DIRECTION ───
  const dirExpression = config.expression || config.expressionCustom;
  const dirPose = config.pose || config.poseCustom;
  const dirAngle = config.cameraAngle || config.cameraAngleCustom;
  const dirLens = config.lens || config.lensCustom;
  const dirGaze = config.gazeDirection || config.gazeDirectionCustom;

  if (dirExpression) parts.push(`facial expression: ${dirExpression}`);
  if (dirPose) parts.push(`body pose: ${dirPose}`);
  if (dirAngle) parts.push(`camera angle: ${dirAngle}`);
  if (dirLens) parts.push(`shot with ${dirLens} lens`);
  if (dirGaze) parts.push(`gaze direction: ${dirGaze}`);

  // Subject horizontal position
  if (config.subjectPosition === 'esquerda') {
    parts.push('subject positioned on the left third of frame, following rule of thirds');
  } else if (config.subjectPosition === 'direita') {
    parts.push('subject positioned on the right third of frame, following rule of thirds');
  } else {
    parts.push('subject centered in frame, symmetrical composition');
  }

  // ─── 4. COLOR PALETTE (third priority) ───
  if (config.colorMode === 'manual') {
    parts.push(`color palette: ambient ${config.ambientColor}, rim light ${config.rimLightColor}, complementary accent ${config.complementaryLightColor}`);
    parts.push('colors applied through lighting and environment, cohesive color harmony');
  } else {
    parts.push('choose the most coherent and harmonious color palette for the lighting and environment based on the overall design context, niche, and mood');
  }

  // ─── 5. COMPOSITION / FRAMING (fourth priority) ───
  if (config.framing === 'closeup') {
    parts.push('close-up shot focusing on face and shoulders, intimate framing');
  } else if (config.framing === 'plano-medio') {
    parts.push('medium shot from waist up, balanced framing');
  } else {
    parts.push('american shot from knees up, full body presence');
  }

  // ─── 6. STYLE (fifth priority) ───
  if (config.visualStyleEnabled && config.visualStyle) {
    const vfx = STYLE_VFX[config.visualStyle] || config.visualStyle;
    parts.push(`visual style: ${vfx}`);
  }

  // ─── 7. NICHE / ENVIRONMENT ───
  if (config.niche) {
    parts.push(`niche context: ${config.niche}, theme-appropriate elements and atmosphere`);
  }
  if (config.environment) {
    parts.push(`environment setting: ${config.environment}`);
  }

  // ─── 8. SOBRIETY ───
  if (config.sobriety > 70) {
    parts.push('professional corporate clean restrained aesthetic');
  } else if (config.sobriety < 30) {
    parts.push('creative artistic bold expressive experimental look');
  }

  // ─── 9. EFFECTS ───
  if (config.useBlur) {
    parts.push('beautiful bokeh background blur, shallow depth of field, subject isolation');
  }
  if (config.useSideGradient) {
    parts.push('subtle lateral gradient color transition on both sides of the frame');
  }

  // ─── 10. FLOATING ELEMENTS (sixth priority) ───
  if (config.floatingElements && config.floatingElementsText) {
    parts.push(`floating decorative elements around subject: ${config.floatingElementsText}, arranged aesthetically, depth layers`);
  }

  // ─── 11. TEXT HANDLING ───
  if (!config.textEnabled || config.textMode === 'camada') {
    // Layer mode: no text in image, just clean space
    parts.push('NO text in the image, clean background areas for post-production text overlay');
    negativeParts.push('any text, letters, words, numbers, watermarks in image');
  } else if (config.textEnabled && config.textMode === 'imagem') {
    // Text in image mode
    if (config.text01) parts.push(`prominent headline text reading "${config.text01}", bold, high readability, clean kerning, professional typography`);
    if (config.text02) parts.push(`secondary text reading "${config.text02}", smaller, supporting the headline`);
    if (config.cta) parts.push(`call-to-action button or text reading "${config.cta}", visually distinct, actionable`);
    negativeParts.push(TEXT_NEGATIVE);
  }

  // ─── 12. ADDITIONAL PROMPT ───
  if (config.additionalPromptEnabled && config.additionalPrompt) {
    parts.push(config.additionalPrompt);
  }

  // ─── ULTRA REALISM BOOST (auto for human subjects) ───
  if (isHumanSubject(config) && !isNonRealistStyle(config)) {
    parts.push(HUMAN_REALISM_BOOST);
    parts.push(HUMAN_LIPS_BOOST);
    negativeParts.push(HUMAN_NEGATIVE_BOOST);
  }

  // ─── USER NEGATIVE PROMPT ───
  if (config.negativePromptEnabled && config.negativePrompt?.trim()) {
    negativeParts.push(config.negativePrompt.trim());
  }

  // ─── ALWAYS INJECT BASE STYLE ───
  parts.push(BASE_STYLE);

  // ─── BUILD REFERENCES ───
  const references: ReferenceEntry[] = [];

  // Subject photos = identity (highest strength)
  for (const url of config.subjectPhotos) {
    references.push({
      url,
      role: 'identity',
      strength: 80,
      preserve_identity: true,
    });
  }

  // Scenery photos
  if (config.sceneryPhotosEnabled) {
    for (const url of config.sceneryPhotos) {
      references.push({
        url,
        role: 'scenery',
        strength: 50,
        preserve_identity: false,
      });
    }
  }

  // Style references = inspiration (lowest strength, never override identity)
  config.styleReferences.forEach((url, i) => {
    const attrs = config.referenceAttributes?.[i] as string[] | undefined;
    const note = config.referenceNotes?.[i];
    references.push({
      url,
      role: 'inspiration',
      strength: 35,
      preserve_identity: false,
      attributes: attrs,
    });
    // Add reference note to prompt if available
    if (note) {
      parts.push(`reference image ${i + 1} guidance: ${note}`);
    }
  });

  return {
    prompt: parts.join('. ') + '.',
    negative_prompt: negativeParts.join(', '),
    width: dim.width,
    height: dim.height,
    references,
    quality: 'high',
    reserved_text_area: reservedArea,
    layout_plan: layoutPlan,
  };
}
