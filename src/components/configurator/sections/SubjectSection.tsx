import { Plus, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function SubjectSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quantities = [1, 2, 3, 4, 5];
  const positions = [
    { id: 'esquerda' as const, label: 'Esq', icon: AlignLeft },
    { id: 'centro' as const, label: 'Centro', icon: AlignCenter },
    { id: 'direita' as const, label: 'Dir', icon: AlignRight },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    });
    onUpdate({ subjectPhotos: [...config.subjectPhotos, ...newUrls] });
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const updated = config.subjectPhotos.filter((_, i) => i !== index);
    onUpdate({ subjectPhotos: updated });
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Photos */}
      <div>
        {config.subjectPhotos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {config.subjectPhotos.map((url, i) => (
              <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/30 group">
                <img src={url} alt={`Sujeito ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Upload</span>
        </button>
      </div>

      {/* Quantity + Gender row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">Qtd</p>
          <div className="flex gap-1">
            {quantities.map((q) => (
              <button
                key={q}
                onClick={() => onUpdate({ quantity: q })}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-medium transition-all duration-150',
                  config.quantity === q
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">Gênero</p>
          <div className="flex gap-1">
            {(['masculino', 'feminino'] as const).map((g) => (
              <button
                key={g}
                onClick={() => onUpdate({ gender: g })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[10px] font-medium capitalize transition-all duration-150 border',
                  config.gender === g
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                {g === 'masculino' ? 'M' : 'F'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <VoiceTextField
        textarea
        placeholder="Descrição da pose ou roupa..."
        value={config.poseDescription}
        onChange={(v) => onUpdate({ poseDescription: v })}
        className="min-h-[52px] resize-none bg-secondary/30 border-border/20 text-[11px]"
      />

      {/* Position */}
      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">Posição</p>
        <div className="grid grid-cols-3 gap-1">
          {positions.map((pos) => (
            <button
              key={pos.id}
              onClick={() => onUpdate({ subjectPosition: pos.id })}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md py-2 text-[9px] font-medium transition-all duration-150 border',
                config.subjectPosition === pos.id
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground hover:text-foreground border-transparent'
              )}
            >
              <pos.icon className="h-3 w-3" />
              {pos.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
