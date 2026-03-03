export type HeroType =
  | 'saas_tecnologia'
  | 'servico_profissional'
  | 'produto_digital'
  | 'app_plataforma'
  | 'marca_pessoal'
  | 'startup_vendas';

export type HeroElement =
  | 'pessoa_fundador'
  | 'produto_mockup'
  | 'cena_abstrata'
  | 'ilustracao_tech'
  | 'simbolo_conceito';

export type HeroComposition =
  | 'pessoa_esquerda'
  | 'pessoa_direita'
  | 'centralizado'
  | 'sem_pessoa'
  | 'split_layout';

export type HeroVisualStyle =
  | 'clean_premium'
  | 'tech_futurista'
  | 'editorial_sofisticado'
  | 'minimal_moderno'
  | 'cinematografico';

export type HeroLighting =
  | 'luz_suave_estudio'
  | 'luz_dramatica_lateral'
  | 'gradiente_tecnologico'
  | 'glow_sutil'
  | 'profundidade_elegante';

export type HeroDimension =
  | 'desktop'
  | 'mobile'
  | 'banner'
  | 'section_cover';

export interface HeroConfig {
  // Hero type
  heroType: HeroType;

  // Element
  element: HeroElement;

  // Upload
  referencePhotos: string[];

  // Composition
  composition: HeroComposition;

  // Style
  visualStyle: HeroVisualStyle;
  intensity: number; // 0-100: Clean → Impactante

  // Lighting
  lighting: HeroLighting;

  // Text
  textEnabled: boolean;
  headline: string;
  subheadline: string;
  cta: string;

  // Format
  dimension: HeroDimension | null;

  // Advanced
  useDepthOfField: boolean;
  useGlow: boolean;
  useSharpness: boolean;
  useGrain: boolean;
  contrast: number; // 0-100

  // Additional
  additionalPrompt: string;

  // Prompt Livre
  freePrompt: string;
  ignoreRest: boolean;

  // Prompt Negativo
  negativePrompt: string;
  negativePromptEnabled: boolean;
}

export const defaultHeroConfig: HeroConfig = {
  heroType: 'saas_tecnologia',
  element: 'pessoa_fundador',
  referencePhotos: [],
  composition: 'pessoa_direita',
  visualStyle: 'clean_premium',
  intensity: 60,
  lighting: 'luz_suave_estudio',
  textEnabled: false,
  headline: '',
  subheadline: '',
  cta: '',
  dimension: 'desktop',
  useDepthOfField: true,
  useGlow: false,
  useSharpness: true,
  useGrain: false,
  contrast: 50,
  additionalPrompt: '',
  freePrompt: '',
  ignoreRest: false,
  negativePrompt: '',
  negativePromptEnabled: false,
};
