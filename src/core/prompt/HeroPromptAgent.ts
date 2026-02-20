import { HeroConfig } from '@/types/heroConfig';

// ── Descriptor maps ──────────────────────────────────────────────────────────

const HERO_TYPE_DESC: Record<HeroConfig['heroType'], string> = {
  saas_tecnologia:      'SaaS technology product landing page, modern software company, digital workspace aesthetic',
  servico_profissional: 'professional services firm, consulting or agency, credibility and trust visual language',
  produto_digital:      'digital product launch, online course or ebook, premium info-product, high-value digital offering',
  app_plataforma:       'mobile app or web platform, app store hero, clean interface showcase, startup energy',
  marca_pessoal:        'personal brand hero, thought leader or expert positioning, authentic and premium personal identity',
  startup_vendas:       'high-conversion sales landing page, startup growth energy, venture-backed company aesthetic',
};

const ELEMENT_DESC: Record<HeroConfig['element'], string> = {
  pessoa_fundador:   'founder or expert person as hero subject, confident professional, high-end portrait lighting, authentic personal brand energy',
  produto_mockup:    'product mockup or device screen as hero element, dashboard UI inside clean device frame, premium product showcase',
  cena_abstrata:     'abstract visual scene, flowing gradients, geometric shapes, conceptual digital landscape',
  ilustracao_tech:   'technological illustration, isometric design elements, data visualization nodes, circuit-like organic forms',
  simbolo_conceito:  'bold symbolic visual concept, minimalist icon blown up as hero element, powerful visual metaphor',
};

const COMPOSITION_DESC: Record<HeroConfig['composition'], string> = {
  pessoa_esquerda:  'subject positioned LEFT side of frame, text space reserved on the right, asymmetric hero layout, strong visual hierarchy',
  pessoa_direita:   'subject positioned RIGHT side of frame, text space reserved on the left, classic landing page composition',
  centralizado:     'centered composition, subject in the middle, symmetric layout, commanding presence, grand editorial feel',
  sem_pessoa:       'no person, full visual hero without human subject, environment or product takes center stage, abstract or conceptual hero',
  split_layout:     'modern split-screen layout, two distinct visual zones, left vs right contrast, editorial magazine composition',
};

const STYLE_DESC: Record<HeroConfig['visualStyle'], string> = {
  clean_premium:          'ultra-clean premium aesthetic, minimal clutter, generous whitespace, Apple-level refinement, timeless design quality',
  tech_futurista:         'futuristic technology aesthetic, neon accents, cyber holographic elements, dark tech background, next-gen visual language',
  editorial_sofisticado:  'editorial sophisticated style, high-fashion photography sensibility, bold typography-ready composition, luxury magazine visual',
  minimal_moderno:        'modern minimalism, stripped-to-essence design, confident negative space usage, Scandinavian design influence, pure form',
  cinematografico:        'cinematic photography style, film-grade color grading, wide aspect ratio sensibility, dramatic and storytelling composition',
};

const LIGHTING_DESC: Record<HeroConfig['lighting'], string> = {
  luz_suave_estudio:        'soft studio lighting, diffused fill light, gentle shadows, bright and clean, professional headshot lighting',
  luz_dramatica_lateral:    'dramatic side lighting, strong shadows creating depth, chiaroscuro effect, bold contrast, editorial impact',
  gradiente_tecnologico:    'tech-gradient atmospheric lighting, backlit glow, blue-purple-cyan ambient, holographic light sources, digital atmosphere',
  glow_sutil:               'subtle glow effect, rim lighting with color, premium product lighting with soft luminous halo, luxury visual feel',
  profundidade_elegante:    'elegant depth, multi-plane lighting separation, bokeh background rendering, painterly depth-of-field quality',
};

const DIMENSION_SPECS: Record<string, string> = {
  desktop:       '1920x1080 widescreen, full-width hero, desktop browser viewport proportions, landscape orientation',
  mobile:        '1080x1920 vertical, mobile viewport hero, thumb-friendly vertical composition, above-the-fold mobile layout',
  banner:        '1440x500 wide banner format, panoramic hero strip, high-impact header visual',
  section_cover: '1:1 square or 4:5 portrait, section divider visual, social-media-ready crop, versatile format',
};

