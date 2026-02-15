import { useState, useRef, useCallback } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Download, Check, ArrowUpCircle, ScanSearch, Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const UPSCALE_PROMPT_BASE = `Analyze the provided image and perform a high-quality restoration and upscale process, increasing the resolution to true {RESOLUTION} while strictly preserving the original composition, proportions, framing, identity, and visual intent.

Enhance overall sharpness and clarity without introducing artifacts, halos, oversharpening, or artificial edges. Restore fine details naturally, improving micro-textures and surface definition.

Apply realistic texture reconstruction:
– Skin: natural skin texture with visible pores, subtle imperfections, realistic softness and depth (no plastic or AI-smoothed look)
– Materials: accurate surface textures such as fabric weave, leather grain, metal micro-scratches, paint reflections, glass clarity, hair strands, and natural edges
– Objects and environments: refined details while maintaining realism and scale

Correct colors, contrast, and exposure only if necessary:
– Balance white levels naturally
– Improve dynamic range without crushing shadows or blowing highlights
– Preserve original color palette and mood
– Avoid color shifting, oversaturation, or stylistic reinterpretation

Noise reduction should be intelligent and selective:
– Remove digital noise and compression artifacts
– Preserve fine detail and texture
– Maintain cinematic depth and realism

Lighting must remain physically consistent with the original image:
– No new light sources
– No relighting or dramatic changes
– Subtle enhancement of depth and separation only if needed

Final output must look like a professionally shot, high-resolution photograph, not AI-generated:
– Ultra-clean
– Natural
– Photorealistic
– True-to-source

RULES:
– Do not change pose, expression, anatomy, or geometry
– Do not add or remove elements
– Do not stylize, dramatize, or reinterpret
– Do not alter identity
– Focus exclusively on quality restoration and resolution enhancement`;

type Resolution = '2K' | '4K';

interface ImageAnalysis {
  quality_score: number;
  resolution_estimate: string;
  issues: string[];
  suggestions: string[];
  details: {
    sharpness: string;
    noise_level: string;
    lighting: string;
    colors: string;
    compression: string;
  };
}

const RESOLUTION_OPTIONS: { value: Resolution; label: string; desc: string }[] = [
  { value: '2K', label: '2K', desc: 'Rápido, boa qualidade' },
  { value: '4K', label: '4K', desc: 'Máxima qualidade' },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? 'text-primary' : score >= 4 ? 'text-yellow-400' : 'text-destructive';
  const bg = score >= 7 ? 'bg-primary/10 border-primary/20' : score >= 4 ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-destructive/10 border-destructive/20';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${bg} ${color}`}>
      {score >= 7 ? <CheckCircle2 className="h-3 w-3" /> : score >= 4 ? <Info className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {score}/10
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground/80 capitalize">{value}</span>
    </div>
  );
}

export default function UpscalePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [resolution, setResolution] = useState<Resolution>('4K');
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
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageBase64, googleApiKey: apiKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `Erro ${response.status}`);
      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success('Análise concluída!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpscale = async () => {
    if (!imageBase64 || !apiKey) return;
    setIsProcessing(true);
    setResultImage(null);
    try {
      const prompt = UPSCALE_PROMPT_BASE.replace('{RESOLUTION}', resolution);
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt,
          negativePrompt: 'low quality, artifacts, noise, blurry, watermark, text',
          referenceImages: [imageBase64],
          googleApiKey: apiKey,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success(`Upscale ${resolution} concluído!`);
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
      link.download = `upscale-${resolution}-${Date.now()}.png`;
      link.click();
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    }, 500);
  }, [resultImage, resolution]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Upscale" />
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[400px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-1 font-display">Upscale & Restauração</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">Envie uma imagem para análise inteligente e upscale profissional.</p>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Original" className="w-full rounded-xl border border-border/15 object-cover max-h-[240px]" />
                <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <span className="text-xs font-semibold text-foreground bg-secondary/80 px-3 py-1.5 rounded-lg">Trocar</span>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/30 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-300">
                <Upload className="h-8 w-8" />
                <span className="text-xs font-semibold">Enviar Imagem</span>
              </button>
            )}

            {/* Analyze button */}
            {imageBase64 && (
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || apiKey.length < 10}
                variant="outline"
                className="w-full h-10 gap-2 rounded-xl text-xs font-bold border-border/30 hover:border-primary/40"
              >
                {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
                {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
              </Button>
            )}

            {/* Analysis results */}
            <AnimatePresence>
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="rounded-xl border border-border/20 bg-secondary/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Diagnóstico</span>
                      <ScoreBadge score={analysis.quality_score} />
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Resolução estimada: <span className="text-foreground/70 font-medium">{analysis.resolution_estimate}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <DetailRow label="Nitidez" value={analysis.details.sharpness} />
                      <DetailRow label="Ruído" value={analysis.details.noise_level} />
                      <DetailRow label="Iluminação" value={analysis.details.lighting} />
                      <DetailRow label="Cores" value={analysis.details.colors} />
                      <DetailRow label="Compressão" value={analysis.details.compression} />
                    </div>

                    {analysis.issues.length > 0 && (
                      <div className="pt-2 border-t border-border/15 space-y-1.5">
                        <span className="text-[10px] font-bold text-destructive/80 uppercase tracking-wider">Problemas</span>
                        {analysis.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <AlertTriangle className="h-3 w-3 text-destructive/60 mt-0.5 shrink-0" />
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.suggestions.length > 0 && (
                      <div className="pt-2 border-t border-border/15 space-y-1.5">
                        <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">Sugestões</span>
                        {analysis.suggestions.map((sug, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-primary/60 mt-0.5 shrink-0" />
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resolution selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Resolução</span>
              <div className="grid grid-cols-2 gap-2">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setResolution(opt.value)}
                    className={`flex flex-col items-center gap-0.5 rounded-xl border p-3 transition-all duration-200 ${
                      resolution === opt.value
                        ? 'border-primary/50 bg-primary/5 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.2)]'
                        : 'border-border/20 bg-secondary/20 hover:border-border/40'
                    }`}
                  >
                    <span className={`text-sm font-bold ${resolution === opt.value ? 'text-primary' : 'text-foreground/60'}`}>{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upscale button */}
            <Button
              onClick={handleUpscale}
              disabled={!imageBase64 || isProcessing || apiKey.length < 10}
              className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-[0_0_32px_-8px_hsl(var(--primary)/0.3)]"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
              {isProcessing ? 'Processando...' : `Upscale ${resolution}`}
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
              <p className="text-sm font-semibold text-primary">Restaurando imagem em {resolution}...</p>
            </div>
          )}
          {resultImage && (
            <div className="relative inline-block">
              <img src={resultImage} alt="Upscaled" className="max-w-full max-h-[80vh] rounded-xl shadow-[0_20px_60px_-15px_hsl(0_0%_0%/0.5)] ring-1 ring-white/[0.03]" />
              <button
                onClick={handleDownload}
                disabled={downloadState === 'loading'}
                className="absolute top-4 right-4 flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_32px_-8px_hsl(var(--primary)/0.3)] border border-white/10 hover:shadow-[0_0_48px_-8px_hsl(var(--primary)/0.4)] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {downloadState === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : downloadState === 'done' ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                {downloadState === 'loading' ? 'Baixando…' : downloadState === 'done' ? 'Salvo' : `Baixar ${resolution}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
