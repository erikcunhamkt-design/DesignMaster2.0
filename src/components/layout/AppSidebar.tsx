import { Compass, PenTool, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  activePage: 'explorar' | 'criar' | 'galeria';
  onNavigate: (page: 'explorar' | 'criar' | 'galeria') => void;
}

const navItems = [
  { id: 'explorar' as const, label: 'Explorar', icon: Compass },
  { id: 'criar' as const, label: 'Criar', icon: PenTool },
  { id: 'galeria' as const, label: 'Minha Galeria', icon: Image },
];

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-border bg-card py-4 gap-1">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
        D
      </div>
      {navItems.map((item) => {
        const active = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex flex-col items-center justify-center w-12 h-12 rounded-lg text-[10px] gap-0.5 transition-colors',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
