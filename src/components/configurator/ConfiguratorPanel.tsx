import { useState } from 'react';
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
import { Sparkles, Copy, Loader2, Eye, Move, Aperture, Palette, Type, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { creativePresets } from '@/data/creativePresets';
import { useTipsMode } from '@/hooks/useTipsMode';
import { tipsConfig } from '@/data/tipsConfig';

interface ConfiguratorPanelProps {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  apiKey: string;
}

const dockTabs = [
  { id: 'look', label: 'Look', icon: Eye },
  { id: 'pose', label: 'Pose', icon: Move },
  { id: 'lens', label: 'Lens', icon: Aperture },
  { id: 'color', label: 'Color', icon: Palette },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'pro', label: 'Pro', icon: Settings2 },
] as const;

type DockTab = typeof dockTabs[number]['id'];

export function ConfiguratorPanel({ config, onUpdate, onGenerate, isGenerating, apiKey }: ConfiguratorPanelProps) {
  const [activeTab, setActiveTab] = useState<DockTab>('look');
  const { tipsEnabled } = useTipsMode();

  const canGenerate = config.dimension !== null && config.niche.length > 0 &&
    (!config.textEnabled || config.text01.length >= 3) && !isGenerating && apiKey.length >= 10;

  const applyPreset = (preset: typeof creativePresets[number]) => {
    onUpdate(preset.values);
  };

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-l border-border/10 bg-card/20">
      {/* Dock Tab Bar */}
      <div className="flex items-center border-b border-border/10 px-2 py-1.5 gap-0.5 shrink-0">
        {dockTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-semibold tracking-wide transition-all duration-300',
                active
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/30'
              )}
            >
              <tab.icon className={cn('h-3.5 w-3.5', active && 'text-primary')} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Presets Row */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border/8 overflow-x-auto shrink-0">
        {creativePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="flex items-center gap-1.5 shrink-0 rounded-lg border border-border/15 bg-secondary/20 px-2.5 py-1.5 text-[9px] font-medium text-foreground/60 hover:bg-secondary/40 hover:text-foreground hover:border-primary/20 transition-all duration-300"
          >
            <span className="text-xs">{preset.emoji}</span>
            <span className="whitespace-nowrap">{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {activeTab === 'look' && (
          <>
            <section>
              <SectionLabel tip={tipsConfig['sujeito']} tipsEnabled={tipsEnabled}>Sujeito</SectionLabel>
              <SubjectSection config={config} onUpdate={onUpdate} />
            </section>
            <section>
              <SectionLabel tip={tipsConfig['estilo-visual']} tipsEnabled={tipsEnabled}>Estilo Visual</SectionLabel>
              <VisualStyleSection config={config} onUpdate={onUpdate} />
            </section>
          </>
        )}

        {activeTab === 'pose' && (
          <section>
            <SectionLabel tip={tipsConfig['direcao']} tipsEnabled={tipsEnabled}>Direção do Personagem</SectionLabel>
            <CharacterDirectionSection config={config} onUpdate={onUpdate} />
          </section>
        )}

        {activeTab === 'lens' && (
          <>
            <section>
              <SectionLabel tip={tipsConfig['dimensoes']} tipsEnabled={tipsEnabled}>Dimensões</SectionLabel>
              <DimensionsSection config={config} onUpdate={onUpdate} />
            </section>
            <section>
              <SectionLabel tip={tipsConfig['composicao']} tipsEnabled={tipsEnabled}>Composição</SectionLabel>
              <CompositionSection config={config} onUpdate={onUpdate} />
            </section>
          </>
        )}

        {activeTab === 'color' && (
          <section>
            <SectionLabel tip={tipsConfig['cores']} tipsEnabled={tipsEnabled}>Cores & Iluminação</SectionLabel>
            <ColorsSection config={config} onUpdate={onUpdate} />
          </section>
        )}

        {activeTab === 'text' && (
          <section>
            <SectionLabel tip={tipsConfig['texto']} tipsEnabled={tipsEnabled}>Texto</SectionLabel>
            <TextSection config={config} onUpdate={onUpdate} />
          </section>
        )}

        {activeTab === 'pro' && (
          <>
            <section>
              <SectionLabel tip={tipsConfig['projeto-cenario']} tipsEnabled={tipsEnabled}>Projeto & Cenário</SectionLabel>
              <ProjectScenarioSection config={config} onUpdate={onUpdate} />
            </section>
            <section>
              <SectionLabel tip={tipsConfig['referencias']} tipsEnabled={tipsEnabled}>Referências</SectionLabel>
              <ReferencesSection config={config} onUpdate={onUpdate} />
            </section>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border/10 p-4 space-y-2">
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
