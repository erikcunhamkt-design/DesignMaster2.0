import { HeroConfig } from '@/types/heroConfig';

// ══════════════════════════════════════════════════════════════════════════════
// HERO PROMPT AGENT — Landing Page Hero Section Specialist
// Builds structured, ultra-detailed prompts optimized for hero generation.
// Sends separated instructions so the edge function can compose correctly.
// ══════════════════════════════════════════════════════════════════════════════

// ── Descriptor maps ──────────────────────────────────────────────────────────

const HERO_TYPE_DESC: Record<HeroConfig['heroType'], string> = {
  saas_tecnologia:      'SaaS technology product hero section for a modern software company landing page, clean digital workspace aesthetic, professional tech startup energy',
  servico_profissional: 'professional services firm hero, consulting agency or law firm, visual language that conveys credibility, authority and trustworthiness',
  produto_digital:      'digital product launch hero, premium online course or ebook landing page, high-value info-product visual with aspirational quality',
  app_plataforma:       'mobile app or web platform hero section, app store showcase energy, clean interface highlight, modern startup landing page',
  marca_pessoal:        'personal brand hero section, thought leader positioning, expert or coach landing page, authentic premium personal identity',
  startup_vendas:       'high-conversion sales landing page hero, aggressive startup growth energy, venture-backed company aesthetic, scroll-stopping visual impact',
};

const ELEMENT_DESC: Record<HeroConfig['element'], string> = {
  pessoa_fundador:   'the main subject is a PERSON (founder, expert, or professional) as the hero visual element — confident, authoritative presence with premium portrait quality',
  produto_mockup:    'the main element is a PRODUCT MOCKUP or device screen showing a dashboard/UI — clean device frame, premium product showcase, floating interface',
  cena_abstrata:     'the main element is an ABSTRACT VISUAL SCENE — flowing gradients, geometric shapes, conceptual digital landscape, no people',
  ilustracao_tech:   'the main element is a TECHNOLOGICAL ILLUSTRATION — isometric design elements, data visualization, circuit-like organic forms, no people',
  simbolo_conceito:  'the main element is a BOLD SYMBOLIC VISUAL CONCEPT — minimalist icon or metaphor blown up as hero element, powerful visual metaphor, no people',
};

const COMPOSITION_DESC: Record<HeroConfig['composition'], string> = {
  pessoa_esquerda:  'COMPOSITION: Subject positioned on the LEFT side of the frame. The RIGHT half must be CLEAN negative space (gradient or subtle background) reserved for text overlay. Asymmetric hero layout with strong visual hierarchy. IMPORTANT: right side must have no busy elements.',
  pessoa_direita:   'COMPOSITION: Subject positioned on the RIGHT side of the frame. The LEFT half must be CLEAN negative space reserved for headline text overlay. Classic landing page hero composition. IMPORTANT: left side must have no busy elements.',
  centralizado:     'COMPOSITION: Centered composition with the subject in the middle. Symmetric layout with commanding presence. Bottom portion should have gradient fade for headline text placement.',
  sem_pessoa:       'COMPOSITION: Full visual hero WITHOUT any human subject. Environment, product, or abstract concept takes center stage. Pure visual impact composition.',
  split_layout:     'COMPOSITION: Modern split-screen layout with two distinct visual zones (left vs right). Editorial magazine composition with contrast between zones.',
};

const STYLE_DESC: Record<HeroConfig['visualStyle'], string> = {
  clean_premium:          'VISUAL STYLE: Ultra-clean premium aesthetic — minimal clutter, generous whitespace, Apple-level refinement, timeless design quality, luxury brand feel',
  tech_futurista:         'VISUAL STYLE: Futuristic technology aesthetic — neon accents, holographic elements, dark tech background with glowing elements, next-generation visual language',
  editorial_sofisticado:  'VISUAL STYLE: Editorial sophisticated style — high-fashion photography sensibility, bold typography-ready composition, luxury magazine visual quality',
  minimal_moderno:        'VISUAL STYLE: Modern minimalism — stripped-to-essence design, confident negative space, Scandinavian design influence, pure geometric form',
  cinematografico:        'VISUAL STYLE: Cinematic photography style — film-grade color grading, wide aspect ratio sensibility, dramatic storytelling composition, movie-poster quality',
};

const LIGHTING_DESC: Record<HeroConfig['lighting'], string> = {
  luz_suave_estudio:        'LIGHTING: Soft studio lighting with diffused fill, gentle shadows, bright and clean professional quality, beauty/headshot lighting setup',
  luz_dramatica_lateral:    'LIGHTING: Dramatic side lighting with strong shadows creating depth, chiaroscuro effect, bold contrast, editorial impact, moody atmosphere',
  gradiente_tecnologico:    'LIGHTING: Tech-gradient atmospheric lighting, backlit glow effect, blue-purple-cyan ambient light, holographic light sources, digital atmosphere',
  glow_sutil:               'LIGHTING: Subtle luminous glow effect, rim lighting with color, premium product lighting with soft halo, luxury visual feel, warm radiance',
  profundidade_elegante:    'LIGHTING: Elegant multi-plane lighting, bokeh background separation, painterly depth-of-field quality, cinematic depth layers',
};

