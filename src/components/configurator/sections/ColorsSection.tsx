import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const colorFields = [
  { key: 'ambientColor' as const, label: 'Ambiente' },
  { key: 'rimLightColor' as const, label: 'Recorte' },
  { key: 'complementaryLightColor' as const, label: 'Complementar' },
];

export function ColorsSection({ config, onUpdate }: Props) {
  const isManual = config.colorMode === 'manual';

  const handleToggle = (checked: boolean) => {
    onUpdate({ colorMode: checked ? 'manual' : 'auto' });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-foreground/70">
          {isManual ? <Unlock className="h-3 w-3 text-primary" /> : <Lock className="h-3 w-3 text-muted-foreground/50" />}
          Personalizar
        </span>
        <Switch checked={isManual} onCheckedChange={handleToggle} />
      </div>

      {!isManual && (
        <p className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
          <Lock className="h-2.5 w-2.5" />
          IA escolhe cores automaticamente
        </p>
      )}

      <div className={cn('space-y-2', !isManual && 'opacity-30 pointer-events-none')}>
        {colorFields.map((f) => (
          <div key={f.key} className="flex items-center gap-2">
            <label className="flex-1 text-[9px] font-semibold uppercase text-muted-foreground/60 tracking-wide">
              {f.label}
            </label>
            <div className="flex items-center gap-1.5 rounded-md bg-secondary/30 px-2 py-1 border border-border/15">
              <input
                type="color"
                value={config[f.key]}
                onChange={(e) => onUpdate({ [f.key]: e.target.value })}
                disabled={!isManual}
                className={cn(
                  'h-4 w-4 rounded border-0 bg-transparent',
                  isManual ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
              />
              <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
                {config[f.key]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
