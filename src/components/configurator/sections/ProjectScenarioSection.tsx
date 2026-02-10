import { Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const niches = [
  'Futebol', 'Social Media', 'Rap', 'Trap', 'Gamer', 'E-commerce',
  'Igreja', 'Fitness', 'Advocacia', 'Estética', 'SaaS', 'Moda',
  'Música', 'Outros',
];

export function ProjectScenarioSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      newUrls.push(URL.createObjectURL(file));
    });
    onUpdate({ sceneryPhotos: [...config.sceneryPhotos, ...newUrls] });
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    onUpdate({ sceneryPhotos: config.sceneryPhotos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Nicho / Projeto</p>
        <Input
          placeholder="Ex: Trader de Elite"
          value={config.niche}
          onChange={(e) => onUpdate({ niche: e.target.value })}
          className="h-8 bg-muted border-none text-xs mb-2"
        />
        <div className="flex flex-wrap gap-1">
          {niches.map((n) => (
            <button
              key={n}
              onClick={() => onUpdate({ niche: n })}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
                config.niche === n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="Ambiente (Ex: Escritório Moderno)"
        value={config.environment}
        onChange={(e) => onUpdate({ environment: e.target.value })}
        className="h-8 bg-muted border-none text-xs"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Usar fotos de cenário?</span>
        <Switch
          checked={config.sceneryPhotosEnabled}
          onCheckedChange={(v) => onUpdate({ sceneryPhotosEnabled: v })}
        />
      </div>

      {config.sceneryPhotosEnabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {config.sceneryPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.sceneryPhotos.map((url, i) => (
                <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt={`Cenário ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs font-medium">UPLOAD CENÁRIO</span>
          </button>
        </>
      )}
    </div>
  );
}
