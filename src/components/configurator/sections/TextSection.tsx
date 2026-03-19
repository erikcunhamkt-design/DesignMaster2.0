import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { AlignStartVertical, AlignCenterVertical, AlignEndVertical, ChevronDown, Palette, Type } from 'lucide-react';

const TEXT_SIZES = [
  { value: 'pequeno' as const, label: 'P', promptHint: 'small subtle text size' },
  { value: 'medio' as const, label: 'M', promptHint: 'medium standard text size' },
  { value: 'grande' as const, label: 'G', promptHint: 'large bold prominent text size' },
];

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const TEXT_POSITIONS = [
  { value: 'topo' as const, label: 'Topo', icon: AlignStartVertical },
  { value: 'centro' as const, label: 'Centro', icon: AlignCenterVertical },
  { value: 'rodape' as const, label: 'Rodapé', icon: AlignEndVertical },
];

export const FONT_STYLES = [
  {
    value: 'sans-serif',
    label: 'Sans-serif',
    preview: 'Abc',
    fontClass: 'font-sans',
    promptHint: 'clean modern sans-serif typography like Helvetica or Montserrat',
  },
  {
    value: 'serif',
    label: 'Serif',
    preview: 'Abc',
    fontClass: 'font-serif',
    promptHint: 'elegant serif typography like Times New Roman or Playfair Display',
  },
  {
    value: 'script',
    label: 'Script',
    preview: 'Abc',
    fontClass: 'italic',
    promptHint: 'flowing cursive script handwritten calligraphy typography',
  },
  {
    value: 'display',
    label: 'Display',
    preview: 'ABC',
    fontClass: 'font-sans font-black tracking-widest uppercase',
    promptHint: 'bold heavy display typography, extra bold impact font, thick strong lettering',
  },
  {
    value: 'graffiti',
    label: 'Graffiti',
    preview: 'Abc',
    fontClass: 'font-sans font-extrabold italic',
    promptHint: 'urban graffiti street art spray paint lettering style typography',
  },
  {
    value: 'retro',
    label: 'Retro',
    preview: 'Abc',
    fontClass: 'font-serif italic tracking-wide',
    promptHint: 'retro vintage 70s groovy typography with warm nostalgic lettering',
  },
  {
    value: 'neon',
    label: 'Neon',
    preview: 'Abc',
    fontClass: 'font-sans font-bold tracking-wider',
    promptHint: 'glowing neon sign typography with luminous light tube lettering effect',
  },
  {
    value: 'stencil',
    label: 'Stencil',
    preview: 'ABC',
    fontClass: 'font-sans font-black uppercase tracking-[0.2em]',
    promptHint: 'military stencil cut-out typography, bold stamped industrial lettering',
  },
  {
    value: 'brush',
    label: 'Brush',
    preview: 'Abc',
    fontClass: 'font-sans font-extrabold italic skew-x-[-6deg]',
    promptHint: 'dynamic brush stroke hand-painted ink typography with textured edges',
  },
  {
    value: 'gothic',
    label: 'Gothic',
    preview: 'Abc',
    fontClass: 'font-serif font-black tracking-tight',
    promptHint: 'dark gothic blackletter medieval calligraphy typography, old english ornate lettering',
  },
  {
    value: 'pixel',
    label: 'Pixel Art',
    preview: 'Abc',
    fontClass: 'font-mono font-bold tracking-widest',
    promptHint: '8-bit pixel art retro video game bitmap typography, blocky pixelated lettering',
  },
  {
    value: 'art-deco',
    label: 'Art Deco',
    preview: 'Abc',
    fontClass: 'font-serif font-semibold tracking-[0.15em] uppercase',
    promptHint: 'art deco 1920s glamorous geometric typography, elegant gatsby-era decorative lettering',
  },
  {
    value: 'handwritten',
    label: 'Handwritten',
    preview: 'Abc',
    fontClass: 'italic font-medium',
    promptHint: 'casual handwritten natural pen ink typography, authentic hand-lettered organic style',
  },
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#F5F5F5', '#1A1A1A',
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
];

