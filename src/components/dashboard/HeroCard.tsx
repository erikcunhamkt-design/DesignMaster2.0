import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroCardProps {
  onOpen: () => void;
}

export function HeroCard({ onOpen }: HeroCardProps) {
  return (
    <div className="relative mb-8 animate-fade-up">
      {/* Outer glow */}
      <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 opacity-50 blur-[3px] pointer-events-none" />

      <button
        onClick={onOpen}
        className="group relative w-full rounded-[20px] overflow-hidden text-left transition-all duration-300 active:scale-[0.998] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 bg-card/50 backdrop-blur-sm"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-transparent pointer-events-none" />

        {/* Floating glow orbs */}
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-80 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/14 transition-all duration-700" />
        <div className="absolute right-1/4 bottom-0 w-48 h-24 bg-accent/8 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/14 transition-all duration-700" />

        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Content */}
        <div className="relative flex items-center justify-between px-10 py-10">
          <div className="max-w-lg">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold text-primary border border-primary/25 shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
                <Sparkles className="h-3 w-3" />
                Featured Tool
              </span>
            </div>
            <h2 className="text-[32px] font-extrabold text-foreground font-display tracking-tight leading-none mb-3 drop-shadow-[0_0_24px_hsl(var(--primary)/0.25)]">
              Creator
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Create images with advanced controls for composition, lighting and style. Your complete AI-powered creative studio.
            </p>

            {/* CTA button */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
              Open Creator
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>

          {/* Decorative right element */}
          <div className="hidden lg:flex items-center justify-center w-32 h-32 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 to-transparent group-hover:border-primary/30 group-hover:shadow-glow-sm transition-all duration-500">
            <div className="text-5xl">🎨</div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </button>
    </div>
  );
}
