export interface TipData {
  title: string;
  bullets: string[];
  example?: string;
}

export const tipsConfig: Record<string, TipData> = {
  'api-key': {
    title: 'Chave da API',
    bullets: [
      'Obtenha sua chave no Google AI Studio.',
      'A chave é armazenada apenas localmente no seu navegador.',
    ],
  },
  'sujeito': {
    title: 'Pose do Sujeito',
    bullets: [
      'Braços cruzados: transmite poder e desafio.',
      'Sorriso: acessível e amigável.',
      'Descreva a pose desejada com detalhes para melhores resultados.',
    ],
    example: 'Ex: "Braços cruzados, olhando para a câmera com expressão confiante"',
  },
  'dimensoes': {
    title: 'Dimensões do Canvas',
    bullets: [
      'Stories (9:16): ideal para Instagram/TikTok Stories.',
      'Feed Quadrado (1:1): posts clássicos de feed.',
      'Feed Retrato (4:5): maximiza espaço no feed do Instagram.',
      'Horizontal (16:9): thumbnails de YouTube e banners.',
    ],
  },
  'texto': {
    title: 'Texto na Imagem',
    bullets: [
      'Textos curtos e impactantes funcionam melhor.',
      'Mantenha o headline com no máximo 5 palavras.',
      'O CTA deve ser direto e claro.',
    ],
    example: 'Ex: Headline "TRANSFORME SEU CORPO", CTA "COMECE AGORA"',
  },
  'projeto-cenario': {
    title: 'Projeto & Cenário',
    bullets: [
      'O nicho define o tom visual (fitness, business, lifestyle…).',
      'Descreva o ambiente para contextualizar a cena.',
      'Ambientes escuros combinam com neon; claros com tons pastel.',
    ],
  },
  'cores': {
    title: 'Direção de Arte & Cor',
    bullets: [
      'Mantenha paleta coerente com o objetivo (corporativo, dramático, neon).',
      'Luz de recorte separa o sujeito do fundo.',
      'Luz complementar adiciona profundidade e drama.',
    ],
  },
  'composicao': {
    title: 'Composição & Olhar',
    bullets: [
      'Espaço negativo: crie respiro e área para texto.',
      'Direção do olhar muda a narrativa.',
      'Posição do sujeito (cima/centro/baixo) altera equilíbrio e espaço livre.',
      'Elementos flutuantes adicionam dinamismo (moedas, faíscas, etc.).',
    ],
  },
  'referencias': {
    title: 'VFX & Referências',
    bullets: [
      'Adicione referências visuais para efeitos especiais (vidro, fumaça, chuva).',
      'Descreva o que extrair de cada imagem.',
      'Evite misturar muitos efeitos de uma vez.',
    ],
  },
  'estilo-visual': {
    title: 'Enquadramento & Estilo',
    bullets: [
      'Waist up: bom para presença e clareza.',
      'Close-up: emoção e detalhes faciais.',
      'All body: ideal para destacar pose e roupa.',
      'Macro destaca detalhes e intensifica expressão.',
    ],
  },
};
