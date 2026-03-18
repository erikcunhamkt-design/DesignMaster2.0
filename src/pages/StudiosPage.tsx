import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studios } from '@/data/studios';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';
import { ToolSection } from '@/components/dashboard/ToolSection';
import { ToolCard } from '@/components/dashboard/ToolCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentTools } from '@/hooks/useRecentTools';
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
import carouselMasterHero from '@/assets/carousel-master-hero.png';
import restorePhotoHero from '@/assets/restore-photo-hero.png';
import editorialHero from '@/assets/editorial-hero.png';
import calendarHero from '@/assets/calendar-hero.png';
import bioHero from '@/assets/bio-hero.png';
import communityChatHero from '@/assets/community-chat-hero.png';
import portraitStudioHero from '@/assets/portrait-studio-hero.png';
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
  'carousel-master': carouselMasterHero,
  'restore-photo': restorePhotoHero,
  'editorial': editorialHero,
  'calendar': calendarHero,
  'bio': bioHero,
  'community-chat': communityChatHero,
  'portrait-studio': portraitStudioHero,
};

const sections = [
{ id: 'image-creators', title: 'Geradores Especializados', studioIds: ['capas', 'hero-studio', 'produtos', 'mockup-studio', 'football-creator', 'auto-creator', 'portrait-studio'] },
{ id: 'creative-assistant', title: 'Agentes de IA ', studioIds: ['chat', 'carousel-master', 'editorial', 'calendar', 'bio'] },
{ id: 'prompt-tools', title: 'Laboratório de Prompts', studioIds: ['prompt-builder', 'extrator', 'markdown'] },
{ id: 'image-tools', title: 'Ferramentas de Imagem', studioIds: ['upscale', 'restore-photo'] },
{ id: 'social', title: 'Social', studioIds: ['community-chat'] }];


const sectionFilterMap: Record<string, string[]> = {
  home: sections.map((s) => s.id),
  'image-creators': ['image-creators'],
  'creative-assistant': ['creative-assistant'],
  'prompt-tools': ['prompt-tools'],
  'image-tools': ['image-tools'],
  'social': ['social'],
  favoritos: [],
  recentes: []
};

const FEATURED_STUDIO_ID = 'criador';

