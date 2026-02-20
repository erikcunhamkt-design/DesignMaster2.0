import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, Wand2, RotateCcw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RefinementChatProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onRefine: (prompt: string, currentImage: string) => Promise<void>;
  isRefining: boolean;
}

const QUICK_REFINEMENTS = [
  'Deixe o fundo mais escuro',
  'Adicione mais iluminação dramática',
  'Mude a expressão para sorrindo',
  'Torne as cores mais vibrantes',
  'Adicione partículas de luz ao fundo',
  'Mude para fundo totalmente preto',
  'Aumente o contraste da imagem',
  'Adicione um blur suave no fundo',
];

export function RefinementChat({ open, onClose, imageUrl, onRefine, isRefining }: RefinementChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([{
        role: 'assistant',
        content: 'O que você quer mudar nesta imagem? Descreva as alterações que deseja e vou refinar para você.',
      }]);
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt || isRefining) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);

    try {
      await onRefine(prompt, imageUrl);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Refinamento aplicado! Veja o resultado no painel. Quer mais algum ajuste?',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ops, ocorreu um erro ao refinar. Tente novamente.',
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-20 transition-all duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 z-30 flex flex-col',
        'bg-background/95 backdrop-blur-xl border-t border-border/15',
        'shadow-[0_-8px_40px_rgba(0,0,0,0.4)]',
        'transition-all duration-400 ease-out',
        open ? 'translate-y-0' : 'translate-y-full'
      )}
        style={{ maxHeight: '65%' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-foreground">Refinar Imagem</p>
              <p className="text-[9px] text-muted-foreground/40 mt-0.5">Descreva o que quer mudar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-2.5 animate-fade-in',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-0.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
              )}
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary/15 text-foreground rounded-tr-sm'
                  : 'bg-secondary/40 text-foreground/80 rounded-tl-sm'
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {isRefining && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-0.5">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              </div>
              <div className="bg-secondary/40 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[11px] text-muted-foreground/60">
                <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" />
                Refinando imagem…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick refinements */}
        {messages.length <= 1 && !isRefining && (
          <div className="px-5 pb-2 shrink-0">
            <p className="text-[8px] font-semibold text-muted-foreground/30 uppercase tracking-widest mb-2">Sugestões rápidas</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REFINEMENTS.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={isRefining}
                  className="flex items-center gap-1 rounded-full border border-border/20 bg-secondary/30 px-2.5 py-1 text-[9px] text-muted-foreground/60 hover:text-foreground hover:border-primary/30 hover:bg-primary/8 transition-all duration-200 disabled:opacity-40"
                >
                  <ChevronRight className="h-2.5 w-2.5" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2.5 px-5 py-3.5 border-t border-border/10 shrink-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Deixe o fundo mais escuro, adicione luzes neon…"
            rows={1}
            disabled={isRefining}
            className={cn(
              'flex-1 resize-none rounded-xl border border-border/20 bg-secondary/30 px-3.5 py-2.5',
              'text-[11px] placeholder:text-muted-foreground/30 text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30',
              'transition-all duration-200 disabled:opacity-50',
              'min-h-[38px] max-h-[100px]'
            )}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isRefining}
            className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-sm hover:shadow-glow-md disabled:opacity-30 transition-all duration-200"
          >
            {isRefining ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
