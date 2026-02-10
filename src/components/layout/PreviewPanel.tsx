import { ImageIcon } from 'lucide-react';

type PreviewState = 'aguardando' | 'gerando' | 'concluido';

interface PreviewPanelProps {
  state: PreviewState;
  imageUrl?: string;
}

export function PreviewPanel({ state, imageUrl }: PreviewPanelProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background rounded-lg border border-border m-3">
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
        </div>
      )}
      {state === 'concluido' && imageUrl && (
        <img
          src={imageUrl}
          alt="Imagem gerada"
          className="max-h-full max-w-full object-contain rounded-lg"
        />
      )}
    </div>
  );
}
