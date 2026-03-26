import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NotificationBellProps {
  collapsed?: boolean;
}

export function NotificationBell({ collapsed = false }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const navigate = useNavigate();

  const isChangelogNotification = (title: string) =>
    /atualiza|novidad|patch|changelog|v\d+\.\d+/i.test(title);

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    setSelected(n);
  };

  const handleGoToChangelog = () => {
    setOpen(false);
    setSelected(null);
    setTimeout(() => navigate('/studio/changelog'), 100);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            collapsed && 'justify-center px-0',
            'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
          )}
        >
          <div className="relative">
            <Bell className="h-[18px] w-[18px] shrink-0" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.4)] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!collapsed && <span className="truncate flex-1 text-left">Avisos</span>}
          {!collapsed && unreadCount > 0 && (
            <span className="bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0 bg-card border-border/60 shadow-xl"
      >
        {selected ? (
          /* Detail view */
          <div className="flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-semibold text-foreground truncate flex-1">{selected.title}</h3>
            </div>
            <div className="px-4 py-4 max-h-80 overflow-y-auto">
              <p className="text-xs text-muted-foreground/60 mb-3">
                {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true, locale: ptBR })}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              {isChangelogNotification(selected.title) && (
                <button
                  onClick={handleGoToChangelog}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  Ver changelog completo
                </button>
              )}
            </div>
          </div>
        ) : (
          /* List view */
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-border/20 transition-colors hover:bg-secondary/30',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <div className={cn('flex-1', n.read && 'pl-4')}>
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      {n.read && <Check className="h-3 w-3 text-muted-foreground/40 mt-1 shrink-0" />}
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
