import { useState, useCallback } from 'react';

const MAX_HISTORY = 5;

// Module-level Map — survives component unmounts / route changes
const studioHistories = new Map<string, string[]>();

/** Check if a studio has existing history (useful for initial state) */
export function hasImageHistory(studioId: string): boolean {
  return (studioHistories.get(studioId)?.length ?? 0) > 0;
}

/**
 * Persists up to 5 generated image URLs per studio tool,
 * surviving tab/route switches without clearing.
 */
export function useImageHistory(studioId: string) {
  const [images, setImages] = useState<string[]>(
    () => studioHistories.get(studioId) ?? []
  );
  const [activeIndex, setActiveIndex] = useState<number>(
    () => Math.max(0, (studioHistories.get(studioId)?.length ?? 0) - 1)
  );

  const currentImage = images[activeIndex] as string | undefined;

  const addImage = useCallback((url: string) => {
    setImages((prev) => {
      const next = [...prev, url].slice(-MAX_HISTORY);
      studioHistories.set(studioId, next);
      setActiveIndex(next.length - 1);
      return next;
    });
  }, [studioId]);

  const selectImage = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const clearHistory = useCallback(() => {
    studioHistories.delete(studioId);
    setImages([]);
    setActiveIndex(0);
  }, [studioId]);

  return { images, currentImage, activeIndex, addImage, selectImage, clearHistory };
}
