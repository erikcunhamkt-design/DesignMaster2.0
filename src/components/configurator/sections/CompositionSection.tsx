import { ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { ProjectConfig } from '@/types/project';

import particulasImg from '@/assets/floating/particulas.png';
import dinheiroImg from '@/assets/floating/dinheiro.png';
import luzesImg from '@/assets/floating/luzes.png';
import boletosImg from '@/assets/floating/boletos.png';
import moedasImg from '@/assets/floating/moedas.png';

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

const floatingPresets = [
  { id: 'Partículas douradas flutuando ao redor', label: 'Partículas', image: particulasImg },
  { id: 'Notas de dólar americano chovendo', label: 'Dinheiro', image: dinheiroImg },
  { id: 'Luzes bokeh coloridas flutuando', label: 'Luzes', image: luzesImg },
  { id: 'Boletos bancários voando', label: 'Boletos', image: boletosImg },
  { id: 'Moedas de ouro caindo', label: 'Moedas', image: moedasImg },
];

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
          onCheckedChange={(v) => onUpdate({ floatingElements: v, floatingElementsText: v ? config.floatingElementsText : '' })}
        />
      </div>

      {config.floatingElements && (
        <div className="space-y-2">
          {/* Preset cards grid */}
          <div className="grid grid-cols-5 gap-1">
            {floatingPresets.map((preset) => {
              const isSelected = config.floatingElementsText === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onUpdate({ floatingElementsText: isSelected ? '' : preset.id })}
                  className={cn(
                    'flex flex-col items-center rounded-md overflow-hidden border transition-all duration-150',
                    isSelected
                      ? 'border-primary/50 ring-1 ring-primary/30'
                      : 'border-border/20 hover:border-border/40'
                  )}
                >
                  <div className="w-full aspect-square overflow-hidden">
                    <img
                      src={preset.image}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={cn(
                      'w-full py-0.5 text-[8px] font-medium text-center leading-tight',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary/30 text-muted-foreground'
                    )}
                  >
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Custom text field */}
          <VoiceTextField
            placeholder="Ou descreva outros elementos..."
            value={floatingPresets.some(p => p.id === config.floatingElementsText) ? '' : config.floatingElementsText}
            onChange={(v) => onUpdate({ floatingElementsText: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
        </div>
      )}

      {/* Vertical position */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 tracking-wide">
            Posição Vertical
          </p>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-[9px] font-medium transition-colors', config.autoVerticalPosition ? 'text-primary' : 'text-muted-foreground/50')}>
              Auto IA
            </span>
            <Switch
              checked={!config.autoVerticalPosition}
              onCheckedChange={(v) => onUpdate({ autoVerticalPosition: !v })}
            />
            <span className={cn('text-[9px] font-medium transition-colors', !config.autoVerticalPosition ? 'text-primary' : 'text-muted-foreground/50')}>
              Manual
            </span>
          </div>
        </div>
        {!config.autoVerticalPosition && (
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
        )}
        {config.autoVerticalPosition && (
          <p className="text-[9px] text-muted-foreground/50 italic text-center py-1">
            A IA vai decidir a melhor posição automaticamente
          </p>
        )}
      </div>
    </div>
  );
}
