import { Home, PenTool, Megaphone, ShoppingBag, Layers, Wrench, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import logoImg from '@/assets/logo.png';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const mainNav: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'create', label: 'Create', icon: PenTool },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'niches', label: 'Niches', icon: Layers },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

const secondaryNav: { label: string; items: SidebarItem[] }[] = [
  {
    label: 'Favorites',
    items: [
      { id: 'fav-creator', label: 'Creator', icon: Star },
      { id: 'fav-mockup', label: 'Mockup Studio', icon: Star },
    ],
  },
  {
    label: 'Recent',
    items: [
      { id: 'recent-hero', label: 'Hero Studio', icon: Clock },
      { id: 'recent-covers', label: 'Magnetic Covers', icon: Clock },
    ],
  },
];

interface DashboardSidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

export function DashboardSidebar({ activeSection, onNavigate }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-border/10 bg-sidebar transition-all duration-300 shrink-0',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 shrink-0 border-b border-border/8', collapsed && 'justify-center px-0')}>
        <img src={logoImg} alt="Design Master" className="h-8 w-8 rounded-xl shadow-glow-sm shrink-0" />
        {!collapsed && (
          <span className="font-display text-sm font-bold tracking-tight text-foreground">
            Design<span className="text-gradient">Master</span>
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
        {mainNav.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Secondary sections */}
        {secondaryNav.map((section) => (
          <div key={section.label} className="pt-5">
            {!collapsed && (
              <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                {section.label}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-border/20" />}
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'group flex items-center gap-3 w-full rounded-xl px-3 py-2 text-[12px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-secondary/30 transition-all duration-200',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-border/8 text-muted-foreground/40 hover:text-foreground hover:bg-secondary/30 transition-all"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
