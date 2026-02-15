import { ImageIcon, Download, ZoomIn, ZoomOut, Type, Sparkles } from 'lucide-react';
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
    link.download = `design-builder-${Date.now()}.png`;
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
    <div className="flex flex-1 flex-col overflow-hidden bg-background relative noise">
      {/* Toolbar */}
      {state === 'concluido' && imageUrl && (
        <div className="relative z-10 flex items-center justify-between border-b border-border/30 px-5 py-2.5 glass shrink-0">
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
                className="h-7 gap-1.5 text-[10px] rounded-lg font-semibold"
              >
                <Type className="h-3 w-3" />
                Texto
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 gap-1.5 text-[10px] rounded-lg font-semibold border-border/50">
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-auto p-8">
        {state === 'aguardando' && (
          <div className="flex flex-col items-center gap-6 text-muted-foreground animate-fade-up">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border/30 bg-secondary/30 shadow-elevation-1">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-bold tracking-tight text-foreground/80">Aguardando criação</p>
              <p className="text-xs text-muted-foreground/70 max-w-[280px]">
                Configure seu criativo no painel ao lado e clique em <span className="text-primary font-semibold">Gerar Imagem</span>
              </p>
            </div>
          </div>
        )}

        {state === 'gerando' && (
          <div className="flex flex-col items-center gap-6 animate-fade-up">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 animate-pulse" />
              <div className="absolute inset-1 rounded-xl bg-background/50 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-pulse-glow" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-bold tracking-tight text-foreground/80">Gerando criativo...</p>
              <p className="text-xs text-muted-foreground/70">Isso pode levar alguns segundos</p>
            </div>
            {/* Shimmer bar */}
            <div className="w-48 h-1 rounded-full overflow-hidden bg-secondary">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
          </div>
        )}

        {state === 'concluido' && imageUrl && (
          <div className="relative inline-block" style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}>
            <img
              src={imageUrl}
              alt="Imagem gerada"
              className="object-contain rounded-xl shadow-elevation-3 transition-all duration-300 w-full h-full ring-1 ring-white/5"
            />
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
                    className="text-center font-bold leading-tight drop-shadow-lg"
                    style={{
                      fontSize: 'clamp(16px, 4vw, 36px)',
                      color: '#FFFFFF',
                      textShadow: '0 2px 8px rgba(0,0,0,0.7)',
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
                      color: '#FFFFFFDD',
                      textShadow: '0 1px 6px rgba(0,0,0,0.6)',
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

      {/* Subtle gradient overlay at edges */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/50 to-transparent" />
      </div>
    </div>
  );
}
