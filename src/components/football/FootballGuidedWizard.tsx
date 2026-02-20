import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Download, RotateCcw, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const artTypes: { id: ArtType; label: string; icon: string; desc: string }[] = [
  { id: 'matchday',         label: 'Matchday',        icon: '⚽', desc: 'Dia do jogo' },
  { id: 'jogador_destaque', label: 'Jogador Destaque', icon: '🌟', desc: 'Herói da partida' },
  { id: 'pre_jogo',         label: 'Pré-Jogo',         icon: '🔥', desc: 'Contagem regressiva' },
  { id: 'pos_jogo',         label: 'Pós-Jogo',         icon: '🏆', desc: 'Resultado final' },
  { id: 'anuncio_partida',  label: 'Anúncio',          icon: '📣', desc: 'Fixture announcement' },
];

const moods: { id: Mood; label: string; icon: string }[] = [
  { id: 'epico',             label: 'Épico',    icon: '⚡' },
  { id: 'explosivo',         label: 'Explosivo',icon: '💥' },
  { id: 'dramatico',         label: 'Dramático',icon: '🎭' },
  { id: 'vitoria',           label: 'Vitória',  icon: '🥇' },
  { id: 'clean_profissional',label: 'Clean Pro',icon: '🎯' },
];

const visualElementsOpts: { id: VisualElements; label: string; icon: string; desc: string }[] = [
  { id: 'jogador_unico',   label: 'Jogador Único', icon: '🧍', desc: 'Um atleta em destaque' },
  { id: 'dois_jogadores',  label: 'Duelo',          icon: '🤝', desc: 'Dois jogadores em cena' },
  { id: 'time_completo',   label: 'Time Completo',  icon: '👥', desc: 'Elenco completo' },
  { id: 'sem_pessoas',     label: 'Sem Pessoas',    icon: '🛡️', desc: 'Escudos e símbolos' },
];

const formats: { id: Format; label: string; icon: string; ratio: string }[] = [
  { id: 'feed',   label: 'Feed',   icon: '📱', ratio: '1:1' },
  { id: 'story',  label: 'Story',  icon: '📲', ratio: '9:16' },
  { id: 'banner', label: 'Banner', icon: '🖥️', ratio: '16:9' },
  { id: 'square', label: 'Square', icon: '⬜', ratio: '1:1' },
];

