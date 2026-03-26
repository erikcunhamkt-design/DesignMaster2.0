import { useState } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Camera, Sun, Eye, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { FormatSelector, getFormatPromptSuffix } from '@/components/configurator/FormatSelector';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useWatermarkDownload } from '@/hooks/useWatermarkDownload';
import { DownloadButtons } from '@/components/DownloadButtons';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Fauna Brasileira ──
const ANIMAL_OPTIONS = [
  { label: 'Onça-Pintada', emoji: '🐆' },
  { label: 'Arara-Azul', emoji: '🦜' },
  { label: 'Lobo-Guará', emoji: '🐺' },
  { label: 'Tucano', emoji: '🦅' },
  { label: 'Tamanduá-Bandeira', emoji: '🐾' },
  { label: 'Boto-Rosa', emoji: '🐬' },
  { label: 'Mico-Leão-Dourado', emoji: '🐒' },
  { label: 'Sucuri', emoji: '🐍' },
  { label: 'Jacaré-Açu', emoji: '🐊' },
  { label: 'Harpia', emoji: '🦅' },
  { label: 'Capivara', emoji: '🦫' },
  { label: 'Tatu-Bola', emoji: '⚽' },
];

const ANGLE_OPTIONS = [
  { label: 'Close-up Extremo', icon: Eye, desc: 'Detalhe facial, olhos, texturas' },
  { label: 'Low Angle Heroico', icon: Zap, desc: 'De baixo p/ cima, dominante' },
  { label: 'Aéreo Drone', icon: Camera, desc: 'Vista de cima, paisagem' },
  { label: 'Eye Level', icon: Eye, desc: 'Olho no olho, conexão' },
  { label: 'Dutch Angle', icon: Zap, desc: 'Inclinado, tensão dramática' },
  { label: 'Over the Shoulder', icon: Camera, desc: 'Perspectiva de profundidade' },
];

const LIGHTING_OPTIONS = [
  { label: 'Golden Hour', desc: 'Luz dourada 5000K, sombras longas' },
  { label: 'Rim Light', desc: 'Contorno luminoso, fundo escuro' },
  { label: 'Moonlight', desc: 'Azul noturno, atmosfera mística' },
  { label: 'Neon Tropical', desc: 'Cores vibrantes, glow surrealista' },
  { label: 'Storm Light', desc: 'Céu dramático, raios e contraste' },
  { label: 'Bioluminescência', desc: 'Fungos e flora que brilham' },
];

const EFFECT_OPTIONS = [
  'Partículas flutuantes',
  'Profundidade extrema (bokeh)',
  'Splash de água',
  'Fumaça / névoa',
  'Borboletas ao redor',
  'Folhagem tropical em 1º plano',
  'Reflexo na água',
  'Poeira dourada',
  'Vagalumes',
  'Gotas de orvalho macro',
];

const STYLE_OPTIONS = [
  'Hiper-Realista 8K',
  'National Geographic',
  'Dark Cinematic',
  'Fantasia Épica',
  'Neon Surreal',
  'Aquarela Digital',
  'Minimalista Bold',
];

const BIOME_OPTIONS = [
  'Amazônia',
  'Cerrado',
  'Pantanal',
  'Mata Atlântica',
  'Caatinga',
  'Pampas',
];

