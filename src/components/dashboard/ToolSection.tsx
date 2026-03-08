import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ToolSection({ title, children }: ToolSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -460 : 460, behavior: 'smooth' });
  };

  return (
    <div className="relative group/section">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[15px] font-bold text-foreground font-display tracking-tight">{title}</h2>
        <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border border-border/20 bg-secondary/40 transition-all',
              canScrollLeft ? 'text-foreground hover:bg-secondary/80' : 'text-muted-foreground/20 cursor-default'
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border border-border/20 bg-secondary/40 transition-all',
              canScrollRight ? 'text-foreground hover:bg-secondary/80' : 'text-muted-foreground/20 cursor-default'
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
      >
        {children}
      </div>

      {/* Edge fade effects */}
      {canScrollLeft && (
        <div className="absolute left-0 top-10 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-10 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}
