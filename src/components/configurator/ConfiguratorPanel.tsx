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
  Sparkles, Copy, Loader2, ChevronDown,
  User, Smartphone, Palette, Type, Settings2, SlidersHorizontal, Clapperboard
} from 'lucide-react';
import { ModelSelector, type AiModel } from './ModelSelector';
import { cn } from '@/lib/utils';
import { creativePresets } from '@/data/creativePresets';
import { useTipsMode } from '@/hooks/useTipsMode';
import { tipsConfig } from '@/data/tipsConfig';
import { SectionLabel } from './SectionLabel';
import genderMale from '@/assets/gender-male.png';
import genderFemale from '@/assets/gender-female.png';
import homerNeutro from '@/assets/expressions/homer-neutro.png';
import margeNeutro from '@/assets/expressions/marge-neutro.png';


interface ConfiguratorPanelProps {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
  aiModel?: AiModel;
  onModelChange?: (model: AiModel) => void;
}

interface CollapsibleBlockProps {
  icon?: React.ElementType;
  avatarSrc?: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accent?: boolean;
}

function CollapsibleBlock({ icon: Icon, avatarSrc, title, subtitle, defaultOpen = false, children, accent }: CollapsibleBlockProps) {
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
        {avatarSrc ? (
          <div className={cn(
            'h-7 w-7 shrink-0 rounded-full overflow-hidden border-2 transition-all duration-300',
            open ? 'border-primary/40' : 'border-border/20'
          )}>
            <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover object-top" />
          </div>
        ) : Icon ? (
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
          <p className={cn(
            'text-[11px] font-semibold tracking-wide transition-colors duration-200',
            open ? 'text-foreground' : 'text-foreground/60'
          )}>
            {title}
          </p>
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

export function ConfiguratorPanel({ config, onUpdate, onGenerate, isGenerating, apiKey, aiModel = 'pro', onModelChange }: ConfiguratorPanelProps) {
  const { tipsEnabled } = useTipsMode();

  const hasFreePrompt = config.ignoreRest && config.freePrompt.trim().length > 0;
  const canGenerate = !isGenerating && (
    apiKey.length >= 10
  ) && (
    hasFreePrompt || (
      config.dimension !== null &&
      config.niche.length > 0 &&
      (!config.textEnabled || config.text01.length >= 3)
    )
  );

  const applyPreset = (preset: typeof creativePresets[number]) => {
    onUpdate(preset.values);
  };

  // Derive subtitles from current config
  const subjectSubtitle = [
    config.quantity > 1 ? `${config.quantity} pessoas` : null,
    config.gender === 'masculino' ? 'Masculino' : 'Feminino',
    config.poseDescription ? config.poseDescription.slice(0, 20) + (config.poseDescription.length > 20 ? '…' : '') : null,
  ].filter(Boolean).join(' · ');

  const dimensionSubtitle = config.dimension
    ? { stories: 'Stories 9:16', horizontal: 'Horizontal 16:9', 'feed-quadrado': 'Feed 1:1', 'feed-retrato': 'Feed 4:5' }[config.dimension]
    : 'Selecionar formato';

  const colorSubtitle = config.colorMode === 'auto' ? 'Automático pela IA' : 'Personalizado';
  const styleSubtitle = config.visualStyleEnabled && config.visualStyle ? config.visualStyle : 'Sobriedade · Blur · Degradê';
  const textSubtitle = config.textEnabled ? (config.text01 || 'Texto habilitado') : 'Desabilitado';
  const scenarioSubtitle = config.niche ? config.niche : 'Nicho não definido';

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-l border-border/10 bg-background/50">
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
        >
          <VisualStyleSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 3 — Direção do Personagem */}
        <CollapsibleBlock
          icon={Clapperboard}
          title="Direção do Personagem"
          subtitle="Expressão · Ângulo · Lente · Olhar"
        >
          <CharacterDirectionSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 4 — Formato & Composição */}
        <CollapsibleBlock
          icon={Smartphone}
          title="Formato & Composição"
          subtitle={dimensionSubtitle}
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
        >
          <ColorsSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 6 — Texto */}
        <CollapsibleBlock
          icon={Type}
          title="Texto na Imagem"
          subtitle={textSubtitle}
        >
          <TextSection config={config} onUpdate={onUpdate} />
        </CollapsibleBlock>

        {/* Bloco 7 — Avançado */}
        <CollapsibleBlock
          icon={Settings2}
          title="Avançado"
          subtitle={`${scenarioSubtitle} · Referências`}
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
        {!canGenerate && !hasFreePrompt && config.niche.length === 0 && config.dimension !== null && (
          <p className="text-[9px] text-muted-foreground/40 text-center">
            Informe o <span className="text-foreground/50 font-semibold">Nicho</span> em Avançado
          </p>
        )}
        <Button
          disabled={!canGenerate}
          onClick={onGenerate}
          className="w-full h-11 gap-2.5 text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-glow-md transition-all duration-500 hover:shadow-glow-lg rounded-xl disabled:opacity-25 disabled:shadow-none uppercase"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
        </Button>
        <Button variant="ghost" className="w-full h-8 gap-2 text-[10px] font-medium text-muted-foreground/40 hover:text-muted-foreground rounded-lg">
          <Copy className="h-3 w-3" />
          Duplicar Config
        </Button>
      </div>
    </div>
  );
}
