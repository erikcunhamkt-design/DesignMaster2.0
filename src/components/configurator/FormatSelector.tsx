import { cn } from '@/lib/utils';
import { Smartphone, Monitor, Square, RectangleVertical } from 'lucide-react';

export interface ImageFormat {
  id: string;
  label: string;
  ratio: string;
  icon: React.ElementType;
}

export const IMAGE_FORMATS: ImageFormat[] = [
  { id: 'stories', label: 'Stories', ratio: '9:16', icon: Smartphone },
  { id: 'horizontal', label: 'Horizontal', ratio: '16:9', icon: Monitor },
  { id: 'quadrado', label: 'Quadrado', ratio: '1:1', icon: Square },
  { id: 'retrato', label: 'Retrato', ratio: '4:5', icon: RectangleVertical },
];

export function getFormatPromptSuffix(formatId: string): string {
  const format = IMAGE_FORMATS.find(f => f.id === formatId);
  if (!format) return '';
  const dims: Record<string, string> = {
    stories: '1080×1920',
    horizontal: '1920×1080',
    quadrado: '1080×1080',
    retrato: '1080×1350',
  };
  return `\n\nCRITICAL FRAMING INSTRUCTION: Generate the image in exactly ${format.ratio} aspect ratio (${dims[format.id]} pixels). The artwork MUST fill the ENTIRE canvas edge to edge — no blur borders, no letterboxing, no empty space, no padding. Every pixel of the canvas must contain meaningful artwork.`;
}

interface FormatSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Dimensões</p>
      <div className="grid grid-cols-4 gap-2">
        {IMAGE_FORMATS.map((fmt) => {
          const Icon = fmt.icon;
          const active = value === fmt.id;
          return (
            <button
              key={fmt.id}
              onClick={() => onChange(fmt.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 transition-all duration-200',
                active
                  ? 'border-primary/50 bg-primary/5 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.2)]'
                  : 'border-border/15 bg-secondary/30 hover:border-border/30'
              )}
            >
              <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground/50')} strokeWidth={1.5} />
              <span className={cn('text-[10px] font-semibold', active ? 'text-foreground' : 'text-foreground/60')}>{fmt.label}</span>
              <span className={cn('text-[9px]', active ? 'text-primary' : 'text-muted-foreground/40')}>{fmt.ratio}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
