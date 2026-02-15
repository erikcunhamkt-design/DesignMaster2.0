export interface PromptTemplate {
  id: string;
  title: string;
  tags: string[];
  prompt: string;
  category: string;
  imageUrl?: string;
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

// Start empty — admin adds prompts manually
export const promptTemplates: PromptTemplate[] = [];
