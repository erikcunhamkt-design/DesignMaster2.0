import { useRef, useEffect, useState } from 'react';
import type { SlideData, SlideTextBlock } from '@/types/carouselEditor';

const SLIDE_W = 1080;
const SLIDE_H = 1080;

interface SlideCanvasProps {
  slide: SlideData;
  fontFamily: string;
  scale?: number;
  interactive?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string | null) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<SlideTextBlock>) => void;
}

export function SlideCanvas({
  slide,
  fontFamily,
  scale = 1,
  interactive = false,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        width: SLIDE_W * scale,
        height: SLIDE_H * scale,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onSelectBlock) onSelectBlock(null);
      }}
    >
      <div
        className="absolute origin-top-left"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          backgroundColor: slide.backgroundColor,
        }}
      >
        {/* Background image */}
        {slide.backgroundImage && (
          <img
            src={slide.backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}

        {/* Text blocks */}
        {slide.blocks.map((block) => (
          <div
            key={block.id}
            className={`absolute cursor-pointer transition-shadow ${
              interactive && selectedBlockId === block.id
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent'
                : ''
            }`}
            style={{
              left: block.x,
              top: block.y,
              width: block.width,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive && onSelectBlock) onSelectBlock(block.id);
            }}
          >
            <div
              style={{
                fontSize: block.fontSize,
                fontWeight: block.fontWeight,
                letterSpacing: block.letterSpacing,
                lineHeight: block.lineHeight,
                color: block.color,
                fontFamily,
                textAlign: block.textAlign,
                wordBreak: 'break-word',
              }}
            >
              {block.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SLIDE_W, SLIDE_H };
