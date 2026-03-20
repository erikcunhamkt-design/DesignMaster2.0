import { Studio } from '@/data/studios';
import { useNavigate } from 'react-router-dom';

interface StudioCardProps {
  studio: Studio;
  index: number;
}

export function StudioCard({ studio, index }: StudioCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(studio.route)}
      className="group relative flex flex-col items-start gap-5 rounded-2xl border border-border/15 bg-card/40 p-8 min-h-[260px] w-full transition-all duration-200 hover:scale-[1.02] hover:border-primary/25 hover:bg-card/70 hover:shadow-glow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Background image */}
      {studio.image && (
        <div className="absolute inset-0 pointer-events-none">
          <img src={studio.image} alt="" className="h-full w-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
      )}

      {/* Gradient fill */}
      <div className={`absolute inset-0 bg-gradient-to-br ${studio.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl`} />

      {/* Icon */}
      <span className="relative text-5xl transition-transform duration-300 group-hover:scale-110">
        {studio.icon}
      </span>

      {/* Content */}
      <div className="relative space-y-2 text-left">
        <h3 className="text-lg font-bold text-foreground tracking-tight font-display">{studio.name}</h3>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/70">{studio.tagline}</p>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{studio.description}</p>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