// ── Prompt Builder ────────────────────────────────────────────────────────────

interface HeroRequest {
  prompt: string;
  negative_prompt: string;
}

export function buildHeroRequest(config: HeroConfig): HeroRequest {
  // Prompt Livre — ignorar o resto
  if (config.ignoreRest && config.freePrompt?.trim()) {
    return { prompt: config.freePrompt.trim(), negative_prompt: '' };
  }
  const parts: string[] = [];

  // Base quality
  parts.push('Ultra-high-quality hero section photograph for landing page');

  // Hero type context
  parts.push(HERO_TYPE_DESC[config.heroType]);

  // Main element
  parts.push(ELEMENT_DESC[config.element]);

  // Composition
  parts.push(COMPOSITION_DESC[config.composition]);

  // Visual style
  parts.push(STYLE_DESC[config.visualStyle]);

  // Intensity modifier
  const intensityLabel = config.intensity < 30
    ? 'restrained and refined approach, subtle visual impact'
    : config.intensity < 60
    ? 'balanced visual impact, engaging without overwhelming'
    : config.intensity < 85
    ? 'high visual impact, commanding presence, scroll-stopping quality'
    : 'maximum visual impact, extremely bold and striking, unforgettable hero moment';
  parts.push(intensityLabel);

  // Lighting
  parts.push(LIGHTING_DESC[config.lighting]);

  // Dimension / format
  if (config.dimension && DIMENSION_SPECS[config.dimension]) {
    parts.push(DIMENSION_SPECS[config.dimension]);
  }

  // Advanced options
  if (config.useDepthOfField) {
    parts.push('shallow depth of field, professional bokeh background separation, subject isolation');
  }
  if (config.useGlow) {
    parts.push('subtle radiant glow effect, light emanating from subject, premium luminous quality');
  }
  if (config.useSharpness) {
    parts.push('razor-sharp foreground detail, crystal clarity, commercial photography precision');
  }
  if (config.useGrain) {
    parts.push('subtle film grain texture, analog warmth, editorial film photography feel');
  }

  // Contrast modifier
  if (config.contrast > 70) {
    parts.push('high contrast image, bold tonal separation, powerful blacks and bright highlights');
  } else if (config.contrast < 30) {
    parts.push('low contrast, airy and soft tonal range, ethereal and delicate mood');
  }

  // Text safe area
  if (config.composition === 'pessoa_esquerda') {
    parts.push('IMPORTANT: right half of image must be clean negative space for text overlay, no busy elements on right side');
  } else if (config.composition === 'pessoa_direita') {
    parts.push('IMPORTANT: left half of image must be clean negative space for text overlay, no busy elements on left side');
  } else if (config.composition === 'centralizado') {
    parts.push('bottom portion of image clean for headline text, gradient fade at bottom to transparent');
  }

  // Conversion-optimized design principles
  parts.push('conversion-optimized visual composition, landing page design principles, premium SaaS brand quality');
  parts.push('no text embedded in image, no logos, no watermarks, no UI chrome elements');
  parts.push('photorealistic or hyper-realistic render, 8K quality, commercial advertising standard');

  // Additional prompt
  if (config.additionalPrompt?.trim()) {
    parts.push(config.additionalPrompt.trim());
  }

  const negative: string[] = [
    'amateur photography, stock photo look, generic, clipart, illustration unless requested',
    'busy cluttered composition, text overlaid on image, watermarks, logos embedded',
    'low quality, blurry, pixelated, overexposed, underexposed',
    'distorted faces, bad anatomy, extra fingers, deformed',
    'dated or 2000s aesthetic, corporate stock photography clichés',
    'multiple mismatched styles, inconsistent lighting, flat boring lighting',
  ];

  return {
    prompt: parts.join('. '),
    negative_prompt: negative.join(', '),
  };
}
