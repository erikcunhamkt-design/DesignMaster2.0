import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface ImageHistoryBarProps {
  images: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onClear?: () => void;
}

export function ImageHistoryBar({ images, activeIndex, onSelect, onClear }: ImageHistoryBarProps) {
  if (images.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 border-t border-border/10 bg-background/60 backdrop-blur-xl shrink-0">
      <span className="text-[9px] text-muted-foreground/40 font-medium mr-1 shrink-0">Histórico</span>
      {images.map((url, i) => (
        <button
          key={`${i}-${url.slice(-12)}`}
          onClick={() => onSelect(i)}
          className={cn(
            'h-8 w-8 rounded-md overflow-hidden border-2 transition-all duration-200 shrink-0 hover:scale-110',
            i === activeIndex
              ? 'border-primary shadow-sm ring-1 ring-primary/30'
              : 'border-border/20 opacity-50 hover:opacity-80'
          )}
        >
          <img src={url} alt={`Versão ${i + 1}`} className="h-full w-full object-cover" />
        </button>
      ))}
      {onClear && images.length > 0 && (
        <button
          onClick={onClear}
          className="ml-auto text-muted-foreground/30 hover:text-destructive/70 transition-colors p-1"
          title="Limpar histórico"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
