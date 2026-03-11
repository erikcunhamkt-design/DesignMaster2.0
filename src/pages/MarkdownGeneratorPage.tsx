import { useState } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { toast } from 'sonner';

export default function MarkdownGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [variations, setVariations] = useState(3);
  const [extra, setExtra] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { apiKey } = useGoogleApiKey();

  const handleGenerate = async () => {
    if (!topic) { toast.error('Informe o tema'); return; }
    setIsLoading(true);
    setResult('');
    try {
      const { data, error } = await supabase.functions.invoke('prompt-ai', {
        body: { mode: 'markdown', topic, variations, extra, googleApiKey: apiKey },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data.prompt || '');
      toast.success('Prompts gerados!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar');
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
      <StudioTopbar title="Estúdio Markdown" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[400px] shrink-0 border-r border-border/15 bg-card/20 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-1 font-display">Gerador de Prompts</h2>
              <p className="text-xs text-muted-foreground">Gere prompts formatados em Markdown com variações.</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Tema / Conceito *</p>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: retrato editorial feminino, produto tech..." className="h-9 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Variações</p>
              <Input type="number" min={1} max={10} value={variations} onChange={e => setVariations(Number(e.target.value))} className="h-9 w-24 bg-secondary/40 border-border/15 text-xs rounded-lg" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Instruções extras</p>
              <Textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="Detalhes opcionais..." className="min-h-[60px] bg-secondary/40 border-border/15 text-xs rounded-lg resize-none" />
            </div>

            <Button onClick={handleGenerate} disabled={isLoading || !topic || apiKey.length < 10} className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent shadow-glow-md">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isLoading ? 'Gerando...' : 'Gerar Markdown'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          {!result && !isLoading && (
            <div className="text-center space-y-3">
              <FileText className="h-14 w-14 mx-auto text-muted-foreground/15" />
              <p className="text-sm font-semibold text-foreground/40">Markdown aparecerá aqui</p>
            </div>
          )}
          {isLoading && (
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Gerando variações...</p>
            </div>
          )}
          {result && (
            <div className="max-w-3xl w-full space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Resultado</p>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5 text-[10px] rounded-lg">
                  {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <pre className="bg-secondary/30 border border-border/15 rounded-xl p-5 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-[70vh]">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
