import { ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Studio } from '@/data/studios';

interface ToolCardProps {
  studio: Studio;
  image?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onNavigate?: (route: string, studioId: string) => void;
}

export function ToolCard({ studio, image, isFavorite, onToggleFavorite, onNavigate }: ToolCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onNavigate) onNavigate(studio.route, studio.id);
    else navigate(studio.route);
  };

  return (
    <button
      onClick={() => navigate(studio.route)}
      className="group relative flex flex-col min-w-[220px] w-[220px] h-[160px] rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm overflow-hidden text-left transition-all duration-300 hover:border-primary/30 hover:shadow-glow-sm hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shrink-0"
    >
      {/* Favorite button */}
      {onToggleFavorite && (
        <div
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleFavorite(studio.id);
          }}
          className={cn(
            'absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
            isFavorite
              ? 'bg-primary/20 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]'
              : 'bg-card/60 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10'
          )}
        >
          <Star className={cn('h-3.5 w-3.5 transition-transform duration-200', isFavorite && 'fill-primary scale-110')} />
        </div>
      )}

      {/* BG image or gradient */}
      {image ? (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ opacity: 0.15 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none', studio.gradient)} />
      )}

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-primary/5 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative flex flex-col justify-end flex-1 p-4">
        {!image && (
          <span className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">{studio.icon}</span>
        )}
        <h3 className="text-[13px] font-bold text-foreground font-display tracking-tight leading-tight mb-1">
          {studio.name}
        </h3>
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
          {studio.tagline}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="relative flex items-center justify-between px-4 pb-3">
        <div className="h-px flex-1 bg-border/10 group-hover:bg-primary/15 transition-colors" />
        <div className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 group-hover:shadow-[0_0_10px_hsl(var(--primary)/0.3)] transition-all duration-300">
          <ArrowRight className="h-3 w-3 text-primary/60 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transform duration-300" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
