import { ImageIcon, Download, ZoomIn, ZoomOut, Type, Sparkles, Check, Loader2, Droplets, Lock, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback, useRef } from 'react';
import { ProjectConfig } from '@/types/project';
import { RefinementChat } from './RefinementChat';

type PreviewState = 'aguardando' | 'gerando' | 'concluido';

interface PreviewPanelProps {
  state: PreviewState;
  imageUrl?: string;
  config?: ProjectConfig;
  elapsedSeconds?: number;
  estimatedSeconds?: number;
  onRefine?: (prompt: string, currentImage: string) => Promise<void>;
  isRefining?: boolean;
}

export function PreviewPanel({ state, imageUrl, config, elapsedSeconds = 0, estimatedSeconds = 35, onRefine, isRefining = false }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [showOverlay, setShowOverlay] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [refinementOpen, setRefinementOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const hasTextOverlay = config?.textEnabled && config.textMode === 'camada' && (config.text01 || config.text02 || config.cta);

  const getOverlayPosition = () => {
    if (!config) return 'bottom';
    if (config.verticalPosition === 'cima') return 'bottom';
    if (config.verticalPosition === 'baixo') return 'top';
    return 'bottom';
  };

  const overlayPos = getOverlayPosition();

  // Draw watermark on canvas and return data URL
  const applyWatermarkToImage = useCallback((src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(src); return; }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        const w = canvas.width;
        const h = canvas.height;
        const fontSize = Math.round(Math.min(w, h) * 0.045);
        const spacing = Math.round(Math.min(w, h) * 0.28);

        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Tiled diagonal watermark
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 5);

        const cols = Math.ceil(Math.sqrt(w * w + h * h) / spacing) + 2;
        const rows = Math.ceil(Math.sqrt(w * w + h * h) / spacing) + 2;
        const startX = -cols * spacing;
        const startY = -rows * spacing;

        for (let row = 0; row < rows * 2; row++) {
          for (let col = 0; col < cols * 2; col++) {
            const x = startX + col * spacing;
            const y = startY + row * spacing;
            ctx.fillText('PRÉVIA', x, y);
          }
        }
        ctx.restore();

        // Bottom bar with lock icon text
        const barH = Math.round(h * 0.055);
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, h - barH, w, barH);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${Math.round(barH * 0.42)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒  Imagem protegida — apenas para aprovação do cliente', w / 2, h - barH / 2);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  }, []);

  const handleDownload = useCallback(async (withWatermark = false) => {
    if (!imageUrl) return;
    setDownloadState('loading');

    try {
      let finalUrl = imageUrl;
      if (withWatermark) {
        finalUrl = await applyWatermarkToImage(imageUrl);
      }
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = withWatermark
        ? `preview-cliente-${Date.now()}.png`
        : `design-master-${Date.now()}.png`;
      link.click();
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch {
      setDownloadState('idle');
    }
  }, [imageUrl, applyWatermarkToImage]);

  const downloadLabel = downloadState === 'loading' ? 'Preparando…' : downloadState === 'done' ? 'Salvo' : 'Baixar';
  const DownloadIcon = downloadState === 'loading' ? Loader2 : downloadState === 'done' ? Check : Download;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background relative">
      {/* Cinematic ambient — subtle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-glow w-[500px] h-[500px] bg-primary -top-60 left-1/4" style={{ opacity: 0.04 }} />
        <div className="ambient-glow w-[300px] h-[300px] bg-accent -bottom-32 right-1/4" style={{ opacity: 0.03 }} />
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
            {/* Refinar Imagem — Em breve */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/15 bg-secondary/30 px-3 h-7 cursor-not-allowed opacity-50">
              <Wand2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <span className="text-[10px] font-semibold text-muted-foreground/50">Refinar</span>
              <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider leading-none ml-0.5">
                em breve
              </span>
            </div>

            {/* Watermark toggle */}
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
              <Button
                size="sm"
                variant={showOverlay ? 'default' : 'outline'}
                onClick={() => setShowOverlay(!showOverlay)}
                className="h-7 gap-1.5 text-[10px] rounded-lg font-medium"
              >
                <Type className="h-3 w-3" />
                Texto
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-auto p-10">
        {state === 'aguardando' && (
          <div className="flex flex-col items-center gap-8 animate-fade-up max-w-[280px] text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/10 bg-card/20">
                <ImageIcon className="h-8 w-8 text-muted-foreground/12" />
              </div>
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/4 to-accent/3 -z-10 animate-breathe" />
            </div>
            <div className="space-y-2.5">
              <p className="font-display text-base font-semibold tracking-tight text-foreground/50">
                Nenhuma imagem gerada ainda
              </p>
              <p className="text-[11px] text-muted-foreground/30 leading-relaxed">
                Configure seu prompt e clique em{' '}
                <span className="text-primary/60 font-semibold">Gerar Imagem</span>{' '}
                para começar.
              </p>
              <p className="text-[10px] text-muted-foreground/20 leading-relaxed mt-1">
                Use os controles à direita para personalizar estilo, composição e iluminação.
              </p>
            </div>
          </div>
        )}

        {state === 'gerando' && (
          <div className="flex flex-col items-center gap-8 animate-fade-up">
            {/* Icon */}
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 animate-breathe" />
              <div className="absolute inset-[3px] rounded-[14px] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-pulse-glow" />
              </div>
            </div>

            {/* Text + timer */}
            <div className="text-center space-y-1.5">
              <p className="font-display text-base font-semibold tracking-tight text-foreground/60">Gerando imagem…</p>
              <p className="text-[11px] text-muted-foreground/35">IA processando seu criativo</p>
              {/* Elapsed + countdown */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="tabular-nums text-[11px] font-mono text-muted-foreground/40">
                  {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
                </span>
                {elapsedSeconds < estimatedSeconds && (
                  <>
                    <span className="text-muted-foreground/20 text-[10px]">/</span>
                    <span className="tabular-nums text-[11px] font-mono text-primary/50 font-semibold">
                      ~{estimatedSeconds - elapsedSeconds}s
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-56 space-y-1.5">
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-border/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/70 to-accent/80 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${Math.min(100, (elapsedSeconds / estimatedSeconds) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-center text-[9px] text-muted-foreground/25 tabular-nums">
                {Math.min(100, Math.round((elapsedSeconds / estimatedSeconds) * 100))}%
              </p>
            </div>
          </div>
        )}

        {state === 'concluido' && imageUrl && (
          <div
            className="relative group flex items-center justify-center"
            style={{
              width: `${zoom}%`,
              height: `${zoom}%`,
              minWidth: zoom >= 100 ? '100%' : undefined,
              minHeight: zoom >= 100 ? '100%' : undefined,
            }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Imagem gerada"
              className="object-contain rounded-xl shadow-cinematic transition-all duration-500 max-w-full max-h-full w-full h-full ring-1 ring-white/[0.03]"
            />

            {/* Watermark overlay (visual only, CSS-based) */}
            {watermarkEnabled && (
              <>
                {/* Tiled PRÉVIA text */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none select-none"
                  style={{ zIndex: 2 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        -30deg,
                        transparent,
                        transparent 70px,
                        rgba(255,255,255,0.04) 70px,
                        rgba(255,255,255,0.04) 71px
                      )`,
                    }}
                  />
                  {/* Diagonal text pattern */}
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

                {/* Bottom protection bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 rounded-b-xl pointer-events-none select-none"
                  style={{
                    background: 'rgba(0,0,0,0.72)',
                    padding: '6px 10px',
                    zIndex: 3,
                  }}
                >
                  <Lock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                  <span
                    className="text-white/80 font-medium text-center leading-tight"
                    style={{ fontSize: 'clamp(8px, 1.2vw, 11px)' }}
                  >
                    Imagem protegida — apenas para aprovação do cliente
                  </span>
                </div>
              </>
            )}

            {/* Download button(s) */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 10 }}>
              {/* Download without watermark */}
              <button
                onClick={() => handleDownload(false)}
                disabled={downloadState === 'loading'}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md border border-white/10 hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
              >
                <DownloadIcon className={`h-3.5 w-3.5 ${downloadState === 'loading' ? 'animate-spin' : ''}`} />
                {downloadState === 'done' ? 'Salvo!' : 'Baixar original'}
              </button>

              {/* Download with watermark */}
              <button
                onClick={() => handleDownload(true)}
                disabled={downloadState === 'loading'}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-amber-500/90 text-white shadow-md border border-amber-400/30 hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
              >
                <Droplets className="h-3.5 w-3.5" />
                Enviar ao cliente
              </button>
            </div>

            <div className="absolute inset-0 rounded-xl bg-background/0 group-hover:bg-background/5 transition-colors duration-300 pointer-events-none" style={{ zIndex: 1 }} />

            {/* Text Overlay */}
            {hasTextOverlay && showOverlay && (
              <div
                className={`absolute left-0 right-0 flex flex-col items-center gap-2 px-6 ${
                  overlayPos === 'top' ? 'top-[8%]' : 'bottom-[8%]'
                }`}
                style={{ pointerEvents: 'none', zIndex: watermarkEnabled ? 1 : 4 }}
              >
                {config.text01 && (
                  <p
                    className="text-center font-display font-bold leading-tight drop-shadow-lg"
                    style={{
                      fontSize: 'clamp(16px, 4vw, 36px)',
                      color: '#FFFFFF',
                      textShadow: '0 2px 12px rgba(0,0,0,0.8)',
                    }}
                  >
                    {config.text01}
                  </p>
                )}
                {config.text02 && (
                  <p
                    className="text-center font-medium leading-snug drop-shadow-md"
                    style={{
                      fontSize: 'clamp(12px, 2.5vw, 22px)',
                      color: '#FFFFFFCC',
                      textShadow: '0 1px 8px rgba(0,0,0,0.7)',
                    }}
                  >
                    {config.text02}
                  </p>
                )}
                {config.cta && (
                  <div
                    className="mt-1 rounded-full px-5 py-1.5 font-semibold shadow-lg"
                    style={{
                      fontSize: 'clamp(10px, 2vw, 16px)',
                      backgroundColor: config.ambientColor || '#8B5CF6',
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {config.cta}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refinement Chat — slides up from bottom */}
      {onRefine && imageUrl && (
        <RefinementChat
          open={refinementOpen}
          onClose={() => setRefinementOpen(false)}
          imageUrl={imageUrl}
          onRefine={onRefine}
          isRefining={isRefining}
        />
      )}
    </div>
  );
}
