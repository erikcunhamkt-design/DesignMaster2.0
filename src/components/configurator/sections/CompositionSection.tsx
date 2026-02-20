import { ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { ProjectConfig } from '@/types/project';

// Homer composition images
import homerCloseup from '@/assets/composition/homer-closeup.png';
import homerMedio from '@/assets/composition/homer-medio.png';
import homerAmericano from '@/assets/composition/homer-americano.png';

// Marge composition images
import margeCloseup from '@/assets/composition/marge-closeup.png';
import margeMedio from '@/assets/composition/marge-medio.png';
import margeAmericano from '@/assets/composition/marge-americano.png';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const framings = [
  {
    id: 'closeup' as const,
    label: 'Close-up',
    images: { homer: homerCloseup, marge: margeCloseup },
  },
  {
    id: 'plano-medio' as const,
    label: 'Médio',
    images: { homer: homerMedio, marge: margeMedio },
  },
  {
    id: 'plano-americano' as const,
    label: 'Americano',
    images: { homer: homerAmericano, marge: margeAmericano },
  },
];

const verticalPositions = [
  { id: 'cima' as const, label: 'Cima', icon: ArrowUp },
  { id: 'centralizado' as const, label: 'Centro', icon: Minus },
  { id: 'baixo' as const, label: 'Baixo', icon: ArrowDown },
];

export function CompositionSection({ config, onUpdate }: Props) {
  const imgKey = config.gender === 'feminino' ? 'marge' : 'homer';

  return (
    <div className="space-y-2.5">
      {/* Framing cards with images */}
      <div className="grid grid-cols-3 gap-1.5">
        {framings.map((f) => {
          const isSelected = config.framing === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onUpdate({ framing: f.id })}
              className={cn(
                'flex flex-col items-center rounded-md overflow-hidden border transition-all duration-150',
                isSelected
                  ? 'border-primary/50 ring-1 ring-primary/30'
                  : 'border-border/20 hover:border-border/40'
              )}
            >
              <div className="w-full aspect-square overflow-hidden">
                <img
                  src={f.images[imgKey]}
                  alt={f.label}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <span
                className={cn(
                  'w-full py-1 text-[9px] font-medium text-center',
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary/30 text-muted-foreground'
                )}
              >
                {f.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom composition text toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/70">Composição personalizada</span>
        <Switch
          checked={!!config.customComposition}
          onCheckedChange={(v) => onUpdate({ customComposition: v ? '' : undefined })}
        />
      </div>

      {config.customComposition !== undefined && (
        <VoiceTextField
          placeholder="Ex: plano conjunto, detalhe, olho de peixe..."
          value={config.customComposition ?? ''}
          onChange={(v) => onUpdate({ customComposition: v })}
          className="h-7 bg-secondary/30 border-border/20 text-[10px]"
        />
      )}

      {/* Floating elements */}
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

      {/* Vertical position */}
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
