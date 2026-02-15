export interface PromptTemplate {
  id: string;
  title: string;
  tags: string[];
  prompt: string;
  category: string;
}

export interface GalleryCategory {
  id: string;
  label: string;
  emoji: string;
}

export const galleryCategories: GalleryCategory[] = [
  { id: 'editorial', label: 'Editorial', emoji: '📰' },
  { id: 'ecommerce', label: 'E-commerce', emoji: '🛍️' },
  { id: 'social', label: 'Social Media', emoji: '📱' },
  { id: 'branding', label: 'Branding', emoji: '✨' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬' },
];

export const promptTemplates: PromptTemplate[] = [
  {
    id: '1',
    title: 'Editorial Luxo Minimalista',
    tags: ['editorial', 'luxo', 'minimalista'],
    category: 'editorial',
    prompt: 'High-end editorial fashion photography, minimalist composition, single subject centered, soft directional lighting from upper left, muted earth tones, shallow depth of field, clean negative space for typography, 4:5 portrait ratio, ultra realistic skin texture, magazine cover quality',
  },
  {
    id: '2',
    title: 'Produto Flutuante Premium',
    tags: ['produto', 'floating', 'premium'],
    category: 'ecommerce',
    prompt: 'Floating product shot, dramatic studio lighting with three-point setup, deep black background, controlled reflections, rim light in warm gold, product centered and slightly tilted, clean composition, packshot quality, ultra sharp focus, 1:1 square ratio',
  },
  {
    id: '3',
    title: 'Stories Neon Urbano',
    tags: ['stories', 'neon', 'urbano'],
    category: 'social',
    prompt: '9:16 vertical stories format, urban night scene, neon lighting in cyan and magenta, wet street reflections, subject in foreground with confident pose, cinematic depth, bokeh city lights background, moody atmospheric haze, high contrast',
  },
  {
    id: '4',
    title: 'Branding Corporativo Clean',
    tags: ['branding', 'corporativo', 'clean'],
    category: 'branding',
    prompt: 'Professional corporate portrait, clean neutral studio backdrop, balanced warm lighting, subject in business attire, confident approachable expression, sharp focus on eyes, subtle gradient background, clean space for logo overlay, trustworthy and modern feel',
  },
  {
    id: '5',
    title: 'Cinematic Poster Dramático',
    tags: ['cinematic', 'poster', 'dramático'],
    category: 'cinematic',
    prompt: 'Cinematic movie poster composition, dramatic chiaroscuro lighting, hero subject positioned in lower third, epic sky or environment filling upper portion, volumetric light rays, film grain subtle, anamorphic lens flare, 2:3 portrait ratio, high contrast color grading',
  },
  {
    id: '6',
    title: 'Feed Carousel Lifestyle',
    tags: ['feed', 'lifestyle', 'carrossel'],
    category: 'social',
    prompt: '1:1 square format, lifestyle photography, natural warm golden hour lighting, authentic candid feel, subject interacting with environment, soft bokeh background, warm color palette with earth tones, clean composition with rule of thirds, aspirational yet relatable',
  },
  {
    id: '7',
    title: 'Tech Product Launch',
    tags: ['tech', 'launch', 'futuristic'],
    category: 'ecommerce',
    prompt: 'Futuristic technology product reveal, dark metallic environment, holographic accent lights in cyan, product hero shot with dramatic angle, reflection on glossy surface, particle effects subtle, ultra clean composition, Apple-inspired minimalism, 16:9 horizontal',
  },
  {
    id: '8',
    title: 'Editorial Moda Avant-Garde',
    tags: ['moda', 'avant-garde', 'editorial'],
    category: 'editorial',
    prompt: 'Avant-garde fashion editorial, unconventional composition with asymmetric framing, bold color blocking, dramatic shadows, high fashion pose, experimental lighting with colored gels, artistic and provocative mood, gallery quality, 4:5 portrait ratio',
  },
  {
    id: '9',
    title: 'Capa Impacto Animal',
    tags: ['capa', 'animal', 'impacto'],
    category: 'cinematic',
    prompt: 'Magnetic cover with majestic lion, epic composition, golden hour backlight, detailed fur texture strand by strand, powerful gaze directed at camera, dramatic sky backdrop, warm amber and deep shadow contrast, text-safe area in upper third, ultra realistic 8K',
  },
  {
    id: '10',
    title: 'Food Photography Gourmet',
    tags: ['food', 'gourmet', 'gastronomia'],
    category: 'ecommerce',
    prompt: 'Gourmet food photography, overhead 45-degree angle, natural window light with subtle fill, artisan rustic surface, fresh ingredients scattered as props, steam or motion frozen, rich saturated colors, shallow depth of field, editorial quality, 1:1 square',
  },
];
