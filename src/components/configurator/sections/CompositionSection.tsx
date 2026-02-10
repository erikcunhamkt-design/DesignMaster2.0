import { User, Users, PersonStanding, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const framings = [
  { id: 'closeup' as const, label: 'Close-up (Rosto)', icon: User },
  { id: 'plano-medio' as const, label: 'Plano Médio (Busto)', icon: Users },
  { id: 'plano-americano' as const, label: 'Plano Americano', icon: PersonStanding },
];

const verticalPositions = [
  { id: 'cima' as const, label: 'Mais pra cima', icon: ArrowUp },
  { id: 'centralizado' as const, label: 'Centralizado', icon: Minus },
  { id: 'baixo' as const, label: 'Mais pra baixo', icon: ArrowDown },
];

export function CompositionSection({ config, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {framings.map((f) => (
          <button
            key={f.id}
            onClick={() => onUpdate({ framing: f.id })}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
              config.framing === f.id
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <f.icon className="h-4 w-4" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Elementos Flutuantes?</span>
        <Switch
          checked={config.floatingElements}
          onCheckedChange={(v) => onUpdate({ floatingElements: v })}
        />
      </div>

      {config.floatingElements && (
        <Input
          placeholder="Ex: Notas de dólar, moedas..."
          value={config.floatingElementsText}
          onChange={(e) => onUpdate({ floatingElementsText: e.target.value })}
          className="h-8 bg-muted border-none text-xs"
        />
      )}

      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
          Posição Vertical do Sujeito
        </p>
        <p className="text-[9px] text-muted-foreground mb-2">Para sobrar área limpa para texto</p>
        <div className="grid grid-cols-3 gap-1.5">
          {verticalPositions.map((vp) => (
            <button
              key={vp.id}
              onClick={() => onUpdate({ verticalPosition: vp.id })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors',
                config.verticalPosition === vp.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <vp.icon className="h-3.5 w-3.5" />
              {vp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
