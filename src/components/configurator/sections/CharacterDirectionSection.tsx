import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { directionGroups, directionPresets, smartTips, DirectionGroup } from '@/data/characterDirectionData';
import { Info, Shuffle, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Homer avatars (reuse existing pose images as character reference)
import genderMale from '@/assets/gender-male.png';
import genderFemale from '@/assets/gender-female.png';

// Homer poses (used as character illustrations per chip)
import homerBracosCruzados from '@/assets/poses/homer-bracos-cruzados.png';
import homerMaosBolso from '@/assets/poses/homer-maos-bolso.png';
import homerPoseHeroica from '@/assets/poses/homer-pose-heroica.png';
import homerSentado from '@/assets/poses/homer-sentado.png';
import homerAndando from '@/assets/poses/homer-andando.png';
import homerApoiado from '@/assets/poses/homer-apoiado.png';
import homerApontando from '@/assets/poses/homer-apontando.png';

// Marge poses
import margeBracosCruzados from '@/assets/poses/marge-bracos-cruzados.png';
import margeMaosBolso from '@/assets/poses/marge-maos-bolso.png';
import margePoseHeroica from '@/assets/poses/marge-pose-heroica.png';
import margeSentado from '@/assets/poses/marge-sentado.png';
import margeAndando from '@/assets/poses/marge-andando.png';
import margeApoiado from '@/assets/poses/marge-apoiado.png';
import margeApontando from '@/assets/poses/marge-apontando.png';

// Character illustrations for each group option
// We map chip labels to avatar expressions using existing pose assets as proxies
const chipAvatarMap: Record<string, { homer: string; marge: string }> = {
  // Expression chips — use different poses to suggest mood
  'Sorrindo':      { homer: homerApontando,      marge: margeApontando },
  'Sério':         { homer: homerBracosCruzados,  marge: margeBracosCruzados },
  'Neutro':        { homer: homerMaosBolso,        marge: margeMaosBolso },
  'Confiante':     { homer: homerPoseHeroica,      marge: margePoseHeroica },
  'Bravo':         { homer: homerBracosCruzados,  marge: margeBracosCruzados },
  'Pensativo':     { homer: homerSentado,          marge: margeSentado },
  'Determinado':   { homer: homerPoseHeroica,      marge: margePoseHeroica },
  // Camera angle chips
  'Frontal':       { homer: homerApontando,        marge: margeApontando },
  '3/4':           { homer: homerApoiado,          marge: margeApoiado },
  'Perfil':        { homer: homerAndando,          marge: margeAndando },
  'Low angle':     { homer: homerPoseHeroica,      marge: margePoseHeroica },
  'High angle':    { homer: homerSentado,          marge: margeSentado },
  'Dutch angle':   { homer: homerAndando,          marge: margeAndando },
  // Lens chips — use neutral poses
  '24mm':          { homer: homerAndando,          marge: margeAndando },
  '35mm':          { homer: homerApoiado,          marge: margeApoiado },
  '50mm':          { homer: homerMaosBolso,        marge: margeMaosBolso },
  '85mm':          { homer: homerApontando,        marge: margeApontando },
  '135mm':         { homer: homerBracosCruzados,  marge: margeBracosCruzados },
  // Gaze chips
  'Para câmera':   { homer: homerApontando,        marge: margeApontando },
  'Esquerda':      { homer: homerAndando,          marge: margeAndando },
  'Direita':       { homer: homerApoiado,          marge: margeApoiado },
  'Para cima':     { homer: homerPoseHeroica,      marge: margePoseHeroica },
  'Para baixo':    { homer: homerSentado,          marge: margeSentado },
  'Distante':      { homer: homerDeCostas,         marge: margeDeCostas },
};

// need to import de-costas separately
import homerDeCostas from '@/assets/poses/homer-de-costas.png';
import margeDeCostas from '@/assets/poses/marge-de-costas.png';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const fieldMap: Record<string, { chip: keyof ProjectConfig; custom: keyof ProjectConfig }> = {
  expression: { chip: 'expression', custom: 'expressionCustom' },
  cameraAngle: { chip: 'cameraAngle', custom: 'cameraAngleCustom' },
  lens: { chip: 'lens', custom: 'lensCustom' },
  gazeDirection: { chip: 'gazeDirection', custom: 'gazeDirectionCustom' },
};

export function CharacterDirectionSection({ config, onUpdate }: Props) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [customEnabled, setCustomEnabled] = useState<Record<string, boolean>>({});

  const isMasculino = config.gender === 'masculino';

  const getChipValue = (key: string) => config[fieldMap[key].chip] as string;
  const getCustomValue = (key: string) => config[fieldMap[key].custom] as string;

  const setChipValue = (key: string, val: string) => {
    const current = getChipValue(key);
    onUpdate({ [fieldMap[key].chip]: current === val ? '' : val });
  };

  const setCustomValue = (key: string, val: string) => {
    onUpdate({ [fieldMap[key].custom]: val });
  };

  const toggleCustom = (key: string) => {
    const next = !customEnabled[key];
    setCustomEnabled(prev => ({ ...prev, [key]: next }));
    if (!next) {
      // clear custom text when toggling off
      onUpdate({ [fieldMap[key].custom]: '' });
    }
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

  const hasAnySelection = directionGroups.some(
    (g) => getChipValue(g.key) || getCustomValue(g.key)
  );

  // Selected chip avatar for the header
  const selectedChips = directionGroups
    .map(g => getChipValue(g.key))
    .filter(Boolean);

  const headerAvatarChip = selectedChips[0];
  const headerAvatar = headerAvatarChip && chipAvatarMap[headerAvatarChip]
    ? (isMasculino ? chipAvatarMap[headerAvatarChip].homer : chipAvatarMap[headerAvatarChip].marge)
    : (isMasculino ? genderMale : genderFemale);

  return (
    <div className="space-y-3">
      {/* Actions bar */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPresetsOpen(!presetsOpen)}
          className="h-6 gap-1 text-[9px] font-semibold text-muted-foreground/60 hover:text-foreground px-2"
        >
          <Zap className="h-2.5 w-2.5" />
          Presets
          {presetsOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={shuffleRandom}
          className="h-6 gap-1 text-[9px] font-semibold text-muted-foreground/60 hover:text-foreground px-2"
        >
          <Shuffle className="h-2.5 w-2.5" />
          Surpreender
        </Button>
        {hasAnySelection && (
          <Button
            variant="ghost"
            size="sm"
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

      {/* Direction groups */}
      {directionGroups.map((group) => (
        <DirectionGroupUI
          key={group.key}
          group={group}
          chipValue={getChipValue(group.key)}
          customValue={getCustomValue(group.key)}
          customEnabled={!!customEnabled[group.key]}
          isMasculino={isMasculino}
          onChipSelect={(val) => setChipValue(group.key, val)}
          onCustomChange={(val) => setCustomValue(group.key, val)}
          onToggleCustom={() => toggleCustom(group.key)}
        />
      ))}

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
                    onClick={() => {
                      onUpdate({ [fieldMap[g.key].chip]: '', [fieldMap[g.key].custom]: '' });
                    }}
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

function DirectionGroupUI({
  group,
  chipValue,
  customValue,
  customEnabled,
  isMasculino,
  onChipSelect,
  onCustomChange,
  onToggleCustom,
}: {
  group: DirectionGroup;
  chipValue: string;
  customValue: string;
  customEnabled: boolean;
  isMasculino: boolean;
  onChipSelect: (val: string) => void;
  onCustomChange: (val: string) => void;
  onToggleCustom: () => void;
}) {
  // Determine avatar to show: selected chip avatar, or neutral gender avatar
  const avatarEntry = chipValue && chipAvatarMap[chipValue] ? chipAvatarMap[chipValue] : null;
  const avatarSrc = avatarEntry
    ? (isMasculino ? avatarEntry.homer : avatarEntry.marge)
    : (isMasculino ? genderMale : genderFemale);

  return (
    <div className="space-y-1.5">
      {/* Group header with avatar preview */}
      <div className="flex items-center gap-2">
        {/* Mini avatar */}
        <div className={cn(
          'shrink-0 h-7 w-7 rounded-full overflow-hidden border transition-all duration-300',
          chipValue
            ? 'border-primary/40 shadow-[0_0_6px_hsl(var(--primary)/0.2)]'
            : 'border-border/20'
        )}>
          <img
            src={avatarSrc}
            alt="personagem"
            className="h-full w-full object-cover object-top"
          />
        </div>

        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50">{group.label}</span>
          {chipValue && (
            <span className="text-[9px] text-primary/70 font-medium truncate">— {chipValue}</span>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/30 hover:text-muted-foreground transition-colors ml-0.5">
                  <Info className="h-2.5 w-2.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[9px] max-w-[180px]">
                {group.tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Custom text toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[8px] text-muted-foreground/40">livre</span>
          <button
            type="button"
            onClick={onToggleCustom}
            className={cn(
              'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors duration-200',
              customEnabled
                ? 'bg-primary border-primary/60'
                : 'bg-secondary/60 border-border/30'
            )}
          >
            <span className={cn(
              'inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200',
              customEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
            )} />
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1">
        {group.chips.map((chip) => (
          <button
            key={chip}
            onClick={() => onChipSelect(chip)}
            className={cn(
              'rounded-full px-2 py-0.5 text-[9px] font-medium transition-all duration-150 border',
              chipValue === chip
                ? 'bg-primary/12 text-primary border-primary/25 shadow-[0_0_6px_hsl(var(--primary)/0.1)]'
                : 'bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Custom text field (toggle-controlled) */}
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
              className="w-full h-7 rounded-md border border-primary/20 bg-primary/5 px-2 text-[9px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
