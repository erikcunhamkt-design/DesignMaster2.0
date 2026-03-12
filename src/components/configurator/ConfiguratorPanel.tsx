import { useState } from 'react';
import { ProjectConfig } from '@/types/project';
import { SubjectSection } from './sections/SubjectSection';
import { DimensionsSection } from './sections/DimensionsSection';
import { TextSection } from './sections/TextSection';
import { ProjectScenarioSection } from './sections/ProjectScenarioSection';
import { ColorsSection } from './sections/ColorsSection';
import { CompositionSection } from './sections/CompositionSection';
import { CharacterDirectionSection } from './sections/CharacterDirectionSection';
import { ReferencesSection } from './sections/ReferencesSection';
import { VisualStyleSection } from './sections/VisualStyleSection';
import { FreePromptBlock } from './FreePromptBlock';
import { NegativePromptBlock } from './NegativePromptBlock';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Copy, Loader2, ChevronDown, HelpCircle,
  User, Smartphone, Palette, Type, Settings2, SlidersHorizontal, Clapperboard
} from 'lucide-react';
import { ModelSelector, type AiModel } from './ModelSelector';
import { cn } from '@/lib/utils';
import { creativePresets } from '@/data/creativePresets';
import { useTipsMode } from '@/hooks/useTipsMode';
import { tipsConfig } from '@/data/tipsConfig';
import { SectionLabel } from './SectionLabel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfiguratorPanelProps {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
  aiModel?: AiModel;
  onModelChange?: (model: AiModel) => void;
  onDuplicate?: () => void;
}

interface CollapsibleBlockProps {
  icon?: React.ElementType;
  avatarSrc?: string;
  title: string;
  subtitle?: string;
  helpText?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accent?: boolean;
}

const sectionHelp: Record<string, string> = {
  'Sujeito': 'Defina o gênero, pose e posição do personagem na imagem.',
  'Estilo Visual': 'Define o estilo artístico da imagem gerada.',
  'Direção do Personagem': 'Controla expressão, ângulo de câmera, lente e direção do olhar.',
  'Formato & Composição': 'Define proporção da imagem como quadrado, retrato ou paisagem.',
  'Cores & Iluminação': 'Ajusta o clima visual, cores e iluminação da imagem.',
  'Texto na Imagem': 'Permite gerar imagens com textos ou tipografia.',
  'Avançado': 'Configurações avançadas para maior controle da geração.',
};

function CollapsibleBlock({ icon: Icon, avatarSrc, title, subtitle, helpText, defaultOpen = false, children, accent }: CollapsibleBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300',
      open
        ? 'border-border/20 bg-card/30'
        : 'border-border/10 bg-card/10 hover:border-border/20 hover:bg-card/20'
    )}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {Icon ? (
          <div className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300',
            open
              ? accent ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground/70'
              : 'bg-secondary/50 text-muted-foreground/50'
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              'text-[11px] font-semibold tracking-wide transition-colors duration-200',
              open ? 'text-foreground' : 'text-foreground/60'
            )}>
              {title}
            </p>
            {helpText && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-primary/60 transition-colors cursor-help"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HelpCircle className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] text-[10px]">
                    {helpText}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {subtitle && (
            <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <ChevronDown className={cn(
          'h-3.5 w-3.5 text-muted-foreground/30 transition-transform duration-300 shrink-0',
          open && 'rotate-180 text-muted-foreground/60'
        )} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="h-px w-full bg-border/10 mb-3.5" />
          {children}
        </div>
      )}
    </div>
  );
}

