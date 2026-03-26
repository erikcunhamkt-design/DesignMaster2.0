import { useState, useRef } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Camera, Sun, Eye, Zap, Leaf, Paintbrush, Wind, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { FormatSelector, getFormatPromptSuffix } from '@/components/configurator/FormatSelector';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useWatermarkDownload } from '@/hooks/useWatermarkDownload';
import { DownloadButtons } from '@/components/DownloadButtons';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  { label: 'Close-up Extremo', desc: 'Olhos, texturas' },
  { label: 'Low Angle Heroico', desc: 'De baixo, dominante' },
  { label: 'Aéreo Drone', desc: 'Vista de cima' },
  { label: 'Eye Level', desc: 'Olho no olho' },
  { label: 'Dutch Angle', desc: 'Tensão dramática' },
  { label: 'Over the Shoulder', desc: 'Profundidade' },
];

const LIGHTING_OPTIONS = [
  { label: 'Golden Hour', desc: 'Dourada, sombras longas' },
  { label: 'Rim Light', desc: 'Contorno luminoso' },
  { label: 'Moonlight', desc: 'Azul noturno' },
  { label: 'Neon Tropical', desc: 'Glow surrealista' },
  { label: 'Storm Light', desc: 'Raios e contraste' },
  { label: 'Bioluminescência', desc: 'Flora que brilha' },
];

const EFFECT_OPTIONS = [
  'Partículas', 'Bokeh extremo', 'Splash de água', 'Névoa',
  'Borboletas', 'Folhagem 1º plano', 'Reflexo na água', 'Poeira dourada',
  'Vagalumes', 'Gotas de orvalho',
];

const STYLE_OPTIONS = [
  'Hiper-Realista 8K', 'National Geographic', 'Dark Cinematic',
  'Fantasia Épica', 'Neon Surreal', 'Aquarela Digital', 'Minimalista Bold',
];

