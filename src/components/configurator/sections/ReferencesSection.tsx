import { Plus, X, Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { ProjectConfig } from '@/types/project';
import { createNormalizedObjectUrl } from '@/lib/imageUtils';
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
    const remaining = 5 - config.styleReferences.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    // Process one at a time to show note dialog for first new one
    const url = URL.createObjectURL(selected[0]);
    // Add remaining files directly (skip note dialog for batch)
    const extraUrls = selected.slice(1).map(f => URL.createObjectURL(f));
    if (extraUrls.length > 0) {
      const newRefs = [...config.styleReferences, ...extraUrls];
      const attrs = { ...(config.referenceAttributes || {}) };
      const notes = { ...(config.referenceNotes || {}) };
      extraUrls.forEach((_, i) => {
        const idx = config.styleReferences.length + i;
        attrs[idx] = [];
        notes[idx] = '';
      });
      onUpdate({ styleReferences: newRefs, referenceAttributes: attrs, referenceNotes: notes });
    }
    setPendingUrl(url);
    setNoteText('');
    e.target.value = '';
  };

  const confirmReference = () => {
    if (!pendingUrl) return;
    const newIndex = config.styleReferences.length;
    const notes = { ...(config.referenceNotes || {}) };
    notes[newIndex] = noteText;
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
        accept="image/*,.heic,.heif,.avif,.webp,.bmp,.tiff,.tif,.svg"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {config.styleReferences.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {config.styleReferences.map((url, i) => (
            <div key={i} className="relative group">
              <div className="h-16 w-16 rounded-lg overflow-hidden border border-border/25">
                <img src={url} alt={`Ref ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeRef(i)}
                  className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
              {getNotePreview(i) && (
                <p className="mt-0.5 max-w-[64px] text-[7px] text-muted-foreground/50 truncate" title={getNotePreview(i)!}>
                  {getNotePreview(i)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {config.styleReferences.length < 5 && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all duration-200"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Referência</span>
        </button>
      )}

      <p className="text-[8px] text-muted-foreground/40">
        {config.styleReferences.length}/5 referências · JPG, PNG, WEBP, HEIC, AVIF, BMP, TIFF, SVG
      </p>

      <Dialog open={!!pendingUrl} onOpenChange={(open) => !open && setPendingUrl(null)}>
        <DialogContent className="sm:max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-display">O que aproveitar desta referência?</DialogTitle>
          </DialogHeader>

          {pendingUrl && (
            <div className="flex gap-4">
              <img src={pendingUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border/30 shrink-0" />
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                <VoiceTextField
                  textarea
                  rows={3}
                  placeholder="Descreva o que quer aproveitar..."
                  value={noteText}
                  onChange={setNoteText}
                  className="bg-secondary/30 border-border/20 text-[10px] resize-none"
                />
                <div className="flex flex-wrap gap-1">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => insertChip(chip.template)}
                      className="text-[8px] px-2 py-0.5 rounded-full bg-primary/8 text-primary/70 hover:bg-primary/15 transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPendingUrl(null)} className="text-[10px]">
              Cancelar
            </Button>
            <Button size="sm" onClick={confirmReference} className="gap-1 text-[10px]">
              <Check className="h-3 w-3" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
