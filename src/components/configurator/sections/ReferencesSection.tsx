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
import { VoiceTextField } from '@/components/ui/VoiceTextField';

const SUGGESTION_CHIPS = [
  { label: 'Estilo visual', template: 'Quero aproveitar o estilo visual: ' },
  { label: 'Iluminação', template: 'Quero aproveitar a iluminação: ' },
  { label: 'Paleta de cores', template: 'Quero aproveitar a paleta de cores: ' },
  { label: 'Composição', template: 'Quero aproveitar a composição: ' },
  { label: 'Textura/material', template: 'Quero aproveitar a textura/material: ' },
  { label: 'Pose/posição', template: 'Quero aproveitar a pose/posição: ' },
];

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function ReferencesSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (config.styleReferences.length >= 4) return;
    const url = URL.createObjectURL(file);
    setPendingUrl(url);
    setNoteText('');
    e.target.value = '';
  };

  const confirmReference = () => {
    if (!pendingUrl) return;
    const newIndex = config.styleReferences.length;
    const notes = { ...(config.referenceNotes || {}) };
    notes[newIndex] = noteText;
    // Keep referenceAttributes for backward compat (empty for new refs)
    const attrs = { ...(config.referenceAttributes || {}) };
    attrs[newIndex] = [];
    onUpdate({
      styleReferences: [...config.styleReferences, pendingUrl],
      referenceAttributes: attrs,
      referenceNotes: notes,
    });
    setPendingUrl(null);
  };

  const removeRef = (index: number) => {
    const newRefs = config.styleReferences.filter((_, i) => i !== index);
    const attrs = { ...(config.referenceAttributes || {}) };
    const notes = { ...(config.referenceNotes || {}) };
    delete attrs[index];
    delete notes[index];
    // Re-index
    const reindexedAttrs: Record<number, string[]> = {};
    const reindexedNotes: Record<number, string> = {};
    let newIdx = 0;
    for (let i = 0; i < config.styleReferences.length; i++) {
      if (i === index) continue;
      if (attrs[i]) reindexedAttrs[newIdx] = attrs[i] as string[];
      if (notes[i]) reindexedNotes[newIdx] = notes[i];
      newIdx++;
    }
    onUpdate({
      styleReferences: newRefs,
      referenceAttributes: reindexedAttrs,
      referenceNotes: reindexedNotes,
    });
  };

  const getNotePreview = (index: number) => {
    const note = config.referenceNotes?.[index];
    if (note) return note;
    // Fallback: show old attribute labels
    const attrs = config.referenceAttributes?.[index] as string[] | undefined;
    if (attrs && attrs.length > 0) return attrs.join(', ');
    return null;
  };

  const insertChip = (template: string) => {
    setNoteText((prev) => (prev ? `${prev}\n${template}` : template));
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
              {getNotePreview(i) && (
                <p className="mt-1 max-w-[80px] text-[8px] text-muted-foreground truncate" title={getNotePreview(i)!}>
                  {getNotePreview(i)}
                </p>
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

      {/* Brief dialog */}
      <Dialog open={!!pendingUrl} onOpenChange={(open) => !open && setPendingUrl(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">O que você quer aproveitar desta referência?</DialogTitle>
          </DialogHeader>

          {pendingUrl && (
            <div className="flex gap-4">
              <img src={pendingUrl} alt="Preview" className="h-28 w-28 rounded-lg object-cover border border-border shrink-0" />
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <VoiceTextField
                  textarea
                  rows={4}
                  placeholder={"Ex: Quero a mesma iluminação neon azul e a composição com o sujeito à esquerda.\nDescreva livremente o que quer aproveitar..."}
                  value={noteText}
                  onChange={setNoteText}
                  className="bg-muted border-none text-xs resize-none"
                />
                <div className="flex flex-wrap gap-1">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => insertChip(chip.template)}
                      className="text-[9px] px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
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
