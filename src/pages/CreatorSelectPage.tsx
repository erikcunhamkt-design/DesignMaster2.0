import { creators } from '@/data/creators';
import { CreatorCard } from '@/components/CreatorCard';
import logo3d from '@/assets/logo-3d.png';

export default function CreatorSelectPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/4 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(hsl(220 12% 20%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 12% 20%) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex h-16 w-full items-center px-8 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logo3d} alt="Design Master" className="h-10 w-10 rounded-lg object-contain" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Spark<span className="text-gradient">Snap</span>
          </span>
        </div>
      </header>

      {/* Center content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-14 px-4">
        <div className="text-center space-y-4 animate-fade-up">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-7xl">
            Quem vai criar <span className="text-gradient">hoje</span>?
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide max-w-md mx-auto">
            Selecione um perfil para começar sua jornada criativa
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      </div>

      <div className="h-12" />
    </div>
  );
}
