import { useState, useRef, useEffect } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { MobileGenerateButton } from '@/components/layout/MobileGenerateButton';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ImageIcon, Palette } from 'lucide-react';
import { useWatermarkDownload } from '@/hooks/useWatermarkDownload';
import { DownloadButtons } from '@/components/DownloadButtons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';

export default function RestorePhotoPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [colorize, setColorize] = useState(false);
  const { apiKey } = useGoogleApiKey();
  const fileRef = useRef<HTMLInputElement>(null);
  const mobileResultRef = useRef<HTMLDivElement>(null);
  const { downloadState, download } = useWatermarkDownload(resultImage, 'restored-photo');

  useEffect(() => {
    if (isProcessing && mobileResultRef.current) {
      setTimeout(() => mobileResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [isProcessing]);

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

  const handleRestore = async () => {
    if (!imageBase64) return;
    if (!apiKey || apiKey.length < 10) {
      toast.error('Configure sua API Key do Google primeiro (botão API no topo).');
      return;
    }
    setIsProcessing(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('restore-photo', {
        body: { imageBase64, colorize, googleApiKey: apiKey },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success('Foto restaurada com sucesso!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao restaurar foto');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Restaurador de Fotos" showApiKey={true} />
      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[400px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-1 font-display">Restaurador de Fotografias</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Restaure fotos antigas danificadas com IA — riscos, manchas, desbotamento e ruído são removidos preservando a identidade original.
              </p>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Original" className="w-full rounded-xl border border-border/15 object-cover max-h-[280px]" />
                <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <span className="text-xs font-semibold text-foreground bg-secondary/80 px-3 py-1.5 rounded-lg">Trocar</span>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/30 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-300">
                <Upload className="h-8 w-8" />
                <span className="text-xs font-semibold">Enviar foto antiga</span>
                <span className="text-[10px] text-muted-foreground/60">JPG, PNG — fotos com danos, riscos ou desbotamento</span>
              </button>
            )}

            <button
              onClick={() => setColorize(!colorize)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border p-3 transition-all duration-200',
                colorize
                  ? 'border-primary/50 bg-primary/5 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.2)]'
                  : 'border-border/20 bg-secondary/20 hover:border-border/40'
              )}
            >
              <Palette className={cn('h-4 w-4', colorize ? 'text-primary' : 'text-muted-foreground')} />
              <div className="text-left flex-1">
                <p className={cn('text-xs font-bold', colorize ? 'text-primary' : 'text-foreground/60')}>Colorizar foto P&B</p>
                <p className="text-[10px] text-muted-foreground">Adiciona cores naturais a fotos preto e branco.</p>
              </div>
              <div className={cn(
                'w-8 h-4 rounded-full transition-colors relative',
                colorize ? 'bg-primary' : 'bg-border/40'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform',
                  colorize ? 'translate-x-4' : 'translate-x-0.5'
                )} />
              </div>
            </button>

            <Button
              onClick={handleRestore}
              disabled={!imageBase64 || isProcessing}
              className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-[0_0_32px_-8px_hsl(var(--primary)/0.3)]"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {isProcessing ? 'Restaurando...' : 'Restaurar Fotografia'}
            </Button>

            <div className="rounded-xl border border-border/15 bg-secondary/20 p-3 space-y-2">
              <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">O que a IA faz</p>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                <li>✦ Remove riscos, manchas e artefatos</li>
                <li>✦ Restaura áreas danificadas ou faltantes</li>
                <li>✦ Corrige contraste e balanço tonal</li>
                <li>✦ Preserva 100% a identidade do sujeito</li>
                <li>✦ Renderiza em qualidade editorial 4K</li>
                {colorize && <li className="text-primary">✦ Coloriza fotos P&B com cores naturais</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative">
          {!resultImage && !isProcessing && (
            <div className="text-center space-y-3">
              <ImageIcon className="h-14 w-14 mx-auto text-muted-foreground/15" />
              <p className="text-sm font-semibold text-foreground/40">Resultado aparecerá aqui</p>
              <p className="text-[11px] text-muted-foreground/30">A foto restaurada será exibida com máxima fidelidade</p>
            </div>
          )}
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Restaurando fotografia...</p>
              <p className="text-[11px] text-muted-foreground/50">Isso pode levar alguns segundos</p>
            </motion.div>
          )}
          {resultImage && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative inline-block">
              <img src={resultImage} alt="Restored" className="max-w-full max-h-[80vh] rounded-xl shadow-[0_20px_60px_-15px_hsl(0_0%_0%/0.5)] ring-1 ring-white/[0.03]" />
              <DownloadButtons downloadState={downloadState} onDownload={download} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground mb-1 font-display">Restaurador de Fotografias</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Restaure fotos antigas danificadas com IA.
            </p>
          </div>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden" onClick={() => fileRef.current?.click()}>
              <img src={imagePreview} alt="Original" className="w-full rounded-xl border border-border/15 object-cover max-h-[220px]" />
              <div className="absolute bottom-2 right-2 text-[10px] font-semibold text-foreground bg-secondary/80 px-2 py-1 rounded-lg">Trocar</div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/30 bg-card/30 text-muted-foreground">
              <Upload className="h-7 w-7" />
              <span className="text-xs font-semibold">Enviar foto antiga</span>
            </button>
          )}

          <button
            onClick={() => setColorize(!colorize)}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl border p-3 transition-all duration-200',
              colorize
                ? 'border-primary/50 bg-primary/5'
                : 'border-border/20 bg-secondary/20'
            )}
          >
            <Palette className={cn('h-4 w-4', colorize ? 'text-primary' : 'text-muted-foreground')} />
            <div className="text-left flex-1">
              <p className={cn('text-xs font-bold', colorize ? 'text-primary' : 'text-foreground/60')}>Colorizar foto P&B</p>
            </div>
            <div className={cn('w-8 h-4 rounded-full transition-colors relative', colorize ? 'bg-primary' : 'bg-border/40')}>
              <div className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform', colorize ? 'translate-x-4' : 'translate-x-0.5')} />
            </div>
          </button>
        </div>

        {/* Mobile result */}
        <div ref={mobileResultRef} className="p-4 min-h-[300px] flex items-center justify-center">
          {!resultImage && !isProcessing && (
            <div className="text-center space-y-2">
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/15" />
              <p className="text-xs font-semibold text-foreground/40">Resultado aparecerá aqui</p>
            </div>
          )}
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Restaurando...</p>
            </motion.div>
          )}
          {resultImage && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full">
              <img src={resultImage} alt="Restored" className="w-full rounded-xl shadow-[0_20px_60px_-15px_hsl(0_0%_0%/0.5)] ring-1 ring-white/[0.03]" />
              <DownloadButtons downloadState={downloadState} onDownload={download} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile floating button */}
      <MobileGenerateButton
        onGenerate={handleRestore}
        isGenerating={isProcessing}
        label="Restaurar ✨"
      />
    </div>
  );
}
