import { ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PreviewState = 'aguardando' | 'gerando' | 'concluido';

interface PreviewPanelProps {
  state: PreviewState;
  imageUrl?: string;
}

export function PreviewPanel({ state, imageUrl }: PreviewPanelProps) {
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `design-builder-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background rounded-lg border border-border m-3 relative">
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
          <div className="h-20 w-20 rounded-2xl bg-primary/20 animate-pulse-glow" />
          <p className="text-sm font-semibold text-primary">GERANDO...</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}
      {state === 'concluido' && imageUrl && (
        <>
          <img
            src={imageUrl}
            alt="Imagem gerada"
            className="max-h-[calc(100%-60px)] max-w-full object-contain rounded-lg"
          />
          <div className="absolute bottom-3 right-3">
            <Button size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
