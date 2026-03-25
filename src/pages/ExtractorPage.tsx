import { useState, useRef } from 'react';
import { Upload, Loader2, Copy, Check, Wand2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';

interface ExtractedResult {
  prompt: string;
  negative_prompt: string;
  suggested_settings: {
    width: number;
    height: number;
    quality: string;
    style_tags: string[];
  };
  notes: string[];
}

const REPLICATE_OPTIONS = [
  { id: 'tudo', label: 'Tudo' },
  { id: 'personagem', label: 'Personagem' },
  { id: 'background', label: 'Background' },
  { id: 'estilo', label: 'Estilo' },
  { id: 'iluminação', label: 'Iluminação' },
  { id: 'composição', label: 'Composição' },
  { id: 'paleta', label: 'Paleta de Cores' },
  { id: 'texturas', label: 'Texturas' },
  { id: 'camera', label: 'Câmera / Ângulo' },
  { id: 'mood', label: 'Mood / Atmosfera' },
  { id: 'objetos', label: 'Objetos / Props' },
  { id: 'tipografia', label: 'Tipografia' },
];

export default function ExtractorPage() {
  const { apiKey } = useGoogleApiKey();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ExtractedResult | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['tudo']);
  const [extraInstruction, setExtraInstruction] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleOption = (id: string) => {
    if (id === 'tudo') {
      setSelectedOptions(['tudo']);
      return;
    }
    setSelectedOptions(prev => {
      const without = prev.filter(o => o !== 'tudo' && o !== id);
      if (prev.includes(id)) return without.length ? without : ['tudo'];
      return [...without, id];
    });
  };

  const handleExtract = async () => {
    if (!imageBase64) return;
    if (!apiKey || apiKey.length < 10) {
      toast.error('Configure sua API Key do Google primeiro (botão API no topo).');
      return;
    }
    setIsExtracting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('extract-prompt', {
        body: {
          imageBase64,
          replicateOptions: selectedOptions,
          extraInstruction: extraInstruction || undefined,
          googleApiKey: apiKey,
        },
      });

      if (error) throw new Error(error.message || 'Erro na extração');
      if (data?.error) throw new Error(data.error);

      setResult(data);
      toast.success('Prompt extraído com sucesso!');
    } catch (err: any) {
      console.error('Extract error:', err);
      toast.error(err.message || 'Erro ao extrair prompt');
    } finally {
      setIsExtracting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copiado!');
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Upload & Options */}
      <div className="w-[420px] shrink-0 border-r border-border/15 bg-card/30 flex flex-col overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground mb-1.5 font-display">Extrator de Prompt</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Envie uma imagem e receba um prompt detalhado para recriá-la.
            </p>
          </div>

          {/* Upload */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          {imagePreview ? (
            <div className="relative group rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full rounded-xl border border-border/15 object-cover max-h-[300px]" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
              >
                <span className="text-xs font-semibold text-foreground bg-secondary/80 px-3 py-1.5 rounded-lg">Trocar imagem</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-52 w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/30 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-300"
            >
              <Upload className="h-8 w-8" />
              <span className="text-xs font-semibold">Enviar Imagem</span>
            </button>
          )}

          {/* Replicate options */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">
              O que deseja extrair?
            </p>
            <div className="flex flex-wrap gap-2">
              {REPLICATE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                    selectedOptions.includes(opt.id)
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-secondary/40 border-border/20 text-muted-foreground hover:border-primary/30 hover:text-foreground/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Input
                placeholder="Ou descreva o que quer extrair: ex. 'só o rosto do personagem', 'a paleta neon do fundo'..."
                value={extraInstruction}
                onChange={(e) => setExtraInstruction(e.target.value)}
                className="h-9 bg-secondary/50 border-border/20 text-xs rounded-lg focus:border-primary/40"
              />
            </div>
          </div>

          {/* Extract button */}
          <Button
            onClick={handleExtract}
            disabled={!imageBase64 || isExtracting}
            className="w-full h-11 gap-2.5 rounded-xl font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-glow-md transition-all duration-500"
          >
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isExtracting ? 'Extraindo...' : 'Extrair Prompt'}
          </Button>
        </div>
      </div>

      {/* Right: Results */}
      <div className="flex-1 overflow-y-auto p-8">
        {!result && !isExtracting && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <Wand2 className="h-14 w-14 opacity-20" />
            <p className="text-sm font-semibold text-foreground/50">Resultado aparecerá aqui</p>
            <p className="text-xs text-muted-foreground/50">Envie uma imagem e clique em "Extrair Prompt"</p>
          </div>
        )}

        {isExtracting && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-semibold text-primary">Analisando imagem...</p>
          </div>
        )}

        {result && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Prompt */}
            <FieldBlock
              label="Prompt"
              value={result.prompt}
              copied={copiedField === 'prompt'}
              onCopy={() => copyToClipboard(result.prompt, 'prompt')}
            />

            {/* Negative Prompt */}
            <FieldBlock
              label="Negative Prompt"
              value={result.negative_prompt}
              copied={copiedField === 'negative'}
              onCopy={() => copyToClipboard(result.negative_prompt, 'negative')}
            />

            {/* Settings */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2.5">Configurações Sugeridas</p>
              <div className="flex gap-3 text-xs">
                <span className="bg-secondary/60 px-3 py-2 rounded-lg border border-border/15 text-foreground/70">{result.suggested_settings.width} × {result.suggested_settings.height}</span>
                <span className="bg-secondary/60 px-3 py-2 rounded-lg border border-border/15 text-foreground/70">Qualidade: {result.suggested_settings.quality}</span>
              </div>
            </div>

            {/* Style Tags */}
            {result.suggested_settings.style_tags?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2.5">Tags de Estilo</p>
                <div className="flex flex-wrap gap-2">
                  {result.suggested_settings.style_tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] rounded-md border-border/20">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {result.notes?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2.5">Observações</p>
                <ul className="space-y-1.5">
                  {result.notes.map((note, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldBlock({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">{label}</p>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-7 gap-1.5 text-[10px] rounded-lg hover:bg-secondary/60">
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <div className="bg-secondary/40 border border-border/15 rounded-xl p-4 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}
