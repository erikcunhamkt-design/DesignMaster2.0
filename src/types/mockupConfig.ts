export type MockupType =
  | 'produto_fisico'
  | 'embalagem'
  | 'dispositivo'
  | 'papelaria'
  | 'social_media'
  | 'branding';

export type MockupObject =
  | 'caixa_embalagem'
  | 'garrafa_lata'
  | 'camiseta_vestuario'
  | 'smartphone_tela'
  | 'livro_revista'
  | 'produto_generico'
  | 'notebook_tablet'
  | 'caneca_copo'
  | 'sacola_bag';

export type MockupScene =
  | 'estudio_clean'
  | 'mesa_trabalho'
  | 'ambiente_urbano'
  | 'lifestyle'
  | 'fundo_neutro'
  | 'fundo_escuro_premium';

export type MockupAngle =
  | 'frente'
  | 'tres_quartos'
  | 'superior'
  | 'close'
  | 'flat_lay';

export type MockupLighting =
  | 'estudio_profissional'
  | 'luz_suave'
  | 'luz_dramatica'
  | 'luz_natural'
  | 'contraste_alto';

export type MockupDimension =
  | 'stories'
  | 'horizontal'
  | 'feed-quadrado'
  | 'feed-retrato'
  | 'apresentacao';

export interface MockupConfig {
  // Type
  mockupType: MockupType;
  mockupObject: MockupObject;

  // Upload (brand art / design)
  designPhotos: string[];

  // Scene & angle
  scene: MockupScene;
  angle: MockupAngle;

  // Lighting
  lighting: MockupLighting;

  // Realism
  realism: number; // 0-100: clean → ultra realista

  // VFX
  useShadows: boolean;
  useReflections: boolean;
  useGrain: boolean;
  useDepthOfField: boolean;

  // Text
  textEnabled: boolean;
  text01: string;
  text02: string;
  verticalPosition: 'cima' | 'centralizado' | 'baixo';

  // Format
  dimension: MockupDimension | null;

  // Advanced
  additionalPrompt: string;

  // Prompt Livre
  freePrompt: string;
  ignoreRest: boolean;

  // Prompt Negativo
  negativePrompt: string;
  negativePromptEnabled: boolean;
}

export const defaultMockupConfig: MockupConfig = {
  mockupType: 'produto_fisico',
  mockupObject: 'caixa_embalagem',
  designPhotos: [],
  scene: 'estudio_clean',
  angle: 'tres_quartos',
  lighting: 'estudio_profissional',
  realism: 75,
  useShadows: true,
  useReflections: true,
  useGrain: false,
  useDepthOfField: true,
  textEnabled: false,
  text01: '',
  text02: '',
  verticalPosition: 'baixo',
  dimension: null,
  additionalPrompt: '',
  freePrompt: '',
  ignoreRest: false,
  negativePrompt: '',
  negativePromptEnabled: false,
};