export default function MagneticCoversPage() {
  const [theme, setTheme] = useState('');
  const [animal, setAnimal] = useState('');
  const [angle, setAngle] = useState('');
  const [lighting, setLighting] = useState('');
  const [effects, setEffects] = useState<string[]>([]);
  const [style, setStyle] = useState('');
  const [biome, setBiome] = useState('');
  const [extra, setExtra] = useState('');
  const [format, setFormat] = useState('feed');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { apiKey } = useGoogleApiKey();
  const { downloadState, download } = useWatermarkDownload(resultImage, 'animais-fantasticos');
  const isMobile = useIsMobile();

  const toggleEffect = (e: string) => {
    setEffects(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const handleGenerate = async () => {
    if (!animal && !theme) { toast.error('Selecione um animal ou defina um tema'); return; }
    setIsGenerating(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('specialist-generate', {
        body: {
          studioType: 'covers',
          theme: theme || `${animal} - fauna brasileira`,
          character: animal,
          style,
          elements: [
            angle && `Camera angle: ${angle}`,
            lighting && `Lighting: ${lighting}`,
            biome && `Biome/Environment: ${biome}`,
            effects.length > 0 && `Visual effects: ${effects.join(', ')}`,
          ].filter(Boolean).join(' | '),
          extra: (extra + getFormatPromptSuffix(format)).trim(),
          referenceImages: [],
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

  const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">{children}</p>
    </div>
  );

  const configPanel = (
    <div className={cn(
      "space-y-5",
      isMobile ? "p-4" : "p-6"
    )}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/10">
        <div className="absolute top-2 right-2 text-4xl opacity-20 animate-[void-pulse_3s_ease-in-out_infinite]">🐆</div>
        <h2 className="text-base font-black text-foreground font-display tracking-tight">Animais Fantásticos</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Fauna brasileira em ângulos magnéticos e iluminação cinematográfica.</p>
      </div>

      {/* Animal selection */}
      <div>
        <SectionTitle icon={<span className="text-sm">🦁</span>}>Animal</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {ANIMAL_OPTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => setAnimal(animal === a.label ? '' : a.label)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[10px] font-semibold border transition-all duration-200',
                animal === a.label
                  ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_rgba(0,255,200,0.1)]'
                  : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20 hover:bg-secondary/50'
              )}
            >
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Angle */}
      <div>
        <SectionTitle icon={<Camera className="h-3 w-3 text-muted-foreground/60" />}>Ângulo Magnético</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {ANGLE_OPTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => setAngle(angle === a.label ? '' : a.label)}
              className={cn(
                'rounded-lg px-2.5 py-2 text-left border transition-all duration-200',
                angle === a.label
                  ? 'bg-primary/10 border-primary/30 shadow-[0_0_8px_rgba(0,255,200,0.08)]'
                  : 'bg-secondary/20 border-border/10 hover:border-primary/15'
              )}
            >
              <span className={cn("text-[10px] font-bold block", angle === a.label ? "text-primary" : "text-foreground/80")}>{a.label}</span>
              <span className="text-[8px] text-muted-foreground/60 block mt-0.5">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lighting */}
      <div>
        <SectionTitle icon={<Sun className="h-3 w-3 text-muted-foreground/60" />}>Iluminação</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {LIGHTING_OPTIONS.map(l => (
            <button
              key={l.label}
              onClick={() => setLighting(lighting === l.label ? '' : l.label)}
              className={cn(
                'rounded-lg px-2.5 py-2 text-left border transition-all duration-200',
                lighting === l.label
                  ? 'bg-primary/10 border-primary/30 shadow-[0_0_8px_rgba(0,255,200,0.08)]'
                  : 'bg-secondary/20 border-border/10 hover:border-primary/15'
              )}
            >
              <span className={cn("text-[10px] font-bold block", lighting === l.label ? "text-primary" : "text-foreground/80")}>{l.label}</span>
              <span className="text-[8px] text-muted-foreground/60 block mt-0.5">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Effects */}
      <div>
        <SectionTitle icon={<Sparkles className="h-3 w-3 text-muted-foreground/60" />}>Efeitos Visuais</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {EFFECT_OPTIONS.map(e => (
            <button
              key={e}
              onClick={() => toggleEffect(e)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[9px] font-medium border transition-all duration-200',
                effects.includes(e)
                  ? 'bg-accent/15 text-accent-foreground border-accent/30'
                  : 'bg-secondary/20 text-muted-foreground border-border/10 hover:border-accent/20'
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <SectionTitle>Estilo Visual</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStyle(style === s ? '' : s)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[9px] font-medium border transition-all',
                style === s ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Biome */}
      <div>
        <SectionTitle icon={<span className="text-xs">🌿</span>}>Bioma / Cenário</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {BIOME_OPTIONS.map(b => (
            <button
              key={b}
              onClick={() => setBiome(biome === b ? '' : b)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[9px] font-medium border transition-all',
                biome === b ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20'
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Theme / Custom */}
      <div>
        <SectionTitle>Tema / Conceito</SectionTitle>
        <Input
          value={theme}
          onChange={e => setTheme(e.target.value)}
          placeholder="Ex: força, liberdade, majestade da natureza..."
          className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg"
        />
      </div>

      <FormatSelector value={format} onChange={setFormat} />

      {/* Extra */}
      <div>
        <SectionTitle>Detalhes Extras</SectionTitle>
        <Textarea
          value={extra}
          onChange={e => setExtra(e.target.value)}
          placeholder="Instruções adicionais, referências..."
          className="min-h-[60px] bg-secondary/40 border-border/15 text-xs rounded-lg resize-none"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || (!animal && !theme) || apiKey.length < 10}
        className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-glow-md"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isGenerating ? 'Criando...' : 'Gerar Imagem'}
      </Button>
    </div>
  );

  const previewPanel = (
    <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
      {!resultImage && !isGenerating && (
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <span className="text-7xl block animate-[void-pulse_3s_ease-in-out_infinite]">🐆</span>
            <div className="absolute -inset-4 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          </div>
          <p className="text-sm font-semibold text-foreground/30">Selecione um animal e gere sua obra</p>
          <p className="text-[10px] text-muted-foreground/40 max-w-xs mx-auto">Combine ângulos magnéticos, iluminação cinematográfica e efeitos visuais para criar capas épicas da fauna brasileira.</p>
        </div>
      )}
      {isGenerating && (
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="absolute -inset-6 rounded-full bg-primary/5 blur-2xl pointer-events-none animate-[void-pulse_2s_ease-in-out_infinite]" />
          </div>
          <p className="text-sm font-bold text-primary animate-pulse">Capturando a fauna...</p>
          <p className="text-[10px] text-muted-foreground/50">Isto pode levar alguns segundos</p>
        </div>
      )}
      {resultImage && (
        <div className="relative inline-block group">
          <img
            src={resultImage}
            alt="Animal fantástico"
            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl ring-1 ring-white/[0.04] transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] pointer-events-none" />
          <DownloadButtons downloadState={downloadState} onDownload={download} />
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <StudioTopbar title="Animais Fantásticos" />
        <div className="flex-1 overflow-y-auto pb-20">
          {configPanel}
          {previewPanel}
        </div>
        {(!resultImage && !isGenerating) && (
          <div className="fixed bottom-0 inset-x-0 p-3 bg-background/80 backdrop-blur-lg border-t border-border/10 z-50">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!animal && !theme) || apiKey.length < 10}
              className="w-full h-11 gap-2 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent"
            >
              <Sparkles className="h-4 w-4" />
              Gerar Imagem
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Animais Fantásticos" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[420px] shrink-0 border-r border-border/15 bg-card/20 overflow-y-auto scrollbar-hide">
          {configPanel}
        </div>
        {previewPanel}
      </div>
    </div>
  );
}
