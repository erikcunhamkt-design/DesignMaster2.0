import { User, Users, PersonStanding, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const framings = [
  { id: 'closeup' as const, label: 'Close-up', icon: User },
  { id: 'plano-medio' as const, label: 'Médio', icon: Users },
  { id: 'plano-americano' as const, label: 'Americano', icon: PersonStanding },
];

const verticalPositions = [
  { id: 'cima' as const, label: 'Cima', icon: ArrowUp },
  { id: 'centralizado' as const, label: 'Centro', icon: Minus },
  { id: 'baixo' as const, label: 'Baixo', icon: ArrowDown },
];

export function CompositionSection({ config, onUpdate }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-1">
        {framings.map((f) => (
          <button
            key={f.id}
            onClick={() => onUpdate({ framing: f.id })}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-md py-2 text-[9px] font-medium transition-all duration-150 border',
              config.framing === f.id
                ? 'bg-primary/10 text-primary border-primary/25'
                : 'bg-secondary/30 text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            <f.icon className="h-3.5 w-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/70">Elementos Flutuantes</span>
        <Switch
          checked={config.floatingElements}
          onCheckedChange={(v) => onUpdate({ floatingElements: v })}
        />
      </div>

      {config.floatingElements && (
        <VoiceTextField
          placeholder="Ex: Notas de dólar, moedas..."
          value={config.floatingElementsText}
          onChange={(v) => onUpdate({ floatingElementsText: v })}
          className="h-7 bg-secondary/30 border-border/20 text-[10px]"
        />
      )}

      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">
          Posição Vertical
        </p>
        <div className="grid grid-cols-3 gap-1">
          {verticalPositions.map((vp) => (
            <button
              key={vp.id}
              onClick={() => onUpdate({ verticalPosition: vp.id })}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[9px] font-medium transition-all duration-150 border',
                config.verticalPosition === vp.id
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground hover:text-foreground border-transparent'
              )}
            >
              <vp.icon className="h-3 w-3" />
              {vp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
