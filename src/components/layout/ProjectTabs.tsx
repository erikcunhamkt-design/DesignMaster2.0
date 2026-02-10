import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';

interface ProjectTabsProps {
  projects: Project[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
}

export function ProjectTabs({ projects, activeId, onSelect, onClose, onAdd }: ProjectTabsProps) {
  return (
    <div className="flex items-center border-b border-border bg-card px-2 gap-1 h-9 overflow-x-auto">
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0',
              active
                ? 'bg-background text-foreground border border-b-0 border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.name}
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(p.id);
              }}
              className="ml-1 rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
