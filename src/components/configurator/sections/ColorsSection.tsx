import { Lock, Unlock, Sparkles } from 'lucide-react';
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
    <div className="space-y-3">
      {/* Auto AI Toggle - Prominent */}
      <div className="flex items-center justify-between rounded-xl border border-border/15 bg-secondary/20 px-3 py-2.5">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-foreground/70">
          {isManual ? (
            <Unlock className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse-glow" />
          )}
          {isManual ? 'Manual' : 'Auto (IA)'}
        </span>
        <Switch checked={isManual} onCheckedChange={handleToggle} />
      </div>

      {!isManual && (
        <div className="rounded-lg border border-primary/10 bg-primary/4 px-3 py-2.5">
          <p className="text-[10px] text-primary/70 font-medium flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Paleta escolhida automaticamente pela IA
          </p>
        </div>
      )}

      <div className={cn('space-y-2.5 transition-all duration-300', !isManual && 'opacity-20 pointer-events-none blur-[1px]')}>
        {colorFields.map((f) => (
          <div key={f.key} className="flex items-center gap-2.5">
            <label className="flex-1 text-[10px] font-semibold uppercase text-muted-foreground/50 tracking-wide">
              {f.label}
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5 border border-border/10">
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
              <span className="text-[9px] font-mono text-muted-foreground/40 uppercase">
                {config[f.key]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
