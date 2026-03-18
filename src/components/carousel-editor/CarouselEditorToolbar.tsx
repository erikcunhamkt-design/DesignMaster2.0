import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, Sparkles, Copy } from 'lucide-react';
import type { SlideData } from '@/types/carouselEditor';

interface CarouselEditorToolbarProps {
  slideCount: number;
  activeIndex: number;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onExportAll: () => void;
  onGenerateTexts: () => void;
  isExporting: boolean;
  isGenerating: boolean;
}

export function CarouselEditorToolbar({
  slideCount,
  activeIndex,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onExportAll,
  onGenerateTexts,
  isExporting,
  isGenerating,
}: CarouselEditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/15 bg-card/20 backdrop-blur-sm">
      <span className="text-xs text-muted-foreground font-medium mr-2">
        Slide {activeIndex + 1} / {slideCount}
      </span>

      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] gap-1"
          onClick={onAddSlide}
          disabled={slideCount >= 10}
          title={slideCount >= 10 ? 'Máximo 10 slides' : 'Adicionar slide'}
        >
          <Plus className="h-3 w-3" /> Slide
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] gap-1"
          onClick={onDuplicateSlide}
          disabled={slideCount >= 10}
        >
          <Copy className="h-3 w-3" /> Duplicar
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive"
          onClick={onDeleteSlide}
          disabled={slideCount <= 1}
        >
          <Trash2 className="h-3 w-3" /> Remover
        </Button>
      </div>

      <div className="flex-1" />

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[10px] gap-1"
        onClick={onGenerateTexts}
        disabled={isGenerating}
      >
        <Sparkles className="h-3 w-3" />
        {isGenerating ? 'Gerando...' : 'IA: Gerar textos'}
      </Button>

      <Button
        size="sm"
        variant="default"
        className="h-7 text-[10px] gap-1"
        onClick={onExportAll}
        disabled={isExporting}
      >
        <Download className="h-3 w-3" />
        {isExporting ? 'Exportando...' : 'Exportar PNGs'}
      </Button>
    </div>
  );
}
