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
  { id: 'feed-quadrado' as const, label: 'Feed Quadrado', ratio: '1:1', icon: Square },
  { id: 'feed-retrato' as const, label: 'Feed Retrato', ratio: '4:5', icon: RectangleVertical },
];

export function DimensionsSection({ config, onUpdate }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {dimensions.map((d) => (
        <button
          key={d.id}
          onClick={() => onUpdate({ dimension: d.id })}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg py-3 text-[10px] font-medium transition-colors',
            config.dimension === d.id
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          <d.icon className="h-5 w-5" />
          <span className="uppercase">{d.label}</span>
          <span className="text-[9px] opacity-60">{d.ratio}</span>
        </button>
      ))}
    </div>
  );
}
