import { MockupConfig } from '@/types/mockupConfig';

export interface MockupGenerationRequest {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
}

// ── Mockup type descriptors ────────────────────────────────────────────────
const TYPE_DESC: Record<MockupConfig['mockupType'], string> = {
  produto_fisico: 'professional product mockup photography, physical product showcase',
  embalagem:      'packaging design mockup, premium product packaging photography',
  dispositivo:    'device mockup, screen mockup, digital product presentation',
  papelaria:      'stationery mockup, print design presentation, paper products mockup',
  social_media:   'social media design mockup, digital content preview, brand post presentation',
  branding:       'brand identity mockup, logo application mockup, complete branding presentation',
};

// ── Object descriptors ─────────────────────────────────────────────────────
const OBJECT_DESC: Record<MockupConfig['mockupObject'], string> = {
  caixa_embalagem:    'product box and packaging, clean geometric box with custom branding applied, crisp edges and premium finish',
  garrafa_lata:       'bottle or can product, beverage container mockup with label design applied, realistic material finish',
  camiseta_vestuario: 'clothing apparel mockup, t-shirt or garment with design printed on fabric, realistic textile texture',
  smartphone_tela:    'smartphone screen mockup, mobile device with app or design displayed on screen, realistic device perspective',
  livro_revista:      'book or magazine mockup, editorial print publication with cover design, realistic paper and binding',
  produto_generico:   'versatile product mockup, customizable product with design applied, clean and professional presentation',
  notebook_tablet:    'laptop or tablet screen mockup, digital device display with design or interface shown',
  caneca_copo:        'mug or cup mockup, ceramic or glass drinkware with custom design or logo applied',
  sacola_bag:         'bag or tote mockup, fabric bag with printed design or brand identity applied',
};

// ── Scene descriptors ──────────────────────────────────────────────────────
const SCENE_DESC: Record<MockupConfig['scene'], string> = {
  estudio_clean:        'clean white studio background, minimalist photography setup, pure white backdrop, professional product photography',
  mesa_trabalho:        'work desk scene, office desk with complementary items, workspace lifestyle context, wooden desk surface',
  ambiente_urbano:      'urban city environment context, modern urban backdrop, city lifestyle aesthetic',
  lifestyle:            'lifestyle context, natural living environment, aspirational brand setting, authentic real-world placement',
  fundo_neutro:         'neutral background, muted tones, subtle gradient backdrop, non-distracting environment',
  fundo_escuro_premium: 'dark premium background, dramatic dark backdrop, luxury brand aesthetic, deep black or dark grey surface',
};

// ── Angle descriptors ──────────────────────────────────────────────────────
const ANGLE_DESC: Record<MockupConfig['angle'], string> = {
  frente:       'straight front view, flat frontal angle, symmetric composition, direct facing camera',
  tres_quartos: 'three-quarter angle view, dynamic perspective, showing depth and dimension',
  superior:     'top-down aerial view, overhead perspective, bird\'s eye composition',
  close:        'close-up detail shot, macro perspective, texture and material visible',
  flat_lay:     'flat lay composition, overhead arranged scene, styled product layout on surface',
};

// ── Lighting descriptors ───────────────────────────────────────────────────
const LIGHTING_DESC: Record<MockupConfig['lighting'], string> = {
  estudio_profissional: 'professional studio lighting, three-point lighting setup, clean shadows, product photography standard',
  luz_suave:           'soft diffused lighting, gentle shadow, airy bright atmosphere, natural soft box quality',
  luz_dramatica:       'dramatic directional lighting, strong shadow contrast, moody high-impact illumination',
  luz_natural:         'natural daylight lighting, window light simulation, soft organic shadows, authentic daylight quality',
  contraste_alto:      'high contrast lighting, deep shadows and bright highlights, bold visual impact',
};

// ── Dimension map ──────────────────────────────────────────────────────────
const DIM_MAP: Record<string, { w: number; h: number }> = {
  stories:         { w: 832,  h: 1472 },
  horizontal:      { w: 1472, h: 832  },
  'feed-quadrado': { w: 1024, h: 1024 },
  'feed-retrato':  { w: 896,  h: 1120 },
  apresentacao:    { w: 1472, h: 944  },
};

