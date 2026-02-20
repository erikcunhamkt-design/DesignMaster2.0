// ── Football Creator Config Types ──────────────────────────────────────────

export interface FootballConfig {
  // Sujeito
  subjectType: 'jogador_unico' | 'dois_jogadores' | 'time_completo' | 'sem_pessoas';
  subjectPhotos: string[];
  subjectPosition: 'esquerda' | 'centro' | 'direita' | 'zoom_dramatico';

  // Dimensões
  dimension: 'stories' | 'horizontal' | 'feed-quadrado' | 'feed-retrato' | null;

  // Estilo Visual
  visualStyle: 'matchday' | 'pre_jogo' | 'pos_jogo' | 'jogador_destaque' | 'final_decisao' | '';
  intensity: number; // 0 = Clean, 100 = Explosivo

  // Clima da Partida (Character Direction adapted)
  matchMood: 'epico' | 'tenso' | 'vitoria' | 'rivalidade' | 'profissional_clean' | '';

  // Composição / Framing
  framing: 'closeup' | 'plano-medio' | 'plano-americano';
  verticalPosition: 'cima' | 'centralizado' | 'baixo';

  // Texto
  textEnabled: boolean;
  textMode: 'camada' | 'imagem';
  text01: string;
  text02: string;
  cta: string;

  // Cores & Iluminação
  colorMode: 'auto' | 'manual' | 'time';
  primaryTeamColor: string;
  secondaryTeamColor: string;
  ambientColor: string;
  rimLightColor: string;

  // Avançado
  sobriety: number; // repurposed as VFX intensity (low = clean, high = explosive)
  useBlur: boolean;
  useSideGradient: boolean;
  useGrain: boolean;
  useGlow: boolean;
  niche: string;
  environment: string;
  additionalPromptEnabled: boolean;
  additionalPrompt: string;

  // Prompt Livre
  freePrompt: string;
  ignoreRest: boolean;

  // Referências
  styleReferences: string[];
}

export const defaultFootballConfig: FootballConfig = {
  subjectType: 'jogador_unico',
  subjectPhotos: [],
  subjectPosition: 'centro',
  dimension: null,
  visualStyle: '',
  intensity: 70,
  matchMood: '',
  framing: 'plano-medio',
  verticalPosition: 'centralizado',
  textEnabled: false,
  textMode: 'camada',
  text01: '',
  text02: '',
  cta: '',
  colorMode: 'auto',
  primaryTeamColor: '#1a6b2e',
  secondaryTeamColor: '#ffffff',
  ambientColor: '#1a3a6b',
  rimLightColor: '#00ff88',
  sobriety: 70,
  useBlur: false,
  useSideGradient: true,
  useGrain: true,
  useGlow: true,
  niche: 'futebol profissional',
  environment: '',
  additionalPromptEnabled: false,
  additionalPrompt: '',
  freePrompt: '',
  ignoreRest: false,
  styleReferences: [],
};
