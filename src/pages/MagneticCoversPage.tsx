import { useState } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { FormatSelector, getFormatPromptSuffix } from '@/components/configurator/FormatSelector';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useWatermarkDownload } from '@/hooks/useWatermarkDownload';
import { DownloadButtons } from '@/components/DownloadButtons';

const CHARACTER_OPTIONS = ['Leão', 'Lobo', 'Águia', 'Dragão', 'Fênix', 'Urso', 'Pantera', 'Mascote Custom'];
const STYLE_OPTIONS = ['Épico Realista', 'Ilustração Digital', 'Neon Glow', 'Dark Cinematic', 'Colorido Vibrante', 'Minimalista Bold'];

export default function MagneticCoversPage() {
  const [theme, setTheme] = useState('');
  const [character, setCharacter] = useState('');
  const [style, setStyle] = useState('');
  const [elements, setElements] = useState('');
  const [extra, setExtra] = useState('');
  const [format, setFormat] = useState('feed');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { apiKey } = useGoogleApiKey();
  const { downloadState, download } = useWatermarkDownload(resultImage, 'capa-magnetica');

  const handleGenerate = async () => {
    if (!theme) { toast.error('Defina o tema da capa'); return; }
    setIsGenerating(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('specialist-generate', {
        body: {
          studioType: 'covers',
          theme,
          character,
          style,
          elements,
          extra: (extra + getFormatPromptSuffix(format)).trim(),
          referenceImages: [],
          googleApiKey: apiKey,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) { setResultImage(data.imageUrl); toast.success('Capa gerada!'); }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar');
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Animais Fantásticos" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[400px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-1 font-display">🦁 Capas Magnéticas</h2>
              <p className="text-xs text-muted-foreground">Capas com animais, personagens e elementos — sem pessoa real.</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Tema / Conceito *</p>
              <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex: poder, liberdade, liderança..." className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Personagem / Animal</p>
              <div className="flex flex-wrap gap-1.5">
                {CHARACTER_OPTIONS.map(c => (
                  <button key={c} onClick={() => setCharacter(character === c ? '' : c)} className={cn('rounded-full px-2.5 py-1 text-[9px] font-medium border transition-all', character === c ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20')}>{c}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Estilo</p>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_OPTIONS.map(s => (
                  <button key={s} onClick={() => setStyle(style === s ? '' : s)} className={cn('rounded-full px-2.5 py-1 text-[9px] font-medium border transition-all', style === s ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20')}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Elementos gráficos</p>
              <Input value={elements} onChange={e => setElements(e.target.value)} placeholder="Ex: raios, coroa, chamas, partículas..." className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            <FormatSelector value={format} onChange={setFormat} />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Detalhes extras</p>
              <Textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="Instruções adicionais..." className="min-h-[60px] bg-secondary/40 border-border/15 text-xs rounded-lg resize-none" />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !theme || apiKey.length < 10} className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-glow-md">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Criando...' : 'Gerar Capa'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          {!resultImage && !isGenerating && (
            <div className="text-center space-y-3">
              <span className="text-6xl block">🦁</span>
              <p className="text-sm font-semibold text-foreground/40">Sua capa aparecerá aqui</p>
            </div>
          )}
          {isGenerating && (
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Criando capa magnética...</p>
            </div>
          )}
          {resultImage && (
            <div className="relative inline-block">
              <img src={resultImage} alt="Cover" className="max-w-full max-h-[80vh] rounded-xl shadow-cinematic ring-1 ring-white/[0.03]" />
              <DownloadButtons downloadState={downloadState} onDownload={download} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
