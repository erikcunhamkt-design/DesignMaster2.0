import { useState } from 'react';
import { Pin, PinOff, Pencil, Trash, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
}

interface ConversationItemProps {
  convo: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onStartRename: (id: string, currentTitle: string) => void;
  onConfirmRename: (id: string, newTitle: string) => void;
  onCancelRename: () => void;
  onEditTitleChange: (value: string) => void;
  onTogglePin?: (id: string) => void;
  formatDate: (d: string) => string;
}

export function ConversationItem({
  convo,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onDelete,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onEditTitleChange,
  onTogglePin,
  formatDate,
}: ConversationItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'group flex items-center gap-1.5 rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-150',
            isActive
              ? 'bg-primary/10 text-foreground'
              : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground',
            convo.is_pinned && 'border-l-2 border-primary/40'
          )}
          onClick={() => onSelect(convo.id)}
        >
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => onEditTitleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onConfirmRename(convo.id, editTitle);
                    if (e.key === 'Escape') onCancelRename();
                  }}
                  className="flex-1 bg-transparent border-b border-primary/30 text-[11px] outline-none py-0.5"
                  autoFocus
                />
                <button onClick={() => onConfirmRename(convo.id, editTitle)} className="p-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </button>
                <button onClick={() => onCancelRename()} className="p-0.5">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  {convo.is_pinned && <Pin className="h-2.5 w-2.5 text-primary/60 shrink-0" />}
                  <p className="text-[11px] font-medium truncate leading-tight">{convo.title}</p>
                </div>
                <p className="text-[9px] text-muted-foreground/40 mt-0.5">{formatDate(convo.updated_at)}</p>
              </>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        {onTogglePin && (
          <ContextMenuItem onClick={() => onTogglePin(convo.id)} className="gap-2 text-xs">
            {convo.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {convo.is_pinned ? 'Desafixar' : 'Fixar conversa'}
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onStartRename(convo.id, convo.title)} className="gap-2 text-xs">
          <Pencil className="h-3.5 w-3.5" />
          Renomear
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDelete(convo.id)} className="gap-2 text-xs text-destructive focus:text-destructive">
          <Trash className="h-3.5 w-3.5" />
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
