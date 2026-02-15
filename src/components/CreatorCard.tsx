import { Creator } from '@/data/creators';
import { useNavigate } from 'react-router-dom';

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    localStorage.setItem('selected_creator', creator.id);
    navigate(creator.route);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/30 bg-secondary/30 p-10 min-h-[280px] w-[240px] transition-all duration-500 hover:scale-[1.03] hover:border-primary/40 hover:bg-secondary/50 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="text-6xl transition-transform duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
        {creator.icon}
      </span>
      <div className="text-center space-y-1.5">
        <h3 className="text-lg font-bold text-foreground tracking-tight">{creator.name}</h3>
        <p className="text-[11px] text-muted-foreground font-medium">{creator.description}</p>
      </div>
      {/* Hover gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
}
