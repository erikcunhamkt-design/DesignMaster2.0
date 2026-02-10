import { ImageIcon, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type PreviewState = 'aguardando' | 'gerando' | 'concluido';

interface PreviewPanelProps {
  state: PreviewState;
  imageUrl?: string;
}

export function PreviewPanel({ state, imageUrl }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `design-builder-${Date.now()}.png`;
    link.click();
  };

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
          <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 gap-1.5 text-[10px]">
            <Download className="h-3 w-3" />
            Download
          </Button>
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
          <img
            src={imageUrl}
            alt="Imagem gerada"
            style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}
            className="object-contain rounded-lg shadow-lg transition-all duration-200"
          />
        )}
      </div>
    </div>
  );
}
