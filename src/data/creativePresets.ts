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
    emoji: '✨',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Elegante',
      sobriety: 80,
      useBlur: true,
      useSideGradient: false,
      framing: 'plano-medio',
      colorMode: 'auto',
    },
  },
  {
    id: 'social-ad-pro',
    name: 'Social Ad Pro',
    emoji: '📱',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Infoproduto',
      sobriety: 60,
      useBlur: false,
      useSideGradient: true,
      dimension: 'stories',
      colorMode: 'auto',
    },
  },
  {
    id: 'netflix-poster',
    name: 'Netflix Poster',
    emoji: '🎬',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Ultra Realista',
      sobriety: 70,
      useBlur: true,
      useSideGradient: true,
      framing: 'plano-americano',
      colorMode: 'auto',
    },
  },
  {
    id: 'fitness-hero',
    name: 'Fitness Hero',
    emoji: '💪',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Jovial',
      sobriety: 40,
      useBlur: false,
      useSideGradient: false,
      niche: 'Fitness',
      colorMode: 'auto',
    },
  },
  {
    id: 'cyber-cinematic',
    name: 'Cyber Cinematic',
    emoji: '🌐',
    values: {
      visualStyleEnabled: true,
      visualStyle: 'Tecnológico',
      sobriety: 50,
      useBlur: true,
      useSideGradient: true,
      colorMode: 'auto',
    },
  },
];
