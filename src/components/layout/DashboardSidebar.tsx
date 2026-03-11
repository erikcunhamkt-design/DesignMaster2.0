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
} from 'lucide-react';
import logo3d from '@/assets/logo-3d.png';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route?: string;
  section?: string;
}

const mainItems: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'image-creators', label: 'Geradores', icon: Wand2, section: 'image-creators' },
  { id: 'creative-assistant', label: 'Agentes', icon: Brain, section: 'creative-assistant' },
  { id: 'prompt-tools', label: 'Prompt Lab', icon: PenTool, section: 'prompt-tools' },
  { id: 'image-tools', label: 'Ferramentas', icon: Wrench, section: 'image-tools' },
];

const secondaryItems: SidebarItem[] = [
  { id: 'favoritos', label: 'Favoritos', icon: Star },
  { id: 'recentes', label: 'Recentes', icon: Clock },
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
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0 bg-sidebar border-r border-border/40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border/30">
          <img src={logo3d} alt="DesignMaster" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
          <span className="font-display text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
            Design<span className="text-gradient">Master</span>
          </span>
        </div>
        <SidebarContent
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          collapsed={false}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // On mobile, don't render the sidebar at all (it's in the Sheet)
  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={cn(
        'relative hidden md:flex h-screen flex-col border-r border-border/40 bg-sidebar transition-all duration-300 ease-in-out z-20',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 h-16 border-b border-border/30', collapsed && 'justify-center px-0')}>
        <img src={logo3d} alt="DesignMaster" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
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
