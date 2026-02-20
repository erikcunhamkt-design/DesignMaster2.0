import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Download, RotateCcw, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo.png';

// ── Types ──────────────────────────────────────────────────────────────────
type ArtType = 'matchday' | 'jogador_destaque' | 'pre_jogo' | 'pos_jogo' | 'anuncio_partida';
type Mood = 'epico' | 'explosivo' | 'dramatico' | 'vitoria' | 'clean_profissional';
type VisualElements = 'jogador_unico' | 'dois_jogadores' | 'time_completo' | 'sem_pessoas';
type Format = 'feed' | 'story' | 'banner' | 'square';

interface Selections {
  artType: ArtType | null;
  mood: Mood | null;
  visualElements: VisualElements | null;
  withText: boolean | null;
  format: Format | null;
}

// ── Option data ────────────────────────────────────────────────────────────
const artTypes: { id: ArtType; label: string; icon: string; desc: string }[] = [
  { id: 'matchday', label: 'Matchday', icon: '⚽', desc: 'Dia do jogo' },
  { id: 'jogador_destaque', label: 'Jogador Destaque', icon: '🌟', desc: 'Herói da partida' },
  { id: 'pre_jogo', label: 'Pré-Jogo', icon: '🔥', desc: 'Contagem regressiva' },
  { id: 'pos_jogo', label: 'Pós-Jogo', icon: '🏆', desc: 'Resultado final' },
  { id: 'anuncio_partida', label: 'Anúncio', icon: '📣', desc: 'Fixture announcement' },
];

const moods: { id: Mood; label: string; icon: string }[] = [
  { id: 'epico', label: 'Épico', icon: '⚡' },
  { id: 'explosivo', label: 'Explosivo', icon: '💥' },
  { id: 'dramatico', label: 'Dramático', icon: '🎭' },
  { id: 'vitoria', label: 'Vitória', icon: '🥇' },
  { id: 'clean_profissional', label: 'Clean Pro', icon: '🎯' },
];

const visualElements: { id: VisualElements; label: string; icon: string; desc: string }[] = [
  { id: 'jogador_unico', label: 'Jogador Único', icon: '🧍', desc: 'Um atleta em destaque' },
  { id: 'dois_jogadores', label: 'Duelo', icon: '🤝', desc: 'Dois jogadores em cena' },
  { id: 'time_completo', label: 'Time Completo', icon: '👥', desc: 'Elenco completo' },
  { id: 'sem_pessoas', label: 'Sem Pessoas', icon: '🛡️', desc: 'Escudos e símbolos' },
];

const formats: { id: Format; label: string; icon: string; ratio: string }[] = [
  { id: 'feed', label: 'Feed', icon: '📱', ratio: '1:1' },
  { id: 'story', label: 'Story', icon: '📲', ratio: '9:16' },
  { id: 'banner', label: 'Banner', icon: '🖥️', ratio: '16:9' },
  { id: 'square', label: 'Square', icon: '⬜', ratio: '1:1' },
];

