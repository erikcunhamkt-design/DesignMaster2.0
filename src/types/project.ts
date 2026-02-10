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

  // Projeto & Cenário
  niche: string;
  environment: string;
  sceneryPhotosEnabled: boolean;
  sceneryPhotos: string[];

  // Cores & Iluminação
  ambientColor: string;
  rimLightColor: string;
  complementaryLightColor: string;

  // Composição
  framing: 'closeup' | 'plano-medio' | 'plano-americano';
  floatingElements: boolean;
  floatingElementsText: string;
  verticalPosition: 'cima' | 'centralizado' | 'baixo';

  // Referências
  styleReferences: string[];

  // Atributos Visuais
  sobriety: number;
  visualStyleEnabled: boolean;
  visualStyle: string;
  useBlur: boolean;
  useSideGradient: boolean;
  additionalPromptEnabled: boolean;
  additionalPrompt: string;
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
  niche: '',
  environment: '',
  sceneryPhotosEnabled: false,
  sceneryPhotos: [],
  ambientColor: '#8B5CF6',
  rimLightColor: '#3B82F6',
  complementaryLightColor: '#F59E0B',
  framing: 'plano-medio',
  floatingElements: false,
  floatingElementsText: '',
  verticalPosition: 'centralizado',
  styleReferences: [],
  sobriety: 50,
  visualStyleEnabled: false,
  visualStyle: '',
  useBlur: false,
  useSideGradient: false,
  additionalPromptEnabled: false,
  additionalPrompt: '',
};
