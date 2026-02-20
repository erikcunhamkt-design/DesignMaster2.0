import { AutoConfig } from '@/types/autoConfig';

export interface AutoGenerationRequest {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
}

// ── Subject descriptors ────────────────────────────────────────────────────
const SUBJECT_DESC: Record<AutoConfig['subjectType'], string> = {
  carro_unico:        'single performance car as the hero subject, full vehicle featured prominently',
  dois_carros:        'two performance cars in dynamic duel composition, side by side rivalry',
  carro_piloto:       'racing driver and car unified composition, driver and machine as one',
  so_o_carro:         'vehicle only, no driver, pure automotive form and design',
  detalhe_automotivo: 'extreme close-up automotive detail — wheel, headlight, intake, cockpit, or carbon fiber',
  moto_unica:         'single motorcycle as the hero subject, full bike featured prominently, aggressive stance',
  moto_piloto:        'motorcycle rider and bike as one unified composition, rider in full gear, dynamic pose',
  caminhao:           'powerful truck as the hero subject, imposing presence, massive and dominant vehicle',
  pickup_offroad:     'pickup truck or off-road 4x4 vehicle, rugged terrain, adventure and power',
  van_utilitario:     'van or utility vehicle, professional and versatile, clean commercial aesthetic',
};

// ── Angle descriptors ──────────────────────────────────────────────────────
const ANGLE_DESC: Record<AutoConfig['subjectAngle'], string> = {
  frente_agressiva:  'aggressive front three-quarter angle, headlights leading, intimidating stance',
  perfil_lateral:    'clean side profile showing full silhouette and body lines',
  traseira_movimento:'rear in motion, exhaust flames, taillights trailing',
  angulo_baixo:      'ultra-low angle, ground level, maximum power perspective, wide lens distortion',
  close_tecnico:     'technical close-up macro, precision engineering details visible',
};

// ── Visual style ───────────────────────────────────────────────────────────
const STYLE_DESC: Record<string, string> = {
  race_day:            'race day motorsport graphic design, pit lane atmosphere, professional motorsport branding, timing boards, race suits, helmet reflections',
  drift:               'drift event aesthetic, tire smoke, sliding angle, drifting lifestyle, neon accents, smoke-filled background',
  trackday:            'trackday morning atmosphere, circuit road, track markers, tire marks on tarmac, golden hour lighting',
  gt_supercar:         'GT supercar luxury performance, editorial automotive photography quality, clean environment, exotic lines',
  formula_open_wheel:  'formula racing open wheel car, aerodynamic elements, downforce visual, F1-inspired graphic design',
  street_performance:  'street performance urban environment, city lights at night, wet asphalt reflections, tuner culture',
};

// ── Mood descriptors ───────────────────────────────────────────────────────
const MOOD_DESC: Record<string, string> = {
  velocidade: 'extreme speed sensation, motion lines, blurred background, velocity energy',
  precisao:   'surgical precision, clean composition, technical perfection, sharp details',
  poder:      'raw power, aggressive stance, dominant presence, muscular energy',
  tensao:     'high tension drama, pre-race intensity, psychological pressure, dark atmosphere',
  vitoria:    'victory celebration, triumphant light, gold accents, championship energy',
  tecnico:    'technical engineering beauty, mechanical precision, studio quality, clean background',
};

// ── Dimension map ──────────────────────────────────────────────────────────
const DIM_MAP = {
  'stories':       { w: 832, h: 1472 },
  'horizontal':    { w: 1472, h: 832 },
  'feed-quadrado': { w: 1024, h: 1024 },
  'feed-retrato':  { w: 896, h: 1120 },
};

const FRAMING_INSTRUCTION = (dim: string) => {
  const ratioMap: Record<string, string> = {
    stories:        '9:16 vertical',
    horizontal:     '16:9 horizontal',
    'feed-quadrado':'1:1 square',
    'feed-retrato': '4:5 portrait',
  };
  return `CRITICAL FRAMING INSTRUCTION: This is a ${ratioMap[dim] || '1:1'} format image. Fill the ENTIRE canvas edge to edge with the composition. Absolutely NO blurred borders, NO letterboxing, NO padding, NO empty sidebars. Every pixel must be part of the composition.`;
};

