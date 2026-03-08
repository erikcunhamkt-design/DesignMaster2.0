import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { directionGroups, directionPresets, DirectionGroup } from '@/data/characterDirectionData';
import { Shuffle, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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

// Emoji maps for visual clarity without character images
const chipEmojiMap: Record<string, string> = {
  // Expressions
  'Sorrindo': '😊', 'Sério': '😐', 'Neutro': '😶', 'Confiante': '😎',
  'Bravo': '😠', 'Pensativo': '🤔', 'Determinado': '😤',
  // Angles
  'Frontal': '🎯', '3/4': '↗️', 'Perfil': '➡️',
  'Low angle': '⬆️', 'High angle': '⬇️', 'Dutch angle': '↩️',
  // Lenses
  '24mm': '🔭', '35mm': '📷', '50mm': '📸', '85mm': '🖼️', '135mm': '🔍',
  // Gaze
  'Para câmera': '👁️', 'Esquerda': '👈', 'Direita': '👉',
  'Para cima': '👆', 'Para baixo': '👇', 'Distante': '🌅',
};

export function CharacterDirectionSection({ config, onUpdate }: Props) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [customEnabled, setCustomEnabled] = useState<Record<string, boolean>>({});

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

      {/* Direction groups — chip grid */}
      <div className="space-y-4">
        {directionGroups.map((group) => (
          <ChipGridSection
            key={group.key}
            group={group}
            chipValue={getChipValue(group.key)}
            customValue={getCustomValue(group.key)}
            customEnabled={!!customEnabled[group.key]}
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

function ChipGridSection({
  group,
  chipValue,
  customValue,
  customEnabled,
  onSelect,
  onCustomChange,
  onToggleCustom,
}: {
  group: DirectionGroup;
  chipValue: string;
  customValue: string;
  customEnabled: boolean;
  onSelect: (val: string) => void;
  onCustomChange: (val: string) => void;
  onToggleCustom: () => void;
}) {
  const chips = group.chips;

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50">
          {group.label}
        </span>
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

      {/* Chip grid */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const isActive = chipValue === chip;
          const emoji = chipEmojiMap[chip];
          return (
            <button
              key={chip}
              onClick={() => onSelect(isActive ? '' : chip)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium border transition-all duration-200',
                isActive
                  ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
                  : 'bg-secondary/20 border-border/15 text-muted-foreground/60 hover:border-primary/20 hover:text-foreground hover:bg-primary/5'
              )}
            >
              {emoji && <span className="text-xs">{emoji}</span>}
              {chip}
            </button>
          );
        })}
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
