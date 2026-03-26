import { useState, useRef } from 'react';
import { HeroConfig } from '@/types/heroConfig';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { FreePromptBlock } from '@/components/configurator/FreePromptBlock';
import { NegativePromptBlock } from '@/components/configurator/NegativePromptBlock';
import {
  Sparkles, Loader2, ChevronDown, Monitor, Type,
  Settings2, Layers, Plus, X, Sun, Image, Zap, Crown,
  Layout, PanelLeft, PanelRight, Square, Columns2, Aperture,
  Lightbulb, Film, Minimize2, Wand2,
} from 'lucide-react';
import { ModelSelector, type AiModel } from '@/components/configurator/ModelSelector';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  config: HeroConfig;
  onUpdate: (patch: Partial<HeroConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
  aiModel?: AiModel;
  onModelChange?: (model: AiModel) => void;
}

// ── Quick Presets ─────────────────────────────────────────────────────────
const QUICK_PRESETS: { label: string; emoji: string; config: Partial<HeroConfig> }[] = [
  {
    label: 'SaaS Premium',
    emoji: '🚀',
    config: {
      heroType: 'saas_tecnologia', element: 'produto_mockup', composition: 'pessoa_direita',
      visualStyle: 'clean_premium', lighting: 'luz_suave_estudio', intensity: 70, dimension: 'desktop',
      useDepthOfField: true, useGlow: false, useSharpness: true,
    },
  },
  {
    label: 'Fundador Expert',
    emoji: '👤',
    config: {
      heroType: 'marca_pessoal', element: 'pessoa_fundador', composition: 'pessoa_esquerda',
      visualStyle: 'editorial_sofisticado', lighting: 'luz_dramatica_lateral', intensity: 80, dimension: 'desktop',
      useDepthOfField: true, useGlow: true, useSharpness: true,
    },
  },
  {
    label: 'Startup Bold',
    emoji: '⚡',
    config: {
      heroType: 'startup_vendas', element: 'cena_abstrata', composition: 'centralizado',
      visualStyle: 'tech_futurista', lighting: 'gradiente_tecnologico', intensity: 90, dimension: 'desktop',
      useDepthOfField: false, useGlow: true, useSharpness: true,
    },
  },
  {
    label: 'Minimal Clean',
    emoji: '✨',
    config: {
      heroType: 'produto_digital', element: 'produto_mockup', composition: 'sem_pessoa',
      visualStyle: 'minimal_moderno', lighting: 'luz_suave_estudio', intensity: 40, dimension: 'desktop',
      useDepthOfField: false, useGlow: false, useSharpness: true,
    },
  },
];

