import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { directionGroups, directionPresets, smartTips, DirectionGroup } from '@/data/characterDirectionData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Shuffle, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

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
          onChipSelect={(val) => setChipValue(group.key, val)}
          onCustomChange={(val) => setCustomValue(group.key, val)}
          tipExpanded={expandedTip === group.key}
          onToggleTip={() => setExpandedTip(expandedTip === group.key ? null : group.key)}
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
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50">{group.label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onToggleTip} className="text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                <Info className="h-2.5 w-2.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[9px] max-w-[180px]">
              {group.tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <AnimatePresence>
        {tipExpanded && smartTips[group.key] && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-[8px] text-primary/50 bg-primary/3 rounded-md px-2 py-1 border border-primary/8"
          >
            💡 {smartTips[group.key]}
          </motion.p>
        )}
      </AnimatePresence>

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

      <input
        type="text"
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={group.placeholder}
        className="w-full h-6 rounded-md border border-border/15 bg-secondary/20 px-2 text-[9px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/20 transition-all"
      />
    </div>
  );
}
