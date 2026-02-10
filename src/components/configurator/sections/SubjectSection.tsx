import { Plus, Upload, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function SubjectSection({ config, onUpdate }: Props) {
  const quantities = [1, 2, 3, 4, 5];
  const positions = [
    { id: 'esquerda' as const, label: 'Esquerda', icon: AlignLeft },
    { id: 'centro' as const, label: 'Centro', icon: AlignCenter },
    { id: 'direita' as const, label: 'Direita', icon: AlignRight },
  ];

  return (
    <div className="space-y-3">
      {/* Upload */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Fotos do Sujeito</p>
        <button className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
          <Plus className="h-4 w-4" />
          <span className="text-xs font-medium">UPLOAD</span>
        </button>
      </div>

      {/* Quantidade */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Quantidade</p>
        <div className="flex gap-1.5">
          {quantities.map((q) => (
            <button
              key={q}
              onClick={() => onUpdate({ quantity: q })}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                config.quantity === q
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Gênero */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Gênero</p>
        <div className="flex gap-1.5">
          {(['masculino', 'feminino'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onUpdate({ gender: g })}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors',
                config.gender === g
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <Textarea
        placeholder="Descrição da pose ou roupa (opcional)..."
        value={config.poseDescription}
        onChange={(e) => onUpdate({ poseDescription: e.target.value })}
        className="min-h-[60px] resize-none bg-muted border-none text-xs"
      />

      {/* Posição */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Posição do Sujeito</p>
        <div className="grid grid-cols-3 gap-1.5">
          {positions.map((pos) => (
            <button
              key={pos.id}
              onClick={() => onUpdate({ subjectPosition: pos.id })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg py-2.5 text-[10px] font-medium transition-colors',
                config.subjectPosition === pos.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <pos.icon className="h-4 w-4" />
              {pos.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
