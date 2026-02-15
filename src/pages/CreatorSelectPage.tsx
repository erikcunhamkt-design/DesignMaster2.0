import { creators } from '@/data/creators';
import { CreatorCard } from '@/components/CreatorCard';
import { Zap } from 'lucide-react';

export default function CreatorSelectPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-background via-background to-[hsl(var(--primary)/0.08)]">
      {/* Top bar */}
      <header className="flex h-14 w-full items-center px-6 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-md shadow-primary/20">
          <Zap className="h-5 w-5" />
        </div>
      </header>

      {/* Center content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Quem vai criar hoje?
          </h1>
          <p className="text-muted-foreground text-base">Escolha um criador</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
