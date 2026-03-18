import type { SlideData } from '@/types/carouselEditor';
import { SlideCanvas } from './SlideCanvas';
import { cn } from '@/lib/utils';

interface SlideThumbnailProps {
  slide: SlideData;
  index: number;
  isActive: boolean;
  fontFamily: string;
  onClick: () => void;
}

export function SlideThumbnail({ slide, index, isActive, fontFamily, onClick }: SlideThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative rounded-lg overflow-hidden border-2 transition-all duration-200 shrink-0',
        isActive
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-border/20 hover:border-border/50'
      )}
      style={{ width: 96, height: 120 }}
    >
      <SlideCanvas slide={slide} fontFamily={fontFamily} scale={120 / 1080} />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white text-center py-0.5 font-medium">
        {index + 1}
      </div>
    </button>
  );
}
