import { cn } from '@/lib/utils';
import { RectangleHorizontal, RectangleVertical, Square, Smartphone, LayoutGrid } from 'lucide-react';

export interface ImageFormat {
  id: string;
  label: string;
  desc: string;
  ratio: string;
  icon: React.ElementType;
}

export const IMAGE_FORMATS: ImageFormat[] = [
  { id: 'feed', label: 'Feed', desc: '1080×1080', ratio: '1:1', icon: Square },
  { id: 'stories', label: 'Stories', desc: '1080×1920', ratio: '9:16', icon: Smartphone },
  { id: 'reels', label: 'Reels', desc: '1080×1920', ratio: '9:16', icon: Smartphone },
  { id: 'horizontal', label: 'Horizontal', desc: '1920×1080', ratio: '16:9', icon: RectangleHorizontal },
  { id: 'vertical', label: 'Vertical', desc: '1080×1350', ratio: '4:5', icon: RectangleVertical },
  { id: 'pinterest', label: 'Pinterest', desc: '1000×1500', ratio: '2:3', icon: RectangleVertical },
  { id: 'cover', label: 'Capa', desc: '1500×500', ratio: '3:1', icon: RectangleHorizontal },
  { id: 'free', label: 'Livre', desc: 'Sem restrição', ratio: '', icon: LayoutGrid },
];

export function getFormatPromptSuffix(formatId: string): string {
  const format = IMAGE_FORMATS.find(f => f.id === formatId);
  if (!format || formatId === 'free') return '';
  return `\n\nIMPORTANT: Generate the image in ${format.ratio} aspect ratio (${format.desc} pixels). Frame the composition accordingly.`;
}

interface FormatSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Formato</p>
      <div className="grid grid-cols-4 gap-1.5">
        {IMAGE_FORMATS.map((fmt) => {
          const Icon = fmt.icon;
          const active = value === fmt.id;
          return (
            <button
              key={fmt.id}
              onClick={() => onChange(fmt.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg border p-2 transition-all duration-200',
                active
                  ? 'border-primary/50 bg-primary/5 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.2)]'
                  : 'border-border/15 bg-secondary/20 hover:border-border/30'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground/60')} />
              <span className={cn('text-[9px] font-semibold', active ? 'text-primary' : 'text-foreground/60')}>{fmt.label}</span>
              <span className="text-[7px] text-muted-foreground/50">{fmt.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
