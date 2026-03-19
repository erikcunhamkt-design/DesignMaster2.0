import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { cn } from '@/lib/utils';
import { ProjectConfig } from '@/types/project';
import { AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const TEXT_POSITIONS = [
  { value: 'topo' as const, label: 'Topo', icon: AlignStartVertical },
  { value: 'centro' as const, label: 'Centro', icon: AlignCenterVertical },
  { value: 'rodape' as const, label: 'Rodapé', icon: AlignEndVertical },
];

const FONT_STYLES = [
  {
    value: 'sans-serif',
    label: 'Sans-serif',
    preview: 'Abc',
    fontClass: 'font-sans',
    desc: 'Clean & moderna',
    promptHint: 'clean modern sans-serif typography like Helvetica or Montserrat',
  },
  {
    value: 'serif',
    label: 'Serif',
    preview: 'Abc',
    fontClass: 'font-serif',
    desc: 'Elegante & clássica',
    promptHint: 'elegant serif typography like Times New Roman or Playfair Display',
  },
  {
    value: 'script',
    label: 'Script',
    preview: 'Abc',
    fontClass: 'italic',
    desc: 'Cursiva & orgânica',
    promptHint: 'flowing cursive script handwritten calligraphy typography',
  },
  {
    value: 'display',
    label: 'Display',
    preview: 'ABC',
    fontClass: 'font-sans font-black tracking-widest uppercase',
    desc: 'Impactante & bold',
    promptHint: 'bold heavy display typography, extra bold impact font, thick strong lettering',
  },
  {
    value: 'graffiti',
    label: 'Graffiti',
    preview: 'Abc',
    fontClass: 'font-sans font-extrabold italic',
    desc: 'Urbano & street',
    promptHint: 'urban graffiti street art spray paint lettering style typography',
  },
];

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
        <div className="space-y-2">
          <VoiceTextField
            placeholder="Headline"
            value={config.text01}
            onChange={(v) => onUpdate({ text01: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
          <VoiceTextField
            placeholder="Subheadline"
            value={config.text02}
            onChange={(v) => onUpdate({ text02: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
          <VoiceTextField
            placeholder="CTA"
            value={config.cta}
            onChange={(v) => onUpdate({ cta: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />

          {/* Estilo de Fonte */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Estilo da Fonte</span>
            <div className="grid grid-cols-5 gap-1">
              {FONT_STYLES.map((f) => {
                const selected = config.fontStyle === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => onUpdate({ fontStyle: config.fontStyle === f.value ? '' : f.value })}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-all duration-200 border',
                      selected
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_-3px_hsl(var(--primary)/0.3)]'
                        : 'bg-secondary/20 text-muted-foreground/70 hover:text-foreground hover:border-border/40 border-transparent'
                    )}
                  >
                    <span className={cn('text-[15px] leading-none', f.fontClass)}>{f.preview}</span>
                    <span className="text-[7px] font-semibold leading-none mt-0.5">{f.label}</span>
                    <span className="text-[6px] leading-none text-muted-foreground/40">{f.desc}</span>
                  </button>
                );
              })}
            </div>
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
  return FONT_STYLES.find(f => f.value === fontStyle)?.promptHint ?? '';
}
