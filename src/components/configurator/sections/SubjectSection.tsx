import { Plus, X, AlignLeft, AlignCenter, AlignRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

      {/* Pose carousel — card único com setas */}
      <div>
        <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-2 tracking-wide">
          Pose — como sua imagem vai aparecer
        </p>

        <PoseCardCarousel
          poses={POSES}
          isMasculino={isMasculino}
          selectedLabel={(config.poseDescription || '').split(',')[0]?.trim() || ''}
          onSelect={selectPose}
        />

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

// ─── Pose Card Carousel ────────────────────────────────────────────────────

function PoseCardCarousel({
  poses,
  isMasculino,
  selectedLabel,
  onSelect,
}: {
  poses: typeof POSES;
  isMasculino: boolean;
  selectedLabel: string;
  onSelect: (label: string) => void;
}) {
  const initIdx = Math.max(0, poses.findIndex(p => p.label === selectedLabel));
  const [navIdx, setNavIdx] = useState(initIdx);
  const currentPose = poses[navIdx];
  const img = isMasculino ? currentPose.homer : currentPose.marge;
  const isSelected = selectedLabel === currentPose.label;

  const goPrev = () => {
    const prev = (navIdx - 1 + poses.length) % poses.length;
    setNavIdx(prev);
    onSelect(poses[prev].label);
  };

  const goNext = () => {
    const next = (navIdx + 1) % poses.length;
    setNavIdx(next);
    onSelect(poses[next].label);
  };

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={goPrev}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-secondary/40 border border-border/20 hover:bg-secondary/70 hover:border-border/40 transition-all"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Card */}
        <button
          onClick={() => isSelected ? onSelect('') : onSelect(currentPose.label)}
          className={cn(
            'flex-1 relative rounded-xl overflow-hidden border transition-all duration-200',
            isSelected
              ? 'border-primary/50 shadow-[0_0_16px_hsl(var(--primary)/0.25)]'
              : 'border-border/20 hover:border-border/40'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={navIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              <div className="h-[148px] w-full bg-black overflow-hidden">
                <img
                  src={img}
                  alt={currentPose.label}
                  className="h-full w-full object-contain object-bottom"
                />
              </div>
              <div className={cn(
                'px-2 py-2 flex items-center justify-between transition-colors',
                isSelected ? 'bg-primary/20' : 'bg-secondary/40'
              )}>
                <p className={cn(
                  'text-[10px] font-semibold',
                  isSelected ? 'text-primary' : 'text-muted-foreground/70'
                )}>
                  {currentPose.label}
                </p>
                <span className="text-[8px] text-muted-foreground/40">
                  {navIdx + 1}/{poses.length}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
          {isSelected && (
            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[8px] text-primary-foreground font-bold">✓</span>
            </div>
          )}
        </button>

        {/* Next */}
        <button
          onClick={goNext}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-secondary/40 border border-border/20 hover:bg-secondary/70 hover:border-border/40 transition-all"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1">
        {poses.map((_, i) => (
          <button
            key={i}
            onClick={() => { setNavIdx(i); onSelect(poses[i].label); }}
            className={cn(
              'rounded-full transition-all duration-200',
              i === navIdx ? 'w-3 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-border/40 hover:bg-border/70'
            )}
          />
        ))}
      </div>
    </div>
  );
}