const FRAMING_INSTRUCTION = (dim: string) => {
  const ratioMap: Record<string, string> = {
    stories:         '9:16 vertical',
    horizontal:      '16:9 horizontal',
    'feed-quadrado': '1:1 square',
    'feed-retrato':  '4:5 portrait',
    apresentacao:    '16:10 presentation',
  };
  return `CRITICAL FRAMING INSTRUCTION: This is a ${ratioMap[dim] || '1:1'} format image. Fill the ENTIRE canvas edge to edge with the composition. Absolutely NO blurred borders, NO letterboxing, NO padding. Every pixel must be part of the composition.`;
};

const NEGATIVE_PROMPT = [
  'blurry borders', 'letterboxing', 'pillarboxing', 'black bars', 'padding',
  'low quality', 'amateur', 'generic clipart', 'flat design', 'cartoon',
  'illustration style', 'watermark', 'text unless requested',
  'distorted product', 'broken perspective', 'ugly label', 'render artifact',
  'floating product', 'unrealistic shadows', 'plastic fake look',
].join(', ');

// ── Build prompt ───────────────────────────────────────────────────────────
export function buildMockupRequest(config: MockupConfig): MockupGenerationRequest {
  // Prompt Livre — ignorar o resto
  if (config.ignoreRest && config.freePrompt?.trim()) {
    const dimMap: Record<string, { w: number; h: number }> = {
      stories: { w: 1080, h: 1920 }, horizontal: { w: 1920, h: 1080 },
      'feed-quadrado': { w: 1080, h: 1080 }, 'feed-retrato': { w: 1080, h: 1350 }, apresentacao: { w: 1920, h: 1200 },
    };
    const { w, h } = dimMap[config.dimension ?? 'feed-quadrado'] ?? { w: 1080, h: 1080 };
    return { prompt: config.freePrompt.trim(), negative_prompt: NEGATIVE_PROMPT, width: w, height: h };
  }
  const parts: string[] = [];

  // Core quality
  parts.push('Ultra-premium professional mockup photography, award-winning commercial product photography, hyperrealistic studio quality');

  // Type
  parts.push(TYPE_DESC[config.mockupType]);

  // Object
  parts.push(OBJECT_DESC[config.mockupObject]);

  // Scene
  parts.push(SCENE_DESC[config.scene]);

  // Angle
  parts.push(ANGLE_DESC[config.angle]);

  // Lighting
  parts.push(LIGHTING_DESC[config.lighting]);

  // Realism level
  const realismLabel = config.realism > 80
    ? 'ultra photorealistic, hyperdetailed materials, perfect product photography render quality'
    : config.realism > 50
      ? 'highly realistic photography quality, natural materials and surfaces'
      : 'clean stylized mockup, design-focused presentation quality';
  parts.push(realismLabel);

  // VFX
  const vfx: string[] = [];
  if (config.useShadows)      vfx.push('realistic product shadows, contact shadow grounding');
  if (config.useReflections)  vfx.push('subtle surface reflections, material sheen');
  if (config.useGrain)        vfx.push('light film grain, organic texture');
  if (config.useDepthOfField) vfx.push('shallow depth of field, bokeh background blur');
  if (vfx.length) parts.push(vfx.join(', '));

  // Design upload note (for reference images)
  if (config.designPhotos.length > 0) {
    parts.push('custom brand design applied to product surface, design correctly mapped to product geometry, accurate perspective mapping of artwork');
  }

  // Text
  if (config.textEnabled) {
    parts.push('minimal typography in scene, clean professional text, non-intrusive label or scene text');
    const zone = config.verticalPosition === 'cima' ? 'top area' :
      config.verticalPosition === 'baixo' ? 'bottom area' : 'center';
    parts.push(`intentional negative space at ${zone} for text overlay`);
  }

  // Additional prompt
  if (config.additionalPrompt) {
    parts.push(config.additionalPrompt);
  }

  // Finish
  parts.push('professional commercial product photography, brand presentation quality, Behance portfolio level mockup');

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
