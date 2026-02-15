export interface DirectionGroup {
  key: string;
  label: string;
  chips: string[];
  placeholder: string;
  tooltip?: string;
}

export const directionGroups: DirectionGroup[] = [
  {
    key: 'expression',
    label: 'Expressão',
    chips: ['Sorrindo', 'Sério', 'Neutro', 'Confiante', 'Bravo', 'Pensativo', 'Determinado'],
    placeholder: 'Ex: olhar penetrante, sorriso sutil...',
    tooltip: 'Define a emoção do personagem na imagem.',
  },
  {
    key: 'pose',
    label: 'Pose',
    chips: ['Braços cruzados', 'Mãos no bolso', 'Sentado', 'Andando', 'Pose heroica', 'Apoiado', 'De costas'],
    placeholder: 'Ex: segurando um produto, apontando...',
    tooltip: 'A linguagem corporal influencia a mensagem visual.',
  },
  {
    key: 'cameraAngle',
    label: 'Ângulo',
    chips: ['Frontal', '3/4', 'Perfil', 'Low angle', 'High angle', 'Dutch angle'],
    placeholder: 'Ex: ligeiramente de lado...',
    tooltip: 'Low angle transmite poder; high angle, vulnerabilidade.',
  },
  {
    key: 'lens',
    label: 'Lente',
    chips: ['24mm', '35mm', '50mm', '85mm', '135mm'],
    placeholder: 'Ex: lente macro, fish-eye...',
    tooltip: '85mm = retrato natural. 24mm = dramático e expansivo.',
  },
  {
    key: 'gazeDirection',
    label: 'Olhar',
    chips: ['Para câmera', 'Esquerda', 'Direita', 'Para cima', 'Para baixo', 'Distante'],
    placeholder: 'Ex: olhando para o produto...',
    tooltip: 'Olhar para câmera cria conexão direta com o espectador.',
  },
];

export interface DirectionPreset {
  name: string;
  description: string;
  values: Record<string, string>;
}

export const directionPresets: DirectionPreset[] = [
  {
    name: 'Retrato Premium',
    description: '85mm + 3/4 + olhar câmera + neutro',
    values: { expression: 'Neutro', pose: '', cameraAngle: '3/4', lens: '85mm', gazeDirection: 'Para câmera' },
  },
  {
    name: 'Capa de Filme',
    description: '35mm + low angle + sério + heroico',
    values: { expression: 'Sério', pose: 'Pose heroica', cameraAngle: 'Low angle', lens: '35mm', gazeDirection: 'Distante' },
  },
  {
    name: 'Foto Corporativa',
    description: '50mm + frontal + sorriso + confiante',
    values: { expression: 'Sorrindo', pose: 'Braços cruzados', cameraAngle: 'Frontal', lens: '50mm', gazeDirection: 'Para câmera' },
  },
  {
    name: 'Lifestyle Dinâmico',
    description: '35mm + andando + confiante + 3/4',
    values: { expression: 'Confiante', pose: 'Andando', cameraAngle: '3/4', lens: '35mm', gazeDirection: 'Esquerda' },
  },
];

export const smartTips: Record<string, string> = {
  expression: 'Dica: "Neutro" ou "Confiante" funcionam melhor para anúncios premium.',
  pose: 'Dica: "Braços cruzados" transmite autoridade. "Mãos no bolso" transmite casualidade.',
  cameraAngle: 'Dica: Para retrato premium use 3/4. Para impacto e poder use Low angle.',
  lens: 'Dica: 85mm é a lente clássica de retrato. 35mm para contexto ambiental.',
  gazeDirection: 'Dica: Olhar para a câmera cria conexão. Olhar para o lado cria mistério.',
};
