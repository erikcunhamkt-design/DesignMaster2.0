import { useState, useRef } from 'react';
import { Upload, Loader2, Copy, Check, Wand2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  { id: 'estilo', label: 'Estilo' },
  { id: 'composição', label: 'Composição' },
  { id: 'paleta', label: 'Paleta de Cores' },
  { id: 'iluminação', label: 'Iluminação' },
  { id: 'tudo', label: 'Tudo' },
];

export default function ExtractorPage() {
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

    setIsExtracting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('extract-prompt', {
        body: {
          imageBase64,
          replicateOptions: selectedOptions,
          extraInstruction: extraInstruction || undefined,
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
      <div className="w-[400px] shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Extrator de Prompt</h2>
            <p className="text-[11px] text-muted-foreground">
              Envie uma imagem e receba um prompt detalhado para recriá-la.
            </p>
          </div>

          {/* Upload */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          {imagePreview ? (
            <div className="relative group">
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg border border-border object-cover max-h-[300px]" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              >
                <span className="text-xs font-medium text-foreground">Trocar imagem</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Upload className="h-8 w-8" />
              <span className="text-xs font-medium">Enviar Imagem</span>
            </button>
          )}

          {/* Replicate options */}
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
              O que deseja replicar?
            </p>
            <div className="flex flex-wrap gap-2">
              {REPLICATE_OPTIONS.map(opt => (
                <label key={opt.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <Checkbox
                    checked={selectedOptions.includes(opt.id)}
                    onCheckedChange={() => toggleOption(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Extra instruction */}
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
              Instrução extra (opcional)
            </p>
            <Input
              placeholder="Ex: trocar cenário para praia, mudar cor para azul..."
              value={extraInstruction}
              onChange={(e) => setExtraInstruction(e.target.value)}
              className="h-8 bg-muted border-none text-xs"
            />
          </div>

          {/* Extract button */}
          <Button
            onClick={handleExtract}
            disabled={!imageBase64 || isExtracting}
            className="w-full gap-2"
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
      <div className="flex-1 overflow-y-auto p-6">
        {!result && !isExtracting && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Wand2 className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Resultado aparecerá aqui</p>
            <p className="text-xs">Envie uma imagem e clique em "Extrair Prompt"</p>
          </div>
        )}

        {isExtracting && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-primary">Analisando imagem...</p>
          </div>
        )}

        {result && (
          <div className="max-w-2xl mx-auto space-y-5">
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
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Configurações Sugeridas</p>
              <div className="flex gap-3 text-xs">
                <span className="bg-muted px-2.5 py-1.5 rounded-lg">{result.suggested_settings.width} × {result.suggested_settings.height}</span>
                <span className="bg-muted px-2.5 py-1.5 rounded-lg">Qualidade: {result.suggested_settings.quality}</span>
              </div>
            </div>

            {/* Style Tags */}
            {result.suggested_settings.style_tags?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Tags de Estilo</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggested_settings.style_tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {result.notes?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Observações</p>
                <ul className="space-y-1">
                  {result.notes.map((note, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {note}</li>
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
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-6 gap-1 text-[10px]">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <div className="bg-muted rounded-lg p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}
