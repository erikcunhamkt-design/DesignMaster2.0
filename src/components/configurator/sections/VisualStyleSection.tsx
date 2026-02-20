import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
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
    <div className="space-y-3">
      {/* Sobriedade */}
      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-2 tracking-wide">Sobriedade</p>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground/50 w-12">Criativo</span>
          <Slider
            value={[config.sobriety]}
            onValueChange={([v]) => onUpdate({ sobriety: v })}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-[8px] text-muted-foreground/50 w-12 text-right">Pro</span>
        </div>
      </div>

      {/* Estilo Visual */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/70">Estilo Visual</span>
        <Switch
          checked={config.visualStyleEnabled}
          onCheckedChange={(v) => onUpdate({ visualStyleEnabled: v })}
        />
      </div>

      {config.visualStyleEnabled && (
        <div className="flex flex-wrap gap-1">
          {styles.map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ visualStyle: s })}
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-medium transition-all duration-150 border',
                config.visualStyle === s
                  ? 'bg-primary/12 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50'
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
          <span className="text-[10px] text-foreground/70">Desfoque (Blur)</span>
          <Switch
            checked={config.useBlur}
            onCheckedChange={(v) => onUpdate({ useBlur: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-foreground/70">Degradê Lateral</span>
          <Switch
            checked={config.useSideGradient}
            onCheckedChange={(v) => onUpdate({ useSideGradient: v })}
          />
        </div>
      </div>

      {/* Prompt Adicional */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-foreground/70">Prompt Extra</span>
        </div>
        <VoiceTextField
          textarea
          placeholder="Instruções adicionais ao prompt (opcional)..."
          value={config.additionalPrompt}
          onChange={(v) => onUpdate({ additionalPrompt: v, additionalPromptEnabled: v.length > 0 })}
          className="min-h-[48px] resize-none bg-secondary/30 border-border/20 text-[10px]"
        />
      </div>
    </div>
  );
}
