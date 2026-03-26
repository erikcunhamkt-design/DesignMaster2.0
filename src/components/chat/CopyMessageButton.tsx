import { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CopyMessageButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-end">
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground/50 hover:text-foreground transition-colors"
        title="Copiar"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
        className={cn("p-1.5 rounded-lg hover:bg-secondary/60 transition-colors", feedback === 'up' ? 'text-primary' : 'text-muted-foreground/50 hover:text-foreground')}
        title="Boa resposta"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
        className={cn("p-1.5 rounded-lg hover:bg-secondary/60 transition-colors", feedback === 'down' ? 'text-destructive' : 'text-muted-foreground/50 hover:text-foreground')}
        title="Resposta ruim"
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}
