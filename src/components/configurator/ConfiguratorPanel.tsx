import { ProjectConfig } from '@/types/project';
import { SectionLabel } from './SectionLabel';
import { SubjectSection } from './sections/SubjectSection';
import { DimensionsSection } from './sections/DimensionsSection';
import { TextSection } from './sections/TextSection';
import { ProjectScenarioSection } from './sections/ProjectScenarioSection';
import { ColorsSection } from './sections/ColorsSection';
import { CompositionSection } from './sections/CompositionSection';
import { CharacterDirectionSection } from './sections/CharacterDirectionSection';
import { ReferencesSection } from './sections/ReferencesSection';
import { VisualStyleSection } from './sections/VisualStyleSection';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Copy, Loader2, Lightbulb } from 'lucide-react';
import { useTipsMode } from '@/hooks/useTipsMode';
import { tipsConfig } from '@/data/tipsConfig';

interface ConfiguratorPanelProps {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
}

export function ConfiguratorPanel({ config, onUpdate, onGenerate, isGenerating, apiKey }: ConfiguratorPanelProps) {
  const { tipsEnabled, setTipsEnabled } = useTipsMode();

  const canGenerate = config.dimension !== null && config.niche.length > 0 &&
    (!config.textEnabled || config.text01.length >= 3) && !isGenerating && apiKey.length >= 10;

  return (
    <div className="flex w-[360px] shrink-0 flex-col border-l border-border/20 bg-card/40 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/15 px-4 py-2.5">
        <h2 className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 font-display">Configurações</h2>
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-2.5 w-2.5 text-muted-foreground/40" />
          <span className="text-[9px] font-medium text-muted-foreground/40">Dicas</span>
          <Switch checked={tipsEnabled} onCheckedChange={setTipsEnabled} className="scale-[0.65] origin-right" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <section>
          <SectionLabel tip={tipsConfig['sujeito']} tipsEnabled={tipsEnabled}>Sujeito</SectionLabel>
          <SubjectSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['dimensoes']} tipsEnabled={tipsEnabled}>Dimensões</SectionLabel>
          <DimensionsSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['direcao']} tipsEnabled={tipsEnabled}>Direção do Personagem</SectionLabel>
          <CharacterDirectionSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['texto']} tipsEnabled={tipsEnabled}>Texto</SectionLabel>
          <TextSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['projeto-cenario']} tipsEnabled={tipsEnabled}>Projeto & Cenário</SectionLabel>
          <ProjectScenarioSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['cores']} tipsEnabled={tipsEnabled}>Cores & Iluminação</SectionLabel>
          <ColorsSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['composicao']} tipsEnabled={tipsEnabled}>Composição</SectionLabel>
          <CompositionSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['referencias']} tipsEnabled={tipsEnabled}>Referências</SectionLabel>
          <ReferencesSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['estilo-visual']} tipsEnabled={tipsEnabled}>Estilo Visual</SectionLabel>
          <VisualStyleSection config={config} onUpdate={onUpdate} />
        </section>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border/15 p-4 space-y-2">
        <Button
          disabled={!canGenerate}
          onClick={onGenerate}
          className="w-full h-10 gap-2 text-[11px] font-bold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-md transition-all duration-300 hover:shadow-glow-lg rounded-lg disabled:opacity-30 disabled:shadow-none"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
        </Button>
        <Button variant="ghost" className="w-full h-8 gap-1.5 text-[10px] font-medium text-muted-foreground/50 hover:text-muted-foreground rounded-lg">
          <Copy className="h-3 w-3" />
          Duplicar Config
        </Button>
      </div>
    </div>
  );
}
