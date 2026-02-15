import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const colorFields = [
  { key: 'ambientColor' as const, label: 'Cor do Ambiente' },
  { key: 'rimLightColor' as const, label: 'Luz de Recorte' },
  { key: 'complementaryLightColor' as const, label: 'Luz Complementar' },
];

export function ColorsSection({ config, onUpdate }: Props) {
  const isManual = config.colorMode === 'manual';

  const handleToggle = (checked: boolean) => {
    onUpdate({ colorMode: checked ? 'manual' : 'auto' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          {isManual ? <Unlock className="h-3.5 w-3.5 text-primary" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          Personalizar cores
        </span>
        <Switch checked={isManual} onCheckedChange={handleToggle} />
      </div>

      {!isManual && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          Automático (IA) — cores escolhidas na geração
        </p>
      )}

      <div className={cn('space-y-2.5', !isManual && 'opacity-40 pointer-events-none')}>
        {colorFields.map((f) => (
          <div key={f.key} className="flex items-center gap-2">
            <label className="flex-1 text-[10px] font-semibold uppercase text-muted-foreground">
              {f.label}
            </label>
            <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
              <input
                type="color"
                value={config[f.key]}
                onChange={(e) => onUpdate({ [f.key]: e.target.value })}
                disabled={!isManual}
                className={cn(
                  'h-5 w-5 rounded border-0 bg-transparent',
                  isManual ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
              />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {config[f.key]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
