import { Plus, X, Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { ProjectConfig } from '@/types/project';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const ATTRIBUTE_OPTIONS = [
  { id: 'estilo', label: 'Estilo Visual' },
  { id: 'iluminacao', label: 'Iluminação' },
  { id: 'pose', label: 'Pose / Posição' },
  { id: 'cores', label: 'Paleta de Cores' },
  { id: 'composicao', label: 'Composição' },
  { id: 'textura', label: 'Textura / Material' },
] as const;

export type ReferenceAttribute = (typeof ATTRIBUTE_OPTIONS)[number]['id'];

export interface StyleReference {
  url: string;
  attributes: ReferenceAttribute[];
}

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function ReferencesSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<ReferenceAttribute[]>(['estilo']);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (config.styleReferences.length >= 4) return;

    const url = URL.createObjectURL(file);
    setPendingUrl(url);
    setSelectedAttrs(['estilo']);
    e.target.value = '';
  };

  const confirmReference = () => {
    if (!pendingUrl) return;
    // Store the URL in styleReferences (keeping backward compatibility)
    onUpdate({ styleReferences: [...config.styleReferences, pendingUrl] });
    // Store attributes in the referenceAttributes map
    const attrs = { ...(config.referenceAttributes || {}) };
    attrs[config.styleReferences.length] = selectedAttrs;
    onUpdate({ referenceAttributes: attrs });
    setPendingUrl(null);
  };

  const toggleAttr = (attr: ReferenceAttribute) => {
    setSelectedAttrs((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const removeRef = (index: number) => {
    const newRefs = config.styleReferences.filter((_, i) => i !== index);
    const attrs = { ...(config.referenceAttributes || {}) };
    delete attrs[index];
    // Re-index
    const reindexed: Record<number, ReferenceAttribute[]> = {};
    let newIdx = 0;
    for (let i = 0; i < config.styleReferences.length; i++) {
      if (i === index) continue;
      if (attrs[i]) reindexed[newIdx] = attrs[i] as ReferenceAttribute[];
      newIdx++;
    }
    onUpdate({ styleReferences: newRefs, referenceAttributes: reindexed });
  };

  const getAttrLabels = (index: number) => {
    const attrs = config.referenceAttributes?.[index] as ReferenceAttribute[] | undefined;
    if (!attrs || attrs.length === 0) return null;
    return attrs.map((a) => ATTRIBUTE_OPTIONS.find((o) => o.id === a)?.label || a);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {config.styleReferences.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.styleReferences.map((url, i) => (
            <div key={i} className="relative group">
              <div className="h-20 w-20 rounded-lg overflow-hidden border border-border">
                <img src={url} alt={`Referência ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeRef(i)}
                  className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
              {getAttrLabels(i) && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {getAttrLabels(i)!.map((label) => (
                    <span key={label} className="text-[8px] bg-primary/10 text-primary px-1 py-0.5 rounded">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {config.styleReferences.length < 4 && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">ADICIONAR REFERÊNCIA</span>
        </button>
      )}

      <p className="text-[9px] text-muted-foreground">
        {config.styleReferences.length}/4 referências adicionais de estilo
      </p>

      {/* Attribute selection dialog */}
      <Dialog open={!!pendingUrl} onOpenChange={(open) => !open && setPendingUrl(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">O que deseja usar desta referência?</DialogTitle>
          </DialogHeader>

          {pendingUrl && (
            <div className="flex gap-4">
              <img src={pendingUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                {ATTRIBUTE_OPTIONS.map((attr) => (
                  <label
                    key={attr.id}
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <Checkbox
                      checked={selectedAttrs.includes(attr.id)}
                      onCheckedChange={() => toggleAttr(attr.id)}
                    />
                    {attr.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPendingUrl(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={confirmReference}
              disabled={selectedAttrs.length === 0}
              className="gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
