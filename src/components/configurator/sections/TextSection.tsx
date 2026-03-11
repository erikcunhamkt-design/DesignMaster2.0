import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const TEXT_POSITIONS = [
  { value: 'topo' as const, label: 'Topo', icon: AlignStartVertical },
  { value: 'centro' as const, label: 'Centro', icon: AlignCenterVertical },
  { value: 'rodape' as const, label: 'Rodapé', icon: AlignEndVertical },
];

export function TextSection({ config, onUpdate }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/70">Ativar Texto</span>
        <Switch
          checked={config.textEnabled}
          onCheckedChange={(v) => onUpdate({ textEnabled: v })}
        />
      </div>

      {config.textEnabled && (
        <div className="space-y-2">
          <VoiceTextField
            placeholder="Headline"
            value={config.text01}
            onChange={(v) => onUpdate({ text01: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
          <VoiceTextField
            placeholder="Subheadline"
            value={config.text02}
            onChange={(v) => onUpdate({ text02: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
          <VoiceTextField
            placeholder="CTA"
            value={config.cta}
            onChange={(v) => onUpdate({ cta: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />

          {/* Posição do texto */}
          <div className="space-y-1 pt-1">
            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Posição do texto</span>
            <div className="grid grid-cols-3 gap-1">
              {TEXT_POSITIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ textPosition: value })}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[9px] transition-all duration-150 border',
                    config.textPosition === value
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-secondary/20 text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Modo */}
          <div className="space-y-1 pt-1">
            {(['camada', 'imagem'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdate({ textMode: mode })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] transition-all duration-150 border',
                  config.textMode === mode
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-secondary/20 text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                <div className={cn(
                  'h-2.5 w-2.5 rounded-full border-2',
                  config.textMode === mode ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                )} />
                {mode === 'camada' ? 'Camada (recomendado)' : 'Na imagem (IA)'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
