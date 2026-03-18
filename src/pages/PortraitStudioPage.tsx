import { useState, useRef } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Camera, X, Sparkles, User } from 'lucide-react';
import { useWatermarkDownload } from '@/hooks/useWatermarkDownload';
import { DownloadButtons } from '@/components/DownloadButtons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImageToBase64 } from '@/lib/imageUtils';

interface PortraitConfig {
  gender: string;
  lighting: string;
  background: string;
  expression: string;
  cameraAngle: string;
  lens: string;
  clothing: string;
  freePrompt: string;
  hasReference: boolean;
}

const GENDERS = [
  { value: 'male', label: 'Masculino', icon: '♂' },
  { value: 'female', label: 'Feminino', icon: '♀' },
];

const LIGHTINGS = [
  { value: 'rembrandt', label: 'Rembrandt', desc: 'Clássico dramático' },
  { value: 'butterfly', label: 'Butterfly', desc: 'Hollywood glamour' },
  { value: 'split', label: 'Split', desc: 'Metade luz / sombra' },
  { value: 'loop', label: 'Loop', desc: 'Natural e lisonjeiro' },
  { value: 'dramatic', label: 'Dramático', desc: 'Low-key cinematográfico' },
  { value: 'high-key', label: 'High-Key', desc: 'Brilhante e limpo' },
  { value: 'natural', label: 'Natural', desc: 'Luz de janela' },
  { value: 'broad', label: 'Broad', desc: 'Aberto e luminoso' },
];

const BACKGROUNDS = [
  { value: 'seamless-gray', label: 'Cinza', desc: 'Clássico neutro' },
  { value: 'seamless-black', label: 'Preto', desc: 'Dramático elegante' },
  { value: 'seamless-white', label: 'Branco', desc: 'Clean profissional' },
  { value: 'studio-gradient', label: 'Gradiente', desc: 'Transição suave' },
  { value: 'textured-wall', label: 'Texturizado', desc: 'Parede com caráter' },
  { value: 'bokeh', label: 'Bokeh', desc: 'Luzes desfocadas' },
  { value: 'outdoor-golden', label: 'Golden Hour', desc: 'Hora dourada' },
  { value: 'urban', label: 'Urbano', desc: 'Arquitetura e cidade' },
];

const EXPRESSIONS = [
  { value: 'confident', label: 'Confiante' },
  { value: 'serious', label: 'Sério' },
  { value: 'gentle-smile', label: 'Sorriso Suave' },
  { value: 'contemplative', label: 'Contemplativo' },
  { value: 'powerful', label: 'Poderoso' },
  { value: 'mysterious', label: 'Misterioso' },
  { value: 'joyful', label: 'Alegre' },
  { value: 'neutral', label: 'Neutro' },
];

const CAMERA_ANGLES = [
  { value: 'eye-level', label: 'Nível dos Olhos' },
  { value: 'slightly-above', label: 'Levemente Acima' },
  { value: 'slightly-below', label: 'Levemente Abaixo' },
  { value: 'three-quarter', label: 'Três Quartos' },
  { value: 'profile', label: 'Perfil' },
  { value: 'close-up', label: 'Close-Up Extremo' },
];

const LENSES = [
  { value: '85mm', label: '85mm', desc: 'Retrato clássico' },
  { value: '105mm', label: '105mm', desc: 'Compressão elegante' },
  { value: '135mm', label: '135mm', desc: 'Máximo bokeh' },
  { value: '50mm', label: '50mm', desc: 'Ambiental natural' },
  { value: '70-200mm', label: '70-200mm', desc: 'Zoom versátil' },
];

type SectionProps = {
  label: string;
  children: React.ReactNode;
};

