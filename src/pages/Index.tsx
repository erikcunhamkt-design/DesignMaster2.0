import { useState, useCallback } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { ProjectTabs } from '@/components/layout/ProjectTabs';
import { PreviewPanel } from '@/components/layout/PreviewPanel';
import { ConfiguratorPanel } from '@/components/configurator/ConfiguratorPanel';
import { useProjectStore } from '@/hooks/useProjectStore';
import { composePrompt } from '@/lib/promptComposer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const [activePage, setActivePage] = useState<'explorar' | 'criar' | 'galeria'>('criar');
  const [previewState, setPreviewState] = useState<'aguardando' | 'gerando' | 'concluido'>('aguardando');
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    addProject,
    removeProject,
    updateConfig,
  } = useProjectStore();

  const handleGenerate = useCallback(async () => {
    if (!activeProject) return;

    setIsGenerating(true);
    setPreviewState('gerando');
    setGeneratedImage(undefined);

    try {
      const { prompt, negativePrompt } = composePrompt(activeProject.config);

      const referenceImages: string[] = [];
      const allRefs = [
        ...activeProject.config.subjectPhotos,
        ...activeProject.config.styleReferences,
        ...(activeProject.config.sceneryPhotosEnabled ? activeProject.config.sceneryPhotos : []),
      ];

      for (const refUrl of allRefs.slice(0, 5)) {
        try {
          const resp = await fetch(refUrl);
          const blob = await resp.blob();
          const base64 = await blobToBase64(blob);
          referenceImages.push(base64);
        } catch {
          // skip failed references
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, negativePrompt, referenceImages },
      });

      if (error) throw new Error(error.message || 'Erro na geração');
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setPreviewState('concluido');
        toast.success('Imagem gerada com sucesso!');
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      toast.error(err.message || 'Erro ao gerar imagem');
      setPreviewState('aguardando');
    } finally {
      setIsGenerating(false);
    }
  }, [activeProject]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <TopNav
        activePage={activePage}
        onNavigate={setActivePage}
        onNewProject={addProject}
      />
      <ProjectTabs
        projects={projects}
        activeId={activeProjectId}
        onSelect={setActiveProjectId}
        onClose={removeProject}
        onAdd={addProject}
      />

      <div className="flex flex-1 overflow-hidden">
        {activePage === 'criar' && activeProject && (
          <>
            <PreviewPanel state={previewState} imageUrl={generatedImage} />
            <ConfiguratorPanel
              config={activeProject.config}
              onUpdate={updateConfig}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </>
        )}

        {activePage === 'explorar' && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <p className="text-sm">Explorar — Em breve</p>
          </div>
        )}

        {activePage === 'galeria' && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <p className="text-sm">Minha Galeria — Em breve</p>
          </div>
        )}
      </div>
    </div>
  );
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default Index;
