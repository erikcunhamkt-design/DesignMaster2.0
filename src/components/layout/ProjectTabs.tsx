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
    <div className="flex items-center bg-background/80 backdrop-blur-sm px-4 gap-1 h-9 overflow-x-auto border-b border-border/20">
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'group flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-all duration-300 shrink-0 rounded-md border',
              active
                ? 'bg-secondary text-foreground border-border/40'
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/40'
            )}
          >
            <Folder className={cn('h-3 w-3', active && 'text-primary')} />
            {p.name}
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(p.id);
              }}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all duration-200 shrink-0 ml-1"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
