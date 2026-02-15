import { Plus, X, Folder } from 'lucide-react';
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
    <div className="flex items-center bg-background/60 backdrop-blur-sm px-3 gap-0.5 h-8 overflow-x-auto border-b border-border/30">
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium transition-all duration-150 shrink-0 rounded-sm border',
              active
                ? 'bg-secondary/70 text-foreground border-border/40'
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/30'
            )}
          >
            <Folder className="h-2.5 w-2.5" />
            {p.name}
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(p.id);
              }}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-border/50 opacity-40 hover:opacity-100 transition-opacity"
            >
              <X className="h-2 w-2" />
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors shrink-0 ml-1"
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
