import { Plus, X, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';
import { useState, useRef, useEffect } from 'react';

interface ProjectTabsProps {
  projects: Project[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, newName: string) => void;
}

export function ProjectTabs({ projects, activeId, onSelect, onClose, onAdd }: ProjectTabsProps) {
  return (
    <div className="flex items-center px-4 gap-1 h-full overflow-x-auto">
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium transition-all duration-200 shrink-0 rounded-md',
              active
                ? 'bg-secondary/60 text-foreground border border-border/25'
                : 'text-muted-foreground/50 hover:text-foreground/70 border border-transparent hover:bg-secondary/20'
            )}
          >
            <Folder className={cn('h-2.5 w-2.5 shrink-0', active ? 'text-primary' : 'text-muted-foreground/30')} />
            <span>{p.name}</span>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(p.id);
              }}
              className="rounded p-0.5 hover:bg-border/40 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity duration-150"
            >
              <X className="h-2 w-2" />
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/30 hover:bg-secondary/40 hover:text-muted-foreground transition-all duration-200 shrink-0 ml-1"
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
