import { Search, Bell, KeyRound, ChevronDown, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ApiKeySection, useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { useNavigate } from 'react-router-dom';

interface DashboardTopbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function DashboardTopbar({ searchQuery, onSearchChange }: DashboardTopbarProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { apiKey, saveKey } = useGoogleApiKey();
  const hasKey = apiKey.length >= 10;
  const navigate = useNavigate();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="flex h-16 items-center justify-between px-8 border-b border-border/30 bg-background/60 backdrop-blur-xl z-10">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar ferramentas..."
          className="w-full h-10 rounded-xl bg-secondary/50 border border-border/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        <SubscriptionBadge />

        {/* API Key */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 border',
                hasKey
                  ? 'bg-primary/8 text-primary/80 border-primary/20 hover:bg-primary/15'
                  : 'bg-destructive/8 text-destructive/70 border-destructive/20 hover:bg-destructive/15'
              )}
            >
              <KeyRound className="h-3 w-3" />
              API
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4 glass-card shadow-elevation-3 rounded-xl">
            <ApiKeySection apiKey={apiKey} onChangeKey={saveKey} />
          </PopoverContent>
        </Popover>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
        </button>

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </button>
        )}

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden ring-2 ring-border/40 hover:ring-primary/40 transition-all">
              <Avatar className="h-9 w-9">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-bold">
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
