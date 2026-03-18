import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlideCanvas, SLIDE_W, SLIDE_H } from './SlideCanvas';
import { SlideThumbnail } from './SlideThumbnail';
import { EditorControls } from './EditorControls';
import { CarouselEditorToolbar } from './CarouselEditorToolbar';
import {
  createDefaultProject,
  createDefaultSlide,
  type CarouselProject,
  type SlideData,
  type SlideTextBlock,
} from '@/types/carouselEditor';

export function CarouselEditor() {
  const [project, setProject] = useState<CarouselProject>(createDefaultProject);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const activeSlide = project.slides[activeIndex];
  const selectedBlock = activeSlide?.blocks.find((b) => b.id === selectedBlockId) ?? null;

  // Calculate scale to fit canvas in container
  const getScale = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return 0.5;
    const padding = 40;
    const maxW = container.clientWidth - padding * 2;
    const maxH = container.clientHeight - padding * 2;
    return Math.min(maxW / SLIDE_W, maxH / SLIDE_H, 1);
  }, []);

  const [scale, setScale] = useState(0.5);

  // Recalc on resize
  const updateScale = useCallback(() => {
    setScale(getScale());
  }, [getScale]);

  // Update block
  const handleUpdateBlock = useCallback(
    (blockId: string, updates: Partial<SlideTextBlock>) => {
      setProject((prev) => ({
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === activeIndex
            ? {
                ...s,
                blocks: s.blocks.map((b) =>
                  b.id === blockId ? { ...b, ...updates } : b
                ) as [SlideTextBlock, SlideTextBlock],
              }
            : s
        ),
      }));
    },
    [activeIndex]
  );

  // Update slide
  const handleUpdateSlide = useCallback(
    (slideId: string, updates: Partial<SlideData>) => {
      setProject((prev) => ({
        ...prev,
        slides: prev.slides.map((s) => (s.id === slideId ? { ...s, ...updates } : s)),
      }));
    },
    []
  );

  // Update project
  const handleUpdateProject = useCallback((updates: Partial<CarouselProject>) => {
    setProject((prev) => ({ ...prev, ...updates }));
  }, []);

  // Add slide
  const handleAddSlide = () => {
    if (project.slides.length >= 10) {
      toast.error('Máximo de 10 slides atingido');
      return;
    }
    const newSlide = createDefaultSlide(project.slides.length);
    setProject((prev) => ({ ...prev, slides: [...prev.slides, newSlide] }));
    setActiveIndex(project.slides.length);
  };

  // Duplicate slide
  const handleDuplicateSlide = () => {
    if (project.slides.length >= 10) {
      toast.error('Máximo de 10 slides atingido');
      return;
    }
    const clone: SlideData = JSON.parse(JSON.stringify(activeSlide));
    clone.id = crypto.randomUUID();
    clone.blocks.forEach((b) => (b.id = crypto.randomUUID()));
    const newSlides = [...project.slides];
    newSlides.splice(activeIndex + 1, 0, clone);
    setProject((prev) => ({ ...prev, slides: newSlides }));
    setActiveIndex(activeIndex + 1);
  };

  // Delete slide
  const handleDeleteSlide = () => {
    if (project.slides.length <= 1) return;
    const newSlides = project.slides.filter((_, i) => i !== activeIndex);
    setProject((prev) => ({ ...prev, slides: newSlides }));
    setActiveIndex(Math.min(activeIndex, newSlides.length - 1));
    setSelectedBlockId(null);
  };

  // Export all slides as PNGs
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      for (let i = 0; i < project.slides.length; i++) {
        const slide = project.slides[i];
        const canvas = document.createElement('canvas');
        canvas.width = SLIDE_W;
        canvas.height = SLIDE_H;
        const ctx = canvas.getContext('2d')!;

        // Background
        ctx.fillStyle = slide.backgroundColor;
        ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

        // Background image
        if (slide.backgroundImage) {
          try {
            const img = await loadImage(slide.backgroundImage);
            ctx.drawImage(img, 0, 0, SLIDE_W, SLIDE_H);
          } catch {}
        }

        // Text blocks
        for (const block of slide.blocks) {
          ctx.fillStyle = block.color;
          ctx.font = `${block.fontWeight} ${block.fontSize}px ${project.fontFamily}`;
          ctx.textAlign = block.textAlign as CanvasTextAlign;
          ctx.textBaseline = 'top';

          const xOffset =
            block.textAlign === 'center'
              ? block.x + block.width / 2
              : block.textAlign === 'right'
              ? block.x + block.width
              : block.x;

          // Word wrap
          const words = block.content.split(' ');
          let line = '';
          let y = block.y;
          const lineH = block.fontSize * block.lineHeight;

          for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > block.width && line) {
              ctx.fillText(line, xOffset, y);
              line = word;
              y += lineH;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, xOffset, y);
        }

        // Download
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slide-${i + 1}.png`;
        a.click();
        URL.revokeObjectURL(url);

        // Small delay between downloads
        if (i < project.slides.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      toast.success(`${project.slides.length} slides exportados!`);
    } catch (e) {
      toast.error('Erro ao exportar slides');
    } finally {
      setIsExporting(false);
    }
  };

  // AI text generation placeholder
  const handleGenerateTexts = async () => {
    setIsGenerating(true);
    toast.info('Geração por IA será conectada em breve. Por agora, edite os textos manualmente.');
    setTimeout(() => setIsGenerating(false), 1000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <CarouselEditorToolbar
        slideCount={project.slides.length}
        activeIndex={activeIndex}
        onAddSlide={handleAddSlide}
        onDuplicateSlide={handleDuplicateSlide}
        onDeleteSlide={handleDeleteSlide}
        onExportAll={handleExportAll}
        onGenerateTexts={handleGenerateTexts}
        isExporting={isExporting}
        isGenerating={isGenerating}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails sidebar */}
        <div className="w-[140px] border-r border-border/15 bg-card/20 shrink-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2 flex flex-col items-center">
              {project.slides.map((slide, i) => (
                <SlideThumbnail
                  key={slide.id}
                  slide={slide}
                  index={i}
                  isActive={i === activeIndex}
                  fontFamily={project.fontFamily}
                  onClick={() => {
                    setActiveIndex(i);
                    setSelectedBlockId(null);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden bg-secondary/10"
          onTransitionEnd={updateScale}
        >
          {activeSlide && (
            <SlideCanvas
              slide={activeSlide}
              fontFamily={project.fontFamily}
              scale={scale}
              interactive
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onUpdateBlock={handleUpdateBlock}
            />
          )}
        </div>

        {/* Controls */}
        {activeSlide && (
          <EditorControls
            project={project}
            activeSlide={activeSlide}
            selectedBlock={selectedBlock}
            onUpdateBlock={handleUpdateBlock}
            onUpdateSlide={handleUpdateSlide}
            onUpdateProject={handleUpdateProject}
          />
        )}
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
