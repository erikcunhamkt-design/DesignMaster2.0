import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Wand2,
  Brain,
  PenTool,
  Wrench,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  Mail,
  Sparkles,
  User,
  Download,
  Settings,
  MessagesSquare,
  Megaphone,
} from 'lucide-react';
import logo3d from '@/assets/logo-3d.png';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUnreadDMs } from '@/hooks/useUnreadDMs';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { NotificationBell } from '@/components/NotificationBell';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route?: string;
  section?: string;
  badge?: number;
}

const mainItems: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'void', label: 'VOID', icon: Sparkles, route: '/studio/void' },
  { id: 'chat-hub', label: 'Chat IA', icon: MessagesSquare, route: '/studio/chat-hub' },
  { id: 'image-creators', label: 'Geradores', icon: Wand2, section: 'image-creators' },
  { id: 'creative-assistant', label: 'Agentes', icon: Brain, section: 'creative-assistant' },
  { id: 'prompt-tools', label: 'Prompt Lab', icon: PenTool, section: 'prompt-tools' },
  { id: 'image-tools', label: 'Ferramentas', icon: Wrench, section: 'image-tools' },
];

const secondaryItems: SidebarItem[] = [
  { id: 'favoritos', label: 'Favoritos', icon: Star },
  { id: 'recentes', label: 'Recentes', icon: Clock },
  { id: 'profile', label: 'Meu Perfil', icon: User, route: '/studio/profile' },
  { id: 'settings', label: 'Configurações', icon: Settings, route: '/studio/settings' },
];

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

// Sidebar content component to reuse in both mobile and desktop
function SidebarContent({
  activeSection,
  onSectionChange,
  collapsed,
  onClose,
  unreadDMs = 0,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onClose?: () => void;
  unreadDMs?: number;
}) {
  const navigate = useNavigate();
  const { canInstall, install } = usePWAInstall();

  const socialItems: SidebarItem[] = [
    { id: 'social', label: 'Comunidade', icon: MessageCircle, route: '/studio/community-chat' },
    { id: 'direct-messages', label: 'DMs', icon: Mail, route: '/studio/direct-messages', badge: unreadDMs },
  ];

  const handleClick = (item: SidebarItem) => {
    if (item.route) {
      navigate(item.route);
    } else {
      onSectionChange(item.section || item.id);
    }
    onClose?.();
  };

  return (
    <>
      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {!collapsed && (
          <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Principal</p>
        )}
        {mainItems.map((item) => {
          const active = activeSection === (item.section || item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
              )}
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', active && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {/* Divider */}
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {!collapsed && (
          <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Atalhos</p>
        )}
        {secondaryItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {/* Notifications & Updates */}
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {!collapsed && (
          <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Social</p>
        )}

        <NotificationBell collapsed={collapsed} />

        <button
          onClick={() => { navigate('/studio/changelog'); onClose?.(); }}
          className={cn(
            'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            collapsed && 'justify-center px-0',
            'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
          )}
        >
          <Megaphone className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Atualizações</span>}
        </button>

        {socialItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', active && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && (item.badge ?? 0) > 0 && (
                <span className="ml-auto bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Install App */}
        {canInstall && (
          <>
            <div className="my-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <button
              onClick={() => { install(); onClose?.(); }}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20',
                collapsed && 'justify-center px-0'
              )}
            >
              <Download className="h-[18px] w-[18px] shrink-0 animate-bounce" />
              {!collapsed && <span className="truncate">Instalar App</span>}
            </button>
          </>
        )}
      </nav>
    </>
  );
}

// Mobile trigger button component
export function MobileSidebarTrigger({
  activeSection,
  onSectionChange,
}: DashboardSidebarProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useUnreadDMs();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors md:hidden">
          <Menu className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0 bg-sidebar border-r border-border/40">
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border/30">
          <img src={logo3d} alt="DesignMaster" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          <span className="font-display text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
            Design<span className="text-gradient">Master</span>
          </span>
        </div>
        <SidebarContent
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          collapsed={false}
          onClose={() => setOpen(false)}
          unreadDMs={unreadCount}
        />
      </SheetContent>
    </Sheet>
  );
}

export function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { unreadCount } = useUnreadDMs();

  if (isMobile) return null;

  return (
    <aside
      className={cn(
        'relative hidden md:flex h-screen flex-col border-r border-border/40 bg-sidebar transition-all duration-300 ease-in-out z-20',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      <div className={cn('flex items-center gap-2.5 px-4 h-16 border-b border-border/30', collapsed && 'justify-center px-0')}>
        <img src={logo3d} alt="DesignMaster" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        {!collapsed && (
          <span className="font-display text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
            Design<span className="text-gradient">Master</span>
          </span>
        )}
      </div>

      <SidebarContent
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        collapsed={collapsed}
        unreadDMs={unreadCount}
      />

      {/* Collapse toggle */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
