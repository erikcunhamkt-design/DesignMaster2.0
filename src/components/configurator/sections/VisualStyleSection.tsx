import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const styles = [
  'Clássico', 'Formal', 'Elegante', 'Sexy', 'Institucional', 'Tecnológico',
  'Glassmorphism', 'Interface UI', 'Minimalista', 'Lúdico', 'Cartoon',
  'Infoproduto', 'Jovial', 'Gamer', 'Retrato Profissional', 'Ultra Realista', 'Glow',
];

export function VisualStyleSection({ config, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      {/* Sobriedade */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Sobriedade</p>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Criativo</span>
          <Slider
            value={[config.sobriety]}
            onValueChange={([v]) => onUpdate({ sobriety: v })}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-[9px] text-muted-foreground">Profissional</span>
        </div>
      </div>

      {/* Estilo Visual */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Ativar Estilo Visual</span>
        <Switch
          checked={config.visualStyleEnabled}
          onCheckedChange={(v) => onUpdate({ visualStyleEnabled: v })}
        />
      </div>

      {config.visualStyleEnabled && (
        <div className="flex flex-wrap gap-1.5">
          {styles.map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ visualStyle: s })}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                config.visualStyle === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">Usar Desfoque (Blur)?</span>
          <Switch
            checked={config.useBlur}
            onCheckedChange={(v) => onUpdate({ useBlur: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">Usar Degradê Lateral?</span>
          <Switch
            checked={config.useSideGradient}
            onCheckedChange={(v) => onUpdate({ useSideGradient: v })}
          />
        </div>
      </div>

      {/* Prompt Adicional */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Prompt Adicional</span>
          <Switch
            checked={config.additionalPromptEnabled}
            onCheckedChange={(v) => onUpdate({ additionalPromptEnabled: v })}
          />
        </div>
        {config.additionalPromptEnabled && (
          <Textarea
            placeholder="Instruções adicionais para o modelo..."
            value={config.additionalPrompt}
            onChange={(e) => onUpdate({ additionalPrompt: e.target.value })}
            className="min-h-[60px] resize-none bg-muted border-none text-xs"
          />
        )}
      </div>
    </div>
  );
}
