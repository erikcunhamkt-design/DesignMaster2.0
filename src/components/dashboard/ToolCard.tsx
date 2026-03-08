import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  name: string;
  description: string;
  icon: string;
  gradient: string;
  image?: string;
  onClick: () => void;
}

export function ToolCard({ name, description, icon, gradient, image, onClick }: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col justify-between w-[220px] h-[180px] shrink-0 rounded-2xl border border-border/10 bg-card/40 p-5 text-left transition-all duration-300 hover:border-primary/25 hover:bg-card/70 hover:shadow-glow-sm hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden"
    >
      {/* Background image */}
      {image && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
            style={{ opacity: 0.15 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>
      )}

      {/* Hover gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', gradient, 'opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-2xl')} />

      {/* Glow on hover */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-16 bg-primary/0 group-hover:bg-primary/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

      {/* Content */}
      <div className="relative space-y-1.5 flex-1">
        {!image && <span className="text-2xl block mb-1">{icon}</span>}
        <h3 className="text-[14px] font-bold text-foreground font-display tracking-tight leading-tight">{name}</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      </div>

      {/* Arrow */}
      <div className="relative flex items-center justify-end pt-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-full border border-border/15 bg-secondary/30 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300">
          <ArrowRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
