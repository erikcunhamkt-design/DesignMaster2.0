import { useState, useRef } from 'react';
import { FootballConfig } from '@/types/footballConfig';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { FreePromptBlock } from '@/components/configurator/FreePromptBlock';
import { NegativePromptBlock } from '@/components/configurator/NegativePromptBlock';
import {
  Sparkles, Loader2, ChevronDown, User, Smartphone,
  Palette, Type, Settings2, Wind, Plus, X,
  AlignLeft, AlignCenter, AlignRight, ZoomIn,
} from 'lucide-react';
import { ModelSelector, type AiModel } from '@/components/configurator/ModelSelector';
import { cn } from '@/lib/utils';

interface Props {
  config: FootballConfig;
  onUpdate: (patch: Partial<FootballConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
  aiModel?: AiModel;
  onModelChange?: (model: AiModel) => void;
}

// ── CollapsibleBlock (same as Criador) ────────────────────────────────────
interface BlockProps {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accent?: boolean;
}

function CollapsibleBlock({ icon: Icon, title, subtitle, defaultOpen = false, children, accent }: BlockProps) {
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
            open
              ? accent ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground/70'
              : 'bg-secondary/50 text-muted-foreground/50'
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

// ── Label ─────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">{children}</p>;
}

// ── Chip button ───────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-2.5 py-1 text-[9px] font-medium transition-all duration-150 border',
        selected
          ? 'bg-primary/15 text-primary border-primary/30'
          : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50'
      )}
    >
      {label}
    </button>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────

