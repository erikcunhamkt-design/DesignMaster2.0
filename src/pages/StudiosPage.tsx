import { studios } from '@/data/studios';
import logoImg from '@/assets/logo.png';
import heroBg from '@/assets/hero-bg.jpg';
import criadorHero from '@/assets/criador-hero.png';
import extratorHero from '@/assets/extrator-hero.png';
import promptBuilderHero from '@/assets/prompt-builder-hero.png';
import upscaleHero from '@/assets/upscale-hero.png';
import markdownHero from '@/assets/markdown-hero.png';
import produtosHero from '@/assets/produtos-hero.png';
import capasHero from '@/assets/capas-hero.png';
import galeriaHero from '@/assets/galeria-hero.png';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const studioImages: Record<string, string> = {
  extrator: extratorHero,
  'prompt-builder': promptBuilderHero,
  upscale: upscaleHero,
  markdown: markdownHero,
  produtos: produtosHero,
  capas: capasHero,
  galeria: galeriaHero,
};

const FEATURED_STUDIO_ID = 'criador';

export default function StudiosPage() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const featured = studios.find(s => s.id === FEATURED_STUDIO_ID)!;
  const rest = studios.filter(s => s.id !== FEATURED_STUDIO_ID);

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Hero background image */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-20"
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/60" />
      </div>

      {/* Topbar */}
      <header className="relative z-10 flex h-16 items-center justify-between px-8 border-b border-border/8">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Design Master" className="h-8 w-8 rounded-xl shadow-glow-sm" />
          <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
            Design<span className="text-gradient">Master</span>
          </span>
          <SubscriptionBadge />
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 px-8 pb-16 pt-10 max-w-[1280px] mx-auto w-full">

        {/* Page title */}
        <div className="mb-10 animate-fade-up">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-2">Workspace</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-display">
            Seus Studios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha uma ferramenta e comece a criar agora
          </p>
        </div>

        {/* Featured card */}
        <button
          onClick={() => navigate(featured.route)}
          className="group relative w-full rounded-2xl border border-border/15 bg-card/50 overflow-hidden mb-4 text-left transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-glow-md active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 animate-fade-up flex items-stretch h-[140px]"
          style={{ animationDelay: '80ms' }}
        >
          {/* Content — LEFT side */}
          <div className="relative flex flex-1 items-center justify-between px-10 py-6 min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/70">{featured.tagline}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20">
                  <Sparkles className="h-2.5 w-2.5" />
                  Principal
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-foreground font-display tracking-tight">{featured.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">{featured.description}</p>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-full border border-border/20 bg-card/60 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300 shrink-0">
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>

          {/* Image — RIGHT side, contained within card height */}
          <div className="relative shrink-0 h-full flex items-center overflow-hidden">
            <img
              src={criadorHero}
              alt="Criador"
              className="h-full w-auto object-contain max-h-full"
              style={{ mixBlendMode: 'luminosity', opacity: 0.85 }}
            />
          </div>
        </button>


        {/* Grid of remaining studios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rest.map((studio, i) => (
            <button
              key={studio.id}
              onClick={() => navigate(studio.route)}
              className="group relative flex flex-col gap-4 rounded-2xl border border-border/12 bg-card/30 p-6 text-left transition-all duration-200 hover:border-primary/20 hover:bg-card/60 hover:shadow-glow-sm hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden animate-fade-up"
              style={{ animationDelay: `${(i + 2) * 55}ms` }}
            >
              {/* Background image — full card, semi-transparent */}
              {studioImages[studio.id] && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <img
                    src={studioImages[studio.id]}
                    alt=""
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    style={{ opacity: 0.18 }}
                  />
                  {/* dark overlay to ensure text readability */}
                  <div className="absolute inset-0 bg-background/40" />
                </div>
              )}

              {/* Hover gradient */}
              <div className={cn('absolute inset-0 bg-gradient-to-br', studio.gradient, 'opacity-0 group-hover:opacity-60 transition-opacity duration-500 rounded-2xl')} />

              {/* Icon (only when no image) */}
              {!studioImages[studio.id] && (
                <span className="relative text-3xl transition-transform duration-300 group-hover:scale-110">{studio.icon}</span>
              )}

              {/* Text */}
              <div className="relative space-y-1.5 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary/60">{studio.tagline}</p>
                <h3 className="text-[15px] font-bold text-foreground font-display tracking-tight leading-tight">{studio.name}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{studio.description}</p>
              </div>

              {/* Arrow */}
              <div className="relative flex items-center justify-between pt-1">
                <div className="h-px flex-1 bg-border/10 group-hover:bg-primary/10 transition-colors" />
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors ml-2" />
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
