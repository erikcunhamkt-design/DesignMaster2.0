import { Plus, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { ProjectConfig } from '@/types/project';
import genderFemale from '@/assets/gender-female.png';
import genderMale from '@/assets/gender-male.png';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const POSES = [
  { id: 'bracos_cruzados', label: 'Braços cruzados', emoji: '🤞' },
  { id: 'maos_bolso', label: 'Mãos no bolso', emoji: '🧍' },
  { id: 'pose_heroica', label: 'Pose heroica', emoji: '🦸' },
  { id: 'sentado', label: 'Sentado', emoji: '🪑' },
  { id: 'andando', label: 'Andando', emoji: '🚶' },
  { id: 'apoiado', label: 'Apoiado', emoji: '🧱' },
  { id: 'apontando', label: 'Apontando', emoji: '👉' },
  { id: 'de_costas', label: 'De costas', emoji: '🔄' },
];

export function SubjectSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const selectedGenderAvatar = config.gender === 'masculino' ? genderMale : genderFemale;
  const selectedGenderName = config.gender === 'masculino' ? 'Homer' : 'Marge';

  const togglePose = (poseLabel: string) => {
    const current = config.poseDescription || '';
    // Check if already selected (exact match in comma-separated list)
    const poses = current.split(',').map(p => p.trim()).filter(Boolean);
    const idx = poses.indexOf(poseLabel);
    if (idx >= 0) {
      poses.splice(idx, 1);
    } else {
      poses.push(poseLabel);
    }
    onUpdate({ poseDescription: poses.join(', ') });
  };

  const isSelected = (poseLabel: string) => {
    const poses = (config.poseDescription || '').split(',').map(p => p.trim());
    return poses.includes(poseLabel);
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

      {/* Gender row — full width */}
      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1.5 tracking-wide">Gênero</p>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { id: 'masculino', label: 'Masculino', img: genderMale },
            { id: 'feminino',  label: 'Feminino',  img: genderFemale },
          ] as const).map(({ id, label, img }) => (
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
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border/20">
                <img
                  src={img}
                  alt={label}
                  className="h-full w-full object-cover object-top"
                />
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

      {/* Pose selector */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 tracking-wide flex-1">
            Pose — como o {selectedGenderName} vai aparecer
          </p>
          <div className="h-6 w-6 rounded-full overflow-hidden border border-border/20 shrink-0">
            <img
              src={selectedGenderAvatar}
              alt={selectedGenderName}
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {POSES.map((pose) => (
            <button
              key={pose.id}
              onClick={() => togglePose(pose.label)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] font-medium transition-all duration-150 border text-left',
                isSelected(pose.label)
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary/20 border-border/10 text-muted-foreground hover:bg-secondary/40 hover:border-border/25 hover:text-foreground'
              )}
            >
              <span className="text-[11px] shrink-0">{pose.emoji}</span>
              <span className="leading-tight">{pose.label}</span>
            </button>
          ))}
        </div>

        {/* Custom pose text */}
        <div className="mt-1.5">
          <VoiceTextField
            textarea
            placeholder="Pose personalizada ou detalhes de roupa..."
            value={
              // Show only non-preset parts in the text field
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
