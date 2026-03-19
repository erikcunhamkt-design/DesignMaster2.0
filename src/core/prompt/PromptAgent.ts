/**
 * PromptAgent — Invisible Cinematic Ad Magnetic Mode
 * 
 * Converts zero-prompt form fields into a rich generation request.
 * The user NEVER sees the final prompt.
 */

import { ProjectConfig } from '@/types/project';
import { getFontStylePromptHint, getTextSizePromptHint, getTextTrackingPromptHint, getTextWeightPromptHint } from '@/components/configurator/sections/TextSection';

export interface GenerationRequest {
  prompt: string;
  lockedPrompt: string;   // Sidebar selections — NEVER rewritten by Architect
  expandablePrompt: string; // Context the Architect CAN enhance
  negative_prompt: string;
  width: number;
  height: number;
  aspectRatio: string;
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
      lockedPrompt: config.freePrompt.trim(),
      expandablePrompt: '',
      negative_prompt: BASE_NEGATIVE,
      width: dim.width,
      height: dim.height,
      aspectRatio: dim.ratio.split(' ')[0],
      references: [],
      quality: 'high',
      reserved_text_area: null,
      layout_plan: '',
    };
  }

  // LOCKED = user's explicit sidebar choices (NEVER rewritten)
  const locked: string[] = [];
  // EXPANDABLE = contextual/style parts the Architect CAN enhance
  const expandable: string[] = [];
  const negativeParts: string[] = [BASE_NEGATIVE];
  const dim = config.dimension ? DIMENSIONS[config.dimension] : DIMENSIONS['feed-quadrado'];

  // ─── FREE PROMPT → LOCKED ───
  if (config.freePrompt?.trim()) {
    locked.push(config.freePrompt.trim());
  }

  // ─── DIMENSION → EXPANDABLE ───
  expandable.push(`${dim.ratio} aspect ratio, professional social media advertisement`);

  // ─── RESERVED TEXT AREA → LOCKED (layout is exact) ───
  let reservedArea: ReservedArea | null = null;
  let layoutPlan = '';

  if (config.verticalPosition === 'cima') {
    reservedArea = { position: 'bottom', percentage: 40 };
    layoutPlan = 'subject upper 55%, clean negative space bottom 40%';
    locked.push('subject positioned in the upper 55% of the frame');
    locked.push('clean negative space in the bottom 35-45% of the image for typography overlay');
  } else if (config.verticalPosition === 'baixo') {
    reservedArea = { position: 'top', percentage: 40 };
    layoutPlan = 'subject lower 55%, clean negative space top 40%';
    locked.push('subject positioned in the lower 55% of the frame');
    locked.push('clean negative space in the top 35-45% of the image for typography overlay');
  } else {
    reservedArea = { position: 'center-bottom', percentage: 25 };
    layoutPlan = 'subject centered, clean space bottom 25%';
    locked.push('subject centered in the frame');
    locked.push('clean negative space in the bottom 20-30% for text overlay');
  }

  // ─── SUBJECT → LOCKED ───
  const genderLabel = config.gender === 'masculino' ? 'male' : 'female';
  locked.push(`${genderLabel} hero subject`);

  if (config.poseDescription) {
    locked.push(`pose: ${config.poseDescription}`);
  }

  // ─── CHARACTER DIRECTION → ALL LOCKED ───
  const dirExpression = config.expression || config.expressionCustom;
  const dirPose = config.pose || config.poseCustom;
  const dirAngle = config.cameraAngle || config.cameraAngleCustom;
  const dirLens = config.lens || config.lensCustom;
  const dirGaze = config.gazeDirection || config.gazeDirectionCustom;

  if (dirExpression) locked.push(`facial expression: ${dirExpression}`);
  if (dirPose) locked.push(`body pose: ${dirPose}`);
  if (dirAngle) locked.push(`camera angle: ${dirAngle}`);
  if (dirLens) locked.push(`shot with ${dirLens} lens`);
  if (dirGaze) locked.push(`gaze direction: ${dirGaze}`);

  // Subject horizontal position → LOCKED
  if (config.subjectPosition === 'esquerda') {
    locked.push('subject positioned on the left third of frame');
  } else if (config.subjectPosition === 'direita') {
    locked.push('subject positioned on the right third of frame');
  } else {
    locked.push('subject centered in frame');
  }

  // ─── COLORS → LOCKED if manual, EXPANDABLE if auto ───
  if (config.colorMode === 'manual') {
    locked.push(`color palette: ambient ${config.ambientColor}, rim light ${config.rimLightColor}, complementary accent ${config.complementaryLightColor}`);
  } else {
    expandable.push('choose the most coherent color palette for the lighting and environment');
  }

  // ─── FRAMING → LOCKED ───
  if (config.framing === 'closeup') {
    locked.push('close-up shot focusing on face and shoulders');
  } else if (config.framing === 'plano-medio') {
    // When text is at bottom (rodapé) or subject is at top, preserve more space below
    const needsBottomSpace = config.textEnabled && config.textMode === 'imagem' && config.textPosition === 'rodape';
    const subjectAtTop = config.verticalPosition === 'cima';
    if (needsBottomSpace || subjectAtTop) {
      locked.push('medium shot from waist up, subject placed in the upper portion of the frame, generous empty space below the waist for text placement');
    } else {
      locked.push('medium shot from waist up, full body framing with comfortable margins above and below');
    }
  } else {
    locked.push('american shot from knees up');
  }

  // ─── STYLE → EXPANDABLE (Architect can enhance) ───
  if (config.visualStyleEnabled && config.visualStyle) {
    const vfx = STYLE_VFX[config.visualStyle] || config.visualStyle;
    expandable.push(`visual style: ${vfx}`);
  }

  // ─── NICHE / ENVIRONMENT → EXPANDABLE ───
  if (config.niche) {
    expandable.push(`niche context: ${config.niche}`);
  }
  if (config.environment) {
    expandable.push(`environment setting: ${config.environment}`);
  }

  // ─── SOBRIETY → EXPANDABLE ───
  if (config.sobriety > 70) {
    expandable.push('professional corporate clean restrained aesthetic');
  } else if (config.sobriety < 30) {
    expandable.push('creative artistic bold expressive experimental look');
  }

  // ─── EFFECTS → LOCKED ───
  if (config.useBlur) {
    locked.push('beautiful bokeh background blur, shallow depth of field');
  }
  if (config.useSideGradient) {
    locked.push('subtle lateral gradient color transition on both sides of the frame');
  }

  // ─── FLOATING ELEMENTS → LOCKED ───
  if (config.floatingElements && config.floatingElementsText) {
    locked.push(`floating decorative elements around subject: ${config.floatingElementsText}`);
  }

  // ─── TEXT HANDLING → LOCKED (exact text is sacred) ───
  if (!config.textEnabled || config.textMode === 'camada') {
    locked.push('NO text in the image, clean background for post-production text overlay');
    negativeParts.push('any text, letters, words, numbers, watermarks in image');
  } else if (config.textEnabled && config.textMode === 'imagem') {
    const posMap = { topo: 'top area', centro: 'center area', rodape: 'bottom area' };
    const posLabel = posMap[config.textPosition] || 'center area';
    const hFont = config.fontStyleHeadline ? `, using ${getFontStylePromptHint(config.fontStyleHeadline)}` : '';
    const sFont = config.fontStyleSubheadline ? `, using ${getFontStylePromptHint(config.fontStyleSubheadline)}` : '';
    const cFont = config.fontStyleCta ? `, using ${getFontStylePromptHint(config.fontStyleCta)}` : '';
    const hColor = config.textColorHeadline ? `, in ${config.textColorHeadline} color` : '';
    const sColor = config.textColorSubheadline ? `, in ${config.textColorSubheadline} color` : '';
    const cColor = config.textColorCta ? `, in ${config.textColorCta} color` : '';
    const hSize = config.textSizeHeadline ? `, ${getTextSizePromptHint(config.textSizeHeadline)}` : '';
    const sSize = config.textSizeSubheadline ? `, ${getTextSizePromptHint(config.textSizeSubheadline)}` : '';
    const cSize = config.textSizeCta ? `, ${getTextSizePromptHint(config.textSizeCta)}` : '';
    const hTrack = config.textTrackingHeadline ? `, ${getTextTrackingPromptHint(config.textTrackingHeadline)}` : '';
    const sTrack = config.textTrackingSubheadline ? `, ${getTextTrackingPromptHint(config.textTrackingSubheadline)}` : '';
    const cTrack = config.textTrackingCta ? `, ${getTextTrackingPromptHint(config.textTrackingCta)}` : '';
    const hWeight = config.textWeightHeadline ? `, ${getTextWeightPromptHint(config.textWeightHeadline)}` : '';
    const sWeight = config.textWeightSubheadline ? `, ${getTextWeightPromptHint(config.textWeightSubheadline)}` : '';
    const cWeight = config.textWeightCta ? `, ${getTextWeightPromptHint(config.textWeightCta)}` : '';
    if (config.text01) locked.push(`prominent headline text reading "${config.text01}", high readability, professional typography${hFont}${hColor}${hSize}${hTrack}${hWeight}, positioned in the ${posLabel} of the image`);
    if (config.text02) locked.push(`secondary text reading "${config.text02}", supporting the headline${sFont}${sColor}${sSize}${sTrack}${sWeight}, in the ${posLabel}`);
    if (config.cta) locked.push(`call-to-action text reading "${config.cta}", visually distinct${cFont}${cColor}${cSize}${cTrack}${cWeight}, in the ${posLabel}`);
    locked.push(`all text elements must be placed in the ${posLabel} of the image`);
    negativeParts.push(TEXT_NEGATIVE);
  }

  // ─── ADDITIONAL PROMPT → LOCKED ───
  if (config.additionalPromptEnabled && config.additionalPrompt) {
    locked.push(config.additionalPrompt);
  }

  // ─── ULTRA REALISM BOOST → LOCKED (technical tokens, never rewritten) ───
  if (isHumanSubject(config) && !isNonRealistStyle(config)) {
    locked.push(HUMAN_REALISM_BOOST);
    locked.push(HUMAN_LIPS_BOOST);
    negativeParts.push(HUMAN_NEGATIVE_BOOST);
  }

  // ─── USER NEGATIVE PROMPT ───
  if (config.negativePromptEnabled && config.negativePrompt?.trim()) {
    negativeParts.push(config.negativePrompt.trim());
  }

  // ─── BASE STYLE → LOCKED (technical tokens, never rewritten) ───
  locked.push(BASE_STYLE);

  // ─── BUILD REFERENCES ───
  const references: ReferenceEntry[] = [];

  for (const url of config.subjectPhotos) {
    references.push({ url, role: 'identity', strength: 80, preserve_identity: true });
  }

  if (config.sceneryPhotosEnabled) {
    for (const url of config.sceneryPhotos) {
      references.push({ url, role: 'scenery', strength: 50, preserve_identity: false });
    }
  }

  config.styleReferences.forEach((url, i) => {
    const attrs = config.referenceAttributes?.[i] as string[] | undefined;
    const note = config.referenceNotes?.[i];
    references.push({ url, role: 'inspiration', strength: 35, preserve_identity: false, attributes: attrs });
    if (note) expandable.push(`reference image ${i + 1} guidance: ${note}`);
  });

  const lockedPrompt = locked.join('. ') + '.';
  const expandablePrompt = expandable.join('. ') + '.';

  return {
    prompt: `${lockedPrompt} ${expandablePrompt}`,
    lockedPrompt,
    expandablePrompt,
    negative_prompt: negativeParts.join(', '),
    width: dim.width,
    height: dim.height,
    aspectRatio: dim.ratio.split(' ')[0],
    references,
    quality: 'high',
    reserved_text_area: reservedArea,
    layout_plan: layoutPlan,
  };
}