/** Inline color picker */
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] transition-all',
          value
            ? 'text-primary/80'
            : 'text-muted-foreground/40 hover:text-muted-foreground/60'
        )}
      >
        {value ? (
          <span
            className="h-3 w-3 rounded-full border border-border/40"
            style={{ backgroundColor: value }}
          />
        ) : (
          <Palette className="h-2.5 w-2.5" />
        )}
        <ChevronDown className={cn('h-2 w-2 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-0.5 flex flex-col gap-1.5 rounded-md border border-border/30 bg-background p-1.5 shadow-lg">
          <div className="grid grid-cols-6 gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(value === c ? '' : c); setOpen(false); }}
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-all',
                  value === c ? 'border-primary scale-110' : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="color"
            value={value || '#FFFFFF'}
            onChange={(e) => { onChange(e.target.value); setOpen(false); }}
            className="h-5 w-full cursor-pointer rounded border-none bg-transparent"
          />
          {value && (
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-[7px] text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Inline text size selector */
function SizePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {TEXT_SIZES.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(active ? '' : s.value)}
            className={cn(
              'px-1.5 py-0.5 rounded text-[8px] font-bold transition-all border',
              active
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground/40 hover:text-muted-foreground/60 border-transparent'
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** Mini inline font picker that expands below the text field */
function FontPicker({
  value,
  onChange,
  label,
  colorValue,
  onColorChange,
  sizeValue,
  onSizeChange,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  colorValue: string;
  onColorChange: (v: string) => void;
  sizeValue: string;
  onSizeChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = FONT_STYLES.find((f) => f.value === value);

  return (
    <div className="space-y-0.5">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] transition-all flex-1',
            selected
              ? 'text-primary/80'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60'
          )}
        >
          {selected ? (
            <span className={cn('text-[10px]', selected.fontClass)}>{selected.label}</span>
          ) : (
            <span>Fonte {label}</span>
          )}
          <ChevronDown className={cn('h-2 w-2 ml-auto transition-transform', open && 'rotate-180')} />
        </button>
        <SizePicker value={sizeValue} onChange={onSizeChange} />
        <ColorPicker value={colorValue} onChange={onColorChange} />
      </div>

      {open && (
        <div className="flex gap-1 flex-wrap px-1 pb-1">
          {FONT_STYLES.map((f) => {
            const active = value === f.value;
            return (
              <button
                key={f.value}
                onClick={() => {
                  onChange(active ? '' : f.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex flex-col items-center gap-0 rounded-md px-2 py-1.5 transition-all duration-150 border min-w-[48px]',
                  active
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-secondary/15 text-muted-foreground/60 hover:text-foreground border-transparent hover:border-border/30'
                )}
              >
                <span className={cn('text-[13px] leading-tight', f.fontClass)}>{f.preview}</span>
                <span className="text-[6px] font-medium leading-none mt-0.5">{f.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        <div className="space-y-1.5">
          {/* Headline + font */}
          <div className="space-y-0">
            <VoiceTextField
              placeholder="Headline"
              value={config.text01}
              onChange={(v) => onUpdate({ text01: v })}
              className="h-7 bg-secondary/30 border-border/20 text-[10px]"
            />
            <FontPicker
              value={config.fontStyleHeadline}
              onChange={(v) => onUpdate({ fontStyleHeadline: v })}
              label="headline"
              colorValue={config.textColorHeadline}
              onColorChange={(v) => onUpdate({ textColorHeadline: v })}
              sizeValue={config.textSizeHeadline}
              onSizeChange={(v) => onUpdate({ textSizeHeadline: v as any })}
            />
          </div>

          {/* Subheadline + font */}
          <div className="space-y-0">
            <VoiceTextField
              placeholder="Subheadline"
              value={config.text02}
              onChange={(v) => onUpdate({ text02: v })}
              className="h-7 bg-secondary/30 border-border/20 text-[10px]"
            />
            <FontPicker
              value={config.fontStyleSubheadline}
              onChange={(v) => onUpdate({ fontStyleSubheadline: v })}
              label="sub"
              colorValue={config.textColorSubheadline}
              onColorChange={(v) => onUpdate({ textColorSubheadline: v })}
              sizeValue={config.textSizeSubheadline}
              onSizeChange={(v) => onUpdate({ textSizeSubheadline: v as any })}
            />
          </div>

          {/* CTA + font */}
          <div className="space-y-0">
            <VoiceTextField
              placeholder="CTA"
              value={config.cta}
              onChange={(v) => onUpdate({ cta: v })}
              className="h-7 bg-secondary/30 border-border/20 text-[10px]"
            />
            <FontPicker
              value={config.fontStyleCta}
              onChange={(v) => onUpdate({ fontStyleCta: v })}
              label="CTA"
              colorValue={config.textColorCta}
              onColorChange={(v) => onUpdate({ textColorCta: v })}
            />
          </div>

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

/** Helper to get the prompt hint for a given fontStyle value */
export function getFontStylePromptHint(fontStyle: string): string {
  return FONT_STYLES.find((f) => f.value === fontStyle)?.promptHint ?? '';
}
