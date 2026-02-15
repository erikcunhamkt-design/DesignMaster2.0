import { cn } from '@/lib/utils';
import { RectangleHorizontal, RectangleVertical, Square, Smartphone } from 'lucide-react';

export interface ImageFormat {
  id: string;
  label: string;
  desc: string;
  ratio: string;
  icon: React.ElementType;
}

export const IMAGE_FORMATS: ImageFormat[] = [
  { id: 'feed', label: 'Feed', desc: '1080×1080', ratio: '1:1', icon: Square },
  { id: 'feed-retrato', label: 'Feed Retrato', desc: '1080×1350', ratio: '4:5', icon: RectangleVertical },
  { id: 'stories', label: 'Stories / Reels', desc: '1080×1920', ratio: '9:16', icon: Smartphone },
  { id: 'horizontal', label: 'Horizontal', desc: '1920×1080', ratio: '16:9', icon: RectangleHorizontal },
  { id: 'capa', label: 'Capa Facebook', desc: '820×312', ratio: '2.63:1', icon: RectangleHorizontal },
  { id: 'pinterest', label: 'Pinterest', desc: '1000×1500', ratio: '2:3', icon: RectangleVertical },
];

export function getFormatPromptSuffix(formatId: string): string {
  const format = IMAGE_FORMATS.find(f => f.id === formatId);
  if (!format) return '';
  return `\n\nCRITICAL FRAMING INSTRUCTION: Generate the image in exactly ${format.ratio} aspect ratio (${format.desc} pixels). The artwork MUST fill the ENTIRE canvas edge to edge — no blur, no letterboxing, no empty borders, no padding, no cropped areas. Every pixel of the canvas must contain meaningful artwork.`;
}

interface FormatSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Formato</p>
      <div className="grid grid-cols-3 gap-1.5">
        {IMAGE_FORMATS.map((fmt) => {
          const Icon = fmt.icon;
          const active = value === fmt.id;
          return (
            <button
              key={fmt.id}
              onClick={() => onChange(fmt.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg border p-2.5 transition-all duration-200',
                active
                  ? 'border-primary/50 bg-primary/5 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.2)]'
                  : 'border-border/15 bg-secondary/20 hover:border-border/30'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground/60')} />
              <span className={cn('text-[9px] font-semibold leading-tight', active ? 'text-primary' : 'text-foreground/60')}>{fmt.label}</span>
              <span className="text-[7px] text-muted-foreground/50">{fmt.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
