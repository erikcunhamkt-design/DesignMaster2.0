import { Search, Bell, Shield, LogOut, Glasses, Sun, KeyRound, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ApiKeySection, useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useNavigate } from 'react-router-dom';

export function DashboardTopbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { apiKey, saveKey } = useGoogleApiKey();
  const { largeText, lightMode, toggleLargeText, toggleLightMode } = useAccessibility();
  const navigate = useNavigate();
  const hasKey = apiKey.length >= 10;
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border/8 bg-background/80 backdrop-blur-xl px-6 shrink-0 z-30">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
        <input
          type="text"
          placeholder="Search tools..."
          className="w-full h-9 rounded-xl bg-secondary/50 border border-border/15 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/20 transition-all"
        />
      </div>

      <div className="flex-1" />

      <SubscriptionBadge />

      {/* Accessibility */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleLargeText}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                largeText ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Glasses className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{largeText ? 'Desativar texto grande' : 'Ativar texto grande'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleLightMode}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                lightMode ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Sun className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{lightMode ? 'Desativar modo claro' : 'Ativar modo claro'}</TooltipContent>
        </Tooltip>
      </div>

      {/* API Key */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold tracking-wider uppercase transition-all duration-200 border',
              hasKey ? 'bg-primary/8 text-primary/80 border-primary/20 hover:bg-primary/12' : 'bg-destructive/8 text-destructive/70 border-destructive/20 hover:bg-destructive/12'
            )}
          >
            <KeyRound className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">API</span>
            <ChevronDown className="h-2 w-2 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-4 glass-card shadow-elevation-3 rounded-xl">
          <ApiKeySection apiKey={apiKey} onChangeKey={saveKey} />
        </PopoverContent>
      </Popover>

      {/* Notifications */}
      <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
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

      {/* User avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden ring-2 ring-border/20 hover:ring-primary/40 transition-all">
            <Avatar className="h-9 w-9">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-bold">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {user?.email && (
            <div className="px-2 py-1.5 text-[10px] text-muted-foreground truncate border-b border-border mb-1">{user.email}</div>
          )}
          <DropdownMenuItem onClick={signOut} className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer">
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
