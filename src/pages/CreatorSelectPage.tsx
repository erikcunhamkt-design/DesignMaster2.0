import { creators } from '@/data/creators';
import { CreatorCard } from '@/components/CreatorCard';
import { Zap } from 'lucide-react';

export default function CreatorSelectPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex h-16 w-full items-center px-8 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/50 text-primary-foreground shadow-glow-sm">
          <Zap className="h-5 w-5" />
        </div>
      </header>

      {/* Center content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-12 px-4">
        <div className="text-center space-y-3 animate-fade-up">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
            Quem vai criar <span className="text-primary">hoje</span>?
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Selecione um perfil para começar</p>
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
