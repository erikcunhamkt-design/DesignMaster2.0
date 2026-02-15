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
      className="group relative flex flex-col items-center justify-center gap-6 rounded-2xl border border-border/20 bg-card/60 p-10 min-h-[300px] w-[250px] transition-all duration-500 hover:scale-[1.04] hover:border-primary/30 hover:bg-card hover:shadow-cinematic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden"
    >
      {/* Hover gradient fill */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <span className="relative text-6xl transition-transform duration-500 group-hover:scale-110">
        {creator.icon}
      </span>
      <div className="relative text-center space-y-2">
        <h3 className="text-lg font-bold text-foreground tracking-tight">{creator.name}</h3>
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{creator.description}</p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
}
