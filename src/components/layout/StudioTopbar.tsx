import { ArrowLeft, KeyRound, ChevronDown, Glasses, LogOut } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ApiKeySection, useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AccessibilityPanel } from '@/components/AccessibilityPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface StudioTopbarProps {
  title: string;
  showApiKey?: boolean;
}

export function StudioTopbar({ title, showApiKey = true }: StudioTopbarProps) {
  const navigate = useNavigate();
  const { apiKey, saveKey } = useGoogleApiKey();
  const hasKey = apiKey.length >= 10;
  const { largeText } = useAccessibility();
  const { user, signOut } = useAuth();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="relative z-30 flex h-12 items-center border-b border-border/20 bg-background/95 backdrop-blur-xl px-4 gap-3 shrink-0">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Studios</span>
      </button>

      <div className="h-5 w-px bg-border/30" />

      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src={logoImg} alt="Design Master" className="h-6 w-6 rounded-md" />
        <span className="font-display text-sm font-bold tracking-tight text-foreground">
          {title}
        </span>
        <SubscriptionBadge compact={false} />
      </div>

      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className={cn('h-1.5 w-1.5 rounded-full', hasKey ? 'bg-primary animate-pulse' : 'bg-destructive')} />
        <span className="hidden md:inline">{hasKey ? 'Online' : 'Offline'}</span>
      </div>

      {/* Accessibility toggles */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleLargeText}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200',
                largeText
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Glasses className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {largeText ? 'Desativar texto grande' : 'Ativar texto grande'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleLightMode}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200',
                lightMode
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {lightMode ? 'Desativar modo claro' : 'Ativar modo claro'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* API Key */}
      {showApiKey && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold tracking-wider uppercase transition-all duration-200 border',
                hasKey
                  ? 'bg-primary/8 text-primary/80 border-primary/20 hover:bg-primary/12'
                  : 'bg-destructive/8 text-destructive/70 border-destructive/20 hover:bg-destructive/12'
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
      )}

      {/* User avatar + logout */}
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
    </header>
  );
}
