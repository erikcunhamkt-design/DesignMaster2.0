import { Plus, X, AlignLeft, AlignCenter, AlignRight, User } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { ProjectConfig } from '@/types/project';
import { createNormalizedObjectUrl } from '@/lib/imageUtils';

const POSES = [
  { id: 'bracos_cruzados', label: 'Braços cruzados', emoji: '💪' },
  { id: 'maos_bolso',      label: 'Mãos no bolso',   emoji: '🧍' },
  { id: 'pose_heroica',    label: 'Pose heroica',     emoji: '🦸' },
  { id: 'sentado',         label: 'Sentado',          emoji: '🪑' },
  { id: 'andando',         label: 'Andando',          emoji: '🚶' },
  { id: 'apoiado',         label: 'Apoiado',          emoji: '🧱' },
  { id: 'apontando',       label: 'Apontando',        emoji: '👉' },
  { id: 'de_costas',       label: 'De costas',        emoji: '🔄' },
];

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function SubjectSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [poseCustomEnabled, setPoseCustomEnabled] = useState(false);
  const positions = [
    { id: 'esquerda' as const, label: 'Esq', icon: AlignLeft },
    { id: 'centro' as const, label: 'Centro', icon: AlignCenter },
    { id: 'direita' as const, label: 'Dir', icon: AlignRight },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - config.subjectPhotos.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    e.target.value = '';
    try {
      const newUrls = await Promise.all(selected.map(f => createNormalizedObjectUrl(f)));
      onUpdate({ subjectPhotos: [...config.subjectPhotos, ...newUrls] });
    } catch (err) {
      console.error('Erro ao processar foto:', err);
    }
  };

  const removePhoto = (index: number) => {
    const updated = config.subjectPhotos.filter((_, i) => i !== index);
    onUpdate({ subjectPhotos: updated });
  };

  const selectPose = (poseLabel: string) => {
    const current = config.poseDescription || '';
    const customParts = current
      .split(',')
      .map(p => p.trim())
      .filter(p => p && !POSES.map(po => po.label).includes(p));
    const alreadySelected = current.split(',').map(p => p.trim()).includes(poseLabel);
    const newPoses = alreadySelected
      ? [...customParts]
      : [poseLabel, ...customParts];
    onUpdate({ poseDescription: newPoses.join(', ') });
  };

  const isSelected = (poseLabel: string) => {
    return (config.poseDescription || '').split(',').map(p => p.trim()).includes(poseLabel);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.avif,.webp,.bmp,.tiff,.tif,.svg"
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

        {config.subjectPhotos.length < 5 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Upload</span>
          </button>
        )}
        <p className="text-[8px] text-muted-foreground/40">
          {config.subjectPhotos.length}/5 fotos · JPG, PNG, WEBP, HEIC, AVIF, BMP, TIFF
        </p>
      </div>

      {/* Gender row */}
      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">Gênero</p>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { id: 'masculino', label: 'Masculino' },
            { id: 'feminino',  label: 'Feminino' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onUpdate({ gender: id })}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-xl py-2 px-1 transition-all duration-150 border overflow-hidden',
                config.gender === id
                  ? 'bg-primary/15 border-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.15)]'
                  : 'bg-secondary/30 border-transparent hover:border-border/30 hover:bg-secondary/50'
              )}
            >
              <div className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center border-2',
                config.gender === id ? 'border-primary/40 bg-primary/10' : 'border-border/20 bg-secondary/40'
              )}>
                <User className={cn('h-6 w-6', config.gender === id ? 'text-primary' : 'text-muted-foreground/50')} />
              </div>
              <span className={cn(
                'text-[9px] font-semibold tracking-wide uppercase',
                config.gender === id ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pose grid — text chips with emoji */}
      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-2 tracking-wide">
          Pose
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          {POSES.map((pose) => (
            <button
              key={pose.id}
              onClick={() => selectPose(pose.label)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-left border transition-all duration-200',
                isSelected(pose.label)
                  ? 'bg-primary/15 border-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.15)]'
                  : 'bg-secondary/20 border-border/15 hover:border-primary/20 hover:bg-primary/5'
              )}
            >
              <span className="text-sm">{pose.emoji}</span>
              <span className={cn(
                'text-[10px] font-medium',
                isSelected(pose.label) ? 'text-primary' : 'text-muted-foreground/70'
              )}>
                {pose.label}
              </span>
            </button>
          ))}
        </div>

        {/* Custom pose text */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Pose avançada
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !poseCustomEnabled;
                setPoseCustomEnabled(next);
                if (!next) {
                  const presetPoses = (config.poseDescription || '')
                    .split(',').map(p => p.trim())
                    .filter(p => POSES.map(po => po.label).includes(p));
                  onUpdate({ poseDescription: presetPoses.join(', ') });
                }
              }}
              className={cn(
                'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors duration-200',
                poseCustomEnabled ? 'bg-primary border-primary/60' : 'bg-secondary/60 border-border/30'
              )}
            >
              <span className={cn(
                'inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200',
                poseCustomEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
              )} />
            </button>
          </div>
          {poseCustomEnabled && (
            <VoiceTextField
              textarea
              placeholder="Pose personalizada ou detalhes de roupa..."
              value={
                (config.poseDescription || '')
                  .split(',')
                  .map(p => p.trim())
                  .filter(p => !POSES.map(po => po.label).includes(p))
                  .join(', ')
              }
              onChange={(v) => {
                const presetPoses = (config.poseDescription || '')
                  .split(',')
                  .map(p => p.trim())
                  .filter(p => POSES.map(po => po.label).includes(p));
                const customParts = v.split(',').map(p => p.trim()).filter(Boolean);
                const allPoses = [...presetPoses, ...customParts].filter(Boolean);
                onUpdate({ poseDescription: allPoses.join(', ') });
              }}
              className="min-h-[40px] resize-none bg-secondary/30 border-border/20 text-[11px]"
            />
          )}
        </div>
      </div>

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
