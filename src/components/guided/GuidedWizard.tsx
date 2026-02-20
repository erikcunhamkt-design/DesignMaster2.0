import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Loader2, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { useWatermarkDownload } from '@/hooks/useWatermarkDownload';
import { DownloadButtons } from '@/components/DownloadButtons';

// ─── Step data ────────────────────────────────────────────────────────────────

const STEP_OBJECTIVES = [
  { id: 'anuncio', label: 'Anúncio', emoji: '📣', desc: 'Vender ou promover algo' },
  { id: 'branding', label: 'Branding', emoji: '🏷️', desc: 'Fortalecer identidade de marca' },
  { id: 'conteudo', label: 'Conteúdo', emoji: '📸', desc: 'Post editorial ou lifestyle' },
  { id: 'produto', label: 'Produto', emoji: '📦', desc: 'Foto de produto ou embalagem' },
  { id: 'capa', label: 'Capa', emoji: '🎨', desc: 'Capa de livro, álbum ou ebook' },
  { id: 'campanha', label: 'Campanha', emoji: '🚀', desc: 'Campanha de lançamento' },
];

const STEP_CONTEXTS = [
  { id: 'stories', label: 'Stories', emoji: '📱', desc: '9:16 — vertical mobile' },
  { id: 'feed', label: 'Feed', emoji: '⬜', desc: '1:1 — quadrado' },
  { id: 'horizontal', label: 'Horizontal', emoji: '🖥️', desc: '16:9 — banner/capa' },
  { id: 'retrato', label: 'Retrato', emoji: '📄', desc: '4:5 — feed retrato' },
];