export default function StudiosPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const { largeText, lightMode } = useAccessibility();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const { recents, trackUsage } = useRecentTools();

  const featured = studios.find((s) => s.id === FEATURED_STUDIO_ID)!;

  // Navigate to studio and track usage
  const navigateToStudio = useCallback((route: string, studioId: string) => {
    trackUsage(studioId);
    navigate(route);
  }, [navigate, trackUsage]);

  // Recent studios resolved from IDs
  const recentStudios = useMemo(() => {
    return recents.map((id) => studios.find((s) => s.id === id)).filter(Boolean) as typeof studios;
  }, [recents]);

  const studioMap = useMemo(() => {
    const map: Record<string, (typeof studios)[0]> = {};
    studios.forEach((s) => map[s.id] = s);
    return map;
  }, []);

  // Studios that are favorited
  const favoriteStudios = useMemo(() => {
    return studios.filter((s) => favorites.has(s.id));
  }, [favorites]);

  const filteredSections = useMemo(() => {
    const allowed = sectionFilterMap[activeSection] || sections.map((s) => s.id);
    return sections.
    filter((s) => allowed.includes(s.id)).
    map((section) => ({
      ...section,
      studios: section.studioIds.
      map((id) => studioMap[id]).
      filter(Boolean).
      filter((s) =>
      searchQuery ?
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) :
      true
      )
    })).
    filter((s) => s.studios.length > 0);
  }, [activeSection, searchQuery, studioMap]);

  return (
    <div className={cn('flex h-screen w-full bg-background overflow-hidden', largeText && 'accessible-large-text', lightMode && 'accessible-light-mode')}>
      <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-16">
          {/* Hero section */}
          {activeSection === 'home' && !searchQuery && (
            <div className="relative mt-6 md:mt-8 mb-8 md:mb-10 animate-fade-up">
              <div className="absolute -inset-[2px] rounded-[20px] bg-gradient-to-r from-primary/50 via-primary/80 to-accent/50 opacity-60 blur-[3px] animate-pulse pointer-events-none" />
              <div className="absolute -inset-[1px] rounded-[19px] bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

              <button
                onClick={() => navigateToStudio(featured.route, featured.id)}
                className="group relative w-full rounded-2xl overflow-hidden text-left transition-all duration-300 active:scale-[0.998] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 min-h-[160px] md:h-[180px] bg-card/60 backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-accent/8 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-72 h-36 bg-primary/8 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-all duration-700" />

                <div className="relative flex items-center justify-between h-full px-5 md:px-10 py-5 md:py-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Ferramenta principal</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] font-bold text-primary border border-primary/25 shadow-[0_0_8px_hsl(var(--primary)/0.3)]">
                        <Sparkles className="h-2 w-2 md:h-2.5 md:w-2.5" />
                        Destaque
                      </span>
                    </div>
                    <h1 className="text-xl md:text-[28px] font-extrabold text-foreground font-display tracking-tight leading-none mb-2 md:mb-2.5 drop-shadow-[0_0_20px_hsl(var(--primary)/0.25)]">
                      {featured.name}
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-lg leading-relaxed line-clamp-2 md:line-clamp-none">
                      Crie imagens com IA usando controles avançados de estilo, iluminação e composição.
                    </p>
                    <div className="mt-3 md:mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/15 border border-primary/25 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold text-primary group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300">
                      Abrir o Design Master
                      <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-primary/20 bg-primary/10 group-hover:border-primary/40 group-hover:bg-primary/20 group-hover:shadow-glow-sm transition-all duration-300 shrink-0 ml-8">
                    <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Section title when filtered */}
          {activeSection !== 'home' && (
            <div className="mt-6 md:mt-8 mb-4 md:mb-6 animate-fade-up">
              <h1 className="text-lg md:text-xl font-bold text-foreground font-display tracking-tight capitalize">
                {activeSection === 'favoritos' ? '⭐ Favoritos' : activeSection === 'recentes' ? '🕐 Recentes' : activeSection}
              </h1>
            </div>
          )}

          {/* Favorites section */}
          {activeSection === 'favoritos' && (
            favoriteStudios.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4 animate-fade-up">
                {favoriteStudios.map((s) => (
                  <ToolCard
                    key={s.id}
                    studio={s}
                    image={studioImages[s.id]}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-border/30 bg-card/20 text-muted-foreground text-xs md:text-sm mt-4 px-4 text-center">
                Nenhuma ferramenta favoritada ainda. Clique na ⭐ em qualquer card para favoritar.
              </div>
            )
          )}

          {/* Recents section */}
          {activeSection === 'recentes' && (
            recentStudios.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4 animate-fade-up">
                {recentStudios.map((s) => (
                  <ToolCard
                    key={s.id}
                    studio={s}
                    image={studioImages[s.id]}
                    isFavorite={isFavorite(s.id)}
                    onToggleFavorite={toggleFavorite}
                    onNavigate={navigateToStudio}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-border/30 bg-card/20 text-muted-foreground text-xs md:text-sm mt-4 px-4 text-center">
                Nenhuma ferramenta usada recentemente. Comece usando qualquer ferramenta!
              </div>
            )
          )}

          {/* Netflix sections */}
          {activeSection !== 'favoritos' && activeSection !== 'recentes' && (
            <div className={cn(activeSection === 'home' && !searchQuery ? '' : 'mt-2')}>
              {filteredSections.map((section, i) => (
                <div key={section.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <ToolSection
                    title={section.title}
                    studios={section.studios}
                    images={studioImages}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    onNavigate={navigateToStudio}
                  />
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {searchQuery && filteredSections.length === 0 && activeSection !== 'favoritos' && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Nenhuma ferramenta encontrada para "{searchQuery}"
            </div>
          )}
        </main>
      </div>
    </div>
  );
}