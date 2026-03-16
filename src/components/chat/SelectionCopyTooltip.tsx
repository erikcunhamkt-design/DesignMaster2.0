import { useEffect, useState, useCallback, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  x: number;
  y: number;
}

type VisualState = 'hidden' | 'visible' | 'closing';

export function SelectionCopyTooltip({ containerRef }: { containerRef: React.RefObject<HTMLElement> }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [copied, setCopied] = useState(false);
  const [visualState, setVisualState] = useState<VisualState>('hidden');
  const savedTextRef = useRef<string>('');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    if (visualState === 'hidden') return;
    setVisualState('closing');
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setPosition(null);
      setCopied(false);
      setVisualState('hidden');
      savedTextRef.current = '';
    }, 200);
  }, [visualState]);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      dismiss();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Check that selection is inside a [data-assistant-message] element within our container
    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (!anchorNode || !focusNode) { dismiss(); return; }

    const anchorInside = container.contains(anchorNode);
    const focusInside = container.contains(focusNode);
    if (!anchorInside && !focusInside) { dismiss(); return; }

    // Check the range's common ancestor is within an assistant message
    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const assistantEl = (ancestor instanceof HTMLElement ? ancestor : ancestor.parentElement)?.closest('[data-assistant-message]');
    if (!assistantEl || !container.contains(assistantEl)) { dismiss(); return; }

    const text = selection.toString().trim();
    if (text.length < 2) { dismiss(); return; }

    // Save text immediately so click can use it
    savedTextRef.current = text;

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let x = rect.left + rect.width / 2 - containerRect.left;
    let y = rect.top - containerRect.top - 10;

    // Clamp horizontally
    x = Math.max(40, Math.min(x, containerRect.width - 40));

    // If not enough space above, show below
    if (y < 10) {
      y = rect.bottom - containerRect.top + 10;
    }

    clearTimeout(closeTimerRef.current);
    setCopied(false);
    setPosition({ x, y });
    setVisualState('visible');
  }, [containerRef, dismiss]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // Cleanup on unmount
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

  if (!position || visualState === 'hidden') return null;

  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.preventDefault()}
      onClick={handleCopy}
      className={`absolute z-50 flex items-center gap-1.5 rounded-lg border border-border/40 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-200 hover:bg-primary hover:text-primary-foreground ${
        visualState === 'visible' ? 'animate-scale-in opacity-100' : 'animate-scale-out opacity-0 pointer-events-none'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
    </button>
  );
}
