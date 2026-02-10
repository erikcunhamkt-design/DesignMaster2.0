import { Search, Plus, User, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  onNewProject: () => void;
}

export function Topbar({ onNewProject }: TopbarProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4 gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="h-8 pl-8 bg-muted border-none text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5" />
          API OK
        </div>

        <Button
          size="sm"
          onClick={onNewProject}
          className="h-8 gap-1 bg-primary hover:bg-primary/90 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo
        </Button>

        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