const steps = ['Tipo', 'Clima', 'Visual', 'Texto', 'Formato'];

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={cn(
            'flex items-center justify-center rounded-full text-[9px] font-bold transition-all duration-300',
            i < current
              ? 'w-5 h-5 bg-primary text-primary-foreground'
              : i === current
                ? 'w-6 h-6 bg-primary/20 border border-primary text-primary'
                : 'w-5 h-5 bg-muted/30 text-muted-foreground'
          )}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={cn(
            'text-[9px] font-medium hidden sm:block',
            i === current ? 'text-primary' : 'text-muted-foreground/40'
          )}>{label}</span>
          {i < steps.length - 1 && (
            <div className={cn('h-px w-3 transition-colors', i < current ? 'bg-primary/50' : 'bg-border/20')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Option Card ────────────────────────────────────────────────────────────
function OptionCard({ label, icon, desc, selected, onClick }: {
  label: string; icon: string; desc?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 w-full',
        'hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none',
        selected ? 'border-primary bg-primary/10 shadow-glow-sm' : 'border-border/15 bg-card/20'
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-[8px] text-primary-foreground font-bold">✓</span>
        </div>
      )}
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className={cn('text-[11px] font-bold leading-tight', selected ? 'text-primary' : 'text-foreground')}>{label}</p>
        {desc && <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </button>
  );
}

// ── Canvas ─────────────────────────────────────────────────────────────────
function GuidedCanvas({ format, isGenerating, generatedImage }: {
  format: Format | null;
  isGenerating: boolean;
  generatedImage: string | null;
}) {
  const sizeClass = format === 'story'
    ? 'w-[180px] h-[320px]'
    : format === 'banner'
      ? 'w-full max-w-lg h-[200px]'
      : 'w-[280px] h-[280px]';

  return (
    <div className={cn(
      'relative rounded-2xl border border-border/15 bg-card/20 overflow-hidden transition-all duration-500',
      sizeClass
    )}>
      {generatedImage ? (
        <img src={generatedImage} alt="Football Art" className="w-full h-full object-cover" />
      ) : isGenerating ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">⚽</div>
          </div>
          <p className="text-[11px] font-semibold text-foreground/60">Gerando arte…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
          <span className="text-4xl opacity-20">⚽</span>
          <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
            Complete as etapas e clique em <strong className="text-primary/60">Gerar Arte</strong>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────
interface Props {
  apiKey: string;
}

export function FootballGuidedWizard({ apiKey }: Props) {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({
    artType: null, mood: null, visualElements: null, withText: null, format: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const totalSteps = 5;
  const currentStepKey = (['artType', 'mood', 'visualElements', 'withText', 'format'] as (keyof Selections)[])[step];
  const canAdvance = selections[currentStepKey] !== null;
  const isLastStep = step === totalSteps - 1;

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error('Configure sua API Key do Google nas configurações');
      return;
    }
    const { artType, mood, visualElements, withText, format } = selections;
    if (!artType || !mood || !visualElements || withText === null || !format) {
      toast.error('Complete todas as etapas');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('football-arts', {
        body: { artType, mood, visualElements, withText, format, googleApiKey: apiKey },
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

  const handleAdvance = () => {
    if (isLastStep) handleGenerate();
    else setStep(s => s + 1);
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setStep(0);
    setSelections({ artType: null, mood: null, visualElements: null, withText: null, format: null });
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `football-art-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center p-8 overflow-auto">
        <div className="flex flex-col items-center gap-4">
          <GuidedCanvas
            format={selections.format}
            isGenerating={isGenerating}
            generatedImage={generatedImage}
          />
          {generatedImage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs h-8 rounded-lg border-border/20"
              >
                <RotateCcw className="h-3 w-3" />
                Nova Arte
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="gap-1.5 text-xs h-8 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                <Download className="h-3 w-3" />
                Baixar Arte
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Wizard panel */}
      <div className="flex w-[380px] shrink-0 flex-col border-l border-border/10 bg-background/50">
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <StepIndicator current={step} />

          {/* Step 0 — Art Type */}
          {step === 0 && (
            <div className="space-y-1.5 animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Tipo de Arte</p>
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
            <div className="space-y-1.5 animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Clima Emocional</p>
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

          {/* Step 2 — Visual Elements */}
          {step === 2 && (
            <div className="space-y-1.5 animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Elementos Visuais</p>
              {visualElementsOpts.map(opt => (
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
            <div className="space-y-1.5 animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Texto na Arte?</p>
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
            <div className="space-y-1.5 animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Formato Final</p>
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

        {/* Footer */}
        <div className="border-t border-border/10 p-4 space-y-2 shrink-0">
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                className="flex-1 h-10 text-xs font-medium rounded-xl border-border/20"
                disabled={isGenerating}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleAdvance}
              disabled={!canAdvance || isGenerating || (!apiKey && isLastStep)}
              className={cn(
                'h-10 text-xs font-bold rounded-xl transition-all duration-200 gap-1.5 uppercase tracking-wide',
                step === 0 ? 'w-full' : 'flex-[2]',
                isLastStep
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md hover:shadow-glow-lg'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {isGenerating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando…</>
              ) : isLastStep ? (
                <>⚽ Gerar Arte</>
              ) : (
                <>Próximo <ChevronRight className="h-3.5 w-3.5" /></>
              )}
            </Button>
          </div>
          {isLastStep && !apiKey && (
            <p className="text-[9px] text-amber-400/80 text-center">Configure sua API Key nas configurações</p>
          )}
        </div>
      </div>
    </div>
  );
}
