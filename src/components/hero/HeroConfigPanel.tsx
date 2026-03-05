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
  Settings2, Layers, Plus, X, Zap, Sun, Image,
} from 'lucide-react';
import { ModelSelector, type AiModel } from '@/components/configurator/ModelSelector';
import { cn } from '@/lib/utils';

interface Props {
  config: HeroConfig;
  onUpdate: (patch: Partial<HeroConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
  aiModel?: AiModel;
  onModelChange?: (model: AiModel) => void;
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

// ── Hero Type & Element Section ────────────────────────────────────────────
function HeroTypeSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const heroTypes: { id: HeroConfig['heroType']; label: string; icon: string }[] = [
    { id: 'saas_tecnologia',      label: 'SaaS / Tech',    icon: '💻' },
    { id: 'servico_profissional', label: 'Serviço Pro',    icon: '🤝' },
    { id: 'produto_digital',      label: 'Prod. Digital',  icon: '📦' },
    { id: 'app_plataforma',       label: 'App / Plataforma', icon: '📱' },
    { id: 'marca_pessoal',        label: 'Marca Pessoal',  icon: '⭐' },
    { id: 'startup_vendas',       label: 'Startup',        icon: '🚀' },
  ];

  const elements: { id: HeroConfig['element']; label: string; icon: string; desc: string }[] = [
    { id: 'pessoa_fundador',   label: 'Pessoa',      icon: '👤', desc: 'Fundador, especialista, persona' },
    { id: 'produto_mockup',    label: 'Produto',     icon: '🖥️', desc: 'App, dashboard, mockup' },
    { id: 'cena_abstrata',     label: 'Abstrata',    icon: '🌌', desc: 'Gradientes, formas, conceitual' },
    { id: 'ilustracao_tech',   label: 'Tech Art',    icon: '⚡', desc: 'Isométrico, data viz, digital' },
    { id: 'simbolo_conceito',  label: 'Símbolo',     icon: '🔷', desc: 'Metáfora visual poderosa' },
  ];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(f => {
      const url = URL.createObjectURL(f);
      onUpdate({ referencePhotos: [...config.referencePhotos, url] });
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />

      {/* Hero Type */}
      <div>
        <Label>Tipo de Hero</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {heroTypes.map(t => (
            <button key={t.id} onClick={() => onUpdate({ heroType: t.id })}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left border transition-all duration-150',
                config.heroType === t.id
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

      {/* Main Element */}
      <div>
        <Label>Elemento Principal</Label>
        <div className="space-y-1">
          {elements.map(el => (
            <button key={el.id} onClick={() => onUpdate({ element: el.id })}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
                config.element === el.id
                  ? 'border-primary/30 bg-primary/10 shadow-glow-sm'
                  : 'border-border/10 bg-card/20 hover:border-border/25 hover:bg-card/40'
              )}
            >
              <span className="text-lg">{el.icon}</span>
              <div>
                <p className={cn('text-[11px] font-semibold', config.element === el.id ? 'text-primary' : 'text-foreground')}>{el.label}</p>
                <p className="text-[9px] text-muted-foreground/60">{el.desc}</p>
              </div>
              {config.element === el.id && (
                <div className="ml-auto h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div>
        <Label>Upload de referência</Label>
        {config.referencePhotos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {config.referencePhotos.map((url, i) => (
              <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/30 group">
                <img src={url} alt={`Ref ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => onUpdate({ referencePhotos: config.referencePhotos.filter((_, j) => j !== i) })}
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
          <span className="text-[10px] font-medium tracking-wide uppercase">Upload pessoa / produto / mockup</span>
        </button>
      </div>
    </div>
  );
}

// ── Composition Section ────────────────────────────────────────────────────
function CompositionSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const compositions: { id: HeroConfig['composition']; label: string; icon: string; desc: string }[] = [
    { id: 'pessoa_esquerda', label: 'Esq. + Texto Direita', icon: '◀️', desc: 'Sujeito à esquerda' },
    { id: 'pessoa_direita',  label: 'Dir. + Texto Esq.',   icon: '▶️', desc: 'Sujeito à direita' },
    { id: 'centralizado',    label: 'Centralizado',          icon: '⬛', desc: 'Simetria e impacto' },
    { id: 'sem_pessoa',      label: 'Abstrato / Sem pessoa', icon: '🌌', desc: 'Visual sem sujeito' },
    { id: 'split_layout',    label: 'Split layout',          icon: '⊟', desc: 'Divisão editorial' },
  ];

  return (
    <div className="space-y-2">
      <Label>Composição do Hero</Label>
      {compositions.map(c => (
        <button key={c.id} onClick={() => onUpdate({ composition: c.id })}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
            config.composition === c.id
              ? 'border-primary/30 bg-primary/10 shadow-glow-sm'
              : 'border-border/10 bg-card/20 hover:border-border/25 hover:bg-card/40'
          )}
        >
          <span className="text-base">{c.icon}</span>
          <div className="flex-1">
            <p className={cn('text-[11px] font-semibold', config.composition === c.id ? 'text-primary' : 'text-foreground')}>{c.label}</p>
            <p className="text-[9px] text-muted-foreground/60">{c.desc}</p>
          </div>
          {config.composition === c.id && (
            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[8px] text-primary-foreground font-bold">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Style Section ──────────────────────────────────────────────────────────
function StyleSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const styles: { id: HeroConfig['visualStyle']; label: string; icon: string; desc: string }[] = [
    { id: 'clean_premium',         label: 'Clean Premium',         icon: '⬜', desc: 'Apple, Stripe, Linear' },
    { id: 'tech_futurista',        label: 'Tech Futurista',        icon: '🔵', desc: 'Neon, cyber, digital' },
    { id: 'editorial_sofisticado', label: 'Editorial',             icon: '🖤', desc: 'Revista, high-fashion' },
    { id: 'minimal_moderno',       label: 'Minimal Moderno',       icon: '⚪', desc: 'Escandinavo, essência' },
    { id: 'cinematografico',       label: 'Cinematográfico',       icon: '🎬', desc: 'Film grade, storytelling' },
  ];

  const lightings: { id: HeroConfig['lighting']; label: string; icon: string }[] = [
    { id: 'luz_suave_estudio',      label: 'Suave Estúdio',   icon: '☁️' },
    { id: 'luz_dramatica_lateral',  label: 'Dramática Lat.',  icon: '🎭' },
    { id: 'gradiente_tecnologico',  label: 'Tech Gradient',   icon: '💜' },
    { id: 'glow_sutil',             label: 'Glow Sutil',      icon: '✨' },
    { id: 'profundidade_elegante',  label: 'Profundidade',    icon: '🌊' },
  ];

  return (
    <div className="space-y-4">
      {/* Visual Style */}
      <div>
        <Label>Estilo Visual</Label>
        <div className="space-y-1">
          {styles.map(s => (
            <button key={s.id} onClick={() => onUpdate({ visualStyle: s.id })}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-150',
                config.visualStyle === s.id
                  ? 'border-primary/30 bg-primary/10'
                  : 'border-border/10 bg-card/20 hover:border-border/20 hover:bg-card/30'
              )}
            >
              <span>{s.icon}</span>
              <div>
                <p className={cn('text-[10px] font-semibold', config.visualStyle === s.id ? 'text-primary' : 'text-foreground')}>{s.label}</p>
                <p className="text-[9px] text-muted-foreground/50">{s.desc}</p>
              </div>
              {config.visualStyle === s.id && (
                <div className="ml-auto h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Intensidade Visual</Label>
          <span className="text-[9px] font-mono text-primary">{config.intensity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground/50 w-10">Clean</span>
          <Slider
            value={[config.intensity]}
            onValueChange={([v]) => onUpdate({ intensity: v })}
            min={0} max={100} step={1}
            className="flex-1"
          />
          <span className="text-[8px] text-muted-foreground/50 w-16 text-right">Impactante</span>
        </div>
      </div>

      {/* Lighting */}
      <div>
        <Label>Iluminação & Atmosfera</Label>
        <div className="grid grid-cols-1 gap-1">
          {lightings.map(l => (
            <button key={l.id} onClick={() => onUpdate({ lighting: l.id })}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all duration-150',
                config.lighting === l.id
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border/10 bg-card/20 text-muted-foreground hover:text-foreground hover:bg-card/30'
              )}
            >
              <span>{l.icon}</span>
              <span className="text-[10px] font-medium">{l.label}</span>
              {config.lighting === l.id && (
                <div className="ml-auto h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[7px] text-primary-foreground font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Text Section ───────────────────────────────────────────────────────────
function TextSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/70">Ativar Texto no Hero</span>
        <Switch
          checked={config.textEnabled}
          onCheckedChange={(v) => onUpdate({ textEnabled: v })}
        />
      </div>
      {config.textEnabled && (
        <div className="space-y-2">
          <VoiceTextField
            placeholder="Headline (ex: Resultados que transformam)"
            value={config.headline}
            onChange={(v) => onUpdate({ headline: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
          <VoiceTextField
            placeholder="Subheadline (proposta de valor)"
            value={config.subheadline}
            onChange={(v) => onUpdate({ subheadline: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
          <VoiceTextField
            placeholder="CTA (ex: Comece agora →)"
            value={config.cta}
            onChange={(v) => onUpdate({ cta: v })}
            className="h-7 bg-secondary/30 border-border/20 text-[10px]"
          />
          <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
            Textos renderizados como camada vetorial sobre a imagem — nitidez máxima e hierarquia visual perfeita.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Format Section ─────────────────────────────────────────────────────────
function FormatSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  const dims: { id: HeroConfig['dimension']; label: string; ratio: string; icon: string; desc: string }[] = [
    { id: 'desktop',       label: 'Desktop',   ratio: '16:9',   icon: '🖥️', desc: 'Hero full-width' },
    { id: 'mobile',        label: 'Mobile',    ratio: '9:16',   icon: '📱', desc: 'Hero adaptado' },
    { id: 'banner',        label: 'Banner',    ratio: '16:4',   icon: '📰', desc: 'Header strip' },
    { id: 'section_cover', label: 'Section',   ratio: '1:1',    icon: '⬛', desc: 'Cover versátil' },
  ];

  return (
    <div>
      <Label>Formato & Responsividade</Label>
      <div className="grid grid-cols-2 gap-1.5">
        {dims.map(d => (
          <button key={d.id} onClick={() => onUpdate({ dimension: d.id })}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-all duration-150',
              config.dimension === d.id
                ? 'bg-primary/10 border-primary/25 shadow-glow-sm'
                : 'bg-secondary/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">{d.icon}</span>
              <span className={cn('text-[10px] font-semibold', config.dimension === d.id ? 'text-primary' : 'text-foreground')}>{d.label}</span>
            </div>
            <span className="text-[9px] text-muted-foreground/50">{d.ratio} · {d.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Advanced Section ────────────────────────────────────────────────────────
function AdvancedSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {[
          { key: 'useDepthOfField', label: 'Profundidade de campo (Bokeh)' },
          { key: 'useGlow',         label: 'Glow controlado' },
          { key: 'useSharpness',    label: 'Nitidez máxima' },
          { key: 'useGrain',        label: 'Grão sutil (film)' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[10px] text-foreground/70">{label}</span>
            <Switch
              checked={config[key as keyof HeroConfig] as boolean}
              onCheckedChange={(v) => onUpdate({ [key]: v })}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Contraste</Label>
          <span className="text-[9px] font-mono text-primary">{config.contrast}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground/50 w-10">Suave</span>
          <Slider
            value={[config.contrast]}
            onValueChange={([v]) => onUpdate({ contrast: v })}
            min={0} max={100} step={1}
            className="flex-1"
          />
          <span className="text-[8px] text-muted-foreground/50 w-10 text-right">Alto</span>
        </div>
      </div>
    </div>
  );
}

// ── Custom Prompt Section ──────────────────────────────────────────────────
function CustomPromptSection({ config, onUpdate }: { config: HeroConfig; onUpdate: (p: Partial<HeroConfig>) => void }) {
  return (
    <div className="space-y-2">
      <VoiceTextField
        textarea
        placeholder="Digite qualquer instrução adicional ao prompt gerado automaticamente... (opcional)"
        value={config.additionalPrompt}
        onChange={(v) => onUpdate({ additionalPrompt: v })}
        className="min-h-[72px] resize-none bg-secondary/30 border-border/20 text-[10px]"
      />
      <p className="text-[9px] text-muted-foreground/35 leading-relaxed">
        Sua instrução será adicionada ao prompt gerado pela IA. Deixe em branco para usar apenas o modo automático.
      </p>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────────
export function HeroConfigPanel({ config, onUpdate, onGenerate, isGenerating, apiKey, aiModel = 'pro', onModelChange }: Props) {
  const needsApiKey = aiModel === 'pro';
  const canGenerate = (!needsApiKey || !!apiKey) && !isGenerating;

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col border-l border-border/10 bg-background/95 backdrop-blur-xl">
      {/* Header */}
      <div className="shrink-0 border-b border-border/10 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
            <Monitor className="h-3 w-3 text-primary" />
          </div>
          <p className="text-[11px] font-bold text-foreground tracking-wide">Hero Studio</p>
          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[8px] font-bold text-primary uppercase tracking-widest">
            Landing Pro
          </span>
        </div>
        <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
          Hero sections de alta conversão — sem escrever prompt.
        </p>
      </div>

      {/* Blocks */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-none">
        {/* Prompt Livre */}
        <FreePromptBlock
          freePrompt={config.freePrompt}
          ignoreRest={config.ignoreRest}
          onUpdate={onUpdate}
          placeholder="Ex: Hero premium para SaaS fintech, mulher executiva, fundo tech gradiente azul-índigo..."
        />

        {/* Prompt Negativo */}
        <NegativePromptBlock
          negativePrompt={config.negativePrompt}
          negativePromptEnabled={config.negativePromptEnabled}
          onUpdate={onUpdate}
        />

        <CollapsibleBlock icon={Image} title="Tipo & Elemento" subtitle="Defina o hero e o sujeito principal" defaultOpen accent>
          <HeroTypeSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Layers} title="Composição" subtitle="Layout e posicionamento">
          <CompositionSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Sun} title="Estilo & Iluminação" subtitle="Visual e atmosfera">
          <StyleSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Type} title="Texto no Hero" subtitle={config.textEnabled ? 'Ativo' : 'Desativado'}>
          <TextSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Monitor} title="Formato" subtitle="Dimensão e responsividade">
          <FormatSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Type} title="Prompt Personalizado" subtitle={config.additionalPrompt ? 'Ativo' : 'Opcional'}>
          <CustomPromptSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        <CollapsibleBlock icon={Settings2} title="Avançado" subtitle="Profundidade, glow, nitidez e grão">
          <AdvancedSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>
      </div>

      {/* Generate button */}
      <div className="shrink-0 border-t border-border/10 p-3 space-y-2">
        {!apiKey && (
          <div className="rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2">
            <p className="text-[9px] text-amber-400/80 leading-relaxed">
              Configure sua chave de API Google para gerar imagens.
            </p>
          </div>
        )}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="w-full h-10 rounded-xl text-[11px] font-bold tracking-wide bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 gap-2 disabled:opacity-40 disabled:pointer-events-none"
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
        <p className="text-center text-[8px] text-muted-foreground/30 leading-relaxed">
          IA Premium · Zero prompt · Alta conversão
        </p>
      </div>
    </div>
  );
}
