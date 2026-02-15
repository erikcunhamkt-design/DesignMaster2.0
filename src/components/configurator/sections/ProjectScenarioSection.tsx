import { Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
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
    <div className="space-y-2.5">
      <div>
        <VoiceTextField
          placeholder="Nicho (Ex: Trader de Elite)"
          value={config.niche}
          onChange={(v) => onUpdate({ niche: v })}
          className="h-7 bg-secondary/30 border-border/20 text-[10px] mb-2"
        />
        <div className="flex flex-wrap gap-1">
          {niches.map((n) => (
            <button
              key={n}
              onClick={() => onUpdate({ niche: n })}
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-medium transition-all duration-150 border',
                config.niche === n
                  ? 'bg-primary/12 text-primary border-primary/25'
                  : 'bg-secondary/30 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <VoiceTextField
        placeholder="Ambiente (Ex: Escritório Moderno)"
        value={config.environment}
        onChange={(v) => onUpdate({ environment: v })}
        className="h-7 bg-secondary/30 border-border/20 text-[10px]"
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/70">Fotos de cenário</span>
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
            <div className="flex flex-wrap gap-1.5">
              {config.sceneryPhotos.map((url, i) => (
                <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/30 group">
                  <img src={url} alt={`Cenário ${i + 1}`} className="h-full w-full object-cover" />
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
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Upload Cenário</span>
          </button>
        </>
      )}
    </div>
  );
}
