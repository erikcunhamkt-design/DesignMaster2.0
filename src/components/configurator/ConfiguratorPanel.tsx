import { ProjectConfig } from '@/types/project';
import { SectionLabel } from './SectionLabel';
import { SubjectSection } from './sections/SubjectSection';
import { DimensionsSection } from './sections/DimensionsSection';
import { TextSection } from './sections/TextSection';
import { ProjectScenarioSection } from './sections/ProjectScenarioSection';
import { ColorsSection } from './sections/ColorsSection';
import { CompositionSection } from './sections/CompositionSection';
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
    <div className="flex w-[380px] shrink-0 flex-col border-l border-border/30 bg-card/80 glass">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/20 px-5 py-3">
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-foreground/60">Configurações</h2>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Dicas</span>
          <Switch checked={tipsEnabled} onCheckedChange={setTipsEnabled} className="scale-75 origin-right" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <section>
          <SectionLabel tip={tipsConfig['sujeito']} tipsEnabled={tipsEnabled}>Sujeito Principal</SectionLabel>
          <SubjectSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['dimensoes']} tipsEnabled={tipsEnabled}>Dimensões</SectionLabel>
          <DimensionsSection config={config} onUpdate={onUpdate} />
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
          <SectionLabel tip={tipsConfig['referencias']} tipsEnabled={tipsEnabled}>Referências de Estilo</SectionLabel>
          <ReferencesSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel tip={tipsConfig['estilo-visual']} tipsEnabled={tipsEnabled}>Atributos Visuais & Estilo</SectionLabel>
          <VisualStyleSection config={config} onUpdate={onUpdate} />
        </section>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border/20 p-5 space-y-2.5">
        <Button
          disabled={!canGenerate}
          onClick={onGenerate}
          className="w-full h-11 gap-2.5 text-sm font-bold tracking-wide bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-glow-md transition-all duration-300 hover:shadow-glow-lg rounded-xl"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
        </Button>
        <Button variant="ghost" className="w-full h-9 gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-xl">
          <Copy className="h-3.5 w-3.5" />
          Duplicar Configuração
        </Button>
      </div>
    </div>
  );
}
