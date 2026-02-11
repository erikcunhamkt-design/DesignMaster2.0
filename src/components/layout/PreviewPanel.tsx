import { ImageIcon, Download, ZoomIn, ZoomOut, Type } from 'lucide-react';
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

  // Determine overlay position based on vertical position setting
  const getOverlayPosition = () => {
    if (!config) return 'bottom';
    if (config.verticalPosition === 'cima') return 'bottom';
    if (config.verticalPosition === 'baixo') return 'top';
    return 'bottom';
  };

  const overlayPos = getOverlayPosition();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      {state === 'concluido' && imageUrl && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-card/50 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {hasTextOverlay && (
              <Button
                size="sm"
                variant={showOverlay ? 'default' : 'outline'}
                onClick={() => setShowOverlay(!showOverlay)}
                className="h-7 gap-1.5 text-[10px]"
              >
                <Type className="h-3 w-3" />
                Texto
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 gap-1.5 text-[10px]">
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        {state === 'aguardando' && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border">
              <ImageIcon className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">AGUARDANDO CRIAÇÃO</p>
              <p className="mt-1 text-xs">Preencha as configurações e clique em "Gerar Imagem"</p>
            </div>
          </div>
        )}

        {state === 'gerando' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-primary/20 animate-pulse" />
            <p className="text-sm font-semibold text-primary">GERANDO...</p>
            <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
          </div>
        )}

        {state === 'concluido' && imageUrl && (
          <div className="relative inline-block" style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}>
            <img
              src={imageUrl}
              alt="Imagem gerada"
              className="object-contain rounded-lg shadow-lg transition-all duration-200 w-full h-full"
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
    </div>
  );
}
