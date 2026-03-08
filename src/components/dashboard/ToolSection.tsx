import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCard } from './ToolCard';
import type { Studio } from '@/data/studios';

interface ToolSectionProps {
  title: string;
  studios: Studio[];
  images: Record<string, string>;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  onNavigate?: (route: string, studioId: string) => void;
}

export function ToolSection({ title, studios, images, isFavorite, onToggleFavorite, onNavigate }: ToolSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  if (studios.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[15px] font-bold text-foreground font-display tracking-tight">{title}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
              canScrollLeft ? 'text-muted-foreground hover:text-foreground hover:bg-secondary/50' : 'text-border/40 cursor-default'
            )}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
              canScrollRight ? 'text-muted-foreground hover:text-foreground hover:bg-secondary/50' : 'text-border/40 cursor-default'
            )}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        >
          {studios.map((s) => (
            <ToolCard
              key={s.id}
              studio={s}
              image={images[s.id]}
              isFavorite={isFavorite?.(s.id)}
              onToggleFavorite={onToggleFavorite}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
