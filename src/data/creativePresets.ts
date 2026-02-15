import { ProjectConfig } from '@/types/project';

export interface CreativePreset {
  id: string;
  name: string;
  emoji: string;
  values: Partial<ProjectConfig>;
}

export const creativePresets: CreativePreset[] = [
  {
    id: 'editorial-luxury',
    name: 'Editorial Luxury',
    emoji: '💎',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Elegante',
      sobriety: 85,
      framing: 'plano-medio',
      useBlur: true,
      useSideGradient: false,
      colorMode: 'auto',
      niche: 'Moda',
    },
  },
  {
    id: 'social-ad-pro',
    name: 'Social Ad Pro',
    emoji: '📱',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Infoproduto',
      sobriety: 50,
      dimension: 'stories',
      textEnabled: true,
      colorMode: 'auto',
      niche: 'Social Media',
    },
  },
  {
    id: 'netflix-poster',
    name: 'Netflix Poster',
    emoji: '🎬',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Ultra Realista',
      sobriety: 75,
      framing: 'closeup',
      useBlur: true,
      useSideGradient: true,
      colorMode: 'auto',
      dimension: 'feed-retrato',
    },
  },
  {
    id: 'fitness-hero',
    name: 'Fitness Hero',
    emoji: '💪',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Glow',
      sobriety: 40,
      framing: 'plano-americano',
      useBlur: false,
      colorMode: 'auto',
      niche: 'Fitness',
    },
  },
  {
    id: 'cyber-cinematic',
    name: 'Cyber Cinematic',
    emoji: '🌃',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Tecnológico',
      sobriety: 65,
      framing: 'plano-medio',
      useBlur: true,
      useSideGradient: true,
      colorMode: 'auto',
      niche: 'Gamer',
    },
  },
];
