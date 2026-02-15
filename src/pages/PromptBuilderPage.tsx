import { useState } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Copy, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STYLE_CHIPS = ['Realista', 'Cinematic', 'Editorial', 'Minimalista', 'Neon', 'Vintage', 'Futurista', 'Cartoon'];
const CATEGORY_CHIPS = ['Moda', 'Gastronomia', 'Tech', 'Lifestyle', 'Fitness', 'Beleza', 'Corporativo', 'Produto'];

export default function PromptBuilderPage() {
  const [subject, setSubject] = useState('');
  const [environment, setEnvironment] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [extra, setExtra] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleChip = (chip: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(chip) ? list.filter(c => c !== chip) : [...list, chip]);
  };

  const handleGenerate = async () => {
    if (!subject) { toast.error('Descreva o sujeito principal'); return; }
    setIsLoading(true);
    setResult('');
    try {
      const { data, error } = await supabase.functions.invoke('prompt-ai', {
        body: {
          mode: 'build',
          subject,
          environment,
          styles: selectedStyles,
          categories: selectedCategories,
          extra,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data.prompt || '');
      toast.success('Prompt gerado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado!');
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Criador de Prompts" showApiKey={false} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Builder */}
        <div className="w-[440px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-1 font-display">Criador de Prompts</h2>
              <p className="text-xs text-muted-foreground">Monte seu prompt com assistência de IA.</p>
            </div>

            {/* Category */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Categoria</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_CHIPS.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleChip(c, selectedCategories, setSelectedCategories)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[10px] font-medium border transition-all duration-200',
                      selectedCategories.includes(c)
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20'
                    )}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Sujeito principal *</p>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: mulher jovem, produto cosmético..." className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            {/* Environment */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Ambiente / Cenário</p>
              <Input value={environment} onChange={e => setEnvironment(e.target.value)} placeholder="Ex: estúdio escuro, praia ao pôr do sol..." className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            {/* Styles */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Estilo visual</p>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_CHIPS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleChip(s, selectedStyles, setSelectedStyles)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[10px] font-medium border transition-all duration-200',
                      selectedStyles.includes(s)
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20'
                    )}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Extra */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Instruções extras</p>
              <Textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="Detalhes adicionais..." className="min-h-[80px] bg-secondary/40 border-border/15 text-xs rounded-lg resize-none" />
            </div>

            <Button onClick={handleGenerate} disabled={isLoading || !subject} className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-glow-md">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isLoading ? 'Gerando...' : 'Gerar Prompt'}
            </Button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          {!result && !isLoading && (
            <div className="text-center space-y-3 text-muted-foreground">
              <Wand2 className="h-14 w-14 mx-auto opacity-15" />
              <p className="text-sm font-semibold text-foreground/40">Prompt aparecerá aqui</p>
            </div>
          )}
          {isLoading && (
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Construindo prompt...</p>
            </div>
          )}
          {result && (
            <div className="max-w-2xl w-full space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Prompt Gerado</p>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5 text-[10px] rounded-lg">
                  {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <div className="bg-secondary/30 border border-border/15 rounded-xl p-5 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
