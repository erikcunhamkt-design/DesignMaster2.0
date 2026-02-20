import { useState, useRef } from 'react';
import { MockupConfig } from '@/types/mockupConfig';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { FreePromptBlock } from '@/components/configurator/FreePromptBlock';
import {
  Sparkles, Loader2, ChevronDown, Package, Smartphone,
  Palette, Type, Settings2, Layers, Plus, X, Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  config: MockupConfig;
  onUpdate: (patch: Partial<MockupConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
}

// ── CollapsibleBlock ──────────────────────────────────────────────────────
function CollapsibleBlock({
  icon: Icon, title, subtitle, defaultOpen = false, children, accent,
}: {
  icon?: React.ElementType; title: string; subtitle?: string;
  defaultOpen?: boolean; children: React.ReactNode; accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300',
      open ? 'border-border/20 bg-card/30' : 'border-border/10 bg-card/10 hover:border-border/20 hover:bg-card/20'
    )}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        {Icon && (
          <div className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300',
            open ? accent ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground/70' : 'bg-secondary/50 text-muted-foreground/50'
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-semibold tracking-wide transition-colors duration-200', open ? 'text-foreground' : 'text-foreground/60')}>
            {title}
          </p>
          {subtitle && <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/30 transition-transform duration-300 shrink-0', open && 'rotate-180 text-muted-foreground/60')} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="h-px w-full bg-border/10 mb-3.5" />
          {children}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">{children}</p>;
}

// ── Product Section ────────────────────────────────────────────────────────
function ProductSection({ config, onUpdate }: { config: MockupConfig; onUpdate: (p: Partial<MockupConfig>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const types: { id: MockupConfig['mockupType']; label: string; icon: string }[] = [
    { id: 'produto_fisico', label: 'Produto físico', icon: '📦' },
    { id: 'embalagem',      label: 'Embalagem',       icon: '🎁' },
    { id: 'dispositivo',    label: 'Dispositivo',      icon: '📱' },
    { id: 'papelaria',      label: 'Papelaria',        icon: '📄' },
    { id: 'social_media',   label: 'Social Media',     icon: '🖼️' },
    { id: 'branding',       label: 'Branding',         icon: '✨' },
  ];

  const objects: { id: MockupConfig['mockupObject']; label: string; icon: string }[] = [
    { id: 'caixa_embalagem',    label: 'Caixa',        icon: '📦' },
    { id: 'garrafa_lata',       label: 'Garrafa/Lata', icon: '🍶' },
    { id: 'camiseta_vestuario', label: 'Camiseta',     icon: '👕' },
    { id: 'smartphone_tela',    label: 'Smartphone',   icon: '📱' },
    { id: 'livro_revista',      label: 'Livro/Revista',icon: '📖' },
    { id: 'notebook_tablet',    label: 'Notebook',     icon: '💻' },
    { id: 'caneca_copo',        label: 'Caneca/Copo',  icon: '☕' },
    { id: 'sacola_bag',         label: 'Sacola/Bag',   icon: '🛍️' },
    { id: 'produto_generico',   label: 'Genérico',     icon: '🎯' },
  ];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(f => {
      const url = URL.createObjectURL(f);
      onUpdate({ designPhotos: [...config.designPhotos, url] });
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />

      {/* Type */}
      <div>
        <Label>Tipo de mockup</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {types.map(t => (
            <button key={t.id} onClick={() => onUpdate({ mockupType: t.id })}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left border transition-all duration-150',
                config.mockupType === t.id
                  ? 'bg-primary/12 border-primary/30 text-primary'
                  : 'bg-secondary/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <span className="text-base">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Object */}
      <div>
        <Label>Objeto principal</Label>
        <div className="grid grid-cols-3 gap-1">
          {objects.map(o => (
            <button key={o.id} onClick={() => onUpdate({ mockupObject: o.id })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg py-2 text-[9px] font-medium border transition-all duration-150',
                config.mockupObject === o.id
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <span className="text-base">{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt extra */}
      <div>
        <Label>Prompt Extra</Label>
        <VoiceTextField
          textarea
          placeholder="Instruções adicionais de mockup..."
          value={config.additionalPrompt}
          onChange={(v) => onUpdate({ additionalPrompt: v })}
          className="min-h-[52px] resize-none bg-secondary/30 border-border/20 text-[10px]"
        />
      </div>

      {/* Upload */}
      <div>
        <Label>Upload do design / arte</Label>
        {config.designPhotos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {config.designPhotos.map((url, i) => (
              <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/30 group">
                <img src={url} alt={`Design ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => onUpdate({ designPhotos: config.designPhotos.filter((_, j) => j !== i) })}
                  className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => fileInputRef.current?.click()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Upload Logo / Design</span>
        </button>
      </div>
    </div>
  );
}

// ── Scene Section ──────────────────────────────────────────────────────────
function SceneSection({ config, onUpdate }: { config: MockupConfig; onUpdate: (p: Partial<MockupConfig>) => void }) {
  const scenes: { id: MockupConfig['scene']; label: string; icon: string }[] = [
    { id: 'estudio_clean',        label: 'Estúdio clean',    icon: '⬜' },
    { id: 'mesa_trabalho',        label: 'Mesa de trabalho', icon: '🖥️' },
    { id: 'ambiente_urbano',      label: 'Urbano',           icon: '🏙️' },
    { id: 'lifestyle',            label: 'Lifestyle',        icon: '✨' },
    { id: 'fundo_neutro',         label: 'Fundo neutro',     icon: '🔘' },
    { id: 'fundo_escuro_premium', label: 'Fundo escuro',     icon: '⬛' },
  ];

  const angles: { id: MockupConfig['angle']; label: string; icon: string }[] = [
    { id: 'frente',       label: 'Frente',   icon: '⬛' },
    { id: 'tres_quartos', label: '3/4',      icon: '◥' },
    { id: 'superior',     label: 'Superior', icon: '⬆️' },
    { id: 'close',        label: 'Close',    icon: '🔍' },
    { id: 'flat_lay',     label: 'Flat lay', icon: '📐' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <Label>Cena / Contexto</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {scenes.map(s => (
            <button key={s.id} onClick={() => onUpdate({ scene: s.id })}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left border transition-all duration-150',
                config.scene === s.id
                  ? 'bg-primary/12 border-primary/30 text-primary'
                  : 'bg-secondary/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <span>{s.icon}</span>
              <span className="text-[10px] font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Ângulo / Perspectiva</Label>
        <div className="grid grid-cols-5 gap-1">
          {angles.map(a => (
            <button key={a.id} onClick={() => onUpdate({ angle: a.id })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md py-2 text-[9px] font-medium border transition-all duration-150',
                config.angle === a.id
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              <span className="text-sm">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Lighting Section ───────────────────────────────────────────────────────
function LightingSection({ config, onUpdate }: { config: MockupConfig; onUpdate: (p: Partial<MockupConfig>) => void }) {
  const lightings: { id: MockupConfig['lighting']; label: string; desc: string; icon: string }[] = [
    { id: 'estudio_profissional', label: 'Estúdio Pro',    desc: 'Three-point, sombras limpas', icon: '💡' },
    { id: 'luz_suave',           label: 'Luz suave',       desc: 'Difusa, arejada, bright',     icon: '☁️' },
    { id: 'luz_dramatica',       label: 'Dramática',       desc: 'Sombra forte, moody',         icon: '🎭' },
    { id: 'luz_natural',         label: 'Natural',         desc: 'Daylight, janela, orgânico',  icon: '🌤️' },
    { id: 'contraste_alto',      label: 'Alto contraste',  desc: 'Bold, impacto máximo',        icon: '⚡' },
  ];

  return (
    <div className="space-y-2">
      <Label>Iluminação</Label>
      {lightings.map(l => (
        <button key={l.id} onClick={() => onUpdate({ lighting: l.id })}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
            config.lighting === l.id
              ? 'border-primary/30 bg-primary/10 shadow-glow-sm'
              : 'border-border/10 bg-card/20 hover:border-border/25 hover:bg-card/40'
          )}
        >
          <span className="text-lg">{l.icon}</span>
          <div>
            <p className={cn('text-[11px] font-semibold', config.lighting === l.id ? 'text-primary' : 'text-foreground')}>{l.label}</p>
            <p className="text-[9px] text-muted-foreground/60">{l.desc}</p>
          </div>
          {config.lighting === l.id && (
            <div className="ml-auto h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[8px] text-primary-foreground font-bold">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Realism Section ────────────────────────────────────────────────────────
function RealismSection({ config, onUpdate }: { config: MockupConfig; onUpdate: (p: Partial<MockupConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Nível de realismo</Label>
          <span className="text-[9px] font-mono text-primary">{config.realism}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground/50 w-10">Clean</span>
          <Slider
            value={[config.realism]}
            onValueChange={([v]) => onUpdate({ realism: v })}
            min={0} max={100} step={1}
            className="flex-1"
          />
          <span className="text-[8px] text-muted-foreground/50 w-16 text-right">Hiper-real</span>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { key: 'useShadows',      label: 'Sombras realistas' },
          { key: 'useReflections',  label: 'Reflexos / brilho de superfície' },
          { key: 'useGrain',        label: 'Grão fotográfico leve' },
          { key: 'useDepthOfField', label: 'Profundidade de campo (bokeh)' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[10px] text-foreground/70">{label}</span>
            <Switch
              checked={config[key as keyof MockupConfig] as boolean}
              onCheckedChange={(v) => onUpdate({ [key]: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Format Section ─────────────────────────────────────────────────────────
function FormatSection({ config, onUpdate }: { config: MockupConfig; onUpdate: (p: Partial<MockupConfig>) => void }) {
  const dims = [
    { id: 'stories' as const,        label: 'Story',    ratio: '9:16',   icon: '📱' },
    { id: 'horizontal' as const,     label: 'Banner',   ratio: '16:9',   icon: '🖥️' },
    { id: 'feed-quadrado' as const,  label: 'Feed',     ratio: '1:1',    icon: '⬛' },
    { id: 'feed-retrato' as const,   label: 'Retrato',  ratio: '4:5',    icon: '📸' },
    { id: 'apresentacao' as const,   label: 'Slides',   ratio: '16:10',  icon: '🎯' },
  ];
  const vPositions: { id: MockupConfig['verticalPosition']; label: string }[] = [
    { id: 'cima',         label: 'Cima' },
    { id: 'centralizado', label: 'Centro' },
    { id: 'baixo',        label: 'Baixo' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label>Formato</Label>
        <div className="grid grid-cols-5 gap-1">
          {dims.map(d => (
            <button key={d.id} onClick={() => onUpdate({ dimension: d.id })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg py-2.5 text-[9px] font-medium border transition-all duration-150',
                config.dimension === d.id
                  ? 'bg-primary/10 text-primary border-primary/25 shadow-glow-sm'
                  : 'bg-secondary/30 text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/50'
              )}
            >
              <span className="text-base">{d.icon}</span>
              <span className="font-semibold">{d.label}</span>
              <span className="text-[8px] opacity-50">{d.ratio}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Posição do texto</Label>
        <div className="grid grid-cols-3 gap-1">
          {vPositions.map(p => (
            <button key={p.id} onClick={() => onUpdate({ verticalPosition: p.id })}
              className={cn(
                'rounded-md py-2 text-[10px] font-medium border transition-all duration-150',
                config.verticalPosition === p.id
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Text Section ───────────────────────────────────────────────────────────
function TextSection({ config, onUpdate }: { config: MockupConfig; onUpdate: (p: Partial<MockupConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-foreground/70">Texto na cena</span>
        <Switch checked={config.textEnabled} onCheckedChange={(v) => onUpdate({ textEnabled: v })} />
      </div>
      {config.textEnabled && (
        <div className="space-y-2">
          <div>
            <Label>Título / Headline</Label>
            <VoiceTextField
              placeholder="Ex: Nova coleção 2025"
              value={config.text01}
              onChange={(v) => onUpdate({ text01: v })}
              className="bg-secondary/30 border-border/20 text-[10px]"
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <VoiceTextField
              placeholder="Ex: Design exclusivo para sua marca"
              value={config.text02}
              onChange={(v) => onUpdate({ text02: v })}
              className="bg-secondary/30 border-border/20 text-[10px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
export function MockupConfigPanel({ config, onUpdate, onGenerate, isGenerating, apiKey }: Props) {
  const canGenerate = config.dimension !== null && !isGenerating && apiKey.length >= 10;

  const objectLabel: Record<MockupConfig['mockupObject'], string> = {
    caixa_embalagem: 'Caixa', garrafa_lata: 'Garrafa/Lata', camiseta_vestuario: 'Camiseta',
    smartphone_tela: 'Smartphone', livro_revista: 'Livro/Revista', produto_generico: 'Genérico',
    notebook_tablet: 'Notebook', caneca_copo: 'Caneca', sacola_bag: 'Sacola',
  };

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-l border-border/10 bg-background/50">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {/* Prompt Livre */}
        <FreePromptBlock
          freePrompt={config.freePrompt}
          ignoreRest={config.ignoreRest}
          onUpdate={onUpdate}
          placeholder="Ex: Caixa de perfume luxo em superfície de mármore, luz lateral dramática, reflexo sutil..."
        />

        <CollapsibleBlock icon={Package} title="Produto" subtitle={`${config.mockupType.replace(/_/g, ' ')} · ${objectLabel[config.mockupObject]}`} defaultOpen accent>
          <ProductSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Layers} title="Cena & Ângulo" subtitle={`${config.scene.replace(/_/g, ' ')} · ${config.angle.replace(/_/g, ' ')}`}>
          <SceneSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Sun} title="Iluminação" subtitle={config.lighting.replace(/_/g, ' ')}>
          <LightingSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Palette} title="Realismo & VFX" subtitle={`${config.realism}% realismo`}>
          <RealismSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Smartphone} title="Formato Final" subtitle={config.dimension ? config.dimension.replace(/-/g, ' ') : 'Selecionar formato'}>
          <FormatSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Type} title="Texto na Cena" subtitle={config.textEnabled ? (config.text01 || 'Habilitado') : 'Desabilitado'}>
          <TextSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>
      </div>

      {/* Footer */}
      <div className="border-t border-border/10 p-4 space-y-2 shrink-0">
        {!canGenerate && config.dimension === null && (
          <p className="text-[9px] text-muted-foreground/40 text-center">
            Selecione um <span className="text-foreground/50 font-semibold">Formato</span> para continuar
          </p>
        )}
        <Button
          disabled={!canGenerate}
          onClick={onGenerate}
          className="w-full h-11 gap-2.5 text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-glow-md transition-all duration-500 hover:shadow-glow-lg rounded-xl disabled:opacity-25 disabled:shadow-none uppercase"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? 'Gerando...' : 'Gerar Mockup ✨'}
        </Button>
      </div>
    </div>
  );
}
