export interface ProjectConfig {
  // Sujeito Principal
  subjectPhotos: string[];
  quantity: number;
  gender: 'masculino' | 'feminino';
  poseDescription: string;
  subjectPosition: 'esquerda' | 'centro' | 'direita';

  // Dimensões
  dimension: 'stories' | 'horizontal' | 'feed-quadrado' | 'feed-retrato' | null;

  // Texto
  textEnabled: boolean;
  text01: string;
  text02: string;
  cta: string;
  textMode: 'camada' | 'imagem';
  textPosition: 'topo' | 'centro' | 'rodape';
  fontStyle: string;
  fontStyleHeadline: string;
  fontStyleSubheadline: string;
  fontStyleCta: string;

  // Projeto & Cenário
  niche: string;
  environment: string;
  sceneryPhotosEnabled: boolean;
  sceneryPhotos: string[];

  // Cores & Iluminação
  colorMode: 'auto' | 'manual';
  ambientColor: string;
  rimLightColor: string;
  complementaryLightColor: string;
  autoAmbientColor: string;
  autoRimLightColor: string;
  autoComplementaryLightColor: string;
  autoColorRationale: string;

  // Composição
  framing: 'closeup' | 'plano-medio' | 'plano-americano';
  floatingElements: boolean;
  floatingElementsText: string;
  verticalPosition: 'cima' | 'centralizado' | 'baixo';
  autoVerticalPosition: boolean;
  customComposition?: string;

  // Referências
  styleReferences: string[];
  referenceAttributes: Record<number, string[]>;
  referenceNotes: Record<number, string>;

  // Direção do Personagem
  expression: string;
  expressionCustom: string;
  pose: string;
  poseCustom: string;
  cameraAngle: string;
  cameraAngleCustom: string;
  lens: string;
  lensCustom: string;
  gazeDirection: string;
  gazeDirectionCustom: string;

  // Atributos Visuais
  sobriety: number;
  visualStyleEnabled: boolean;
  visualStyle: string;
  useBlur: boolean;
  useSideGradient: boolean;
  additionalPromptEnabled: boolean;
  additionalPrompt: string;

  // Prompt Livre
  freePrompt: string;
  ignoreRest: boolean;

  // Prompt Negativo
  negativePrompt: string;
  negativePromptEnabled: boolean;
}

export interface Project {
  id: string;
  name: string;
  config: ProjectConfig;
}

export const defaultConfig: ProjectConfig = {
  subjectPhotos: [],
  quantity: 1,
  gender: 'masculino',
  poseDescription: '',
  subjectPosition: 'centro',
  dimension: null,
  textEnabled: false,
  text01: '',
  text02: '',
  cta: '',
  textMode: 'camada',
  textPosition: 'centro',
  fontStyle: '',
  fontStyleHeadline: '',
  fontStyleSubheadline: '',
  fontStyleCta: '',
  niche: '',
  environment: '',
  sceneryPhotosEnabled: false,
  sceneryPhotos: [],
  colorMode: 'auto',
  ambientColor: '#8B5CF6',
  rimLightColor: '#3B82F6',
  complementaryLightColor: '#F59E0B',
  autoAmbientColor: '#8B5CF6',
  autoRimLightColor: '#3B82F6',
  autoComplementaryLightColor: '#F59E0B',
  autoColorRationale: 'Paleta padrão cinematográfica.',
  framing: 'plano-medio',
  floatingElements: false,
  floatingElementsText: '',
  verticalPosition: 'centralizado',
  autoVerticalPosition: true,
  styleReferences: [],
  referenceAttributes: {},
  referenceNotes: {},
  expression: '',
  expressionCustom: '',
  pose: '',
  poseCustom: '',
  cameraAngle: '',
  cameraAngleCustom: '',
  lens: '',
  lensCustom: '',
  gazeDirection: '',
  gazeDirectionCustom: '',
  sobriety: 50,
  visualStyleEnabled: false,
  visualStyle: '',
  useBlur: false,
  useSideGradient: false,
  additionalPromptEnabled: false,
  additionalPrompt: '',
  freePrompt: '',
  ignoreRest: false,
  negativePrompt: '',
  negativePromptEnabled: false,
};