const DIMENSION_SPECS: Record<string, { instruction: string; aspectRatio: string }> = {
  desktop:       { instruction: 'FORMAT: 1920x1080 widescreen hero, full-width desktop browser viewport, landscape orientation', aspectRatio: '16:9' },
  mobile:        { instruction: 'FORMAT: 1080x1920 vertical mobile hero, above-the-fold mobile layout, portrait orientation', aspectRatio: '9:16' },
  banner:        { instruction: 'FORMAT: Wide panoramic banner strip, high-impact header visual', aspectRatio: '21:9' },
  section_cover: { instruction: 'FORMAT: Square or 4:5 portrait section divider, social-media-ready crop, versatile format', aspectRatio: '4:5' },
};

// ── Public Interface ─────────────────────────────────────────────────────────

export interface HeroRequest {
  /** Locked prompt parts (config selections — must not be rewritten) */
  lockedPrompt: string;
  /** Expandable creative context (free prompt — can be enhanced by Architect) */
  expandablePrompt: string;
  /** Negative prompt */
  negativePrompt: string;
  /** Aspect ratio for image generation */
  aspectRatio: string;
  /** Whether to use Prompt Architect for expansion */
  useArchitect: boolean;
}

export function buildHeroRequest(config: HeroConfig): HeroRequest {
  // ── Prompt Livre: bypass everything ──
  if (config.ignoreRest && config.freePrompt?.trim()) {
    return {
      lockedPrompt: '',
      expandablePrompt: config.freePrompt.trim(),
      negativePrompt: config.negativePromptEnabled && config.negativePrompt?.trim()
        ? config.negativePrompt.trim()
        : '',
      aspectRatio: config.dimension ? DIMENSION_SPECS[config.dimension]?.aspectRatio || '16:9' : '16:9',
      useArchitect: true,
    };
  }

  // ── Build locked prompt (non-negotiable config instructions) ──
  const locked: string[] = [];

  // Landing page context
  locked.push('Ultra-high-quality hero section image for a professional landing page');
  locked.push(HERO_TYPE_DESC[config.heroType]);
  locked.push(ELEMENT_DESC[config.element]);
  locked.push(COMPOSITION_DESC[config.composition]);
  locked.push(STYLE_DESC[config.visualStyle]);
  locked.push(LIGHTING_DESC[config.lighting]);

  // Intensity
  if (config.intensity < 30) {
    locked.push('INTENSITY: Restrained and refined visual approach, subtle impact, elegant restraint');
  } else if (config.intensity < 60) {
    locked.push('INTENSITY: Balanced visual impact, engaging without overwhelming, professional energy');
  } else if (config.intensity < 85) {
    locked.push('INTENSITY: High visual impact, commanding scroll-stopping presence, bold energy');
  } else {
    locked.push('INTENSITY: Maximum visual impact, extremely bold and striking, unforgettable hero moment');
  }

  // Format
  if (config.dimension && DIMENSION_SPECS[config.dimension]) {
    locked.push(DIMENSION_SPECS[config.dimension].instruction);
  }

  // Advanced effects
  if (config.useDepthOfField) {
    locked.push('EFFECT: Shallow depth of field with professional bokeh background, subject isolation');
  }
  if (config.useGlow) {
    locked.push('EFFECT: Subtle radiant glow emanating from subject, premium luminous quality');
  }
  if (config.useSharpness) {
    locked.push('EFFECT: Razor-sharp foreground detail, crystal clarity, commercial photography precision');
  }
  if (config.useGrain) {
    locked.push('EFFECT: Subtle film grain texture, analog warmth, editorial film photography feel');
  }

  // Contrast
  if (config.contrast > 70) {
    locked.push('CONTRAST: High contrast with bold tonal separation, powerful blacks and bright highlights');
  } else if (config.contrast < 30) {
    locked.push('CONTRAST: Low contrast, airy and soft tonal range, ethereal and delicate mood');
  }

  // Landing page conversion rules
  locked.push('LANDING PAGE RULES: conversion-optimized visual composition, premium brand quality');
  locked.push('MANDATORY: No text embedded in image, no logos, no watermarks, no UI chrome elements');
  locked.push('QUALITY: Photorealistic or hyper-realistic render, 8K quality, commercial advertising standard');

  // ── Build expandable prompt (creative context for Architect) ──
  const expandable: string[] = [];

  if (config.additionalPrompt?.trim()) {
    expandable.push(config.additionalPrompt.trim());
  }

  if (config.freePrompt?.trim() && !config.ignoreRest) {
    expandable.push(config.freePrompt.trim());
  }

  // ── Negative prompt ──
  const negParts: string[] = [
    'amateur photography, stock photo look, generic, clipart',
    'busy cluttered composition, text overlaid on image, watermarks, logos embedded',
    'low quality, blurry, pixelated, overexposed, underexposed',
    'distorted faces, bad anatomy, extra fingers, deformed',
    'dated aesthetic, corporate stock photography clichés',
    'multiple mismatched styles, inconsistent lighting, flat boring lighting',
    'pasted head effect, mismatched skin tones between face and body',
  ];

  if (config.negativePromptEnabled && config.negativePrompt?.trim()) {
    negParts.push(config.negativePrompt.trim());
  }

  return {
    lockedPrompt: locked.join('. '),
    expandablePrompt: expandable.join('. '),
    negativePrompt: negParts.join(', '),
    aspectRatio: config.dimension ? DIMENSION_SPECS[config.dimension]?.aspectRatio || '16:9' : '16:9',
    useArchitect: expandable.length > 0,
  };
}
