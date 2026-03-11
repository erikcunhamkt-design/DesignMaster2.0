import { Wand2, Scissors, PenTool, ArrowUpCircle, FileText, ShoppingBag, Sparkles, BookOpen } from 'lucide-react';

export interface Studio {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  image?: string;
  route: string;
  gradient: string;
  isNew?: boolean;
}

export const studios: Studio[] = [
  {
    id: 'criador',
    name: 'DESIGN MASTER',
    tagline: 'Seu canvas de criação',
    description: 'Área principal para gerar imagens com controles avançados de composição, iluminação e estilo.',
    icon: '🎨',
    route: '/studio/criador',
    gradient: 'from-primary/20 to-accent/10',
  },
  {
    id: 'extrator',
    name: 'Extrator de Prompts',
    tagline: 'Extraia prompts de imagens com IA.',
    description: 'Extraia, limpe e organize prompts a partir de imagens existentes.',
    icon: '🔬',
    route: '/studio/extrator',
    gradient: 'from-blue-500/15 to-cyan-500/10',
  },
  {
    id: 'prompt-builder',
    name: 'Arquiteto de Prompts',
    tagline: 'Crie prompts poderosos com IA.',
    description: 'Monte prompts guiados com presets, estrutura e IA para resultados perfeitos.',
    icon: '✍️',
    route: '/studio/prompt-builder',
    gradient: 'from-violet-500/15 to-purple-500/10',
  },
  {
    id: 'upscale',
    name: 'Ultra Upscale',
    tagline: 'Ampliação de imagem com qualidade máxima.',
    description: 'Restauração e upscale inteligente com preservação total da identidade visual.',
    icon: '🔍',
    route: '/studio/upscale',
    gradient: 'from-amber-500/15 to-orange-500/10',
  },
  {
    id: 'markdown',
    name: 'Estúdio Markdown',
    tagline: 'Transforme prompts em templates organizados.',
    description: 'Gere prompts prontos em formato Markdown com blocos, presets e variações.',
    icon: '📝',
    route: '/studio/markdown',
    gradient: 'from-emerald-500/15 to-teal-500/10',
  },
  {
    id: 'produtos',
    name: 'Produto Lendário',
    tagline: 'Transforme ou crie qualquer produto em uma imagem de alto impacto.',
    description: 'Bot especialista em fotografia de produtos com iluminação de estúdio e acabamento premium.',
    icon: '📦',
    route: '/studio/produtos',
    gradient: 'from-rose-500/15 to-pink-500/10',
  },
  {
    id: 'capas',
    name: 'Animais Fantásticos',
    tagline: 'Crie imagens com animais em alta resolução.',
    description: 'Capas magnéticas com animais, personagens e elementos gráficos — sem pessoa real.',
    icon: '🦁',
    route: '/studio/capas',
    gradient: 'from-yellow-500/15 to-amber-500/10',
  },
  {
    id: 'galeria',
    name: 'Galeria de Ideias',
    tagline: 'Inspiração infinita',
    description: 'Biblioteca de ideias, templates e coleções de prompts prontos para usar.',
    icon: '💡',
    route: '/studio/galeria',
    gradient: 'from-sky-500/15 to-indigo-500/10',
  },
  {
    id: 'chat',
    name: 'Creator Master',
    tagline: 'Seu mentor de elite em design',
    description: 'Chat especialista em design, viralização, calendário de conteúdo e ideias magnéticas para Instagram.',
    icon: '🧠',
    route: '/studio/chat',
    gradient: 'from-fuchsia-500/15 to-pink-500/10',
  },
  {
    id: 'football-creator',
    name: 'Clube das Lendas',
    tagline: 'Crie artes épicas para futebol e esportes.',
    description: 'Crie artes de futebol profissionais com IA — matchday, jogador destaque, flyers esportivos e muito mais.',
    icon: '🏟️',
    route: '/studio/football-creator',
    gradient: 'from-emerald-500/15 to-green-600/10',
  },
  {
    id: 'auto-creator',
    name: 'Velozes & Imortais',
    tagline: 'Crie imagens automotivas de alta performance',
    description: 'Crie artes automotivas profissionais com IA — race day, drift, trackday, supercar e muito mais.',
    icon: '🏎️',
    route: '/studio/auto-creator',
    gradient: 'from-red-500/15 to-orange-500/10',
  },
  {
    id: 'hero-studio',
    name: 'Liga dos Heróis',
    tagline: 'Crie imagens hero para páginas de alta conversão.',
    description: 'Crie hero sections premium para landing pages e sites SaaS — sem escrever prompt, resultado comparável às melhores marcas do mundo.',
    icon: '🖥️',
    route: '/studio/hero-studio',
    gradient: 'from-blue-500/15 to-indigo-500/10',
  },
  {
    id: 'mockup-studio',
    name: 'Laboratório de Mockups',
    tagline: 'Gere apresentações profissionais para seus designs.',
    description: 'Gere mockups realistas de produtos, embalagens, dispositivos e branding sem escrever uma linha de prompt.',
    icon: '📦',
    route: '/studio/mockup-studio',
    gradient: 'from-violet-500/15 to-purple-500/10',
  },
];
