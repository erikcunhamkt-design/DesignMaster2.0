import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function TextSection({ config, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Ativar Texto</span>
        <Switch
          checked={config.textEnabled}
          onCheckedChange={(v) => onUpdate({ textEnabled: v })}
        />
      </div>

      {config.textEnabled && (
        <div className="space-y-2">
          <Input
            placeholder="Texto 01 (headline)"
            value={config.text01}
            onChange={(e) => onUpdate({ text01: e.target.value })}
            className="h-8 bg-muted border-none text-xs"
          />
          <Input
            placeholder="Texto 02 (subheadline)"
            value={config.text02}
            onChange={(e) => onUpdate({ text02: e.target.value })}
            className="h-8 bg-muted border-none text-xs"
          />
          <Input
            placeholder="CTA"
            value={config.cta}
            onChange={(e) => onUpdate({ cta: e.target.value })}
            className="h-8 bg-muted border-none text-xs"
          />

          <div className="space-y-1.5 pt-1">
            {(['camada', 'imagem'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdate({ textMode: mode })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] transition-colors',
                  config.textMode === mode
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'h-3 w-3 rounded-full border-2',
                  config.textMode === mode ? 'border-primary bg-primary' : 'border-muted-foreground'
                )} />
                {mode === 'camada'
                  ? 'Texto como camada no app (recomendado)'
                  : 'Texto dentro da imagem (IA)'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
