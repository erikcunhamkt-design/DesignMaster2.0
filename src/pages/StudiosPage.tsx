import { studios } from '@/data/studios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { HeroCard } from '@/components/dashboard/HeroCard';
import { ToolSection } from '@/components/dashboard/ToolSection';
import { ToolCard } from '@/components/dashboard/ToolCard';
import { useAccessibility } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

// Import hero images
import extratorHero from '@/assets/extrator-hero.png';
import promptBuilderHero from '@/assets/prompt-builder-hero.png';
import upscaleHero from '@/assets/upscale-hero.png';
import markdownHero from '@/assets/markdown-hero.png';
import produtosHero from '@/assets/produtos-hero.png';
import capasHero from '@/assets/capas-hero.png';
import galeriaHero from '@/assets/galeria-hero.png';
import chatHero from '@/assets/chat-hero.png';
import footballCreatorHero from '@/assets/football-creator-hero.png';
import autoCreatorHero from '@/assets/auto-creator-hero.png';
import heroStudioHero from '@/assets/hero-studio-hero.png';
import mockupStudioHero from '@/assets/mockup-studio-hero.png';

const studioImages: Record<string, string> = {
  extrator: extratorHero,
  'prompt-builder': promptBuilderHero,
  upscale: upscaleHero,
  markdown: markdownHero,
  produtos: produtosHero,
  capas: capasHero,
  galeria: galeriaHero,
  chat: chatHero,
  'football-creator': footballCreatorHero,
  'auto-creator': autoCreatorHero,
  'hero-studio': heroStudioHero,
  'mockup-studio': mockupStudioHero,
};

// Section definitions with studio IDs
const sections = [
  {
    title: '🚀 Start Creating',
    ids: ['criador', 'prompt-builder', 'extrator', 'galeria'],
  },
  {
    title: '🔥 Most Used',
    ids: ['mockup-studio', 'capas', 'hero-studio'],
  },
  {
    title: '📢 Marketing & Content',
    ids: ['capas', 'hero-studio', 'chat', 'markdown'],
  },
  {
    title: '🛍️ Products & Ecommerce',
    ids: ['produtos', 'mockup-studio'],
  },
  {
    title: '🎯 Creative Niches',
    ids: ['football-creator', 'auto-creator'],
  },
  {
    title: '🛠️ Image Tools',
    ids: ['upscale'],
  },
];

export default function StudiosPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const { largeText, lightMode } = useAccessibility();

  const studioMap = new Map(studios.map((s) => [s.id, s]));

  const navigateToStudio = (id: string) => {
    const studio = studioMap.get(id);
    if (studio) navigate(studio.route);
  };

  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-background', largeText && 'accessible-large-text', lightMode && 'accessible-light-mode')}>
      <DashboardSidebar activeSection={activeSection} onNavigate={setActiveSection} />

      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar />

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-10">
            {/* Hero */}
            <HeroCard onOpen={() => navigate('/studio/criador')} />

            {/* Netflix-style sections */}
            {sections.map((section) => (
              <ToolSection key={section.title} title={section.title}>
                {section.ids.map((id) => {
                  const studio = studioMap.get(id);
                  if (!studio) return null;
                  return (
                    <ToolCard
                      key={`${section.title}-${id}`}
                      name={studio.name}
                      description={studio.description}
                      icon={studio.icon}
                      gradient={studio.gradient}
                      image={studioImages[studio.id]}
                      onClick={() => navigateToStudio(id)}
                    />
                  );
                })}
              </ToolSection>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
