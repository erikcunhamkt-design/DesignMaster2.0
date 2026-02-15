import { useState, useRef, useCallback } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Download, Check, ArrowUpCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { toast } from 'sonner';

const UPSCALE_PROMPT = `Analyze the provided image and perform a high-quality restoration and upscale process, increasing the resolution to true 4K while strictly preserving the original composition, proportions, framing, identity, and visual intent. Enhance overall sharpness and clarity without introducing artifacts, halos, oversharpening, or artificial textures. Restore fine details naturally, improving micro-textures and surface definition. Apply realistic texture reconstruction: skin with natural pores and subtle imperfections, accurate material surfaces (fabric weave, leather grain, metal reflections, glass clarity, hair strands), refined object and environment details. Correct colors, contrast, and exposure only if necessary: balance white levels naturally, improve dynamic range without crushing shadows or blowing highlights, preserve original color palette and mood. Intelligent noise reduction: remove digital noise and compression artifacts while preserving fine detail and texture. Lighting must remain physically consistent with the original image: no new light sources, no relighting, subtle enhancement of depth only if needed. Final output must look like a professionally shot, high-resolution photograph: ultra-clean, natural, photorealistic, true-to-source. Do not change pose, expression, anatomy, or geometry. Do not add or remove elements. Do not stylize, dramatize, or reinterpret. Do not alter identity.`;

export default function UpscalePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'done'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const { apiKey } = useGoogleApiKey();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setImagePreview(b64);
      setImageBase64(b64);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpscale = async () => {
    if (!imageBase64 || !apiKey) return;
    setIsProcessing(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: UPSCALE_PROMPT,
          negativePrompt: 'low quality, artifacts, noise, blurry, watermark, text',
          referenceImages: [imageBase64],
          googleApiKey: apiKey,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success('Upscale concluído!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro no upscale');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!resultImage) return;
    setDownloadState('loading');
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `upscale-${Date.now()}.png`;
      link.click();
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    }, 500);
  }, [resultImage]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Upscale" />
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[380px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-foreground mb-1 font-display">Upscale & Restauração</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">Envie uma imagem para restauração e upscale inteligente em 4K.</p>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Original" className="w-full rounded-xl border border-border/15 object-cover max-h-[300px]" />
                <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <span className="text-xs font-semibold text-foreground bg-secondary/80 px-3 py-1.5 rounded-lg">Trocar</span>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/30 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-300">
                <Upload className="h-8 w-8" />
                <span className="text-xs font-semibold">Enviar Imagem</span>
              </button>
            )}

            <Button onClick={handleUpscale} disabled={!imageBase64 || isProcessing || apiKey.length < 10} className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-glow-md">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
              {isProcessing ? 'Processando...' : 'Upscale 4K'}
            </Button>

            {apiKey.length < 10 && (
              <p className="text-[10px] text-destructive/70 text-center">Configure sua API Key para usar o Upscale</p>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative">
          {!resultImage && !isProcessing && (
            <div className="text-center space-y-3">
              <ArrowUpCircle className="h-14 w-14 mx-auto text-muted-foreground/15" />
              <p className="text-sm font-semibold text-foreground/40">Resultado aparecerá aqui</p>
            </div>
          )}
          {isProcessing && (
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Restaurando imagem...</p>
            </div>
          )}
          {resultImage && (
            <div className="relative inline-block">
              <img src={resultImage} alt="Upscaled" className="max-w-full max-h-[80vh] rounded-xl shadow-cinematic ring-1 ring-white/[0.03]" />
              {/* Premium download overlay */}
              <button
                onClick={handleDownload}
                disabled={downloadState === 'loading'}
                className="absolute top-4 right-4 flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md border border-white/10 hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {downloadState === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : downloadState === 'done' ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                {downloadState === 'loading' ? 'Baixando…' : downloadState === 'done' ? 'Salvo' : 'Baixar 4K'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