// ── Step indicator ─────────────────────────────────────────────────────────
const steps = ['Tipo', 'Clima', 'Visual', 'Texto', 'Formato'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={cn(
            'flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300',
            i < current
              ? 'w-5 h-5 bg-primary text-primary-foreground'
              : i === current
                ? 'w-6 h-6 bg-primary/20 border border-primary text-primary'
                : 'w-5 h-5 bg-muted/30 text-muted-foreground'
          )}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={cn(
            'text-[10px] font-medium hidden sm:block',
            i === current ? 'text-primary' : 'text-muted-foreground/50'
          )}>{label}</span>
          {i < steps.length - 1 && (
            <div className={cn('h-px w-4 transition-colors', i < current ? 'bg-primary/50' : 'bg-border/20')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Option card ────────────────────────────────────────────────────────────
function OptionCard({
  label, icon, desc, selected, onClick,
}: {
  label: string; icon: string; desc?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 w-full',
        'hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        selected
          ? 'border-primary bg-primary/10 shadow-glow-sm'
          : 'border-border/15 bg-card/30'
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <span className="text-[8px] text-primary-foreground font-bold">✓</span>
        </div>
      )}
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={cn('text-[13px] font-bold leading-tight', selected ? 'text-primary' : 'text-foreground')}>{label}</p>
        {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function FootballArtsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({
    artType: null, mood: null, visualElements: null, withText: null, format: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('googleApiKey') || '');

  const totalSteps = 5;
  const currentStepKey = ['artType', 'mood', 'visualElements', 'withText', 'format'][step] as keyof Selections;
  const canAdvance = selections[currentStepKey] !== null;

  const advance = () => {
    if (step < totalSteps - 1) setStep(s => s + 1);
    else handleGenerate();
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error('Configure sua API Key do Google nas configurações');
      return;
    }

    const { artType, mood, visualElements: ve, withText, format } = selections;
    if (!artType || !mood || !ve || withText === null || !format) {
      toast.error('Complete todas as etapas');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('football-arts', {
        body: {
          artType,
          mood,
          visualElements: ve,
          withText,
          format,
          googleApiKey: apiKey,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error('Nenhuma imagem gerada');

      setGeneratedImage(data.imageUrl);
      toast.success('Arte gerada com sucesso! 🏆');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar arte');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `football-art-${Date.now()}.png`;
    a.click();
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setStep(0);
    setSelections({ artType: null, mood: null, visualElements: null, withText: null, format: null });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[120px]" />
      </div>

      {/* Topbar */}
      <header className="relative z-10 flex h-14 items-center justify-between px-6 border-b border-border/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={logoImg} alt="Design Master" className="h-6 w-6 rounded-lg" />
          <div>
            <span className="text-[13px] font-bold text-foreground">Football</span>
            <span className="text-[13px] font-bold text-primary"> Arts</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-widest">
            Studio
          </span>
        </div>
        <div className="flex items-center gap-2">
          {generatedImage && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-border/20 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border/40 transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Nova Arte
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <Download className="h-3 w-3" />
                Baixar
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 overflow-hidden">

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className={cn(
            'relative rounded-2xl border border-border/15 bg-card/20 overflow-hidden transition-all duration-500',
            selections.format === 'story'
              ? 'w-[280px] h-[498px]'
              : selections.format === 'banner'
                ? 'w-full max-w-2xl h-[280px]'
                : 'w-[480px] h-[480px]',
          )}>
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Football Art"
                className="w-full h-full object-cover"
              />
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">⚽</div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Gerando sua arte...</p>
                  <p className="text-xs text-muted-foreground mt-1">IA construindo o visual perfeito</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
                <span className="text-5xl opacity-30">⚽</span>
                <p className="text-sm text-muted-foreground/60 leading-relaxed">
                  Configure o painel lateral e clique em <strong className="text-primary">Gerar Arte</strong> para criar sua arte profissional de futebol
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Config panel */}
        <aside className="w-[340px] shrink-0 border-l border-border/10 flex flex-col bg-card/10 overflow-y-auto">
          <div className="flex-1 p-6">

            {/* API Key notice */}
            {!apiKey && (
              <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[11px] text-amber-400 font-medium">Configure sua API Key do Google para gerar imagens</p>
                <input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={e => {
                    setApiKey(e.target.value);
                    localStorage.setItem('googleApiKey', e.target.value);
                  }}
                  className="mt-2 w-full rounded-lg bg-background/50 border border-border/20 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                />
              </div>
            )}

            <StepIndicator current={step} />

            {/* Step 0 — Art Type */}
            {step === 0 && (
              <div className="space-y-2 animate-fade-up">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60 mb-3">Tipo de Arte</p>
                {artTypes.map(opt => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    desc={opt.desc}
                    selected={selections.artType === opt.id}
                    onClick={() => setSelections(s => ({ ...s, artType: opt.id }))}
                  />
                ))}
              </div>
            )}

            {/* Step 1 — Mood */}
            {step === 1 && (
              <div className="space-y-2 animate-fade-up">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60 mb-3">Clima Emocional</p>
                {moods.map(opt => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    selected={selections.mood === opt.id}
                    onClick={() => setSelections(s => ({ ...s, mood: opt.id }))}
                  />
                ))}
              </div>
            )}

            {/* Step 2 — Visual elements */}
            {step === 2 && (
              <div className="space-y-2 animate-fade-up">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60 mb-3">Elementos Visuais</p>
                {visualElements.map(opt => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    desc={opt.desc}
                    selected={selections.visualElements === opt.id}
                    onClick={() => setSelections(s => ({ ...s, visualElements: opt.id }))}
                  />
                ))}
              </div>
            )}

            {/* Step 3 — Text */}
            {step === 3 && (
              <div className="space-y-2 animate-fade-up">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60 mb-3">Texto na Arte?</p>
                <OptionCard
                  label="Com Texto"
                  icon="🔤"
                  desc="Tipografia esportiva profissional integrada"
                  selected={selections.withText === true}
                  onClick={() => setSelections(s => ({ ...s, withText: true }))}
                />
                <OptionCard
                  label="Sem Texto"
                  icon="🖼️"
                  desc="Arte visual pura, sem elementos textuais"
                  selected={selections.withText === false}
                  onClick={() => setSelections(s => ({ ...s, withText: false }))}
                />
              </div>
            )}

            {/* Step 4 — Format */}
            {step === 4 && (
              <div className="space-y-2 animate-fade-up">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60 mb-3">Formato Final</p>
                {formats.map(opt => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    desc={opt.ratio}
                    selected={selections.format === opt.id}
                    onClick={() => setSelections(s => ({ ...s, format: opt.id }))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t border-border/10 space-y-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="w-full rounded-xl border border-border/15 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border/30 transition-all"
              >
                Voltar
              </button>
            )}
            <button
              onClick={advance}
              disabled={!canAdvance || isGenerating || !apiKey}
              className={cn(
                'w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2',
                canAdvance && apiKey && !isGenerating
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm'
                  : 'bg-muted/20 text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              {step < totalSteps - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚽</span>
                  Gerando...
                </span>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Gerar Arte
                </>
              )}
            </button>

            {/* Summary chips */}
            {Object.values(selections).some(v => v !== null) && (
              <div className="flex flex-wrap gap-1 pt-2">
                {selections.artType && (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] text-primary font-bold">
                    {artTypes.find(a => a.id === selections.artType)?.label}
                  </span>
                )}
                {selections.mood && (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] text-primary font-bold">
                    {moods.find(m => m.id === selections.mood)?.label}
                  </span>
                )}
                {selections.format && (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] text-primary font-bold">
                    {formats.find(f => f.id === selections.format)?.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
