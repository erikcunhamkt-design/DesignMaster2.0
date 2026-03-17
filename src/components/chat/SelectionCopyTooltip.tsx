import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Coords {
  x: number;
  y: number;
}

type VisualState = 'hidden' | 'visible' | 'closing';
type Placement = 'above' | 'below';

function getClosestAssistantMessage(node: Node | null, container: HTMLElement) {
  const element = node instanceof HTMLElement ? node : node?.parentElement;
  const assistantMessage = element?.closest('[data-assistant-message]');

  if (!assistantMessage || !(assistantMessage instanceof HTMLElement)) {
    return null;
  }

  return container.contains(assistantMessage) ? assistantMessage : null;
}

export function SelectionCopyTooltip({ containerRef }: { containerRef: React.RefObject<HTMLElement> }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [copied, setCopied] = useState(false);
  const [visualState, setVisualState] = useState<VisualState>('hidden');
  const [placement, setPlacement] = useState<Placement>('above');

  const visualStateRef = useRef<VisualState>('hidden');
  const savedTextRef = useRef('');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>();

  const dismiss = useCallback(() => {
    if (visualStateRef.current === 'hidden') return;

    visualStateRef.current = 'closing';
    setVisualState('closing');
    clearTimeout(closeTimerRef.current);

    closeTimerRef.current = setTimeout(() => {
      setCoords(null);
      setCopied(false);
      savedTextRef.current = '';
      visualStateRef.current = 'hidden';
      setVisualState('hidden');
    }, 200);
  }, []);

  const updateTooltipFromSelection = useCallback(() => {
    const selection = window.getSelection();
    const container = containerRef.current;

    if (!container || !selection || selection.rangeCount === 0) {
      dismiss();
      return;
    }

    const rawText = selection.toString();
    const text = rawText.trim();

    if (selection.isCollapsed || text.length < 2) {
      dismiss();
      return;
    }

    const anchorMessage = getClosestAssistantMessage(selection.anchorNode, container);
    const focusMessage = getClosestAssistantMessage(selection.focusNode, container);

    if (!anchorMessage || !focusMessage || anchorMessage !== focusMessage) {
      dismiss();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const rects = Array.from(range.getClientRects()).filter((clientRect) => clientRect.width > 0 || clientRect.height > 0);
    const fallbackRect = rects[0];
    const activeRect = rect.width > 0 || rect.height > 0 ? rect : fallbackRect;

    if (!activeRect) {
      dismiss();
      return;
    }

    savedTextRef.current = rawText.trim();

    const nextPlacement: Placement = activeRect.top > 64 ? 'above' : 'below';
    const nextX = Math.max(64, Math.min(activeRect.left + activeRect.width / 2, window.innerWidth - 64));
    const nextY = nextPlacement === 'above' ? activeRect.top - 12 : activeRect.bottom + 12;

    clearTimeout(closeTimerRef.current);
    setCopied(false);
    setPlacement(nextPlacement);
    setCoords({ x: nextX, y: nextY });
    visualStateRef.current = 'visible';
    setVisualState('visible');
  }, [containerRef, dismiss]);

  const scheduleSelectionCheck = useCallback(() => {
    cancelAnimationFrame(rafRef.current ?? 0);
    rafRef.current = window.requestAnimationFrame(() => {
      updateTooltipFromSelection();
    });
  }, [updateTooltipFromSelection]);

  useEffect(() => {
    document.addEventListener('selectionchange', scheduleSelectionCheck);
    document.addEventListener('mouseup', scheduleSelectionCheck);
    document.addEventListener('keyup', scheduleSelectionCheck);
    window.addEventListener('resize', scheduleSelectionCheck);
    window.addEventListener('scroll', scheduleSelectionCheck, true);

    return () => {
      document.removeEventListener('selectionchange', scheduleSelectionCheck);
      document.removeEventListener('mouseup', scheduleSelectionCheck);
      document.removeEventListener('keyup', scheduleSelectionCheck);
      window.removeEventListener('resize', scheduleSelectionCheck);
      window.removeEventListener('scroll', scheduleSelectionCheck, true);
      cancelAnimationFrame(rafRef.current ?? 0);
    };
  }, [scheduleSelectionCheck]);

  useEffect(() => {
    return () => {
      clearTimeout(closeTimerRef.current);
      cancelAnimationFrame(rafRef.current ?? 0);
    };
  }, []);

  const handleCopy = async () => {
    const text = savedTextRef.current;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copiado!');

      setTimeout(() => {
        window.getSelection()?.removeAllRanges();
        dismiss();
      }, 900);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  if (!coords || visualState === 'hidden') return null;

  return createPortal(
    <button
      onMouseDown={(event) => event.preventDefault()}
      onPointerDown={(event) => event.preventDefault()}
      onClick={handleCopy}
      className={`fixed z-[9999] flex items-center gap-1.5 rounded-lg border border-border/40 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-200 hover:bg-primary hover:text-primary-foreground ${
        visualState === 'visible' ? 'animate-scale-in opacity-100' : 'animate-scale-out opacity-0 pointer-events-none'
      }`}
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        transform: placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      }}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copiar
        </>
      )}
    </button>,
    document.body
  );
}