function SubjectSection({ config, onUpdate }: { config: FootballConfig; onUpdate: (p: Partial<FootballConfig>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectTypes: { id: FootballConfig['subjectType']; label: string; icon: string }[] = [
    { id: 'jogador_unico',   label: 'Jogador único', icon: '🧍' },
    { id: 'dois_jogadores',  label: 'Duelo',         icon: '🤝' },
    { id: 'time_completo',   label: 'Time completo', icon: '👥' },
    { id: 'sem_pessoas',     label: 'Sem pessoas',   icon: '🛡️' },
  ];
  const positions: { id: FootballConfig['subjectPosition']; label: string; icon: React.ElementType }[] = [
    { id: 'esquerda',       label: 'Esq',     icon: AlignLeft },
    { id: 'centro',         label: 'Centro',  icon: AlignCenter },
    { id: 'direita',        label: 'Dir',     icon: AlignRight },
    { id: 'zoom_dramatico', label: 'Zoom',    icon: ZoomIn },
  ];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    Array.from(files).forEach(f => urls.push(URL.createObjectURL(f)));
    onUpdate({ subjectPhotos: [...config.subjectPhotos, ...urls] });
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />

      {/* Subject type */}
      <div>
        <Label>Tipo de sujeito</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {subjectTypes.map(t => (
            <button
              key={t.id}
              onClick={() => onUpdate({ subjectType: t.id })}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left border transition-all duration-150',
                config.subjectType === t.id
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

      {/* Prompt Extra — logo abaixo do tipo de sujeito */}
      <div className="space-y-1.5">
        <Label>Prompt Extra</Label>
        <VoiceTextField
          textarea
          placeholder="Instruções adicionais esportivas..."
          value={config.additionalPrompt}
          onChange={(v) => onUpdate({ additionalPrompt: v, additionalPromptEnabled: true })}
          className="min-h-[56px] resize-none bg-secondary/30 border-border/20 text-[10px]"
        />
      </div>

      {/* Upload */}
      {config.subjectType !== 'sem_pessoas' && (
        <div>
          <Label>Foto do atleta</Label>
          {config.subjectPhotos.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {config.subjectPhotos.map((url, i) => (
                <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/30 group">
                  <img src={url} alt={`Jogador ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => onUpdate({ subjectPhotos: config.subjectPhotos.filter((_, j) => j !== i) })}
                    className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Upload Atleta</span>
          </button>
        </div>
      )}

      {/* Position */}
      <div>
        <Label>Posição na composição</Label>
        <div className="grid grid-cols-4 gap-1">
          {positions.map(pos => (
            <button
              key={pos.id}
              onClick={() => onUpdate({ subjectPosition: pos.id })}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md py-2 text-[9px] font-medium transition-all duration-150 border',
                config.subjectPosition === pos.id
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground hover:text-foreground border-transparent'
              )}
            >
              <pos.icon className="h-3 w-3" />
              {pos.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualStyleSection({ config, onUpdate }: { config: FootballConfig; onUpdate: (p: Partial<FootballConfig>) => void }) {
  const styles: { id: FootballConfig['visualStyle']; label: string; emoji: string }[] = [
    { id: 'matchday',         label: 'Matchday',         emoji: '⚽' },
    { id: 'pre_jogo',         label: 'Pré-Jogo',         emoji: '🔥' },
    { id: 'pos_jogo',         label: 'Pós-Jogo',         emoji: '🏆' },
    { id: 'jogador_destaque', label: 'Jogador Destaque',  emoji: '⭐' },
    { id: 'final_decisao',    label: 'Final / Decisão',  emoji: '🥇' },
  ];

  return (
    <div className="space-y-3">
      {/* Style chips */}
      <div>
        <Label>Estilo da arte</Label>
        <div className="flex flex-wrap gap-1.5">
          {styles.map(s => (
            <button
              key={s.id}
              onClick={() => onUpdate({ visualStyle: config.visualStyle === s.id ? '' : s.id })}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium border transition-all duration-150',
                config.visualStyle === s.id
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <span>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Intensidade visual</Label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground/50 w-10">Clean</span>
          <Slider
            value={[config.intensity]}
            onValueChange={([v]) => onUpdate({ intensity: v })}
            min={0} max={100} step={1}
            className="flex-1"
          />
          <span className="text-[8px] text-muted-foreground/50 w-14 text-right">Explosivo</span>
        </div>
      </div>

      {/* VFX toggles */}
      <div className="space-y-2">
        {[
          { key: 'useGlow',         label: 'Glow / Aura esportivo' },
          { key: 'useSideGradient', label: 'Degradê lateral' },
          { key: 'useBlur',         label: 'Blur de fundo (Bokeh)' },
          { key: 'useGrain',        label: 'Grão cinematográfico' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[10px] text-foreground/70">{label}</span>
            <Switch
              checked={config[key as keyof FootballConfig] as boolean}
              onCheckedChange={(v) => onUpdate({ [key]: v })}
            />
          </div>
        ))}
      </div>

    </div>
  );
}


function MoodSection({ config, onUpdate }: { config: FootballConfig; onUpdate: (p: Partial<FootballConfig>) => void }) {
  const moods: { id: FootballConfig['matchMood']; label: string; desc: string; emoji: string }[] = [
    { id: 'epico',             label: 'Épico',            desc: 'Lighting heroico, poderoso',        emoji: '⚡' },
    { id: 'tenso',             label: 'Tenso',            desc: 'Alto contraste, drama psicológico',  emoji: '😤' },
    { id: 'vitoria',           label: 'Vitória',          desc: 'Luz dourada triunfal, euforia',      emoji: '🥇' },
    { id: 'rivalidade',        label: 'Rivalidade',       desc: 'Tensão de força oposta, duelo',      emoji: '⚔️' },
    { id: 'profissional_clean',label: 'Clean Pro',        desc: 'Branding corporativo premium',       emoji: '🎯' },
  ];

  return (
    <div className="space-y-2">
      <Label>Clima da partida</Label>
      {moods.map(m => (
        <button
          key={m.id}
          onClick={() => onUpdate({ matchMood: config.matchMood === m.id ? '' : m.id })}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
            config.matchMood === m.id
              ? 'border-primary/30 bg-primary/10 shadow-glow-sm'
              : 'border-border/10 bg-card/20 hover:border-border/25 hover:bg-card/40'
          )}
        >
          <span className="text-lg">{m.emoji}</span>
          <div>
            <p className={cn('text-[11px] font-semibold', config.matchMood === m.id ? 'text-primary' : 'text-foreground')}>
              {m.label}
            </p>
            <p className="text-[9px] text-muted-foreground/60">{m.desc}</p>
          </div>
          {config.matchMood === m.id && (
            <div className="ml-auto h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[8px] text-primary-foreground font-bold">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function FormatSection({ config, onUpdate }: { config: FootballConfig; onUpdate: (p: Partial<FootballConfig>) => void }) {
  const dims = [
    { id: 'stories' as const,         label: 'Story',      ratio: '9:16',  icon: '📱' },
    { id: 'horizontal' as const,      label: 'Banner',     ratio: '16:9',  icon: '🖥️' },
    { id: 'feed-quadrado' as const,   label: 'Feed',       ratio: '1:1',   icon: '⬛' },
    { id: 'feed-retrato' as const,    label: 'Retrato',    ratio: '4:5',   icon: '📸' },
  ];
  const framings: { id: FootballConfig['framing']; label: string }[] = [
    { id: 'closeup',          label: 'Close-up' },
    { id: 'plano-medio',      label: 'Médio' },
    { id: 'plano-americano',  label: 'Americano' },
  ];
  const vPositions: { id: FootballConfig['verticalPosition']; label: string }[] = [
    { id: 'cima',         label: 'Cima' },
    { id: 'centralizado', label: 'Centro' },
    { id: 'baixo',        label: 'Baixo' },
  ];

  return (
    <div className="space-y-4">
      {/* Dimension */}
      <div>
        <Label>Formato</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {dims.map(d => (
            <button
              key={d.id}
              onClick={() => onUpdate({ dimension: d.id })}
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

      {/* Framing */}
      <div>
        <Label>Enquadramento</Label>
        <div className="grid grid-cols-3 gap-1">
          {framings.map(f => (
            <button
              key={f.id}
              onClick={() => onUpdate({ framing: f.id })}
              className={cn(
                'rounded-md py-2 text-[10px] font-medium border transition-all duration-150',
                config.framing === f.id
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical position */}
      <div>
        <Label>Posição vertical (área de texto)</Label>
        <div className="grid grid-cols-3 gap-1">
          {vPositions.map(p => (
            <button
              key={p.id}
              onClick={() => onUpdate({ verticalPosition: p.id })}
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

function ColorsSection({ config, onUpdate }: { config: FootballConfig; onUpdate: (p: Partial<FootballConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1">
        {[
          { id: 'auto',  label: 'Auto IA' },
          { id: 'time',  label: 'Cor do time' },
          { id: 'manual', label: 'Manual' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => onUpdate({ colorMode: m.id as FootballConfig['colorMode'] })}
            className={cn(
              'rounded-md py-2 text-[10px] font-medium border transition-all duration-150',
              config.colorMode === m.id
                ? 'bg-primary/10 text-primary border-primary/25'
                : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {(config.colorMode === 'manual' || config.colorMode === 'time') && (
        <div className="space-y-2">
          <div>
            <Label>Cor primária do time</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.primaryTeamColor}
                onChange={e => onUpdate({ primaryTeamColor: e.target.value })}
                className="h-8 w-12 rounded-lg border border-border/20 cursor-pointer bg-transparent"
              />
              <span className="text-[10px] text-muted-foreground font-mono">{config.primaryTeamColor}</span>
            </div>
          </div>
          <div>
            <Label>Cor secundária do time</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.secondaryTeamColor}
                onChange={e => onUpdate({ secondaryTeamColor: e.target.value })}
                className="h-8 w-12 rounded-lg border border-border/20 cursor-pointer bg-transparent"
              />
              <span className="text-[10px] text-muted-foreground font-mono">{config.secondaryTeamColor}</span>
            </div>
          </div>
        </div>
      )}

      {config.colorMode === 'manual' && (
        <div className="space-y-2">
          <div>
            <Label>Iluminação ambiente</Label>
            <input type="color" value={config.ambientColor} onChange={e => onUpdate({ ambientColor: e.target.value })} className="h-8 w-12 rounded-lg border border-border/20 cursor-pointer bg-transparent" />
          </div>
          <div>
            <Label>Rim light (contra-luz)</Label>
            <input type="color" value={config.rimLightColor} onChange={e => onUpdate({ rimLightColor: e.target.value })} className="h-8 w-12 rounded-lg border border-border/20 cursor-pointer bg-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}

function TextSection({ config, onUpdate }: { config: FootballConfig; onUpdate: (p: Partial<FootballConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/70">Texto na arte</span>
        <Switch checked={config.textEnabled} onCheckedChange={(v) => onUpdate({ textEnabled: v })} />
      </div>

      {config.textEnabled && (
        <>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: 'camada', label: 'Espaço limpo' },
              { id: 'imagem', label: 'Integrado na arte' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => onUpdate({ textMode: m.id as 'camada' | 'imagem' })}
                className={cn(
                  'rounded-md py-2 text-[10px] font-medium border transition-all',
                  config.textMode === m.id
                    ? 'bg-primary/10 text-primary border-primary/25'
                    : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {config.textMode === 'imagem' && (
            <div className="space-y-2">
              <VoiceTextField
                placeholder="Título principal (ex: MATCHDAY)"
                value={config.text01}
                onChange={(v) => onUpdate({ text01: v })}
                className="bg-secondary/30 border-border/20 text-[10px]"
              />
              <VoiceTextField
                placeholder="Subtítulo (ex: Santos x Flamengo)"
                value={config.text02}
                onChange={(v) => onUpdate({ text02: v })}
                className="bg-secondary/30 border-border/20 text-[10px]"
              />
              <VoiceTextField
                placeholder="CTA / Apoio (ex: 21h00 • Maracanã)"
                value={config.cta}
                onChange={(v) => onUpdate({ cta: v })}
                className="bg-secondary/30 border-border/20 text-[10px]"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdvancedSection({ config, onUpdate }: { config: FootballConfig; onUpdate: (p: Partial<FootballConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Ambiente / Cenário</Label>
        <VoiceTextField
          placeholder="Ex: estádio lotado, campo molhado, noite sob holofotes..."
          value={config.environment}
          onChange={(v) => onUpdate({ environment: v })}
          className="bg-secondary/30 border-border/20 text-[10px]"
        />
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
export function FootballConfigPanel({ config, onUpdate, onGenerate, isGenerating, apiKey, aiModel = 'pro', onModelChange }: Props) {
  const hasFreePrompt = config.ignoreRest && config.freePrompt.trim().length > 0;
  const needsApiKey = aiModel === 'pro';
  const canGenerate = !isGenerating && (!needsApiKey || apiKey.length >= 10) && (hasFreePrompt || config.dimension !== null);

  const subjectSubtitle = `${config.subjectType.replace('_', ' ')} · ${config.subjectPosition.replace('_', ' ')}`;
  const styleSubtitle = config.visualStyle ? config.visualStyle.replace('_', ' ') : 'Selecionar estilo';
  const moodSubtitle = config.matchMood ? config.matchMood.replace('_', ' ') : 'Selecionar clima';
  const formatSubtitle = config.dimension
    ? { stories: 'Story 9:16', horizontal: 'Banner 16:9', 'feed-quadrado': 'Feed 1:1', 'feed-retrato': 'Feed 4:5' }[config.dimension]
    : 'Selecionar formato';

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-l border-border/10 bg-background/50">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {/* Prompt Livre */}
        <FreePromptBlock
          freePrompt={config.freePrompt}
          ignoreRest={config.ignoreRest}
          onUpdate={onUpdate}
          placeholder="Ex: Jogador de futebol em campo molhado, iluminação dramática noturna..."
        />

        {/* Prompt Negativo */}
        <NegativePromptBlock
          negativePrompt={config.negativePrompt}
          negativePromptEnabled={config.negativePromptEnabled}
          onUpdate={onUpdate}
        />

        {/* Block 1 — Sujeito */}
        <CollapsibleBlock icon={User} title="Sujeito" subtitle={subjectSubtitle} defaultOpen accent>
          <SubjectSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Block 2 — Estilo Visual */}
        <CollapsibleBlock icon={Sparkles} title="Estilo Visual" subtitle={styleSubtitle}>
          <VisualStyleSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Block 3 — Clima da Partida */}
        <CollapsibleBlock icon={Wind} title="Clima da Partida" subtitle={moodSubtitle}>
          <MoodSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Block 4 — Formato & Composição */}
        <CollapsibleBlock icon={Smartphone} title="Formato & Composição" subtitle={formatSubtitle}>
          <FormatSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Block 5 — Cores & Iluminação */}
        <CollapsibleBlock icon={Palette} title="Cores & Iluminação" subtitle={config.colorMode === 'auto' ? 'Automático pela IA' : 'Personalizado'}>
          <ColorsSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Block 6 — Texto */}
        <CollapsibleBlock icon={Type} title="Texto na Arte" subtitle={config.textEnabled ? (config.text01 || 'Habilitado') : 'Desabilitado'}>
          <TextSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Block 7 — Avançado */}
        <CollapsibleBlock icon={Settings2} title="Avançado" subtitle="Ambiente · Cenário">
          <AdvancedSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>
      </div>

      {/* Footer */}
      <div className="border-t border-border/10 p-4 space-y-2 shrink-0">
        {onModelChange && (
          <div className="mb-1">
            <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">Modelo de IA</p>
            <ModelSelector value={aiModel} onChange={onModelChange} />
          </div>
        )}
        {!canGenerate && !hasFreePrompt && config.dimension === null && (
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
          {isGenerating ? 'Gerando...' : 'Gerar Arte ⚽'}
        </Button>
      </div>
    </div>
  );
}
