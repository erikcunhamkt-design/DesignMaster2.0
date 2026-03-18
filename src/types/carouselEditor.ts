export interface SlideTextBlock {
  id: string;
  content: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  x: number;
  y: number;
  width: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface SlideData {
  id: string;
  order: number;
  blocks: [SlideTextBlock, SlideTextBlock];
  backgroundImage: string | null;
  backgroundColor: string;
}

export interface CarouselProject {
  slides: SlideData[];
  palette: string[];
  fontFamily: string;
  globalFontSize: number;
}

export const DEFAULT_PALETTE = ['#0D9488', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#FFFFFF', '#000000'];

export const FONT_OPTIONS = [
  'Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Oswald', 'Bebas Neue', 'Raleway', 'Roboto'
];

export function createDefaultSlide(order: number): SlideData {
  return {
    id: crypto.randomUUID(),
    order,
    blocks: [
      {
        id: crypto.randomUUID(),
        content: `Título do Slide ${order + 1}`,
        fontSize: 48,
        fontWeight: 700,
        letterSpacing: -0.5,
        lineHeight: 1.1,
        color: '#FFFFFF',
        x: 60,
        y: 120,
        width: 960,
        textAlign: 'left',
      },
      {
        id: crypto.randomUUID(),
        content: `Subtítulo ou descrição do slide ${order + 1}. Edite este texto.`,
        fontSize: 24,
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.4,
        color: '#CCCCCC',
        x: 60,
        y: 300,
        width: 960,
        textAlign: 'left',
      },
    ],
    backgroundImage: null,
    backgroundColor: '#1a1a2e',
  };
}

export function createDefaultProject(): CarouselProject {
  return {
    slides: Array.from({ length: 5 }, (_, i) => createDefaultSlide(i)),
    palette: [...DEFAULT_PALETTE],
    fontFamily: 'Inter',
    globalFontSize: 100,
  };
}
