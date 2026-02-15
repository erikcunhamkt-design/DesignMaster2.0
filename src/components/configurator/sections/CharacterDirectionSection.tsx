import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { directionGroups, directionPresets, smartTips, DirectionGroup } from '@/data/characterDirectionData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Shuffle, Sparkles, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

// Maps group key to config field names
const fieldMap: Record<string, { chip: keyof ProjectConfig; custom: keyof ProjectConfig }> = {
  expression: { chip: 'expression', custom: 'expressionCustom' },
  pose: { chip: 'pose', custom: 'poseCustom' },
  cameraAngle: { chip: 'cameraAngle', custom: 'cameraAngleCustom' },
  lens: { chip: 'lens', custom: 'lensCustom' },
  gazeDirection: { chip: 'gazeDirection', custom: 'gazeDirectionCustom' },
};

export function CharacterDirectionSection({ config, onUpdate }: Props) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const getChipValue = (key: string) => config[fieldMap[key].chip] as string;
  const getCustomValue = (key: string) => config[fieldMap[key].custom] as string;

  const setChipValue = (key: string, val: string) => {
    const current = getChipValue(key);
    onUpdate({ [fieldMap[key].chip]: current === val ? '' : val });
  };

  const setCustomValue = (key: string, val: string) => {
    onUpdate({ [fieldMap[key].custom]: val });
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

  const activeCount = directionGroups.filter(
    (g) => getChipValue(g.key) || getCustomValue(g.key)
  ).length;

  return (
    <div className="space-y-4">
      {/* Presets & Actions bar */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPresetsOpen(!presetsOpen)}
          className="h-7 gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground px-2"
        >
          <Zap className="h-3 w-3" />
          Presets
          {presetsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={shuffleRandom}
          className="h-7 gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground px-2"
        >
          <Shuffle className="h-3 w-3" />
          Surpreender
        </Button>
        {hasAnySelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 gap-1.5 text-[10px] font-semibold text-destructive/70 hover:text-destructive px-2 ml-auto"
          >
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Presets panel */}
      <AnimatePresence>
        {presetsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1.5 pb-2">
              {directionPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="flex flex-col items-start gap-0.5 rounded-lg border border-border/30 bg-muted/50 px-2.5 py-2 text-left transition-all hover:bg-primary/10 hover:border-primary/30"
                >
                  <span className="text-[10px] font-bold text-foreground">{preset.name}</span>
                  <span className="text-[9px] text-muted-foreground leading-tight">{preset.description}</span>
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
          onChipSelect={(val) => setChipValue(group.key, val)}
          onCustomChange={(val) => setCustomValue(group.key, val)}
          tipExpanded={expandedTip === group.key}
          onToggleTip={() => setExpandedTip(expandedTip === group.key ? null : group.key)}
        />
      ))}

      {/* Summary */}
      {hasAnySelection && (
        <div className="rounded-lg border border-border/20 bg-muted/30 p-2.5 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Resumo da Direção</p>
          <div className="flex flex-wrap gap-1">
            {directionGroups.map((g) => {
              const val = getChipValue(g.key) || getCustomValue(g.key);
              if (!val) return null;
              return (
                <span
                  key={g.key}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-medium text-primary"
                >
                  <span className="text-primary/60">{g.label}:</span> {val}
                  <button
                    onClick={() => {
                      onUpdate({ [fieldMap[g.key].chip]: '', [fieldMap[g.key].custom]: '' });
                    }}
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
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

// ── Individual group component ──
function DirectionGroupUI({
  group,
  chipValue,
  customValue,
  onChipSelect,
  onCustomChange,
  tipExpanded,
  onToggleTip,
}: {
  group: DirectionGroup;
  chipValue: string;
  customValue: string;
  onChipSelect: (val: string) => void;
  onCustomChange: (val: string) => void;
  tipExpanded: boolean;
  onToggleTip: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{group.label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onToggleTip} className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px] max-w-[200px]">
              {group.tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Smart tip */}
      <AnimatePresence>
        {tipExpanded && smartTips[group.key] && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-[9px] text-primary/70 bg-primary/5 rounded-md px-2 py-1.5 border border-primary/10"
          >
            💡 {smartTips[group.key]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Chips */}
      <div className="flex flex-wrap gap-1">
        {group.chips.map((chip) => (
          <button
            key={chip}
            onClick={() => onChipSelect(chip)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-200 border',
              chipValue === chip
                ? 'bg-primary/15 text-primary border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
                : 'bg-muted/60 text-muted-foreground border-border/20 hover:bg-muted hover:text-foreground hover:border-border/40'
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Custom text input */}
      <input
        type="text"
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={group.placeholder}
        className="w-full h-7 rounded-md border border-border/20 bg-muted/40 px-2.5 text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/30 transition-all"
      />
    </div>
  );
}
