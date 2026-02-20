export type AutoSubjectType =
  | 'carro_unico'
  | 'dois_carros'
  | 'carro_piloto'
  | 'so_o_carro'
  | 'detalhe_automotivo'
  | 'moto_unica'
  | 'moto_piloto'
  | 'caminhao'
  | 'pickup_offroad'
  | 'van_utilitario';

export type AutoAngle =
  | 'frente_agressiva'
  | 'perfil_lateral'
  | 'traseira_movimento'
  | 'angulo_baixo'
  | 'close_tecnico';

export type AutoVisualStyle =
  | 'race_day'
  | 'drift'
  | 'trackday'
  | 'gt_supercar'
  | 'formula_open_wheel'
  | 'street_performance';

export type AutoMood =
  | 'velocidade'
  | 'precisao'
  | 'poder'
  | 'tensao'
  | 'vitoria'
  | 'tecnico';

export type AutoDimension =
  | 'stories'
  | 'horizontal'
  | 'feed-quadrado'
  | 'feed-retrato';

export type AutoColorMode = 'auto' | 'manual';

export interface AutoConfig {
  // Subject
  subjectType: AutoSubjectType;
  subjectPhotos: string[];
  subjectAngle: AutoAngle;

  // Visual style
  visualStyle: AutoVisualStyle | '';
  intensity: number;

  // VFX
  useMotionBlur: boolean;
  useSparks: boolean;
  useSmoke: boolean;
  useGrain: boolean;
  useDepthOfField: boolean;

  // Mood
  matchMood: AutoMood | '';

  // Format
  dimension: AutoDimension | null;

  // Colors
  colorMode: AutoColorMode;
  primaryColor: string;
  secondaryColor: string;

  // Text
  textEnabled: boolean;
  text01: string;
  text02: string;
  cta: string;
  verticalPosition: 'cima' | 'centralizado' | 'baixo';

  // Advanced
  additionalPrompt: string;
  environment: string;
}

export const defaultAutoConfig: AutoConfig = {
  subjectType: 'carro_unico',
  subjectPhotos: [],
  subjectAngle: 'frente_agressiva',
  visualStyle: '',
  intensity: 70,
  useMotionBlur: true,
  useSparks: false,
  useSmoke: false,
  useGrain: true,
  useDepthOfField: true,
  matchMood: '',
  dimension: null,
  colorMode: 'auto',
  primaryColor: '#e63946',
  secondaryColor: '#1a1a2e',
  textEnabled: false,
  text01: '',
  text02: '',
  cta: '',
  verticalPosition: 'baixo',
  additionalPrompt: '',
  environment: '',
};