export function ConfiguratorPanel({ config, onUpdate, onGenerate, isGenerating, apiKey, aiModel = 'pro', onModelChange, onDuplicate }: ConfiguratorPanelProps) {
  const { tipsEnabled } = useTipsMode();

  const hasFreePrompt = config.ignoreRest && config.freePrompt.trim().length > 0;
  const hasValidKey = apiKey.length >= 10;
  const canGenerate = !isGenerating && hasValidKey && (
    hasFreePrompt || (
      config.dimension !== null &&
      (!config.textEnabled || config.text01.length >= 3)
    )
  );

  const applyPreset = (preset: typeof creativePresets[number]) => {
    onUpdate(preset.values);
  };

  const dimensionSubtitle = config.dimension
    ? { stories: 'Stories 9:16', horizontal: 'Horizontal 16:9', 'feed-quadrado': 'Feed 1:1', 'feed-retrato': 'Feed 4:5' }[config.dimension]
    : 'Selecionar formato';

  const colorSubtitle = config.colorMode === 'auto' ? 'Automático pela IA' : 'Personalizado';
  const styleSubtitle = config.visualStyleEnabled && config.visualStyle ? config.visualStyle : 'Sobriedade · Blur · Degradê';
  const textSubtitle = config.textEnabled ? (config.text01 || 'Texto habilitado') : 'Desabilitado';
  const scenarioSubtitle = config.niche ? config.niche : 'Nicho não definido';

  return (
    <div className="flex w-full md:w-[400px] shrink-0 flex-col md:border-l border-border/10 bg-background/50">
      {/* Blocks */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">

        {/* Prompt Livre */}
        <FreePromptBlock
          freePrompt={config.freePrompt}
          ignoreRest={config.ignoreRest}
          onUpdate={onUpdate}
          placeholder="Ex: Mulher executiva confiante, fundo urbano noturno, lighting dramático..."
        />

        {/* Prompt Negativo */}
        <NegativePromptBlock
          negativePrompt={config.negativePrompt}
          negativePromptEnabled={config.negativePromptEnabled}
          onUpdate={onUpdate}
        />

        {/* Bloco 1 — Sujeito */}
        <CollapsibleBlock
          icon={User}
          title="Sujeito"
          subtitle={config.gender === 'masculino' ? 'Masculino' : 'Feminino'}
          helpText={sectionHelp['Sujeito']}
          defaultOpen
          accent
        >
          <SubjectSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 2 — Estilo Visual */}
        <CollapsibleBlock
          icon={SlidersHorizontal}
          title="Estilo Visual"
          subtitle={styleSubtitle}
          helpText={sectionHelp['Estilo Visual']}
        >
          <VisualStyleSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 3 — Direção do Personagem */}
        <CollapsibleBlock
          icon={Clapperboard}
          title="Direção do Personagem"
          subtitle="Expressão · Ângulo · Lente · Olhar"
          helpText={sectionHelp['Direção do Personagem']}
        >
          <CharacterDirectionSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 4 — Formato & Composição */}
        <CollapsibleBlock
          icon={Smartphone}
          title="Formato & Composição"
          subtitle={dimensionSubtitle}
          helpText={sectionHelp['Formato & Composição']}
        >
          <div className="space-y-5">
            <div>
              <SectionLabel tip={tipsConfig['dimensoes']} tipsEnabled={tipsEnabled}>Dimensões</SectionLabel>
              <DimensionsSection config={config} onUpdate={onUpdate} />
            </div>
            <div>
              <SectionLabel tip={tipsConfig['composicao']} tipsEnabled={tipsEnabled}>Composição</SectionLabel>
              <CompositionSection config={config} onUpdate={onUpdate} />
            </div>
          </div>
        </CollapsibleBlock>

        {/* Bloco 5 — Cores & Iluminação */}
        <CollapsibleBlock
          icon={Palette}
          title="Cores & Iluminação"
          subtitle={colorSubtitle}
          helpText={sectionHelp['Cores & Iluminação']}
        >
          <ColorsSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 6 — Texto */}
        <CollapsibleBlock
          icon={Type}
          title="Texto na Imagem"
          subtitle={textSubtitle}
          helpText={sectionHelp['Texto na Imagem']}
        >
          <TextSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 7 — Avançado */}
        <CollapsibleBlock
          icon={Settings2}
          title="Avançado"
          subtitle={`${scenarioSubtitle} · Referências`}
          helpText={sectionHelp['Avançado']}
        >
          <div className="space-y-5">
            <div>
              <SectionLabel tip={tipsConfig['projeto-cenario']} tipsEnabled={tipsEnabled}>Projeto & Cenário</SectionLabel>
              <ProjectScenarioSection config={config} onUpdate={onUpdate} />
            </div>
            <div>
              <SectionLabel tip={tipsConfig['referencias']} tipsEnabled={tipsEnabled}>Referências</SectionLabel>
              <ReferencesSection config={config} onUpdate={onUpdate} />
            </div>
          </div>
        </CollapsibleBlock>

      </div>

      {/* Footer */}
      <div className="border-t border-border/10 p-4 space-y-2 shrink-0">
        {onModelChange && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">Modelo de IA</p>
            <ModelSelector value={aiModel} onChange={onModelChange} />
          </div>
        )}
        {!canGenerate && !hasFreePrompt && config.dimension === null && (
          <p className="text-[9px] text-muted-foreground/40 text-center">
            Selecione um <span className="text-foreground/50 font-semibold">Formato</span> para continuar
          </p>
        )}
        <Button
          disabled={!canGenerate}
          onClick={onGenerate}
          className={cn(
            "w-full h-11 gap-2.5 text-xs font-bold tracking-wider text-primary-foreground transition-all duration-500 rounded-xl disabled:opacity-25 disabled:shadow-none uppercase",
            !hasValidKey
              ? "bg-destructive hover:bg-destructive/90 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.4)]"
              : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-glow-md hover:shadow-glow-lg"
          )}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : !hasValidKey ? 'API Key Não Conectada' : 'Gerar Imagem'}
        </Button>
        <Button variant="ghost" onClick={onDuplicate} className="w-full h-8 gap-2 text-[10px] font-medium text-muted-foreground/40 hover:text-muted-foreground rounded-lg">
          <Copy className="h-3 w-3" />
          Duplicar Config
        </Button>
      </div>
    </div>
  );
}