// ── CollapsibleBlock ──────────────────────────────────────────────────────
function CollapsibleBlock({
  icon: Icon, title, subtitle, defaultOpen = false, children, accent, badge,
}: {
  icon?: React.ElementType; title: string; subtitle?: string;
  defaultOpen?: boolean; children: React.ReactNode; accent?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300',
      open ? 'border-border/25 bg-card/40 shadow-sm' : 'border-border/10 bg-card/10 hover:border-border/20 hover:bg-card/20'
    )}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left group">
        {Icon && (
          <div className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
            open
              ? accent ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10' : 'bg-secondary text-foreground/70'
              : 'bg-secondary/50 text-muted-foreground/50 group-hover:bg-secondary/80 group-hover:text-muted-foreground/70'
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-[11px] font-semibold tracking-wide transition-colors duration-200', open ? 'text-foreground' : 'text-foreground/60')}>
              {title}
            </p>
            {badge && (
              <span className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-px text-[7px] font-bold text-primary uppercase tracking-widest">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/30 transition-transform duration-300 shrink-0', open && 'rotate-180 text-muted-foreground/60')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="h-px w-full bg-border/10 mb-3.5" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">{children}</p>;
}

// ── Chip Selector ─────────────────────────────────────────────────────────
function ChipSelector<T extends string>({
  options, value, onChange, columns = 2,
}: {
  options: { id: T; label: string; icon?: string | React.ElementType; desc?: string }[];
  value: T; onChange: (v: T) => void; columns?: number;
}) {
  return (
    <div className={cn('grid gap-1.5', columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1')}>
      {options.map(opt => {
        const active = value === opt.id;
        const IconComp = typeof opt.icon === 'function' ? opt.icon : null;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all duration-200',
              active
                ? 'bg-primary/10 border-primary/30 text-primary shadow-sm shadow-primary/5'
                : 'bg-secondary/20 border-border/10 text-muted-foreground hover:text-foreground hover:bg-secondary/40 hover:border-border/20'
            )}
          >
            {typeof opt.icon === 'string' && <span className="text-sm shrink-0">{opt.icon}</span>}
            {IconComp && <IconComp className="h-3.5 w-3.5 shrink-0" />}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-semibold block truncate">{opt.label}</span>
              {opt.desc && <span className="text-[8px] text-muted-foreground/50 block truncate">{opt.desc}</span>}
            </div>
            {active && (
              <motion.div
                layoutId="chip-check"
                className="h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center shrink-0"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <span className="text-[7px] text-primary-foreground font-bold">✓</span>
              </motion.div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Hero Type Section ──────────────────────────────────────────────────────
function HeroTypeSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const heroTypes: { id: HeroConfig['heroType']; label: string; icon: string }[] = [
    { id: 'saas_tecnologia',      label: 'SaaS / Tech',       icon: '💻' },
    { id: 'servico_profissional', label: 'Serviço Pro',       icon: '🤝' },
    { id: 'produto_digital',      label: 'Prod. Digital',     icon: '📦' },
    { id: 'app_plataforma',       label: 'App / Plataforma',  icon: '📱' },
    { id: 'marca_pessoal',        label: 'Marca Pessoal',     icon: '⭐' },
    { id: 'startup_vendas',       label: 'Startup',           icon: '🚀' },
  ];

  return (
    <div>
      <Label>Tipo de Hero</Label>
      <ChipSelector options={heroTypes} value={config.heroType} onChange={(v) => onUpdate({ heroType: v })} columns={2} />
    </div>
  );
}

// ── Upload Block (reusable) ────────────────────────────────────────────────
function UploadBlock({ photos, onUpdate, fieldKey, label, placeholder, max = 3 }: {
  photos: string[]; onUpdate: (p: Partial<HeroConfig>) => void;
  fieldKey: 'subjectPhotos' | 'productPhotos' | 'referencePhotos';
  label: string; placeholder: string; max?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = max - photos.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    e.target.value = '';
    const newUrls = selected.map(f => URL.createObjectURL(f));
    onUpdate({ [fieldKey]: [...photos, ...newUrls] } as Partial<HeroConfig>);
  };

  return (
    <div>
      <Label>{label}</Label>
      <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif,.avif,.webp" multiple className="hidden" onChange={handleFile} />
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {photos.map((url, i) => (
            <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/30 group">
              <img src={url} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" />
              <button onClick={() => onUpdate({ [fieldKey]: photos.filter((_, j) => j !== i) } as Partial<HeroConfig>)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-4 w-4 text-white" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
      {photos.length < max && (
        <button onClick={() => fileInputRef.current?.click()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 bg-secondary/15 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">{placeholder}</span>
        </button>
      )}
      <p className="text-[8px] text-muted-foreground/35 mt-1">{photos.length}/{max}</p>
    </div>
  );
}

// ── Element Selector Section ──────────────────────────────────────────────
function ElementSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const elements: { id: HeroConfig['element']; label: string; icon: string; desc: string }[] = [
    { id: 'pessoa_fundador',   label: 'Pessoa',      icon: '👤', desc: 'Fundador ou especialista' },
    { id: 'produto_mockup',    label: 'Produto',     icon: '🖥️', desc: 'App, dashboard, mockup' },
    { id: 'cena_abstrata',     label: 'Abstrata',    icon: '🌌', desc: 'Gradientes e formas' },
    { id: 'ilustracao_tech',   label: 'Tech Art',    icon: '⚡', desc: 'Isométrico, digital' },
    { id: 'simbolo_conceito',  label: 'Símbolo',     icon: '🔷', desc: 'Metáfora visual' },
  ];

  return (
    <div>
      <Label>Elemento Principal</Label>
      <ChipSelector options={elements} value={config.element} onChange={(v) => onUpdate({ element: v })} columns={1} />
    </div>
  );
}

// ── Composition Section ────────────────────────────────────────────────────
function CompositionSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const compositions: { id: HeroConfig['composition']; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'pessoa_esquerda', label: 'Sujeito à Esquerda', icon: PanelLeft,  desc: 'Texto à direita' },
    { id: 'pessoa_direita',  label: 'Sujeito à Direita',  icon: PanelRight, desc: 'Texto à esquerda' },
    { id: 'centralizado',    label: 'Centralizado',        icon: Layout,     desc: 'Simetria editorial' },
    { id: 'sem_pessoa',      label: 'Sem pessoa',          icon: Square,     desc: 'Visual abstrato' },
    { id: 'split_layout',    label: 'Split Layout',        icon: Columns2,   desc: 'Duas zonas' },
  ];

  return (
    <div className="space-y-3">
      <Label>Layout & Composição</Label>
      <div className="grid grid-cols-1 gap-1.5">
        {compositions.map(c => {
          const active = config.composition === c.id;
          return (
            <button key={c.id} onClick={() => onUpdate({ composition: c.id })}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
                active
                  ? 'border-primary/30 bg-primary/10 shadow-sm shadow-primary/5'
                  : 'border-border/10 bg-card/15 hover:border-border/25 hover:bg-card/30'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                active ? 'bg-primary/20 text-primary' : 'bg-secondary/40 text-muted-foreground/60'
              )}>
                <c.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className={cn('text-[10px] font-semibold', active ? 'text-primary' : 'text-foreground/80')}>{c.label}</p>
                <p className="text-[8px] text-muted-foreground/50">{c.desc}</p>
              </div>
              {active && (
                <motion.div layoutId="comp-check" className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0" transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                  <span className="text-[7px] text-primary-foreground font-bold">✓</span>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Style Section ──────────────────────────────────────────────────────────
function StyleSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const styles: { id: HeroConfig['visualStyle']; label: string; color: string; desc: string }[] = [
    { id: 'clean_premium',         label: 'Clean Premium',    color: 'bg-white/80',      desc: 'Apple, Stripe' },
    { id: 'tech_futurista',        label: 'Tech Futurista',   color: 'bg-blue-500/80',   desc: 'Neon, cyber' },
    { id: 'editorial_sofisticado', label: 'Editorial',        color: 'bg-neutral-800',   desc: 'High-fashion' },
    { id: 'minimal_moderno',       label: 'Minimal',          color: 'bg-gray-300/80',   desc: 'Escandinavo' },
    { id: 'cinematografico',       label: 'Cinemático',       color: 'bg-amber-700/80',  desc: 'Film grade' },
  ];

  const lightings: { id: HeroConfig['lighting']; label: string; icon: React.ElementType }[] = [
    { id: 'luz_suave_estudio',      label: 'Suave Estúdio',   icon: Sun },
    { id: 'luz_dramatica_lateral',  label: 'Dramática Lat.',  icon: Film },
    { id: 'gradiente_tecnologico',  label: 'Tech Gradient',   icon: Lightbulb },
    { id: 'glow_sutil',             label: 'Glow Sutil',      icon: Sparkles },
    { id: 'profundidade_elegante',  label: 'Profundidade',    icon: Aperture },
  ];

  return (
    <div className="space-y-4">
      {/* Style cards */}
      <div>
        <Label>Estilo Visual</Label>
        <div className="grid grid-cols-1 gap-1">
          {styles.map(s => {
            const active = config.visualStyle === s.id;
            return (
              <button key={s.id} onClick={() => onUpdate({ visualStyle: s.id })}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-200',
                  active ? 'border-primary/30 bg-primary/10' : 'border-border/10 bg-card/15 hover:bg-card/25'
                )}
              >
                <div className={cn('h-5 w-5 rounded-full border border-white/20 shrink-0', s.color)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[10px] font-semibold truncate', active ? 'text-primary' : 'text-foreground/80')}>{s.label}</p>
                  <p className="text-[8px] text-muted-foreground/50 truncate">{s.desc}</p>
                </div>
                {active && (
                  <div className="h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-[7px] text-primary-foreground font-bold">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Intensidade Visual</Label>
          <span className={cn(
            'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded',
            config.intensity > 70 ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          )}>
            {config.intensity}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Minimize2 className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          <Slider value={[config.intensity]} onValueChange={([v]) => onUpdate({ intensity: v })} min={0} max={100} step={1} className="flex-1" />
          <Zap className="h-3 w-3 text-primary/60 shrink-0" />
        </div>
      </div>

      {/* Lighting */}
      <div>
        <Label>Iluminação</Label>
        <div className="grid grid-cols-1 gap-1">
          {lightings.map(l => {
            const active = config.lighting === l.id;
            return (
              <button key={l.id} onClick={() => onUpdate({ lighting: l.id })}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all duration-200',
                  active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border/10 bg-card/15 text-muted-foreground hover:text-foreground hover:bg-card/25'
                )}
              >
                <l.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] font-medium flex-1">{l.label}</span>
                {active && (
                  <div className="h-3 w-3 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-[6px] text-primary-foreground font-bold">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Text Section ───────────────────────────────────────────────────────────
function TextSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-secondary/20 px-3 py-2">
        <span className="text-[10px] font-medium text-foreground/70">Texto sobreposto</span>
        <Switch checked={config.textEnabled} onCheckedChange={(v) => onUpdate({ textEnabled: v })} />
      </div>
      <AnimatePresence>
        {config.textEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
          >
            <VoiceTextField placeholder="Headline (ex: Resultados que transformam)" value={config.headline} onChange={(v) => onUpdate({ headline: v })} className="h-8 bg-secondary/30 border-border/20 text-[10px]" />
            <VoiceTextField placeholder="Subheadline (proposta de valor)" value={config.subheadline} onChange={(v) => onUpdate({ subheadline: v })} className="h-8 bg-secondary/30 border-border/20 text-[10px]" />
            <VoiceTextField placeholder="CTA (ex: Comece agora →)" value={config.cta} onChange={(v) => onUpdate({ cta: v })} className="h-8 bg-secondary/30 border-border/20 text-[10px]" />
            <p className="text-[8px] text-muted-foreground/35 leading-relaxed italic">
              Textos renderizados como camada vetorial — nitidez máxima.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Format Section ─────────────────────────────────────────────────────────
function FormatSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const dims: { id: HeroConfig['dimension']; label: string; ratio: string; icon: string; w: number; h: number }[] = [
    { id: 'desktop',       label: 'Desktop',   ratio: '16:9',  icon: '🖥️', w: 40, h: 22 },
    { id: 'mobile',        label: 'Mobile',    ratio: '9:16',  icon: '📱', w: 18, h: 32 },
    { id: 'banner',        label: 'Banner',    ratio: '16:4',  icon: '📰', w: 44, h: 11 },
    { id: 'section_cover', label: 'Section',   ratio: '1:1',   icon: '⬛', w: 26, h: 26 },
  ];

  return (
    <div>
      <Label>Formato de saída</Label>
      <div className="grid grid-cols-2 gap-2">
        {dims.map(d => {
          const active = config.dimension === d.id;
          return (
            <button key={d.id} onClick={() => onUpdate({ dimension: d.id })}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border px-3 py-3 transition-all duration-200',
                active ? 'bg-primary/10 border-primary/30 shadow-sm shadow-primary/5' : 'bg-secondary/15 border-border/10 hover:bg-secondary/30 hover:border-border/20'
              )}
            >
              {/* Mini aspect ratio preview */}
              <div
                className={cn(
                  'rounded border transition-colors',
                  active ? 'border-primary/50 bg-primary/20' : 'border-border/30 bg-secondary/40'
                )}
                style={{ width: d.w, height: d.h }}
              />
              <div className="text-center">
                <p className={cn('text-[10px] font-semibold', active ? 'text-primary' : 'text-foreground/70')}>{d.label}</p>
                <p className="text-[8px] text-muted-foreground/50">{d.ratio}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Advanced Section ────────────────────────────────────────────────────────
function AdvancedSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const toggles = [
    { key: 'useDepthOfField', label: 'Profundidade (Bokeh)', icon: Aperture },
    { key: 'useGlow',         label: 'Glow controlado',      icon: Sparkles },
    { key: 'useSharpness',    label: 'Nitidez máxima',       icon: Zap },
    { key: 'useGrain',        label: 'Grão sutil (film)',    icon: Film },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {toggles.map(({ key, label, icon: TIcon }) => (
          <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/15 px-3 py-2">
            <div className="flex items-center gap-2">
              <TIcon className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-[10px] text-foreground/70">{label}</span>
            </div>
            <Switch
              checked={config[key] as boolean}
              onCheckedChange={(v) => onUpdate({ [key]: v })}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Contraste</Label>
          <span className="text-[9px] font-mono text-muted-foreground">{config.contrast}%</span>
        </div>
        <Slider value={[config.contrast]} onValueChange={([v]) => onUpdate({ contrast: v })} min={0} max={100} step={1} className="flex-1" />
      </div>
    </div>
  );
}

// ── Custom Prompt ──────────────────────────────────────────────────────────
function CustomPromptSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  return (
    <div className="space-y-2">
      <VoiceTextField
        textarea
        placeholder="Instrução adicional ao prompt gerado... (opcional)"
        value={config.additionalPrompt}
        onChange={(v) => onUpdate({ additionalPrompt: v })}
        className="min-h-[60px] resize-none bg-secondary/30 border-border/20 text-[10px]"
      />
      <p className="text-[8px] text-muted-foreground/35 leading-relaxed italic">
        Será adicionada ao prompt automático.
      </p>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────────
export function HeroConfigPanel({ config, onUpdate, onGenerate, isGenerating, apiKey, aiModel = 'pro', onModelChange }: Props) {
  const canGenerate = !!apiKey && apiKey.length >= 10 && !isGenerating;
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="flex h-full w-full md:w-[320px] shrink-0 flex-col border-l border-border/10 bg-background/95 backdrop-blur-xl">
      {/* Header */}
      <div className="shrink-0 border-b border-border/10 px-4 py-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/15 shadow-sm shadow-primary/10">
            <Crown className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-foreground tracking-wide">Hero Studio</p>
            <p className="text-[8px] text-muted-foreground/40">Landing pages de alta conversão</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[7px] font-bold text-primary uppercase tracking-widest">
            Pro
          </span>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="shrink-0 border-b border-border/10 px-3 py-2">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex w-full items-center gap-2 text-left group"
        >
          <Wand2 className="h-3 w-3 text-primary/60 group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-semibold text-foreground/60 group-hover:text-foreground transition-colors flex-1">
            Presets rápidos
          </span>
          <ChevronDown className={cn('h-3 w-3 text-muted-foreground/30 transition-transform', showPresets && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-1.5 pt-2">
                {QUICK_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { onUpdate(p.config); setShowPresets(false); }}
                    className="flex items-center gap-2 rounded-lg bg-secondary/30 border border-border/10 px-2.5 py-2 hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all duration-200 group/p"
                  >
                    <span className="text-sm">{p.emoji}</span>
                    <span className="text-[9px] font-semibold text-foreground/60 group-hover/p:text-primary truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Blocks */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-none">
        <FreePromptBlock
          freePrompt={config.freePrompt}
          ignoreRest={config.ignoreRest}
          onUpdate={onUpdate}
          placeholder="Ex: Hero premium para SaaS fintech, mulher executiva, fundo tech..."
        />
        <NegativePromptBlock
          negativePrompt={config.negativePrompt}
          negativePromptEnabled={config.negativePromptEnabled}
          onUpdate={onUpdate}
        />

        <CollapsibleBlock icon={Monitor} title="Tipo de Hero" subtitle="Nicho e segmento" defaultOpen accent badge="Core">
          <HeroTypeSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Zap} title="Elemento Principal" subtitle={config.element} defaultOpen accent>
          <ElementSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Image} title="Foto do Sujeito" subtitle={config.subjectPhotos.length > 0 ? `${config.subjectPhotos.length} foto(s)` : 'Nenhuma'} defaultOpen>
          <UploadBlock photos={config.subjectPhotos} onUpdate={onUpdate} fieldKey="subjectPhotos" label="Pessoa / Fundador" placeholder="Upload da pessoa" max={3} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Layers} title="Foto do Produto" subtitle={config.productPhotos.length > 0 ? `${config.productPhotos.length} foto(s)` : 'Nenhuma'}>
          <UploadBlock photos={config.productPhotos} onUpdate={onUpdate} fieldKey="productPhotos" label="App, Dashboard, Mockup" placeholder="Upload do produto" max={3} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Plus} title="Referência Visual" subtitle={config.referencePhotos.length > 0 ? `${config.referencePhotos.length} ref` : 'Nenhuma'}>
          <UploadBlock photos={config.referencePhotos} onUpdate={onUpdate} fieldKey="referencePhotos" label="Referência de estilo" placeholder="Upload de referência" max={3} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Layers} title="Composição" subtitle="Layout e posicionamento">
          <CompositionSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Sun} title="Estilo & Iluminação" subtitle="Visual e atmosfera">
          <StyleSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Type} title="Texto no Hero" subtitle={config.textEnabled ? `"${config.headline || 'Configurar'}"` : 'Desativado'}>
          <TextSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Monitor} title="Formato" subtitle={config.dimension ? `${config.dimension}` : 'Selecionar'}>
          <FormatSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Wand2} title="Prompt Extra" subtitle={config.additionalPrompt ? 'Ativo' : 'Opcional'}>
          <CustomPromptSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Settings2} title="Avançado" subtitle="Efeitos e contraste">
          <AdvancedSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>
      </div>

      {/* Generate */}
      <div className="shrink-0 border-t border-border/10 p-3 space-y-2.5">
        {onModelChange && (
          <ModelSelector value={aiModel} onChange={onModelChange} />
        )}
        {(!apiKey || apiKey.length < 10) && (
          <div className="rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2">
            <p className="text-[9px] text-amber-400/80 leading-relaxed">
              Configure sua chave de API para gerar.
            </p>
          </div>
        )}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="w-full h-11 rounded-xl text-[11px] font-bold tracking-wide bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md hover:shadow-glow-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 gap-2 disabled:opacity-40 disabled:pointer-events-none"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando Hero…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Hero Section ✨
            </>
          )}
        </Button>
        <p className="text-center text-[8px] text-muted-foreground/30">
          IA Premium · Zero prompt · Alta conversão
        </p>
      </div>
    </div>
  );
}
