import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { directionGroups, directionPresets, DirectionGroup } from '@/data/characterDirectionData';
import { ChevronLeft, ChevronRight, Shuffle, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// Expression images — unique per expression, per gender
import homerExprSorrindo    from '@/assets/expressions/homer-sorrindo.png';
import homerExprSerio       from '@/assets/expressions/homer-serio.png';
import homerExprNeutro      from '@/assets/expressions/homer-neutro.png';
import homerExprConfiante   from '@/assets/expressions/homer-confiante.png';
import homerExprBravo       from '@/assets/expressions/homer-bravo.png';
import homerExprPensativo   from '@/assets/expressions/homer-pensativo.png';
import homerExprDeterminado from '@/assets/expressions/homer-determinado.png';

import margeExprSorrindo    from '@/assets/expressions/marge-sorrindo.png';
import margeExprSerio       from '@/assets/expressions/marge-serio.png';
import margeExprNeutro      from '@/assets/expressions/marge-neutro.png';
import margeExprConfiante   from '@/assets/expressions/marge-confiante.png';
import margeExprBravo       from '@/assets/expressions/marge-bravo.png';
import margeExprPensativo   from '@/assets/expressions/marge-pensativo.png';
import margeExprDeterminado from '@/assets/expressions/marge-determinado.png';

// Pose images for lens / gaze groups
import homerBracosCruzados from '@/assets/poses/homer-bracos-cruzados.png';
import homerMaosBolso      from '@/assets/poses/homer-maos-bolso.png';
import homerPoseHeroica    from '@/assets/poses/homer-pose-heroica.png';
import homerSentado        from '@/assets/poses/homer-sentado.png';
import homerAndando        from '@/assets/poses/homer-andando.png';
import homerApoiado        from '@/assets/poses/homer-apoiado.png';
import homerApontando      from '@/assets/poses/homer-apontando.png';
import homerDeCostas       from '@/assets/poses/homer-de-costas.png';

import margeBracosCruzados from '@/assets/poses/marge-bracos-cruzados.png';
import margeMaosBolso      from '@/assets/poses/marge-maos-bolso.png';
import margePoseHeroica    from '@/assets/poses/marge-pose-heroica.png';
import margeSentado        from '@/assets/poses/marge-sentado.png';
import margeAndando        from '@/assets/poses/marge-andando.png';
import margeApoiado        from '@/assets/poses/marge-apoiado.png';
import margeApontando      from '@/assets/poses/marge-apontando.png';
import margeDeCostas       from '@/assets/poses/marge-de-costas.png';

// Angle-specific images — each matches the actual camera angle concept
import homerAngleFrontal    from '@/assets/angles/homer-frontal.png';
import homerAngleTresQuartos from '@/assets/angles/homer-tres-quartos.png';
import homerAnglePerfil     from '@/assets/angles/homer-perfil.png';
import homerAngleLowAngle   from '@/assets/angles/homer-low-angle.png';
import homerAngleHighAngle  from '@/assets/angles/homer-high-angle.png';
import homerAngleDutchAngle from '@/assets/angles/homer-dutch-angle.png';

import margeAngleFrontal    from '@/assets/angles/marge-frontal.png';
import margeAngleTresQuartos from '@/assets/angles/marge-tres-quartos.png';
import margeAnglePerfil     from '@/assets/angles/marge-perfil.png';
import margeAngleLowAngle   from '@/assets/angles/marge-low-angle.png';
import margeAngleHighAngle  from '@/assets/angles/marge-high-angle.png';
import margeAngleDutchAngle from '@/assets/angles/marge-dutch-angle.png';

// ─── Avatar map: each chip → unique image per gender ─────────────────────────
const chipAvatarMap: Record<string, { homer: string; marge: string }> = {
  // EXPRESSÃO — uses new expression-specific images (all unique)
  'Sorrindo':    { homer: homerExprSorrindo,    marge: margeExprSorrindo    },
  'Sério':       { homer: homerExprSerio,       marge: margeExprSerio       },
  'Neutro':      { homer: homerExprNeutro,      marge: margeExprNeutro      },
  'Confiante':   { homer: homerExprConfiante,   marge: margeExprConfiante   },
  'Bravo':       { homer: homerExprBravo,       marge: margeExprBravo       },
  'Pensativo':   { homer: homerExprPensativo,   marge: margeExprPensativo   },
  'Determinado': { homer: homerExprDeterminado, marge: margeExprDeterminado },

  // ÂNGULO — imagens específicas para cada ângulo de câmera
  'Frontal':     { homer: homerAngleFrontal,     marge: margeAngleFrontal     },
  '3/4':         { homer: homerAngleTresQuartos, marge: margeAngleTresQuartos },
  'Perfil':      { homer: homerAnglePerfil,      marge: margeAnglePerfil      },
  'Low angle':   { homer: homerAngleLowAngle,    marge: margeAngleLowAngle    },
  'High angle':  { homer: homerAngleHighAngle,   marge: margeAngleHighAngle   },
  'Dutch angle': { homer: homerAngleDutchAngle,  marge: margeAngleDutchAngle  },

  // LENTE — 5 unique poses, none repeated
  '24mm':        { homer: homerAndando,         marge: margeAndando         },
  '35mm':        { homer: homerApoiado,         marge: margeApoiado         },
  '50mm':        { homer: homerMaosBolso,       marge: margeMaosBolso       },
  '85mm':        { homer: homerBracosCruzados,  marge: margeBracosCruzados  },
  '135mm':       { homer: homerPoseHeroica,     marge: margePoseHeroica     },

  // OLHAR — 6 unique poses, none repeated
  'Para câmera': { homer: homerApontando,       marge: margeApontando       },
  'Esquerda':    { homer: homerDeCostas,        marge: margeDeCostas        },
  'Direita':     { homer: homerApoiado,         marge: margeApoiado         },
  'Para cima':   { homer: homerPoseHeroica,     marge: margePoseHeroica     },
  'Para baixo':  { homer: homerSentado,         marge: margeSentado         },
  'Distante':    { homer: homerAndando,         marge: margeAndando         },
};

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const fieldMap: Record<string, { chip: keyof ProjectConfig; custom: keyof ProjectConfig }> = {
  expression:   { chip: 'expression',   custom: 'expressionCustom' },
  cameraAngle:  { chip: 'cameraAngle',  custom: 'cameraAngleCustom' },
  lens:         { chip: 'lens',         custom: 'lensCustom' },
  gazeDirection:{ chip: 'gazeDirection',custom: 'gazeDirectionCustom' },
};

export function CharacterDirectionSection({ config, onUpdate }: Props) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [customEnabled, setCustomEnabled] = useState<Record<string, boolean>>({});
  const isMasculino = config.gender === 'masculino';

  const getChipValue = (key: string) => config[fieldMap[key].chip] as string;
  const getCustomValue = (key: string) => config[fieldMap[key].custom] as string;

  const setChipValue = (key: string, val: string) => {
    onUpdate({ [fieldMap[key].chip]: val });
  };

  const setCustomValue = (key: string, val: string) => {
    onUpdate({ [fieldMap[key].custom]: val });
  };

  const toggleCustom = (key: string) => {
    const next = !customEnabled[key];
    setCustomEnabled(prev => ({ ...prev, [key]: next }));
    if (!next) onUpdate({ [fieldMap[key].custom]: '' });
  };

  const applyPreset = (preset: typeof directionPresets[0]) => {
    const patch: Partial<ProjectConfig> = {};
    for (const [key, val] of Object.entries(preset.values)) {
      if (fieldMap[key]) {
        (patch as any)[fieldMap[key].chip] = val;
        (patch as any)[fieldMap[key].custom] = '';
      }
    }
    onUpdate(patch);
  };

  const clearAll = () => {
    const patch: Partial<ProjectConfig> = {};
    for (const key of Object.keys(fieldMap)) {
      (patch as any)[fieldMap[key].chip] = '';
      (patch as any)[fieldMap[key].custom] = '';
    }
    onUpdate(patch);
    setCustomEnabled({});
  };

  const shuffleRandom = () => {
    const patch: Partial<ProjectConfig> = {};
    for (const group of directionGroups) {
      const randomChip = group.chips[Math.floor(Math.random() * group.chips.length)];
      (patch as any)[fieldMap[group.key].chip] = randomChip;
      (patch as any)[fieldMap[group.key].custom] = '';
    }
    onUpdate(patch);
  };

  const hasAnySelection = directionGroups.some(g => getChipValue(g.key) || getCustomValue(g.key));

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="sm"
          onClick={() => setPresetsOpen(!presetsOpen)}
          className="h-6 gap-1 text-[9px] font-semibold text-muted-foreground/60 hover:text-foreground px-2"
        >
          <Zap className="h-2.5 w-2.5" />
          Presets
          {presetsOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
        </Button>
        <Button
          variant="ghost" size="sm"
          onClick={shuffleRandom}
          className="h-6 gap-1 text-[9px] font-semibold text-muted-foreground/60 hover:text-foreground px-2"
        >
          <Shuffle className="h-2.5 w-2.5" />
          Surpreender
        </Button>
        {hasAnySelection && (
          <Button
            variant="ghost" size="sm"
            onClick={clearAll}
            className="h-6 gap-1 text-[9px] font-semibold text-destructive/50 hover:text-destructive px-2 ml-auto"
          >
            <X className="h-2.5 w-2.5" />
            Limpar
          </Button>
        )}
      </div>

      {/* Presets */}
      <AnimatePresence>
        {presetsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1 pb-2">
              {directionPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="flex flex-col items-start gap-0.5 rounded-md border border-border/15 bg-secondary/20 px-2 py-1.5 text-left transition-all hover:bg-primary/5 hover:border-primary/20"
                >
                  <span className="text-[9px] font-bold text-foreground/80">{preset.name}</span>
                  <span className="text-[8px] text-muted-foreground/50 leading-tight">{preset.description}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direction groups — card carousel */}
      <div className="space-y-5">
        {directionGroups.map((group) => (
          <ChipCardCarousel
            key={group.key}
            group={group}
            chipValue={getChipValue(group.key)}
            customValue={getCustomValue(group.key)}
            customEnabled={!!customEnabled[group.key]}
            isMasculino={isMasculino}
            onSelect={(val) => setChipValue(group.key, val)}
            onCustomChange={(val) => setCustomValue(group.key, val)}
            onToggleCustom={() => toggleCustom(group.key)}
          />
        ))}
      </div>

      {/* Summary */}
      {hasAnySelection && (
        <div className="rounded-md border border-border/12 bg-secondary/15 p-2 space-y-1">
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">Resumo</p>
          <div className="flex flex-wrap gap-1">
            {directionGroups.map((g) => {
              const val = getChipValue(g.key) || getCustomValue(g.key);
              if (!val) return null;
              return (
                <span
                  key={g.key}
                  className="inline-flex items-center gap-0.5 rounded-full bg-primary/8 border border-primary/15 px-2 py-0.5 text-[8px] font-medium text-primary/80"
                >
                  <span className="text-primary/40">{g.label}:</span> {val}
                  <button
                    onClick={() => onUpdate({ [fieldMap[g.key].chip]: '', [fieldMap[g.key].custom]: '' })}
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ChipCardCarousel({
  group,
  chipValue,
  customValue,
  customEnabled,
  isMasculino,
  onSelect,
  onCustomChange,
  onToggleCustom,
}: {
  group: DirectionGroup;
  chipValue: string;
  customValue: string;
  customEnabled: boolean;
  isMasculino: boolean;
  onSelect: (val: string) => void;
  onCustomChange: (val: string) => void;
  onToggleCustom: () => void;
}) {
  // Local index for navigation; sync to chipValue when defined
  const chips = group.chips;
  const selectedIdx = chips.indexOf(chipValue);
  const [navIdx, setNavIdx] = useState(selectedIdx >= 0 ? selectedIdx : 0);

  const currentChip = chips[navIdx];
  const avatarEntry = chipAvatarMap[currentChip];
  const avatarSrc = avatarEntry
    ? (isMasculino ? avatarEntry.homer : avatarEntry.marge)
    : (isMasculino ? homerExprNeutro : margeExprNeutro);

  const isSelected = chipValue === currentChip;

  const goNext = () => {
    const next = (navIdx + 1) % chips.length;
    setNavIdx(next);
    onSelect(chips[next]);
  };

  const goPrev = () => {
    const prev = (navIdx - 1 + chips.length) % chips.length;
    setNavIdx(prev);
    onSelect(chips[prev]);
  };

  const handleCardClick = () => {
    if (isSelected) {
      onSelect('');
    } else {
      onSelect(currentChip);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50">
          {group.label}
        </span>
        {/* Custom toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-muted-foreground/40">livre</span>
          <button
            type="button"
            onClick={onToggleCustom}
            className={cn(
              'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors duration-200',
              customEnabled ? 'bg-primary border-primary/60' : 'bg-secondary/60 border-border/30'
            )}
          >
            <span className={cn(
              'inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200',
              customEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
            )} />
          </button>
        </div>
      </div>

      {/* Card carousel */}
      <div className="relative flex items-center gap-2">
        {/* Prev arrow */}
        <button
          onClick={goPrev}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/40 border border-border/20 hover:bg-secondary/70 hover:border-border/40 transition-all"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Card */}
        <button
          onClick={handleCardClick}
          className={cn(
            'flex-1 relative rounded-xl overflow-hidden border transition-all duration-200',
            isSelected
              ? 'border-primary/50 shadow-[0_0_16px_hsl(var(--primary)/0.25)]'
              : 'border-border/20 hover:border-border/40'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={navIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              {/* Character image — fills the full card */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src={avatarSrc}
                  alt={currentChip}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </div>

              {/* Label overlay */}
              <div className={cn(
                'px-2 py-2 flex items-center justify-between transition-colors duration-200',
                isSelected ? 'bg-primary/20' : 'bg-secondary/40'
              )}>
                <p className={cn(
                  'text-[10px] font-semibold',
                  isSelected ? 'text-primary' : 'text-muted-foreground/70'
                )}>
                  {currentChip}
                </p>
                <span className="text-[8px] text-muted-foreground/40">
                  {navIdx + 1}/{chips.length}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[8px] text-primary-foreground font-bold">✓</span>
            </div>
          )}
        </button>

        {/* Next arrow */}
        <button
          onClick={goNext}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/40 border border-border/20 hover:bg-secondary/70 hover:border-border/40 transition-all"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1">
        {chips.map((_, i) => (
          <button
            key={i}
            onClick={() => { setNavIdx(i); onSelect(chips[i]); }}
            className={cn(
              'rounded-full transition-all duration-200',
              i === navIdx
                ? 'w-3 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-border/40 hover:bg-border/70'
            )}
          />
        ))}
      </div>

      {/* Custom text field */}
      <AnimatePresence>
        {customEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              value={customValue}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder={group.placeholder}
              className="w-full h-7 rounded-md border border-primary/20 bg-primary/5 px-2 text-[9px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all mt-1"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
