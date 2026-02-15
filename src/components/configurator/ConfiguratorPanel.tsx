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
import { ApiKeySection } from './sections/ApiKeySection';
import { Button } from '@/components/ui/button';
import { Sparkles, Copy, Loader2 } from 'lucide-react';

interface ConfiguratorPanelProps {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
  onChangeApiKey: (key: string) => void;
}

export function ConfiguratorPanel({ config, onUpdate, onGenerate, isGenerating, apiKey, onChangeApiKey }: ConfiguratorPanelProps) {
  const canGenerate = config.dimension !== null && config.niche.length > 0 &&
    (!config.textEnabled || config.text01.length >= 3) && !isGenerating && apiKey.length >= 10;

  return (
    <div className="flex w-[360px] shrink-0 flex-col border-l border-border bg-card">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section>
          <SectionLabel>🔑 API Key do Google</SectionLabel>
          <ApiKeySection apiKey={apiKey} onChangeKey={onChangeApiKey} />
        </section>

        <section>
          <SectionLabel>Sujeito Principal</SectionLabel>
          <SubjectSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel>Dimensões</SectionLabel>
          <DimensionsSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel>Texto</SectionLabel>
          <TextSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel>Projeto & Cenário</SectionLabel>
          <ProjectScenarioSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel>Cores & Iluminação</SectionLabel>
          <ColorsSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel>Composição</SectionLabel>
          <CompositionSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel>Referências de Estilo</SectionLabel>
          <ReferencesSection config={config} onUpdate={onUpdate} />
        </section>

        <section>
          <SectionLabel>Atributos Visuais & Estilo</SectionLabel>
          <VisualStyleSection config={config} onUpdate={onUpdate} />
        </section>
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <Button
          disabled={!canGenerate}
          onClick={onGenerate}
          className="w-full gap-2 bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
        </Button>
        <Button variant="outline" className="w-full gap-2 text-xs">
          <Copy className="h-3.5 w-3.5" />
          Duplicar Configuração
        </Button>
      </div>
    </div>
  );
}
