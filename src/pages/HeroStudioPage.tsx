import { useState, useCallback, useRef, useEffect } from 'react';
import { useImageHistory, hasImageHistory } from '@/hooks/useImageHistory';
import { ImageHistoryBar } from '@/components/layout/ImageHistoryBar';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { MobileGenerateButton } from '@/components/layout/MobileGenerateButton';
import { HeroConfigPanel } from '@/components/hero/HeroConfigPanel';
import { HeroConfig, defaultHeroConfig } from '@/types/heroConfig';
import { buildHeroRequest } from '@/core/prompt/HeroPromptAgent';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AiModel } from '@/components/configurator/ModelSelector';
import {
  Download, ZoomIn, ZoomOut, Check,
  Loader2, Droplets, Lock, Wand2, Crown, Sparkles, Monitor,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefinementChat } from '@/components/layout/RefinementChat';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type PreviewState = 'aguardando' | 'gerando' | 'concluido';

// ── Preview Panel ──────────────────────────────────────────────────────────
function HeroPreviewPanel({
  state, imageUrl, config, onRefine, isRefining,
  historyImages, historyIndex, onSelectHistory, onClearHistory,
}: {
  state: PreviewState; imageUrl?: string; config: HeroConfig;
  onRefine?: (prompt: string, currentImage: string) => Promise<void>;
  isRefining?: boolean;
  historyImages?: string[]; historyIndex?: number;
  onSelectHistory?: (i: number) => void; onClearHistory?: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [refinementOpen, setRefinementOpen] = useState(false);

  const hasTextOverlay = config.textEnabled && (config.headline || config.subheadline);
  const textSide = config.composition === 'pessoa_direita' ? 'left' : 'right';
  const isCentered = config.composition === 'centralizado' || config.composition === 'sem_pessoa' || config.composition === 'split_layout';

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    setDownloadState('loading');
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `hero-studio-${Date.now()}.png`;
      link.click();
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch {
      setDownloadState('idle');
    }
  }, [imageUrl]);

  const DownloadIcon = downloadState === 'loading' ? Loader2 : downloadState === 'done' ? Check : Download;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background relative">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full -top-96 left-1/4 bg-primary/3 blur-[180px]" />
        <div className="absolute w-[500px] h-[500px] rounded-full -bottom-60 right-1/4 bg-blue-500/2 blur-[120px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent/2 blur-[100px]" />
      </div>

      {/* Toolbar */}
      <AnimatePresence>
        {state === 'concluido' && imageUrl && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex items-center justify-between border-b border-border/10 px-5 py-2 bg-background/70 backdrop-blur-2xl shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] font-mono font-semibold text-muted-foreground w-10 text-center tabular-nums bg-secondary/40 rounded px-1 py-0.5">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setZoom(100)}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              {onRefine && (
                <Button
                  size="sm"
                  variant={refinementOpen ? 'default' : 'outline'}
                  onClick={() => setRefinementOpen(!refinementOpen)}
                  disabled={isRefining}
                  className={cn(
                    'h-7 gap-1.5 text-[10px] rounded-lg font-medium transition-all',
                    refinementOpen
                      ? 'bg-primary/90 hover:bg-primary border-primary/50 text-primary-foreground shadow-sm'
                      : 'border-border/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isRefining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  Refinar
                </Button>
              )}
              <Button
                size="sm"
                variant={watermarkEnabled ? 'default' : 'outline'}
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                className={cn(
                  'h-7 gap-1.5 text-[10px] rounded-lg font-medium transition-all',
                  watermarkEnabled
                    ? 'bg-amber-500/90 hover:bg-amber-500 border-amber-500/50 text-white shadow-sm'
                    : 'border-border/30 text-muted-foreground hover:text-foreground'
                )}
              >
                <Droplets className="h-3 w-3" />
                Marca d'água
              </Button>
              {hasTextOverlay && (
                <Button size="sm" variant={showOverlay ? 'default' : 'outline'} onClick={() => setShowOverlay(!showOverlay)}
                  className="h-7 gap-1.5 text-[10px] rounded-lg font-medium"
                >
                  Texto
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {state === 'aguardando' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-6 max-w-[300px] text-center"
            >
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-border/15 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm">
                  <Crown className="h-12 w-12 text-primary/20" />
                </div>
                <div className="absolute -inset-8 rounded-[32px] bg-gradient-to-br from-primary/5 to-accent/3 -z-10 animate-breathe" />
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [-3, 3, -3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                </motion.div>
                <motion.div
                  animate={{ y: [3, -3, 3] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 border border-accent/20"
                >
                  <Monitor className="h-3 w-3 text-accent/60" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground/60">
                  Hero Studio
                </h2>
                <p className="text-[11px] text-muted-foreground/35 leading-relaxed max-w-[220px]">
                  Configure o painel e clique em{' '}
                  <span className="text-primary/60 font-semibold">Gerar Hero Section</span>{' '}
                  para criar visuais de alta conversão.
                </p>
              </div>

              <div className="flex items-center gap-4">
                {['🚀 SaaS', '👤 Personal', '⚡ Startup'].map(tag => (
                  <span key={tag} className="text-[9px] text-muted-foreground/25 font-medium bg-secondary/20 px-2 py-1 rounded-full border border-border/10">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {state === 'gerando' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative h-28 w-28">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 animate-breathe" />
                <div className="absolute inset-[3px] rounded-[22px] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Crown className="absolute inset-0 m-auto h-5 w-5 text-primary/60" />
                  </div>
                </div>
                {/* Orbiting dots */}
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 rounded-full bg-primary/40"
                    animate={{
                      x: [0, 20 * Math.cos((i * 2 * Math.PI) / 3), -20 * Math.cos((i * 2 * Math.PI) / 3), 0],
                      y: [0, 20 * Math.sin((i * 2 * Math.PI) / 3), -20 * Math.sin((i * 2 * Math.PI) / 3), 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                    style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
                  />
                ))}
              </div>
              <div className="text-center space-y-2">
                <p className="font-display text-base font-bold tracking-tight text-foreground/70">Construindo hero section…</p>
                <p className="text-[11px] text-muted-foreground/40">Aplicando princípios de alta conversão</p>
              </div>
              <div className="w-52 h-1 rounded-full overflow-hidden bg-border/15">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-accent/60"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: '40%' }}
                />
              </div>
            </motion.div>
          )}

          {state === 'concluido' && imageUrl && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative inline-block group"
              style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}
            >
              <img
                src={imageUrl}
                alt="Hero section gerado"
                className="object-contain rounded-xl shadow-2xl transition-all duration-500 w-full h-full ring-1 ring-white/[0.04]"
              />

              {/* Watermark */}
              {watermarkEnabled && (
                <>
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none select-none" style={{ zIndex: 2 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="absolute w-full text-center font-bold tracking-[0.3em] uppercase"
                        style={{
                          top: `${(i * 100) / 12 - 5}%`, left: '-10%', width: '120%',
                          transform: 'rotate(-18deg)', fontSize: 'clamp(10px, 2vw, 18px)',
                          color: 'rgba(255,255,255,0.18)', letterSpacing: '0.4em',
                          userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
                        }}
                      >
                        PRÉVIA &nbsp;&nbsp;&nbsp; PRÉVIA &nbsp;&nbsp;&nbsp; PRÉVIA
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 rounded-b-xl pointer-events-none select-none"
                    style={{ background: 'rgba(0,0,0,0.72)', padding: '6px 10px', zIndex: 3 }}
                  >
                    <Lock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                    <span className="text-white/80 font-medium text-center leading-tight" style={{ fontSize: 'clamp(8px, 1.2vw, 11px)' }}>
                      Imagem protegida — apenas para aprovação
                    </span>
                  </div>
                </>
              )}

              {/* Download */}
              <div className="absolute top-4 right-4 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 10 }}>
                <button
                  onClick={handleDownload}
                  disabled={downloadState === 'loading'}
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md border border-white/10 hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
                >
                  <DownloadIcon className={`h-3.5 w-3.5 ${downloadState === 'loading' ? 'animate-spin' : ''}`} />
                  {downloadState === 'done' ? 'Salvo!' : 'Baixar Hero'}
                </button>
              </div>

              <div className="absolute inset-0 rounded-xl bg-background/0 group-hover:bg-background/5 transition-colors duration-300 pointer-events-none" style={{ zIndex: 1 }} />

              {/* Text overlay */}
              {hasTextOverlay && showOverlay && (
                <div
                  className={cn(
                    'absolute flex flex-col gap-2 px-8 py-6',
                    isCentered ? 'inset-x-0 bottom-[8%] items-center text-center' : textSide === 'left' ? 'left-[5%] top-1/2 -translate-y-1/2 w-[40%] items-start text-left' : 'right-[5%] top-1/2 -translate-y-1/2 w-[40%] items-end text-right'
                  )}
                  style={{ pointerEvents: 'none', zIndex: 4 }}
                >
                  {config.headline && (
                    <p className="font-display font-bold leading-tight drop-shadow-lg text-foreground" style={{ fontSize: 'clamp(16px, 3.5vw, 42px)', textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>
                      {config.headline}
                    </p>
                  )}
                  {config.subheadline && (
                    <p className="font-medium leading-snug drop-shadow-md text-foreground/80" style={{ fontSize: 'clamp(11px, 2vw, 20px)', textShadow: '0 1px 10px rgba(0,0,0,0.6)' }}>
                      {config.subheadline}
                    </p>
                  )}
                  {config.cta && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/90 text-primary-foreground font-bold shadow-glow-md border border-border/20" style={{ fontSize: 'clamp(10px, 1.5vw, 16px)', padding: '6px 20px' }}>
                      {config.cta}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Refinement Chat */}
      {onRefine && imageUrl && (
        <RefinementChat
          open={refinementOpen}
          onClose={() => setRefinementOpen(false)}
          imageUrl={imageUrl}
          onRefine={onRefine}
          isRefining={isRefining ?? false}
        />
      )}
      {state === 'concluido' && onSelectHistory && (
        <ImageHistoryBar images={historyImages ?? []} activeIndex={historyIndex ?? 0} onSelect={onSelectHistory} onClear={onClearHistory} />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HeroStudioPage() {
  const [config, setConfig] = useState<HeroConfig>({ ...defaultHeroConfig });
  const [previewState, setPreviewState] = useState<PreviewState>(() => hasImageHistory('hero-studio') ? 'concluido' : 'aguardando');
  const { images: historyImages, currentImage: generatedImage, activeIndex: historyIndex, addImage, selectImage: selectHistoryImage, clearHistory } = useImageHistory('hero-studio');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const { apiKey } = useGoogleApiKey();
  const [aiModel, setAiModel] = useState<AiModel>('pro');
  const mobilePreviewRef = useRef<HTMLDivElement>(null);

  const handleRefine = useCallback(async (refinementPrompt: string, currentImageUrl: string) => {
    setIsRefining(true);
    try {
      const refineText = `Edit this image: ${refinementPrompt}. Preserve the overall composition, subject, pose, lighting style, and visual quality. Only apply the requested change. The final image MUST fill the entire canvas edge to edge with no blank space.`;
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: refineText,
          negativePrompt: 'low quality, blurry, artifacts, blank space, empty borders',
          referenceImages: [currentImageUrl],
          googleApiKey: apiKey,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        addImage(data.imageUrl);
        toast.success('Imagem refinada!');
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (err: any) {
      console.error('Refine error:', err);
      toast.error(err.message || 'Erro ao refinar');
      throw err;
    } finally {
      setIsRefining(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (previewState === 'gerando' && mobilePreviewRef.current) {
      setTimeout(() => mobilePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [previewState]);

  const updateConfig = useCallback((patch: Partial<HeroConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setPreviewState('gerando');

    try {
      const genRequest = buildHeroRequest(config);

      const referenceImages: string[] = [];
      for (const url of config.referencePhotos.slice(0, 3)) {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          referenceImages.push(base64);
        } catch {
          // skip
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: genRequest.prompt,
          negativePrompt: genRequest.negative_prompt,
          referenceImages,
          googleApiKey: apiKey,
          aiModel,
        },
      });

      if (error) throw new Error(error.message || 'Erro na geração');
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        addImage(data.imageUrl);
        setPreviewState('concluido');
        toast.success('Hero section gerado com sucesso! ✨');
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (err: any) {
      console.error('Hero generation error:', err);
      toast.error(err.message || 'Erro ao gerar hero section');
      setPreviewState('aguardando');
    } finally {
      setIsGenerating(false);
    }
  }, [config, apiKey, aiModel]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Liga dos Heróis" />

      {/* Mode bar */}
      <div className="flex items-center border-b border-border/10 bg-background/90 backdrop-blur-sm shrink-0 h-9 px-3 gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
          <Crown className="h-2.5 w-2.5 text-primary" />
          <span className="text-[10px] font-semibold text-primary">Hero Studio</span>
        </div>
        <div className="h-4 w-px bg-border/20" />
        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-semibold">Landing Page</span>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        {/* Mobile */}
        <div className="md:hidden flex flex-col flex-1 overflow-y-auto pb-20">
          <HeroConfigPanel
            config={config}
            onUpdate={updateConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            apiKey={apiKey}
            aiModel={aiModel}
            onModelChange={setAiModel}
          />
          {previewState !== 'aguardando' && (
            <div ref={mobilePreviewRef} className="min-h-[400px]">
              <HeroPreviewPanel state={previewState} imageUrl={generatedImage} config={config} onRefine={handleRefine} isRefining={isRefining} historyImages={historyImages} historyIndex={historyIndex} onSelectHistory={selectHistoryImage} onClearHistory={clearHistory} />
            </div>
          )}
        </div>
        {/* Desktop */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <HeroPreviewPanel state={previewState} imageUrl={generatedImage} config={config} onRefine={handleRefine} isRefining={isRefining} historyImages={historyImages} historyIndex={historyIndex} onSelectHistory={selectHistoryImage} onClearHistory={clearHistory} />
          <HeroConfigPanel
            config={config}
            onUpdate={updateConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            apiKey={apiKey}
            aiModel={aiModel}
            onModelChange={setAiModel}
          />
        </div>
        {/* MobileGenerateButton removed — config panel already has the generate button */}
      </div>
    </div>
  );
}
