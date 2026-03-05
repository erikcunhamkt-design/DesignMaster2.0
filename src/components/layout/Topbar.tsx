import { Search, Plus, Activity, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  onNewProject: () => void;
}

export function Topbar({ onNewProject }: TopbarProps) {
  const { user, signOut } = useAuth();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  const avatarUrl = user?.user_metadata?.avatar_url;

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
              <Avatar className="h-7 w-7">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user?.email && (
              <div className="px-2 py-1.5 text-[10px] text-muted-foreground truncate border-b border-border mb-1">
                {user.email}
              </div>
            )}
            <DropdownMenuItem onClick={signOut} className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
