import { useState, useCallback, useRef, useEffect } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { MobileGenerateButton } from '@/components/layout/MobileGenerateButton';
import { ProjectTabs } from '@/components/layout/ProjectTabs';
import { PreviewPanel } from '@/components/layout/PreviewPanel';
import { ConfiguratorPanel } from '@/components/configurator/ConfiguratorPanel';
import { GuidedWizard } from '@/components/guided/GuidedWizard';
import { useProjectStore } from '@/hooks/useProjectStore';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { buildGenerationRequest } from '@/core/prompt/PromptAgent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, Wand2 } from 'lucide-react';
import { ModelSelector, type AiModel } from '@/components/configurator/ModelSelector';
import { compressImageToBase64 } from '@/lib/imageUtils';
import { useImageHistory } from '@/hooks/useImageHistory';
import { ImageHistoryBar } from '@/components/layout/ImageHistoryBar';


// Estimated generation time in seconds
const ESTIMATED_SECONDS = 35;

const Index = () => {
  const [mode, setMode] = useState<'avancado' | 'guiado'>('avancado');
  const [previewState, setPreviewState] = useState<'aguardando' | 'gerando' | 'concluido'>('aguardando');
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { apiKey } = useGoogleApiKey();
  const [aiModel, setAiModel] = useState<AiModel>('pro');
  const mobilePreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewState === 'gerando' && mobilePreviewRef.current) {
      setTimeout(() => mobilePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [previewState]);

  const {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    addProject,
    duplicateProject,
    removeProject,
    renameProject,
    updateConfig,
  } = useProjectStore();

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!activeProject) return;

    setIsGenerating(true);
    setPreviewState('gerando');
    setGeneratedImage(undefined);
    setElapsedSeconds(0);

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    try {
      const genRequest = buildGenerationRequest(activeProject.config);

      // Show format validation toast before generating
      const dimLabel = activeProject.config.dimension
        ? { stories: 'Stories 9:16', horizontal: 'Horizontal 16:9', 'feed-quadrado': 'Quadrado 1:1', 'feed-retrato': 'Retrato 4:5' }[activeProject.config.dimension]
        : 'Quadrado 1:1';
      toast.info(`Gerando em ${dimLabel} · Aspect Ratio: ${genRequest.aspectRatio}`, { duration: 3000 });

      // Separate subject (identity) images from style/pose references
      const subjectImages: string[] = [];
      const styleReferenceImages: string[] = [];
      const referenceNotes: string[] = [];
      for (const ref of genRequest.references.slice(0, 8)) {
        if (ref.role === 'identity') {
          subjectImages.push(await compressImageToBase64(ref.url, 1024, 0.9));
        } else {
          styleReferenceImages.push(await compressImageToBase64(ref.url, 1024, 0.9));
          if (ref.attributes && ref.attributes.length > 0) {
            referenceNotes.push(ref.attributes.join(', '));
          }
        }
      }

      console.log(`📸 Sending ${subjectImages.length} subject (identity) images, ${styleReferenceImages.length} style references`);

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: genRequest.prompt,
          lockedPrompt: genRequest.lockedPrompt,
          expandablePrompt: genRequest.expandablePrompt,
          negativePrompt: genRequest.negative_prompt,
          aspectRatio: genRequest.aspectRatio,
          subjectImages,
          styleReferenceImages,
          referenceNotes,
          // Legacy fallback
          referenceImages: [],
          googleApiKey: apiKey,
          aiModel,
        },
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
      stopTimer();
      setIsGenerating(false);
    }
  }, [activeProject, apiKey]);

  const handleRefine = useCallback(async (refinementPrompt: string, currentImageUrl: string) => {
    setIsRefining(true);
    try {
      // Ensure we have a data URL (generated images are already base64)
      let imageDataUrl: string;
      if (currentImageUrl.startsWith('data:')) {
        imageDataUrl = currentImageUrl;
      } else {
        const resp = await fetch(currentImageUrl);
        const blob = await resp.blob();
        imageDataUrl = await blobToBase64(blob);
      }

      // Use generate-image with the current image as a reference (Google API key)
      const refinePromptText = `Edit this image: ${refinementPrompt}. Preserve the overall composition, subject, pose, lighting style, and visual quality. Only apply the requested change. The final image MUST fill the entire canvas edge to edge with no blank space.`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: refinePromptText,
          negativePrompt: 'low quality, blurry, artifacts, blank space, empty borders',
          referenceImages: [imageDataUrl],
          googleApiKey: apiKey,
        },
      });

      if (error) throw new Error(error.message || 'Erro no refinamento');
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success('Imagem refinada!');
      } else {
        throw new Error('Nenhuma imagem retornada no refinamento');
      }
    } catch (err: any) {
      console.error('Refine error:', err);
      toast.error(err.message || 'Erro ao refinar imagem');
    } finally {
      setIsRefining(false);
    }
  }, [apiKey]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Design Master" />

      {/* Mode switcher + project tabs row */}
      <div className="flex items-center border-b border-border/10 bg-background/90 backdrop-blur-sm shrink-0 h-9">
        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 px-3 h-full border-r border-border/10 shrink-0">
          <button
            onClick={() => setMode('avancado')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-md transition-all duration-200',
              mode === 'avancado'
                ? 'bg-secondary/60 text-foreground border border-border/25'
                : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20'
            )}
          >
            <SlidersHorizontal className="h-2.5 w-2.5" />
            Avançado
          </button>
          <button
            onClick={() => setMode('guiado')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-md transition-all duration-200',
              mode === 'guiado'
                ? 'bg-secondary/60 text-foreground border border-border/25'
                : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20'
            )}
          >
            <Wand2 className="h-2.5 w-2.5" />
            Guiado
            <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider leading-none">
              novo
            </span>
          </button>
        </div>

        {/* Project tabs — only in avançado mode */}
        {mode === 'avancado' && (
          <div className="flex-1 min-w-0 h-full">
            <ProjectTabs
              projects={projects}
              activeId={activeProjectId}
              onSelect={setActiveProjectId}
              onClose={removeProject}
              onAdd={addProject}
              onRename={renameProject}
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        {mode === 'guiado' ? (
          <GuidedWizard />
        ) : (
          activeProject && (
            <>
              {/* On mobile: config first, then preview below */}
              <div className="md:hidden flex flex-col flex-1 overflow-y-auto pb-20">
                <ConfiguratorPanel
                  config={activeProject.config}
                  onUpdate={updateConfig}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  apiKey={apiKey}
                  aiModel={aiModel}
                  onModelChange={setAiModel}
                  onDuplicate={duplicateProject}
                />
                {(previewState === 'gerando' || previewState === 'concluido') && (
                  <div ref={mobilePreviewRef}>
                    <PreviewPanel
                      state={previewState}
                      imageUrl={generatedImage}
                      config={activeProject.config}
                      elapsedSeconds={elapsedSeconds}
                      estimatedSeconds={ESTIMATED_SECONDS}
                      onRefine={handleRefine}
                      isRefining={isRefining}
                    />
                  </div>
                )}
              </div>
              {/* Desktop: side by side */}
              <div className="hidden md:flex flex-1 overflow-hidden">
                <PreviewPanel
                  state={previewState}
                  imageUrl={generatedImage}
                  config={activeProject.config}
                  elapsedSeconds={elapsedSeconds}
                  estimatedSeconds={ESTIMATED_SECONDS}
                  onRefine={handleRefine}
                  isRefining={isRefining}
                />
                <ConfiguratorPanel
                  config={activeProject.config}
                  onUpdate={updateConfig}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  apiKey={apiKey}
                  aiModel={aiModel}
                  onModelChange={setAiModel}
                  onDuplicate={duplicateProject}
                />
              </div>
            </>
          )
        )}
        {mode === 'avancado' && activeProject && (
          <MobileGenerateButton onGenerate={handleGenerate} isGenerating={isGenerating} label="Gerar Imagem ✨" />
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
