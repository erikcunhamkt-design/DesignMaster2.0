import { useState, useRef, useCallback } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, Download, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LIGHTING_OPTIONS = ['Estúdio Softbox', 'Rim Light Dramático', 'Luz Natural Janela', 'Hard Light Produto', 'Backlight Silhueta'];
const BG_OPTIONS = ['Fundo Infinito Branco', 'Fundo Infinito Preto', 'Fundo Gradiente', 'Lifestyle Contextual', 'Superfície Reflexiva'];

export default function ProductsStudioPage() {
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('');
  const [lighting, setLighting] = useState('');
  const [background, setBackground] = useState('');
  const [extra, setExtra] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'done'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const { apiKey } = useGoogleApiKey();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setProductImage(reader.result as string); setResultImage(null); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerate = async () => {
    if (!productName) { toast.error('Descreva o produto'); return; }
    setIsGenerating(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('specialist-generate', {
        body: {
          studioType: 'products',
          productName,
          productType,
          lighting,
          background,
          extra,
          referenceImages: productImage ? [productImage] : [],
          googleApiKey: apiKey,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) { setResultImage(data.imageUrl); toast.success('Imagem gerada!'); }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!resultImage) return;
    setDownloadState('loading');
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `product-${Date.now()}.png`;
      link.click();
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    }, 500);
  }, [resultImage]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Produtos" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[400px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-1 font-display flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" /> Especialista em Produtos
              </h2>
              <p className="text-xs text-muted-foreground">Fotografia de produto com iluminação de estúdio e acabamento premium.</p>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Foto do produto (opcional)</p>
              {productImage ? (
                <div className="relative group rounded-xl overflow-hidden">
                  <img src={productImage} alt="Product" className="w-full rounded-xl border border-border/15 object-cover max-h-[180px]" />
                  <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <span className="text-xs font-semibold bg-secondary/80 px-3 py-1.5 rounded-lg">Trocar</span>
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="flex h-28 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/30 bg-card/30 text-muted-foreground hover:border-primary/40 transition-all text-xs">
                  <Upload className="h-4 w-4" /> Enviar foto
                </button>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Produto *</p>
              <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ex: perfume premium, tênis esportivo..." className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Tipo</p>
              <Input value={productType} onChange={e => setProductType(e.target.value)} placeholder="Ex: cosmético, eletrônico, vestuário..." className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Iluminação</p>
              <div className="flex flex-wrap gap-1.5">
                {LIGHTING_OPTIONS.map(l => (
                  <button key={l} onClick={() => setLighting(lighting === l ? '' : l)} className={cn('rounded-full px-2.5 py-1 text-[9px] font-medium border transition-all', lighting === l ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20')}>{l}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Background</p>
              <div className="flex flex-wrap gap-1.5">
                {BG_OPTIONS.map(b => (
                  <button key={b} onClick={() => setBackground(background === b ? '' : b)} className={cn('rounded-full px-2.5 py-1 text-[9px] font-medium border transition-all', background === b ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20')}>{b}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Detalhes extras</p>
              <Textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="Instruções adicionais..." className="min-h-[60px] bg-secondary/40 border-border/15 text-xs rounded-lg resize-none" />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !productName || apiKey.length < 10} className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-glow-md">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Gerando...' : 'Gerar Packshot'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          {!resultImage && !isGenerating && (
            <div className="text-center space-y-3">
              <ShoppingBag className="h-14 w-14 mx-auto text-muted-foreground/15" />
              <p className="text-sm font-semibold text-foreground/40">Packshot aparecerá aqui</p>
            </div>
          )}
          {isGenerating && (
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Criando packshot...</p>
            </div>
          )}
          {resultImage && (
            <div className="relative inline-block">
              <img src={resultImage} alt="Product shot" className="max-w-full max-h-[80vh] rounded-xl shadow-cinematic ring-1 ring-white/[0.03]" />
              <button onClick={handleDownload} disabled={downloadState === 'loading'} className="absolute top-4 right-4 flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-md border border-white/10 hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all duration-200">
                {downloadState === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : downloadState === 'done' ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                {downloadState === 'loading' ? 'Baixando…' : downloadState === 'done' ? 'Salvo' : 'Baixar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
