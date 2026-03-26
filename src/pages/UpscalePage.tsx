import { useState, useRef } from 'react';
import { GeneratingAnimation } from '@/components/layout/GeneratingAnimation';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ArrowUpCircle, ScanSearch, Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useWatermarkDownload } from '@/hooks/useWatermarkDownload';
import { DownloadButtons } from '@/components/DownloadButtons';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';


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
  const fileRef = useRef<HTMLInputElement>(null);
  const { apiKey } = useGoogleApiKey();
  const { downloadState, download } = useWatermarkDownload(resultImage, `upscale-${resolution}`);

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

  const buildDiagnosticCorrections = (diag: ImageAnalysis | null): string | undefined => {
    if (!diag) return undefined;
    const corrections: string[] = [];

    if (diag.details.sharpness && diag.details.sharpness !== 'boa' && diag.details.sharpness !== 'alta') {
      corrections.push('SHARPNESS is low — aggressively recover micro-detail and edge definition');
    }
    if (diag.details.noise_level && diag.details.noise_level !== 'baixo' && diag.details.noise_level !== 'mínimo') {
      corrections.push('NOISE is significant — apply strong noise reduction while preserving textures');
    }
    if (diag.details.compression && diag.details.compression !== 'mínima' && diag.details.compression !== 'baixa') {
      corrections.push('COMPRESSION ARTIFACTS detected — rebuild blocked areas and eliminate banding');
    }
    if (diag.details.lighting && (diag.details.lighting.includes('baixa') || diag.details.lighting.includes('flat'))) {
      corrections.push('DYNAMIC RANGE is limited — enhance local contrast and shadow/highlight separation');
    }
    if (diag.details.colors && (diag.details.colors.includes('desbotad') || diag.details.colors.includes('baixa'))) {
      corrections.push('COLORS are faded — restore natural saturation and white balance');
    }

    if (diag.suggestions.length > 0) {
      corrections.push(`Additional guidance: ${diag.suggestions.join('. ')}`);
    }

    return corrections.length > 0 ? corrections.map((c, i) => `${i + 1}. ${c}`).join('\n') : undefined;
  };

  const handleUpscale = async (useDiagnostic = false) => {
    if (!imageBase64 || !apiKey) return;
    setIsProcessing(true);
    setResultImage(null);
    try {
      const diagnosticCorrections = useDiagnostic ? buildDiagnosticCorrections(analysis) : undefined;

      const { data, error } = await supabase.functions.invoke('upscale-image', {
        body: {
          imageBase64,
          resolution,
          diagnosticCorrections,
          googleApiKey: apiKey,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success(`Upscale ${resolution}${useDiagnostic ? ' com diagnóstico' : ''} concluído!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro no upscale');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Ultra Upscale" />
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

            {/* Upscale com diagnóstico — aparece logo após análise */}
            {analysis && (
              <Button
                onClick={() => handleUpscale(true)}
                disabled={!imageBase64 || isProcessing || apiKey.length < 10}
                className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-[0_0_32px_-8px_hsl(var(--primary)/0.3)]"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isProcessing ? 'Processando...' : `Upscale com Diagnóstico ${resolution}`}
              </Button>
            )}

            {/* Upscale padrão */}
            <Button
              onClick={() => handleUpscale(false)}
              disabled={!imageBase64 || isProcessing || apiKey.length < 10}
              variant="outline"
              className="w-full h-10 gap-2 rounded-xl font-bold tracking-wider text-xs uppercase border-border/30 hover:border-primary/40"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
              {isProcessing ? 'Processando...' : `Upscale padrão ${resolution}`}
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
            <GeneratingAnimation
              icon={ArrowUpCircle}
              title={`Ultra Upscale ${resolution} — Pipeline Multi-Pass`}
              subtitle="Pass 1: Upscale estrutural + detalhes · Pass 2: Polish & micro-refinamento"
            />
          )}
          {resultImage && (
            <div className="relative inline-block">
              <img src={resultImage} alt="Upscaled" className="max-w-full max-h-[80vh] rounded-xl shadow-[0_20px_60px_-15px_hsl(0_0%_0%/0.5)] ring-1 ring-white/[0.03]" />
              <DownloadButtons downloadState={downloadState} onDownload={download} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
