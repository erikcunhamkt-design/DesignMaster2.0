import { useState, useCallback } from 'react';

export type DownloadState = 'idle' | 'loading' | 'done';

function applyWatermarkToImage(src: string, prefix = 'design-master'): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(src); return; }

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
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 5);

      const cols = Math.ceil(Math.sqrt(w * w + h * h) / spacing) + 2;
      const rows = Math.ceil(Math.sqrt(w * w + h * h) / spacing) + 2;
      for (let row = 0; row < rows * 2; row++) {
        for (let col = 0; col < cols * 2; col++) {
          ctx.fillText('PRÉVIA', -cols * spacing + col * spacing, -rows * spacing + row * spacing);
        }
      }
      ctx.restore();

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
}

export function useWatermarkDownload(imageUrl: string | null, prefix = 'design-master') {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');

  const download = useCallback(async (withWatermark = false) => {
    if (!imageUrl) return;
    setDownloadState('loading');
    try {
      const finalUrl = withWatermark ? await applyWatermarkToImage(imageUrl, prefix) : imageUrl;
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = withWatermark
        ? `preview-cliente-${Date.now()}.png`
        : `${prefix}-${Date.now()}.png`;
      link.click();
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch {
      setDownloadState('idle');
    }
  }, [imageUrl, prefix]);

  return { downloadState, download };
}
