import { useEffect, useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  x: number;
  y: number;
}

export function SelectionCopyTooltip({ containerRef }: { containerRef: React.RefObject<HTMLElement> }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setPosition(null);
      setCopied(false);
      return;
    }

    // Only show if selection is inside our container
    const container = containerRef.current;
    if (!container) return;

    const anchorNode = selection.anchorNode;
    if (!anchorNode || !container.contains(anchorNode)) {
      setPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPosition({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 8,
    });
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const handleCopy = async () => {
    const selection = window.getSelection();
    if (!selection) return;
    
    try {
      await navigator.clipboard.writeText(selection.toString());
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => {
        setCopied(false);
        setPosition(null);
        selection.removeAllRanges();
      }, 1200);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  if (!position) return null;

  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleCopy}
      className="absolute z-50 flex items-center gap-1.5 rounded-lg border border-border/40 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-150 hover:bg-primary hover:text-primary-foreground animate-fade-up"
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