const BIOME_OPTIONS = [
  { label: 'Amazônia', emoji: '🌳' },
  { label: 'Cerrado', emoji: '🌾' },
  { label: 'Pantanal', emoji: '💧' },
  { label: 'Mata Atlântica', emoji: '🌿' },
  { label: 'Caatinga', emoji: '🌵' },
  { label: 'Pampas', emoji: '🏔️' },
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
  const resultRef = useRef<HTMLDivElement>(null);

  const toggleEffect = (e: string) => {
    setEffects(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const selectionSummary = [animal, angle, lighting, biome, style, ...effects].filter(Boolean);

  const handleGenerate = async () => {
    if (!animal && !theme) { toast.error('Selecione um animal ou defina um tema'); return; }
    setIsGenerating(true);
    setResultImage(null);
    if (isMobile) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
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

  /* ── Reusable section wrapper with collapsible ── */
  const Section = ({ title, icon, children, defaultOpen = true }: {
    title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
  }) => (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full group py-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">{title}</span>
        </div>
        <ChevronDown className="h-3 w-3 text-muted-foreground/40 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  /* ── Chip component ── */
  const Chip = ({ label, selected, onClick, size = 'md' }: {
    label: React.ReactNode; selected: boolean; onClick: () => void; size?: 'sm' | 'md';
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border transition-all duration-200 font-medium',
        size === 'sm' ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[10px]',
        selected
          ? 'bg-primary/12 text-primary border-primary/25 shadow-[0_0_6px_rgba(0,255,200,0.08)]'
          : 'bg-secondary/25 text-muted-foreground border-border/10 hover:border-primary/15 hover:bg-secondary/40'
      )}
    >
      {label}
    </button>
  );

  /* ── Card chip for angle/lighting ── */
  const CardChip = ({ label, desc, selected, onClick }: {
    label: string; desc: string; selected: boolean; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2 text-left border transition-all duration-200 w-full',
        selected
          ? 'bg-primary/8 border-primary/25 shadow-[0_0_6px_rgba(0,255,200,0.06)]'
          : 'bg-secondary/15 border-border/8 hover:border-primary/12 hover:bg-secondary/25'
      )}
    >
      <span className={cn("text-[10px] font-semibold block leading-tight", selected ? "text-primary" : "text-foreground/75")}>{label}</span>
      <span className="text-[8px] text-muted-foreground/50 block mt-0.5 leading-tight">{desc}</span>
    </button>
  );

  const configPanel = (
    <div className={cn("space-y-4", isMobile ? "p-4 pb-6" : "p-5")}>
      {/* ── Animal Grid ── */}
      <Section title="Animal" icon={<span className="text-xs">🦁</span>}>
        <div className="grid grid-cols-3 gap-1.5">
          {ANIMAL_OPTIONS.map(a => (
            <Chip
              key={a.label}
              label={<><span className="mr-1">{a.emoji}</span>{a.label}</>}
              selected={animal === a.label}
              onClick={() => setAnimal(animal === a.label ? '' : a.label)}
            />
          ))}
        </div>
      </Section>

      {/* ── Biome ── */}
      <Section title="Bioma" icon={<Leaf className="h-3 w-3 text-muted-foreground/50" />}>
        <div className="flex flex-wrap gap-1.5">
          {BIOME_OPTIONS.map(b => (
            <Chip
              key={b.label}
              label={<><span className="mr-0.5">{b.emoji}</span>{b.label}</>}
              selected={biome === b.label}
              onClick={() => setBiome(biome === b.label ? '' : b.label)}
              size="sm"
            />
          ))}
        </div>
      </Section>

      {/* ── Angle ── */}
      <Section title="Ângulo" icon={<Camera className="h-3 w-3 text-muted-foreground/50" />}>
        <div className="grid grid-cols-2 gap-1.5">
          {ANGLE_OPTIONS.map(a => (
            <CardChip key={a.label} label={a.label} desc={a.desc} selected={angle === a.label} onClick={() => setAngle(angle === a.label ? '' : a.label)} />
          ))}
        </div>
      </Section>

      {/* ── Lighting ── */}
      <Section title="Iluminação" icon={<Sun className="h-3 w-3 text-muted-foreground/50" />}>
        <div className="grid grid-cols-2 gap-1.5">
          {LIGHTING_OPTIONS.map(l => (
            <CardChip key={l.label} label={l.label} desc={l.desc} selected={lighting === l.label} onClick={() => setLighting(lighting === l.label ? '' : l.label)} />
          ))}
        </div>
      </Section>

      {/* ── Style ── */}
      <Section title="Estilo" icon={<Paintbrush className="h-3 w-3 text-muted-foreground/50" />}>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map(s => (
            <Chip key={s} label={s} selected={style === s} onClick={() => setStyle(style === s ? '' : s)} size="sm" />
          ))}
        </div>
      </Section>

      {/* ── Effects ── */}
      <Section title="Efeitos" icon={<Wind className="h-3 w-3 text-muted-foreground/50" />} defaultOpen={false}>
        <div className="flex flex-wrap gap-1.5">
          {EFFECT_OPTIONS.map(e => (
            <Chip key={e} label={e} selected={effects.includes(e)} onClick={() => toggleEffect(e)} size="sm" />
          ))}
        </div>
      </Section>

      {/* ── Theme ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Tema / Conceito</span>
        </div>
        <Input
          value={theme}
          onChange={e => setTheme(e.target.value)}
          placeholder="Ex: força, liberdade, majestade..."
          className="h-8 bg-secondary/30 border-border/10 text-[11px] rounded-lg"
        />
      </div>

      <FormatSelector value={format} onChange={setFormat} />

      {/* ── Extra ── */}
      <Textarea
        value={extra}
        onChange={e => setExtra(e.target.value)}
        placeholder="Instruções adicionais..."
        className="min-h-[50px] bg-secondary/30 border-border/10 text-[11px] rounded-lg resize-none"
      />

      {/* ── Selection summary ── */}
      {selectionSummary.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectionSummary.map((s, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-primary/8 text-primary text-[8px] font-medium border border-primary/10">{s}</span>
          ))}
        </div>
      )}

      {/* ── Generate button ── */}
      {!isMobile && (
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!animal && !theme) || apiKey.length < 10}
          className="w-full h-10 gap-2 rounded-xl font-bold tracking-wider text-[11px] uppercase bg-gradient-to-r from-primary to-accent shadow-glow-md"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? 'Criando...' : 'Gerar Imagem'}
        </Button>
      )}
    </div>
  );

  const previewPanel = (
    <div ref={resultRef} className="flex-1 overflow-auto flex items-center justify-center relative">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      {!resultImage && !isGenerating && (
        <div className="text-center space-y-5 relative z-10 px-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-primary/[0.04] blur-3xl" />
            <span className="text-6xl md:text-7xl block animate-[void-pulse_4s_ease-in-out_infinite] relative">🐆</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-foreground/25 tracking-tight">Selecione e gere</p>
            <p className="text-[10px] text-muted-foreground/30 max-w-[260px] mx-auto leading-relaxed">
              Escolha um animal, ângulo, iluminação e efeitos para criar imagens épicas da fauna brasileira.
            </p>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="text-center space-y-4 relative z-10">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full bg-primary/[0.06] blur-2xl animate-[void-pulse_2s_ease-in-out_infinite]" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-primary">Capturando a fauna...</p>
            <p className="text-[9px] text-muted-foreground/40">Alguns segundos</p>
          </div>
        </div>
      )}

      {resultImage && (
        <div className="relative inline-block group p-4 md:p-8">
          <img
            src={resultImage}
            alt="Animal fantástico"
            className="max-w-full max-h-[82vh] rounded-xl shadow-2xl ring-1 ring-white/[0.04] transition-all duration-500 group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
          />
          <div className="absolute inset-4 md:inset-8 rounded-xl ring-1 ring-inset ring-white/[0.05] pointer-events-none" />
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
        <div className="fixed bottom-0 inset-x-0 p-3 bg-background/90 backdrop-blur-xl border-t border-border/8 z-50">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!animal && !theme) || apiKey.length < 10}
            className="w-full h-11 gap-2 rounded-xl font-bold tracking-wider text-[11px] uppercase bg-gradient-to-r from-primary to-accent shadow-glow-md"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Criando...' : 'Gerar Imagem'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Animais Fantásticos" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[380px] shrink-0 border-r border-border/10 bg-card/15 overflow-y-auto scrollbar-hide">
          {configPanel}
        </div>
        {previewPanel}
      </div>
    </div>
  );
}
