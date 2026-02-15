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
      className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 min-h-[260px] w-[220px] transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="text-6xl transition-transform duration-300 group-hover:scale-110">
        {creator.icon}
      </span>
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-foreground">{creator.name}</h3>
        <p className="text-xs text-muted-foreground">{creator.description}</p>
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
}
