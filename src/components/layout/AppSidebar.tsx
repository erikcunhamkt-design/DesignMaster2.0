import { Compass, PenTool, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo3d from '@/assets/logo-3d.png';

interface AppSidebarProps {
  activePage: 'explorar' | 'criar' | 'galeria';
  onNavigate: (page: 'explorar' | 'criar' | 'galeria') => void;
}

const navItems = [
  { id: 'explorar' as const, label: 'Explorar', icon: Compass },
  { id: 'criar' as const, label: 'Criar', icon: PenTool },
  { id: 'galeria' as const, label: 'Galeria', icon: Image },
];

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  return (
    <aside className="flex h-screen w-[68px] flex-col items-center border-r border-border bg-card py-5 gap-2">
      <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-sm tracking-tight shadow-lg shadow-primary/20">
        <Zap className="h-4 w-4" />
      </div>
      {navItems.map((item) => {
        const active = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'relative flex flex-col items-center justify-center w-11 h-11 rounded-xl text-[9px] font-medium gap-0.5 transition-all duration-200',
              active
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {active && (
              <div className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
            )}
            <item.icon className="h-4 w-4" />
            <span className="tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
