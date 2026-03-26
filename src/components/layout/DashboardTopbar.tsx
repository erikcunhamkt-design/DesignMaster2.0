import { useState } from 'react';
import { Search, Bell, LogOut, Shield, Settings, Check, X, BellOff, ArrowLeft, Sparkles, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useNotifications, Notification } from '@/hooks/useNotifications';
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
        <NotificationPopover />

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

function NotificationPopover() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const navigate = useNavigate();

  const isChangelog = (title: string) =>
    /atualiza|novidad|patch|changelog|v\d+\.\d+/i.test(title);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d`;
  };

  const handleClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    setSelected(n);
  };

  const handleChangelog = () => {
    setOpen(false);
    setSelected(null);
    setTimeout(() => navigate('/studio/changelog'), 50);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
      <PopoverTrigger asChild>
        <button className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold shadow-[0_0_8px_hsl(var(--primary)/0.5)] animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 glass-card shadow-elevation-3 rounded-xl overflow-hidden">
        {selected ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20">
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-foreground truncate flex-1">{selected.title}</span>
              <span className="text-[9px] text-muted-foreground/50 shrink-0">{formatDate(selected.created_at)}</span>
            </div>
            <div className="px-4 py-4 max-h-80 overflow-y-auto">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              {isChangelog(selected.title) && (
                <button
                  onClick={handleChangelog}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  Ver changelog completo
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <span className="text-xs font-bold text-foreground">Notificações</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-primary hover:underline"
                  >
                    Marcar todas
                  </button>
                )}
                <button
                  onClick={handleChangelog}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Megaphone className="h-3 w-3" />
                  Atualizações
                </button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 gap-2">
                  <BellOff className="h-8 w-8 text-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground/60 font-medium">Nenhuma notificação</span>
                  <span className="text-[10px] text-muted-foreground/40">Você será avisado quando houver novidades</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-border/10 hover:bg-secondary/30 transition-colors',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                      )}
                      <div className={cn('flex-1 min-w-0', n.read && 'ml-4')}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground truncate">{n.title}</span>
                          <span className="text-[9px] text-muted-foreground/50 shrink-0">{formatDate(n.created_at)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
