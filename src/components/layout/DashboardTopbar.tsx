import { Search, Bell, LogOut, Shield, Settings, Check, X, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { MobileSidebarTrigger } from './DashboardSidebar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface DashboardTopbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function DashboardTopbar({ searchQuery, onSearchChange, activeSection, onSectionChange }: DashboardTopbarProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { apiKey } = useGoogleApiKey();
  const hasKey = apiKey.length >= 10;
  const navigate = useNavigate();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8 border-b border-border/30 bg-background/60 backdrop-blur-xl z-10 gap-3">
      {/* Mobile menu trigger */}
      {activeSection && onSectionChange && (
        <MobileSidebarTrigger activeSection={activeSection} onSectionChange={onSectionChange} />
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar..."
          className="w-full h-9 md:h-10 rounded-xl bg-secondary/50 border border-border/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Settings gear */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate('/studio/settings')}
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Configurações</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
        </button>

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </button>
        )}

        {/* Avatar with API status badge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full overflow-visible">
              <div className="h-full w-full rounded-full overflow-hidden ring-2 ring-border/40 hover:ring-primary/40 transition-all">
                <Avatar className="h-8 w-8 md:h-9 md:w-9">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] md:text-[11px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* API status badge */}
              <span className={cn(
                'absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background shadow-sm',
                hasKey ? 'bg-primary' : 'bg-destructive'
              )}>
                {hasKey
                  ? <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  : <X className="h-2.5 w-2.5 text-destructive-foreground" strokeWidth={3} />
                }
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user?.email && (
              <div className="px-2 py-1.5 text-[10px] text-muted-foreground truncate border-b border-border mb-1">
                {user.email}
              </div>
            )}
            <DropdownMenuItem onClick={() => navigate('/studio/settings')} className="text-xs gap-2 cursor-pointer">
              <Settings className="h-3.5 w-3.5" />
              Configurações
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate('/admin')} className="text-xs gap-2 cursor-pointer md:hidden">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </DropdownMenuItem>
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
