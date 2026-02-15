import { ImageIcon, Download, ZoomIn, ZoomOut, Type, Sparkles, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ProjectConfig } from '@/types/project';

type PreviewState = 'aguardando' | 'gerando' | 'concluido';

interface PreviewPanelProps {
  state: PreviewState;
  imageUrl?: string;
  config?: ProjectConfig;
}

export function PreviewPanel({ state, imageUrl, config }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [showOverlay, setShowOverlay] = useState(true);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `spark-snap-${Date.now()}.png`;
    link.click();
  };

  const hasTextOverlay = config?.textEnabled && config.textMode === 'camada' && (config.text01 || config.text02 || config.cta);

  const getOverlayPosition = () => {
    if (!config) return 'bottom';
    if (config.verticalPosition === 'cima') return 'bottom';
    if (config.verticalPosition === 'baixo') return 'top';
    return 'bottom';
  };

  const overlayPos = getOverlayPosition();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background relative">
      {/* Cinematic ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-glow w-[600px] h-[600px] bg-primary -top-48 -left-48" />
        <div className="ambient-glow w-[400px] h-[400px] bg-accent -bottom-40 -right-40" />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.012]" style={{
          backgroundImage: 'radial-gradient(circle, hsl(220 12% 30%) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Toolbar */}
      {state === 'concluido' && imageUrl && (
        <div className="relative z-10 flex items-center justify-between border-b border-border/15 px-5 py-2.5 bg-background/60 backdrop-blur-md shrink-0">
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
            <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 gap-1.5 text-[10px] rounded-lg font-medium border-border/30 hover:border-primary/30">
              <Download className="h-3 w-3" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-auto p-12">
        {state === 'aguardando' && (
          <div className="flex flex-col items-center gap-10 animate-fade-up">
            {/* Floating icon */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border/15 bg-card/40 shadow-inner-glow animate-float">
                <ImageIcon className="h-10 w-10 text-muted-foreground/25" />
              </div>
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/4 to-accent/4 -z-10 animate-breathe" />
            </div>
            <div className="text-center space-y-3">
              <p className="font-display text-2xl font-bold tracking-tight text-foreground/80">Pronto para criar</p>
              <p className="text-xs text-muted-foreground/50 max-w-[280px] leading-relaxed">
                Configure seu criativo no painel e clique em <span className="text-primary font-semibold">Gerar</span>
              </p>
            </div>
          </div>
        )}

        {state === 'gerando' && (
          <div className="flex flex-col items-center gap-10 animate-fade-up">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 animate-breathe" />
              <div className="absolute inset-[3px] rounded-xl bg-background/70 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-9 w-9 text-primary animate-pulse-glow" />
              </div>
            </div>
            <div className="text-center space-y-2.5">
              <p className="font-display text-2xl font-bold tracking-tight text-foreground/80">Gerando...</p>
              <p className="text-xs text-muted-foreground/45">IA processando seu criativo</p>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-[3px] rounded-full overflow-hidden bg-border/20">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
          </div>
        )}

        {state === 'concluido' && imageUrl && (
          <div className="relative inline-block group" style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}>
            <img
              src={imageUrl}
              alt="Imagem gerada"
              className="object-contain rounded-xl shadow-cinematic transition-all duration-500 w-full h-full ring-1 ring-white/[0.04]"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl bg-background/0 group-hover:bg-background/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="h-6 w-6 text-foreground/50" />
            </div>
            {/* Text Overlay */}
            {hasTextOverlay && showOverlay && (
              <div
                className={`absolute left-0 right-0 flex flex-col items-center gap-2 px-6 ${
                  overlayPos === 'top' ? 'top-[8%]' : 'bottom-[8%]'
                }`}
                style={{ pointerEvents: 'none' }}
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
    </div>
  );
}
