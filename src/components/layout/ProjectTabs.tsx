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
    <div className="flex items-center bg-card/50 px-2 gap-0.5 h-8 overflow-x-auto border-b border-border">
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium transition-all duration-200 shrink-0 rounded-md',
              active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Folder className="h-3 w-3" />
            {p.name}
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(p.id);
              }}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-border opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 ml-1"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
