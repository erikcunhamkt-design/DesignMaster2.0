import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Coords {
  x: number;
  y: number;
}

type VisualState = 'hidden' | 'visible' | 'closing';

export function SelectionCopyTooltip({ containerRef }: { containerRef: React.RefObject<HTMLElement> }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [copied, setCopied] = useState(false);
  const [visualState, setVisualState] = useState<VisualState>('hidden');
  const visualStateRef = useRef<VisualState>('hidden');
  const savedTextRef = useRef<string>('');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    if (visualStateRef.current === 'hidden') return;
    visualStateRef.current = 'closing';
    setVisualState('closing');
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setCoords(null);
      setCopied(false);
      visualStateRef.current = 'hidden';
      setVisualState('hidden');
      savedTextRef.current = '';
    }, 200);
  }, []);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      dismiss();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (!anchorNode || !focusNode) { dismiss(); return; }

    const anchorInside = container.contains(anchorNode);
    const focusInside = container.contains(focusNode);
    if (!anchorInside && !focusInside) { dismiss(); return; }

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const assistantEl = (ancestor instanceof HTMLElement ? ancestor : ancestor.parentElement)?.closest('[data-assistant-message]');
    if (!assistantEl || !container.contains(assistantEl)) { dismiss(); return; }

    const text = selection.toString().trim();
    if (text.length < 2) { dismiss(); return; }

    savedTextRef.current = text;

    // Use viewport coordinates for fixed positioning
    const rect = range.getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top - 10;

    // Clamp horizontally to viewport
    x = Math.max(60, Math.min(x, window.innerWidth - 60));

    // If not enough space above, show below
    if (y < 50) {
      y = rect.bottom + 10;
    }

    clearTimeout(closeTimerRef.current);
    setCopied(false);
    setCoords({ x, y });
    visualStateRef.current = 'visible';
    setVisualState('visible');
  }, [containerRef, dismiss]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

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
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.preventDefault()}
      onClick={handleCopy}
      className={`fixed z-[9999] flex items-center gap-1.5 rounded-lg border border-border/40 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-200 hover:bg-primary hover:text-primary-foreground ${
        visualState === 'visible' ? 'animate-scale-in opacity-100' : 'animate-scale-out opacity-0 pointer-events-none'
      }`}
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        transform: 'translate(-50%, -100%)',
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
