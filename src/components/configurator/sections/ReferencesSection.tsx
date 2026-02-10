import { Plus } from 'lucide-react';
import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

export function ReferencesSection({ config, onUpdate }: Props) {
  return (
    <div className="space-y-2">
      <button className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
        <Plus className="h-5 w-5" />
        <span className="text-xs font-medium">ADICIONAR REFERÊNCIA</span>
      </button>
      <p className="text-[9px] text-muted-foreground">Até 4 referências adicionais de estilo</p>
    </div>
  );
}
