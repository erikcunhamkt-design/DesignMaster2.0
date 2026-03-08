import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studios } from '@/data/studios';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';
import { ToolSection } from '@/components/dashboard/ToolSection';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

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
    id: 'criar',
    title: 'Começar a criar',
    studioIds: ['criador', 'prompt-builder', 'extrator', 'galeria'],
  },
  {
    id: 'popular',
    title: 'Mais usados',
    studioIds: ['mockup-studio', 'capas', 'hero-studio'],
  },
  {
    id: 'marketing',
    title: 'Marketing & Conteúdo',
    studioIds: ['capas', 'hero-studio', 'chat', 'markdown'],
  },
  {
    id: 'produtos',
    title: 'Produtos & E-commerce',
    studioIds: ['produtos', 'mockup-studio'],
  },
  {
    id: 'nichos',
    title: 'Nichos Criativos',
    studioIds: ['football-creator', 'auto-creator'],
  },
  {
    id: 'ferramentas',
    title: 'Ferramentas de Imagem',
    studioIds: ['upscale'],
  },
];

// Map section filter to which sections to show
const sectionFilterMap: Record<string, string[]> = {
  home: sections.map((s) => s.id),
  criar: ['criar'],
  marketing: ['marketing'],
  produtos: ['produtos'],
  nichos: ['nichos'],
  ferramentas: ['ferramentas'],
  favoritos: [],
  recentes: [],
};

const FEATURED_STUDIO_ID = 'criador';

export default function StudiosPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const { largeText, lightMode } = useAccessibility();

  const featured = studios.find((s) => s.id === FEATURED_STUDIO_ID)!;

  const studioMap = useMemo(() => {
    const map: Record<string, (typeof studios)[0]> = {};
    studios.forEach((s) => (map[s.id] = s));
    return map;
  }, []);

  const filteredSections = useMemo(() => {
    const allowed = sectionFilterMap[activeSection] || sections.map((s) => s.id);
    return sections
      .filter((s) => allowed.includes(s.id))
      .map((section) => ({
        ...section,
        studios: section.studioIds
          .map((id) => studioMap[id])
          .filter(Boolean)
          .filter((s) =>
            searchQuery
              ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase())
              : true
          ),
      }))
      .filter((s) => s.studios.length > 0);
  }, [activeSection, searchQuery, studioMap]);

  return (
    <div className={cn('flex h-screen w-full bg-background overflow-hidden', largeText && 'accessible-large-text', lightMode && 'accessible-light-mode')}>
      <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto px-8 pb-16">
          {/* Hero section */}
          {activeSection === 'home' && !searchQuery && (
            <div className="relative mt-8 mb-10 animate-fade-up">
              {/* Glow */}
              <div className="absolute -inset-[2px] rounded-[20px] bg-gradient-to-r from-primary/50 via-primary/80 to-accent/50 opacity-60 blur-[3px] animate-pulse pointer-events-none" />
              <div className="absolute -inset-[1px] rounded-[19px] bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

              <button
                onClick={() => navigate(featured.route)}
                className="group relative w-full rounded-2xl overflow-hidden text-left transition-all duration-300 active:scale-[0.998] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 h-[180px] bg-card/60 backdrop-blur-md"
              >
                {/* BG effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-accent/8 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-72 h-36 bg-primary/8 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-all duration-700" />

                <div className="relative flex items-center justify-between h-full px-10">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Ferramenta principal</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/25 shadow-[0_0_8px_hsl(var(--primary)/0.3)]">
                        <Sparkles className="h-2.5 w-2.5" />
                        Destaque
                      </span>
                    </div>
                    <h1 className="text-[28px] font-extrabold text-foreground font-display tracking-tight leading-none mb-2.5 drop-shadow-[0_0_20px_hsl(var(--primary)/0.25)]">
                      {featured.name}
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                      Crie imagens com IA usando controles avançados de estilo, iluminação e composição.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/15 border border-primary/25 px-4 py-2 text-xs font-semibold text-primary group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300">
                      Abrir Criador
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-center w-12 h-12 rounded-full border border-primary/20 bg-primary/10 group-hover:border-primary/40 group-hover:bg-primary/20 group-hover:shadow-glow-sm transition-all duration-300 shrink-0 ml-8">
                    <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Section title when filtered */}
          {activeSection !== 'home' && (
            <div className="mt-8 mb-6 animate-fade-up">
              <h1 className="text-xl font-bold text-foreground font-display tracking-tight capitalize">
                {activeSection === 'favoritos' ? '⭐ Favoritos' : activeSection === 'recentes' ? '🕐 Recentes' : activeSection}
              </h1>
            </div>
          )}

          {/* Favorites / Recents placeholder */}
          {(activeSection === 'favoritos' || activeSection === 'recentes') && (
            <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-border/30 bg-card/20 text-muted-foreground text-sm mt-4">
              {activeSection === 'favoritos' ? 'Nenhuma ferramenta favoritada ainda.' : 'Nenhuma ferramenta usada recentemente.'}
            </div>
          )}

          {/* Netflix sections */}
          <div className={cn(activeSection === 'home' && !searchQuery ? '' : 'mt-2')}>
            {filteredSections.map((section, i) => (
              <div key={section.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <ToolSection
                  title={section.title}
                  studios={section.studios}
                  images={studioImages}
                />
              </div>
            ))}
          </div>

          {/* No results */}
          {searchQuery && filteredSections.length === 0 && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Nenhuma ferramenta encontrada para "{searchQuery}"
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
