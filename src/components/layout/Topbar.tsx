import { Search, Plus, User, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  onNewProject: () => void;
}

export function Topbar({ onNewProject }: TopbarProps) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-border bg-card px-4 gap-4">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="h-7 pl-8 bg-muted border-none text-xs rounded-lg"
        />
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary tracking-wide">
          <Activity className="h-3 w-3" />
          ONLINE
        </div>

        <Button
          size="sm"
          onClick={onNewProject}
          className="h-7 gap-1 text-[10px] font-semibold rounded-lg bg-primary hover:bg-primary/85 text-primary-foreground shadow-sm shadow-primary/20"
        >
          <Plus className="h-3 w-3" />
          Novo
        </Button>

        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <User className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
