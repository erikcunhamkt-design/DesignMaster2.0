import { Download, Loader2, Check, Droplets } from 'lucide-react';
import { DownloadState } from '@/hooks/useWatermarkDownload';

interface DownloadButtonsProps {
  downloadState: DownloadState;
  onDownload: (withWatermark: boolean) => void;
  prefix?: string;
}

export function DownloadButtons({ downloadState, onDownload }: DownloadButtonsProps) {
  const isLoading = downloadState === 'loading';
  const isDone = downloadState === 'done';

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1.5" style={{ zIndex: 10 }}>
      {/* Baixar original */}
      <button
        onClick={() => onDownload(false)}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md border border-white/10 hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isDone ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
        {isDone ? 'Salvo!' : 'Baixar original'}
      </button>

      {/* Enviar ao cliente (com marca d'água) */}
      <button
        onClick={() => onDownload(true)}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-amber-500/90 text-white shadow-md border border-amber-400/30 hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
      >
        <Droplets className="h-3.5 w-3.5" />
        Enviar ao cliente
      </button>
    </div>
  );
}