// ── Negative prompt ────────────────────────────────────────────────────────
const NEGATIVE_PROMPT = [
  'blurry borders', 'letterboxing', 'pillarboxing', 'black bars', 'padding',
  'low quality', 'amateur', 'generic stock photo', 'flat lighting',
  'cartoon', 'anime', 'illustration', 'render artifact', 'watermark',
  'text in image unless requested', 'ugly', 'deformed vehicle', 'broken perspective',
].join(', ');

// ── Build prompt ───────────────────────────────────────────────────────────
export function buildAutoRequest(config: AutoConfig): AutoGenerationRequest {
  // Prompt Livre — ignorar o resto
  if (config.ignoreRest && config.freePrompt?.trim()) {
    const dimMap: Record<string, { w: number; h: number }> = {
      stories: { w: 1080, h: 1920 }, horizontal: { w: 1920, h: 1080 },
      'feed-quadrado': { w: 1080, h: 1080 }, 'feed-retrato': { w: 1080, h: 1350 },
    };
    const { w, h } = dimMap[config.dimension ?? 'stories'] ?? { w: 1080, h: 1920 };
    return { prompt: config.freePrompt.trim(), negative_prompt: NEGATIVE_PROMPT, width: w, height: h };
  }
  const parts: string[] = [];

  // Core quality statement
  parts.push('Ultra-premium automotive motorsport digital art, professional advertising quality, cinematic');

  // Subject
  parts.push(SUBJECT_DESC[config.subjectType]);

  // Angle
  parts.push(ANGLE_DESC[config.subjectAngle]);

  // Style
  if (config.visualStyle && STYLE_DESC[config.visualStyle]) {
    parts.push(STYLE_DESC[config.visualStyle]);
  }

  // Mood
  if (config.matchMood && MOOD_DESC[config.matchMood]) {
    parts.push(MOOD_DESC[config.matchMood]);
  }

  // Colors
  if (config.colorMode === 'manual') {
    parts.push(`primary color palette: ${config.primaryColor}, secondary accent: ${config.secondaryColor}`);
  } else {
    parts.push('dramatic automotive color grading, high contrast with rich shadows and vivid highlights');
  }

  // VFX
  const vfx: string[] = [];
  if (config.useMotionBlur) vfx.push('subtle motion blur conveying speed');
  if (config.useSparks)     vfx.push('flying sparks and embers');
  if (config.useSmoke)      vfx.push('tire smoke and exhaust haze');
  if (config.useGrain)      vfx.push('cinematic film grain');
  if (config.useDepthOfField) vfx.push('shallow depth of field, bokeh background');
  if (vfx.length) parts.push(vfx.join(', '));

  // Intensity
  const intensityLabel = config.intensity > 75 ? 'extreme aggressive explosive energy' :
    config.intensity > 50 ? 'bold dynamic energy' : 'clean refined elegant';
  parts.push(intensityLabel);

  // Text
  if (config.textEnabled) {
    parts.push('racing typography integrated, motorsport editorial text layout, clear hierarchy');
    const zone = config.verticalPosition === 'cima' ? 'top area' :
      config.verticalPosition === 'baixo' ? 'bottom area' : 'center';
    parts.push(`intentional negative space reserved at ${zone} for text overlay`);
  }

  // Environment
  if (config.environment) {
    parts.push(config.environment);
  }

  // Additional
  if (config.additionalPrompt) {
    parts.push(config.additionalPrompt);
  }

  // Finish
  parts.push('professional motorsport club design quality, maximum impact visual, award-winning automotive photography aesthetic');

  // Framing
  const dim = config.dimension || 'feed-quadrado';
  parts.push(FRAMING_INSTRUCTION(dim));

  const { w, h } = DIM_MAP[dim] || DIM_MAP['feed-quadrado'];

  return {
    prompt: parts.join('. '),
    negative_prompt: NEGATIVE_PROMPT,
    width: w,
    height: h,
  };
}
