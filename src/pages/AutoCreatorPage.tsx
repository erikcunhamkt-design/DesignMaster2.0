import { useState, useCallback, useRef, useEffect } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { MobileGenerateButton } from '@/components/layout/MobileGenerateButton';
import { AutoConfigPanel } from '@/components/auto/AutoConfigPanel';
import { AutoConfig, defaultAutoConfig } from '@/types/autoConfig';
import { buildAutoRequest } from '@/core/prompt/AutoPromptAgent';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AiModel } from '@/components/configurator/ModelSelector';
import {
  Download, ZoomIn, ZoomOut,
  Check, Loader2, Droplets, Lock, SlidersHorizontal, Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefinementChat } from '@/components/layout/RefinementChat';

// ── Preview state ──────────────────────────────────────────────────────────
type PreviewState = 'aguardando' | 'gerando' | 'concluido';

function AutoPreviewPanel({
  state,
  imageUrl,
  config,
  onRefine,
  isRefining,
}: {
  state: PreviewState;
  imageUrl?: string;
  config: AutoConfig;
  onRefine?: (prompt: string, currentImage: string) => Promise<void>;
  isRefining?: boolean;
}) {
  const [zoom, setZoom] = useState(100);
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [refinementOpen, setRefinementOpen] = useState(false);

  const hasTextOverlay = config.textEnabled && (config.text01 || config.text02 || config.cta);
  const overlayPos = config.verticalPosition === 'cima' ? 'bottom' : config.verticalPosition === 'baixo' ? 'top' : 'bottom';

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    setDownloadState('loading');
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `auto-creator-${Date.now()}.png`;
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
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full -top-60 left-1/4 bg-primary/5 blur-[120px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full -bottom-32 right-1/4 bg-red-500/4 blur-[80px]" />
      </div>

      {/* Toolbar */}
      {state === 'concluido' && imageUrl && (
        <div className="relative z-10 flex items-center justify-between border-b border-border/8 px-5 py-2 bg-background/60 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono font-medium text-muted-foreground w-10 text-center tabular-nums">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {onRefine && (
              <Button
                size="sm"
                variant={refinementOpen ? 'default' : 'outline'}
                onClick={() => setRefinementOpen(!refinementOpen)}
                disabled={isRefining}
                className={`h-7 gap-1.5 text-[10px] rounded-lg font-medium transition-all ${refinementOpen ? 'bg-primary/90 hover:bg-primary border-primary/50 text-primary-foreground shadow-sm' : 'border-border/30 text-muted-foreground hover:text-foreground'}`}
              >
                {isRefining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                Refinar
              </Button>
            )}
            <Button
              size="sm"
              variant={watermarkEnabled ? 'default' : 'outline'}
              onClick={() => setWatermarkEnabled(!watermarkEnabled)}
              className={`h-7 gap-1.5 text-[10px] rounded-lg font-medium transition-all ${watermarkEnabled ? 'bg-amber-500/90 hover:bg-amber-500 border-amber-500/50 text-white shadow-sm' : 'border-border/30 text-muted-foreground hover:text-foreground'}`}
            >
              <Droplets className="h-3 w-3" />
              Marca d'água
            </Button>
            {hasTextOverlay && (
              <Button size="sm" variant={showOverlay ? 'default' : 'outline'} onClick={() => setShowOverlay(!showOverlay)} className="h-7 gap-1.5 text-[10px] rounded-lg font-medium">
                Texto
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-auto p-10">
        {state === 'aguardando' && (
          <div className="flex flex-col items-center gap-8 animate-fade-up max-w-[240px] text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border/10 bg-card/20">
                <span className="text-5xl opacity-30">🏎️</span>
              </div>
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/5 to-red-500/3 -z-10 animate-breathe" />
            </div>
            <div className="space-y-2">
              <p className="font-display text-base font-semibold tracking-tight text-foreground/50">
                Auto Creator
              </p>
              <p className="text-[11px] text-muted-foreground/30 leading-relaxed">
                Configure o painel à direita e clique em{' '}
                <span className="text-primary/60 font-semibold">Gerar Arte 🏎️</span>
              </p>
            </div>
            <div className="flex gap-3 text-muted-foreground/20">
              <span className="text-xl">🏁</span>
              <span className="text-xl">⚡</span>
              <span className="text-xl">🏆</span>
            </div>
          </div>
        )}

        {state === 'gerando' && (
          <div className="flex flex-col items-center gap-8 animate-fade-up">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-red-500/10 animate-breathe" />
              <div className="absolute inset-[3px] rounded-[14px] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <span className="absolute inset-0 flex items-center justify-center text-xl">🏎️</span>
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-display text-base font-semibold tracking-tight text-foreground/60">Gerando arte automotiva…</p>
              <p className="text-[11px] text-muted-foreground/35">IA construindo visual motorsport profissional</p>
            </div>
            <div className="w-48 h-[1.5px] rounded-full overflow-hidden bg-border/15">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
          </div>
        )}

        {state === 'concluido' && imageUrl && (
          <div className="relative inline-block group" style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}>
            <img
              src={imageUrl}
              alt="Arte automotiva gerada"
              className="object-contain rounded-xl shadow-cinematic transition-all duration-500 w-full h-full ring-1 ring-white/[0.03]"
            />

            {/* Watermark */}
            {watermarkEnabled && (
              <>
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none select-none" style={{ zIndex: 2 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full text-center font-bold tracking-[0.3em] uppercase"
                      style={{
                        top: `${(i * 100) / 12 - 5}%`,
                        left: '-10%',
                        width: '120%',
                        transform: 'rotate(-18deg)',
                        fontSize: 'clamp(10px, 2vw, 18px)',
                        color: 'rgba(255,255,255,0.18)',
                        letterSpacing: '0.4em',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        lineHeight: 1,
                      }}
                    >
                      PRÉVIA &nbsp;&nbsp;&nbsp; PRÉVIA &nbsp;&nbsp;&nbsp; PRÉVIA
                    </div>
                  ))}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 rounded-b-xl pointer-events-none select-none"
                  style={{ background: 'rgba(0,0,0,0.72)', padding: '6px 10px', zIndex: 3 }}
                >
                  <Lock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                  <span className="text-white/80 font-medium text-center leading-tight" style={{ fontSize: 'clamp(8px, 1.2vw, 11px)' }}>
                    Imagem protegida — apenas para aprovação do cliente
                  </span>
                </div>
              </>
            )}

            {/* Download button */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 10 }}>
              <button
                onClick={handleDownload}
                disabled={downloadState === 'loading'}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md border border-white/10 hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
              >
                <DownloadIcon className={`h-3.5 w-3.5 ${downloadState === 'loading' ? 'animate-spin' : ''}`} />
                {downloadState === 'done' ? 'Salvo!' : 'Baixar Arte'}
              </button>
            </div>

            <div className="absolute inset-0 rounded-xl bg-background/0 group-hover:bg-background/5 transition-colors duration-300 pointer-events-none" style={{ zIndex: 1 }} />

            {/* Text overlay */}
            {hasTextOverlay && showOverlay && (
              <div
                className={`absolute left-0 right-0 flex flex-col items-center gap-2 px-6 ${overlayPos === 'top' ? 'top-[8%]' : 'bottom-[8%]'}`}
                style={{ pointerEvents: 'none', zIndex: 4 }}
              >
                {config.text01 && (
                  <p className="text-center font-display font-bold leading-tight drop-shadow-lg" style={{ fontSize: 'clamp(16px, 4vw, 36px)', color: '#FFFFFF', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
                    {config.text01}
                  </p>
                )}
                {config.text02 && (
                  <p className="text-center font-medium leading-snug drop-shadow-md" style={{ fontSize: 'clamp(12px, 2.5vw, 22px)', color: '#FFFFFFCC', textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                    {config.text02}
                  </p>
                )}
                {config.cta && (
                  <div className="mt-1 rounded-full px-5 py-1.5 font-semibold shadow-lg" style={{ fontSize: 'clamp(10px, 2vw, 16px)', backgroundColor: config.primaryColor || '#e63946', color: '#FFFFFF' }}>
                    {config.cta}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AutoCreatorPage() {
  const [config, setConfig] = useState<AutoConfig>({ ...defaultAutoConfig });
  const [previewState, setPreviewState] = useState<PreviewState>('aguardando');
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
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
        setGeneratedImage(data.imageUrl);
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

  const updateConfig = useCallback((patch: Partial<AutoConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setPreviewState('gerando');
    setGeneratedImage(undefined);

    try {
      const genRequest = buildAutoRequest(config);

      // Convert reference photos to base64
      const referenceImages: string[] = [];
      for (const url of config.subjectPhotos.slice(0, 3)) {
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
        setGeneratedImage(data.imageUrl);
        setPreviewState('concluido');
        toast.success('Arte automotiva gerada! 🏎️🏁');
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (err: any) {
      console.error('Auto generation error:', err);
      toast.error(err.message || 'Erro ao gerar arte');
      setPreviewState('aguardando');
    } finally {
      setIsGenerating(false);
    }
  }, [config, apiKey]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Velozes & Imortais" />

      {/* Mode bar */}
      <div className="flex items-center border-b border-border/10 bg-background/90 backdrop-blur-sm shrink-0 h-9 px-3 gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/60 border border-border/25">
          <SlidersHorizontal className="h-2.5 w-2.5 text-foreground" />
          <span className="text-[10px] font-semibold text-foreground">Avançado</span>
        </div>
        <div className="h-4 w-px bg-border/20" />
        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-semibold">Auto Creator</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-widest">
          🏎️ Motorsport
        </span>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        <div className="md:hidden flex flex-col flex-1 overflow-y-auto pb-20">
          <AutoConfigPanel
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
              <AutoPreviewPanel state={previewState} imageUrl={generatedImage} config={config} onRefine={handleRefine} isRefining={isRefining} />
            </div>
          )}
        </div>
        <div className="hidden md:flex flex-1 overflow-hidden">
          <AutoPreviewPanel state={previewState} imageUrl={generatedImage} config={config} onRefine={handleRefine} isRefining={isRefining} />
          <AutoConfigPanel
            config={config}
            onUpdate={updateConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            apiKey={apiKey}
            aiModel={aiModel}
            onModelChange={setAiModel}
          />
        </div>
        <MobileGenerateButton onGenerate={handleGenerate} isGenerating={isGenerating} label="Gerar Arte 🏎️" />
      </div>
    </div>
  );
}
