import { Plus, X, AlignLeft, AlignCenter, AlignRight, Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { ProjectConfig } from '@/types/project';
import genderFemale from '@/assets/gender-female.png';
import genderMale from '@/assets/gender-male.png';

// Homer poses
import homerBracosCruzados from '@/assets/poses/homer-bracos-cruzados.png';
import homerMaosBolso from '@/assets/poses/homer-maos-bolso.png';
import homerPoseHeroica from '@/assets/poses/homer-pose-heroica.png';
import homerSentado from '@/assets/poses/homer-sentado.png';
import homerAndando from '@/assets/poses/homer-andando.png';
import homerApoiado from '@/assets/poses/homer-apoiado.png';
import homerApontando from '@/assets/poses/homer-apontando.png';
import homerDeCostas from '@/assets/poses/homer-de-costas.png';

// Marge poses
import margeBracosCruzados from '@/assets/poses/marge-bracos-cruzados.png';
import margeMaosBolso from '@/assets/poses/marge-maos-bolso.png';
import margePoseHeroica from '@/assets/poses/marge-pose-heroica.png';
import margeSentado from '@/assets/poses/marge-sentado.png';
import margeAndando from '@/assets/poses/marge-andando.png';
import margeApoiado from '@/assets/poses/marge-apoiado.png';
import margeApontando from '@/assets/poses/marge-apontando.png';
import margeDeCostas from '@/assets/poses/marge-de-costas.png';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const POSES = [
  { id: 'bracos_cruzados', label: 'Braços cruzados', homer: homerBracosCruzados, marge: margeBracosCruzados },
  { id: 'maos_bolso',      label: 'Mãos no bolso',   homer: homerMaosBolso,      marge: margeMaosBolso },
  { id: 'pose_heroica',    label: 'Pose heroica',     homer: homerPoseHeroica,    marge: margePoseHeroica },
  { id: 'sentado',         label: 'Sentado',          homer: homerSentado,        marge: margeSentado },
  { id: 'andando',         label: 'Andando',          homer: homerAndando,        marge: margeAndando },
  { id: 'apoiado',         label: 'Apoiado',          homer: homerApoiado,        marge: margeApoiado },
  { id: 'apontando',       label: 'Apontando',        homer: homerApontando,      marge: margeApontando },
  { id: 'de_costas',       label: 'De costas',        homer: homerDeCostas,       marge: margeDeCostas },
];

export function SubjectSection({ config, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [poseCustomEnabled, setPoseCustomEnabled] = useState(false);
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

  const selectPose = (poseLabel: string) => {
    // Single selection: if already selected, deselect; otherwise replace
    const current = config.poseDescription || '';
    // Keep any custom text (non-preset parts)
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

  const isMasculino = config.gender === 'masculino';

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

      {/* Gender row */}
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
                <img src={img} alt={label} className="h-full w-full object-cover object-top" />
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

      {/* Pose carousel */}
      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-2 tracking-wide">
          Pose — como sua imagem vai aparecer
        </p>

        {/* Horizontal scrollable cards */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
          {POSES.map((pose) => {
            const selected = isSelected(pose.label);
            const img = isMasculino ? pose.homer : pose.marge;
            return (
              <button
                key={pose.id}
                onClick={() => selectPose(pose.label)}
                className={cn(
                  'relative shrink-0 snap-start rounded-xl overflow-hidden border transition-all duration-200 w-[88px]',
                  selected
                    ? 'border-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.25)]'
                    : 'border-border/15 hover:border-border/35'
                )}
              >
                {/* Character image */}
                <div className="h-[112px] w-full bg-black overflow-hidden">
                  <img
                    src={img}
                    alt={pose.label}
                    className="h-full w-full object-cover object-top"
                  />
                </div>

                {/* Label */}
                <div className={cn(
                  'px-1.5 py-1.5 transition-colors duration-200',
                  selected ? 'bg-primary/20' : 'bg-secondary/40'
                )}>
                  <p className={cn(
                    'text-[8px] font-semibold leading-tight text-center',
                    selected ? 'text-primary' : 'text-muted-foreground/70'
                  )}>
                    {pose.label}
                  </p>
                </div>

                {/* Selected checkmark */}
                {selected && (
                  <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
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
                  // clear custom text when disabled
                  const presetPoses = (config.poseDescription || '')
                    .split(',').map(p => p.trim())
                    .filter(p => POSES.map(po => po.label).includes(p));
                  onUpdate({ poseDescription: presetPoses.join(', ') });
                }
              }}
              className={cn(
                'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors duration-200',
                poseCustomEnabled
                  ? 'bg-primary border-primary/60'
                  : 'bg-secondary/60 border-border/30'
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
