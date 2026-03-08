import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  PenTool,
  Megaphone,
  ShoppingBag,
  Layers,
  Wrench,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route?: string;
  section?: string;
}

const mainItems: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'criar', label: 'Criar', icon: PenTool, section: 'criar' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, section: 'marketing' },
  { id: 'produtos', label: 'Produtos', icon: ShoppingBag, section: 'produtos' },
  { id: 'nichos', label: 'Nichos', icon: Layers, section: 'nichos' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench, section: 'ferramentas' },
];

const secondaryItems: SidebarItem[] = [
  { id: 'favoritos', label: 'Favoritos', icon: Star },
  { id: 'recentes', label: 'Recentes', icon: Clock },
];

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleClick = (item: SidebarItem) => {
    if (item.route) {
      navigate(item.route);
    } else {
      onSectionChange(item.section || item.id);
    }
  };

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-border/40 bg-sidebar transition-all duration-300 ease-in-out z-20',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 h-16 border-b border-border/30', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-sm">
          <Zap className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="font-display text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
            Design<span className="text-gradient">Master</span>
          </span>
        )}
      </div>

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
      </nav>

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
