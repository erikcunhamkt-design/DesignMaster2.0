import { Smartphone, Monitor, Square, RectangleVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const dimensions = [
  { id: 'stories' as const, label: 'Stories', ratio: '9:16', icon: Smartphone },
  { id: 'horizontal' as const, label: 'Horizontal', ratio: '16:9', icon: Monitor },
  { id: 'feed-quadrado' as const, label: 'Quadrado', ratio: '1:1', icon: Square },
  { id: 'feed-retrato' as const, label: 'Retrato', ratio: '4:5', icon: RectangleVertical },
];

export function DimensionsSection({ config, onUpdate }: Props) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {dimensions.map((d) => (
        <button
          key={d.id}
          onClick={() => onUpdate({ dimension: d.id })}
          className={cn(
            'flex flex-col items-center gap-1 rounded-lg py-2.5 text-[9px] font-medium transition-all duration-150 border',
            config.dimension === d.id
              ? 'bg-primary/10 text-primary border-primary/25 shadow-glow-sm'
              : 'bg-secondary/30 text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/50'
          )}
        >
          <d.icon className="h-4 w-4" />
          <span className="font-semibold">{d.label}</span>
          <span className="text-[8px] opacity-50">{d.ratio}</span>
        </button>
      ))}
    </div>
  );
}