function Section({ label, children }: SectionProps) {
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

type ChipProps = {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

function Chip({ selected, onClick, children, className = '' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
        selected
          ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]'
          : 'border-border/20 bg-secondary/20 text-foreground/60 hover:border-border/40 hover:text-foreground/80'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function PortraitStudioPage() {
  const [config, setConfig] = useState<PortraitConfig>({
    gender: 'male',
    lighting: 'rembrandt',
    background: 'seamless-gray',
    expression: 'confident',
    cameraAngle: 'eye-level',
    lens: '85mm',
    clothing: '',
    freePrompt: '',
    hasReference: false,
  });
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [subjectPreview, setSubjectPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { downloadState, download } = useWatermarkDownload(resultImage, 'portrait-master');

  const update = <K extends keyof PortraitConfig>(key: K, value: PortraitConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result as string;
      setSubjectPreview(b64);
      try {
        const compressed = await compressImageToBase64(b64, 1024, 0.85);
        setSubjectImage(compressed);
        update('hasReference', true);
        toast.success('Foto carregada!');
      } catch {
        setSubjectImage(b64);
        update('hasReference', true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeSubject = () => {
    setSubjectImage(null);
    setSubjectPreview(null);
    update('hasReference', false);
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-portrait', {
        body: { config, subjectImage },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success('Retrato profissional gerado!');
      }
    } catch (err: any) {
      const msg = err.message || 'Erro na geração';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Portrait Master" showApiKey={false} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[380px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-0.5 font-display flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Retrato Profissional
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Gere retratos ultra-realistas de estúdio — com ou sem foto de referência.
              </p>
            </div>

            {/* Subject upload */}
            <Section label="Foto do Sujeito (opcional)">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              {subjectPreview ? (
                <div className="relative group rounded-xl overflow-hidden">
                  <img src={subjectPreview} alt="Sujeito" className="w-full rounded-xl border border-border/15 object-cover max-h-[180px]" />
                  <button onClick={removeSubject} className="absolute top-2 right-2 bg-background/80 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3.5 w-3.5 text-foreground" />
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <span className="text-[10px] font-semibold text-foreground bg-secondary/80 px-2.5 py-1 rounded-lg">Trocar</span>
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/30 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-300">
                  <User className="h-6 w-6" />
                  <span className="text-[10px] font-semibold">Enviar foto (preserva identidade)</span>
                </button>
              )}
            </Section>

            {/* Gender */}
            <Section label="Gênero">
              <div className="flex gap-2">
                {GENDERS.map(g => (
                  <Chip key={g.value} selected={config.gender === g.value} onClick={() => update('gender', g.value)} className="flex-1 text-center">
                    {g.icon} {g.label}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Expression */}
            <Section label="Expressão">
              <div className="flex flex-wrap gap-1.5">
                {EXPRESSIONS.map(e => (
                  <Chip key={e.value} selected={config.expression === e.value} onClick={() => update('expression', e.value)}>
                    {e.label}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Lighting */}
            <Section label="Iluminação">
              <div className="grid grid-cols-2 gap-1.5">
                {LIGHTINGS.map(l => (
                  <Chip key={l.value} selected={config.lighting === l.value} onClick={() => update('lighting', l.value)}>
                    <div className="text-left">
                      <div>{l.label}</div>
                      <div className="text-[9px] opacity-60 font-normal">{l.desc}</div>
                    </div>
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Background */}
            <Section label="Fundo">
              <div className="grid grid-cols-2 gap-1.5">
                {BACKGROUNDS.map(b => (
                  <Chip key={b.value} selected={config.background === b.value} onClick={() => update('background', b.value)}>
                    <div className="text-left">
                      <div>{b.label}</div>
                      <div className="text-[9px] opacity-60 font-normal">{b.desc}</div>
                    </div>
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Camera angle */}
            <Section label="Ângulo de Câmera">
              <div className="flex flex-wrap gap-1.5">
                {CAMERA_ANGLES.map(c => (
                  <Chip key={c.value} selected={config.cameraAngle === c.value} onClick={() => update('cameraAngle', c.value)}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Lens */}
            <Section label="Lente">
              <div className="flex flex-wrap gap-1.5">
                {LENSES.map(l => (
                  <Chip key={l.value} selected={config.lens === l.value} onClick={() => update('lens', l.value)}>
                    <div className="text-left">
                      <div>{l.label}</div>
                      <div className="text-[9px] opacity-60 font-normal">{l.desc}</div>
                    </div>
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Clothing */}
            <Section label="Vestimenta">
              <input
                type="text"
                value={config.clothing}
                onChange={e => update('clothing', e.target.value)}
                placeholder="Ex: terno preto elegante, vestido vermelho..."
                className="w-full h-9 px-3 rounded-lg border border-border/20 bg-secondary/20 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
              />
            </Section>

            {/* Free prompt */}
            <Section label="Instruções Extras">
              <textarea
                value={config.freePrompt}
                onChange={e => update('freePrompt', e.target.value)}
                placeholder="Detalhes adicionais: acessórios, cenário específico, mood..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border/20 bg-secondary/20 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 resize-none"
              />
            </Section>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="w-full h-12 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-[0_0_32px_-8px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_-6px_hsl(var(--primary)/0.4)] transition-all duration-300"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isProcessing ? 'Gerando retrato...' : 'Gerar Retrato Profissional'}
            </Button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative">
          <AnimatePresence mode="wait">
            {!resultImage && !isProcessing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-3"
              >
                <Camera className="h-16 w-16 mx-auto text-muted-foreground/10" />
                <p className="text-sm font-semibold text-foreground/30">Seu retrato aparecerá aqui</p>
                <p className="text-[11px] text-muted-foreground/40 max-w-xs mx-auto">
                  Configure os parâmetros ao lado e clique em gerar. Com foto de referência, a identidade será preservada.
                </p>
              </motion.div>
            )}
            {isProcessing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <div className="absolute inset-0 h-12 w-12 mx-auto animate-ping opacity-20 rounded-full bg-primary" />
                </div>
                <p className="text-sm font-semibold text-primary">Criando retrato profissional...</p>
                <p className="text-[10px] text-muted-foreground/60">Isso pode levar 15-30 segundos</p>
              </motion.div>
            )}
            {resultImage && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative inline-block"
              >
                <img
                  src={resultImage}
                  alt="Portrait"
                  className="max-w-full max-h-[80vh] rounded-xl shadow-[0_20px_60px_-15px_hsl(0_0%_0%/0.5)] ring-1 ring-white/[0.03]"
                />
                <DownloadButtons downloadState={downloadState} onDownload={download} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