const STEP_MOODS = [
  { id: 'luxury', label: 'Luxury', emoji: '✨', desc: 'Premium, sofisticado, escuro' },
  { id: 'energetico', label: 'Energético', emoji: '⚡', desc: 'Vibrante, dinâmico, bold' },
  { id: 'minimalista', label: 'Minimalista', emoji: '◻️', desc: 'Clean, respirado, preciso' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬', desc: 'Dramático, iluminação épica' },
  { id: 'editorial', label: 'Editorial', emoji: '📰', desc: 'Fashion, arte, conceitual' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '🌿', desc: 'Natural, humano, autêntico' },
];

const STEP_GUIDES = [
  { id: 'profissional', label: 'Profissional', emoji: '💼', desc: 'Foco em resultados e conversão' },
  { id: 'artista', label: 'Artista', emoji: '🎭', desc: 'Expressão criativa e ousadia' },
  { id: 'estrategista', label: 'Estrategista', emoji: '🧠', desc: 'Coerência de marca e posicionamento' },
  { id: 'minimalista', label: 'Minimalista', emoji: '🤍', desc: 'Menos é mais, elegância absoluta' },
];

const VARIATION_OPTIONS = [
  { id: '1', label: '1 variação', desc: 'Mais rápido' },
  { id: '2', label: '2 variações', desc: 'Equilibrado' },
  { id: '3', label: '3 variações', desc: 'Mais opções' },
];

const INTENSITY_OPTIONS = [
  { id: 'sutil', label: 'Sutil', desc: 'Resultado seguro e coerente' },
  { id: 'moderado', label: 'Moderado', desc: 'Equilíbrio entre controle e surpresa' },
  { id: 'ousado', label: 'Ousado', desc: 'IA com mais liberdade criativa' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface WizardState {
  objective: string;
  context: string;
  mood: string;
  guide: string;
  variations: string;
  intensity: string;
  subject: string;
}

const INITIAL: WizardState = {
  objective: '',
  context: '',
  mood: '',
  guide: '',
  variations: '1',
  intensity: 'moderado',
  subject: '',
};

// ─── Step components ──────────────────────────────────────────────────────────

interface OptionCardProps {
  emoji: string;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ emoji, label, desc, selected, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all duration-200 w-full',
        selected
          ? 'bg-primary/12 border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.12)]'
          : 'bg-card/40 border-border/15 hover:bg-card/70 hover:border-border/30'
      )}
    >
      {selected && (
        <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      <span className="text-2xl leading-none">{emoji}</span>
      <p className={cn('text-[11px] font-bold tracking-wide', selected ? 'text-primary' : 'text-foreground/80')}>{label}</p>
      <p className="text-[9px] text-muted-foreground/60 leading-tight">{desc}</p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GuidedWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const { apiKey } = useGoogleApiKey();
  const { downloadState, download } = useWatermarkDownload(resultImage, 'guided-creation');

  const update = (key: keyof WizardState, val: string) =>
    setState((s) => ({ ...s, [key]: val }));

  const formatMap: Record<string, string> = {
    stories: 'Vertical 9:16 para Stories',
    feed: 'Quadrado 1:1 para Feed',
    horizontal: 'Horizontal 16:9',
    retrato: 'Retrato 4:5 para Feed',
  };

  const canProceed = () => {
    if (step === 0) return !!state.objective;
    if (step === 1) return !!state.context;
    if (step === 2) return !!state.mood;
    if (step === 3) return !!state.guide;
    return true;
  };

  const buildPrompt = () => {
    const objLabel = STEP_OBJECTIVES.find(o => o.id === state.objective)?.label || state.objective;
    const moodLabel = STEP_MOODS.find(m => m.id === state.mood)?.label || state.mood;
    const guideLabel = STEP_GUIDES.find(g => g.id === state.guide)?.label || state.guide;
    const fmt = formatMap[state.context] || state.context;
    const intensity = state.intensity === 'sutil' ? 'conservative, safe, polished' : state.intensity === 'ousado' ? 'bold, creative, experimental' : 'balanced, refined';

    return `Ultra high quality cinematic advertisement image. Objective: ${objLabel}. Format: ${fmt}. Visual mood: ${moodLabel} aesthetic — ${STEP_MOODS.find(m=>m.id===state.mood)?.desc}. Creative direction: ${guideLabel} approach — ${STEP_GUIDES.find(g=>g.id===state.guide)?.desc}. Creative intensity: ${intensity}. Dramatic studio lighting, photorealistic render, premium ad quality, high contrast, deep shadows, professional color grading.`;
  };

  const handleGenerate = async () => {
    if (apiKey.length < 10) {
      toast.error('Configure sua API Key antes de gerar');
      return;
    }
    setIsGenerating(true);
    setResultImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: buildPrompt(),
          negativePrompt: 'text, watermark, blurry, low quality, amateur, distorted',
          referenceImages: [],
          googleApiKey: apiKey,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success('Criação concluída!');
        setStep(6);
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar');
    } finally {
      setIsGenerating(false);
    }
  };

  const restart = () => {
    setState(INITIAL);
    setResultImage(null);
    setStep(0);
  };

  // ── Step definitions ──
  const STEPS = [
    {
      key: 'objetivo',
      label: 'Objetivo',
      question: 'Qual é o objetivo desta criação?',
      hint: 'Isso define a intenção estratégica da imagem.',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {STEP_OBJECTIVES.map(o => (
            <OptionCard key={o.id} {...o} selected={state.objective === o.id} onClick={() => update('objective', o.id)} />
          ))}
        </div>
      ),
    },
    {
      key: 'contexto',
      label: 'Formato',
      question: 'Onde esta imagem vai ser usada?',
      hint: 'O formato define proporção e composição ideal.',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {STEP_CONTEXTS.map(c => (
            <OptionCard key={c.id} {...c} selected={state.context === c.id} onClick={() => update('context', c.id)} />
          ))}
        </div>
      ),
    },
    {
      key: 'direcao',
      label: 'Estilo',
      question: 'Qual é a linguagem visual?',
      hint: 'O mood define a atmosfera emocional da imagem.',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {STEP_MOODS.map(m => (
            <OptionCard key={m.id} {...m} selected={state.mood === m.id} onClick={() => update('mood', m.id)} />
          ))}
        </div>
      ),
    },
    {
      key: 'orientador',
      label: 'Orientador',
      question: 'Quem guia a criação?',
      hint: 'O orientador molda o ponto de vista criativo da IA.',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {STEP_GUIDES.map(g => (
            <OptionCard key={g.id} {...g} selected={state.guide === g.id} onClick={() => update('guide', g.id)} />
          ))}
        </div>
      ),
    },
    {
      key: 'intensidade',
      label: 'Ajustes',
      question: 'Como a IA deve interpretar suas escolhas?',
      hint: 'Intensidade criativa controla a liberdade da IA.',
      content: (
        <div className="space-y-2">
          {INTENSITY_OPTIONS.map(o => (
            <button
              key={o.id}
              onClick={() => update('intensity', o.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200',
                state.intensity === o.id
                  ? 'bg-primary/12 border-primary/40'
                  : 'bg-card/40 border-border/15 hover:bg-card/70'
              )}
            >
              <div className={cn(
                'h-3 w-3 rounded-full border-2 shrink-0 transition-all',
                state.intensity === o.id ? 'border-primary bg-primary' : 'border-border/40'
              )} />
              <div>
                <p className={cn('text-[11px] font-bold', state.intensity === o.id ? 'text-primary' : 'text-foreground/80')}>{o.label}</p>
                <p className="text-[9px] text-muted-foreground/60">{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'geracao',
      label: 'Gerar',
      question: 'Pronto para criar?',
      hint: 'Revise suas escolhas e inicie a geração.',
      content: (
        <div className="space-y-3">
          {/* Summary */}
          <div className="rounded-xl border border-border/15 bg-card/30 divide-y divide-border/10">
            {[
              { label: 'Objetivo', value: STEP_OBJECTIVES.find(o => o.id === state.objective) },
              { label: 'Formato', value: STEP_CONTEXTS.find(c => c.id === state.context) },
              { label: 'Estilo', value: STEP_MOODS.find(m => m.id === state.mood) },
              { label: 'Orientador', value: STEP_GUIDES.find(g => g.id === state.guide) },
              { label: 'Intensidade', value: INTENSITY_OPTIONS.find(i => i.id === state.intensity) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40">{label}</span>
                <div className="flex items-center gap-1.5">
                  {'emoji' in (value || {}) && <span className="text-sm">{(value as any).emoji}</span>}
                  <span className="text-[11px] font-semibold text-foreground/80">{value?.label || '—'}</span>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || apiKey.length < 10}
            className="w-full h-12 gap-2.5 text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-glow-md rounded-xl uppercase"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Criando...' : 'Criar Agora'}
          </Button>
          {apiKey.length < 10 && (
            <p className="text-[9px] text-destructive/70 text-center">Configure sua API Key no topo para gerar</p>
          )}
        </div>
      ),
    },
  ];

  // ── Result screen ──
  if (step === 6 && resultImage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Criação concluída</p>
            <h2 className="text-lg font-bold text-foreground font-display">Sua imagem está pronta</h2>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border/15 shadow-elevation-3">
            <img src={resultImage} alt="Resultado" className="w-full object-cover" />
          </div>
          <div className="relative">
            <DownloadButtons downloadState={downloadState} onDownload={download} />
          </div>
          <Button
            variant="ghost"
            onClick={restart}
            className="w-full h-9 gap-2 text-[10px] font-medium text-muted-foreground/50 hover:text-muted-foreground rounded-xl"
          >
            <RotateCcw className="h-3 w-3" />
            Começar nova criação
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: wizard panel */}
      <div className="w-[400px] shrink-0 border-r border-border/10 bg-background/50 flex flex-col">

        {/* Progress bar */}
        <div className="flex gap-1 px-5 pt-5 pb-3 shrink-0">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                'h-0.5 flex-1 rounded-full transition-all duration-500',
                i < step ? 'bg-primary' : i === step ? 'bg-primary/50' : 'bg-border/20'
              )}
            />
          ))}
        </div>

        {/* Step label */}
        <div className="px-5 pb-4 shrink-0">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
            Passo {step + 1} de {STEPS.length} — {currentStep.label}
          </p>
        </div>

        {/* Question */}
        <div className="px-5 pb-5 shrink-0">
          <h2 className="text-base font-bold text-foreground font-display leading-snug">
            {currentStep.question}
          </h2>
          <p className="text-[10px] text-muted-foreground/50 mt-1">{currentStep.hint}</p>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="border-t border-border/10 px-5 py-4 flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="h-9 gap-1.5 rounded-xl text-[10px] font-semibold text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-20"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>

          <div className="flex-1" />

          {step < STEPS.length - 1 && (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="h-9 gap-1.5 rounded-xl text-[10px] font-bold px-5 bg-primary/90 hover:bg-primary text-primary-foreground disabled:opacity-25"
            >
              Próximo
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Right: canvas preview */}
      <div className="flex-1 flex items-center justify-center bg-background/30 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {isGenerating ? (
          <div className="text-center space-y-4 relative z-10">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Criando...</p>
              <p className="text-[10px] text-muted-foreground/50">A IA está trabalhando na sua criação</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 relative z-10 px-8 max-w-sm">
            {/* Visual summary of selections */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[
                STEP_OBJECTIVES.find(o => o.id === state.objective),
                STEP_CONTEXTS.find(c => c.id === state.context),
                STEP_MOODS.find(m => m.id === state.mood),
                STEP_GUIDES.find(g => g.id === state.guide),
              ].filter(Boolean).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-full bg-secondary/40 border border-border/15 px-3 py-1"
                >
                  <span className="text-sm">{(item as any).emoji}</span>
                  <span className="text-[9px] font-semibold text-foreground/60">{item!.label}</span>
                </div>
              ))}
            </div>

            <div className="h-px w-16 bg-border/15 mx-auto" />
            <Sparkles className="h-8 w-8 mx-auto text-primary/20" />
            <p className="text-[11px] font-semibold text-foreground/30">
              {step < 5
                ? 'Complete as etapas para gerar'
                : 'Pronto — pressione Criar Agora'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
