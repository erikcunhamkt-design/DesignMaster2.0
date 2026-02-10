import { Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function ReferencesSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      if (config.styleReferences.length + newUrls.length < 4) {
        newUrls.push(URL.createObjectURL(file));
      }
    });
    onUpdate({ styleReferences: [...config.styleReferences, ...newUrls] });
    e.target.value = '';
  };

  const removeRef = (index: number) => {
    onUpdate({ styleReferences: config.styleReferences.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {config.styleReferences.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.styleReferences.map((url, i) => (
            <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border group">
              <img src={url} alt={`Referência ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removeRef(i)}
                className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
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
    </div>
  );
}
