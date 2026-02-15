import { Compass, PenTool, Image, Zap, Plus, User, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TopNavProps {
  activePage: 'explorar' | 'criar' | 'galeria' | 'extrator';
  onNavigate: (page: 'explorar' | 'criar' | 'galeria' | 'extrator') => void;
  onNewProject: () => void;
}

const navItems = [
  { id: 'explorar' as const, label: 'Explorar', icon: Compass },
  { id: 'criar' as const, label: 'Criar', icon: PenTool },
  { id: 'extrator' as const, label: 'Extrator', icon: Wand2 },
  { id: 'galeria' as const, label: 'Galeria', icon: Image },
];

export function TopNav({ activePage, onNavigate, onNewProject }: TopNavProps) {

  return (
    <header className="relative z-30 flex h-12 items-center border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 gap-3">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0 mr-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/90 to-primary/40 text-primary-foreground shadow-glow-sm">
          <Zap className="h-3.5 w-3.5" />
        </div>
        <span className="font-display text-sm font-bold tracking-tight text-foreground hidden lg:block">
          Spark<span className="text-primary">Snap</span>
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border/50" />

      {/* Nav items */}
      <nav className="flex items-center gap-0.5">
        {navItems.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wide transition-all duration-200',
                active
                  ? 'text-foreground bg-secondary/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
              {active && (
                <span className="absolute -bottom-[7px] left-2 right-2 h-[2px] rounded-full bg-primary shadow-glow-sm" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New project */}
      <Button
        size="sm"
        onClick={onNewProject}
        className="h-7 gap-1 text-[10px] font-semibold tracking-wide rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border/50 shadow-none transition-all duration-200"
      >
        <Plus className="h-3 w-3" />
        <span className="hidden sm:inline">Novo</span>
      </Button>

      {/* User avatar */}
      <button className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all duration-200 shrink-0">
        <User className="h-3 w-3" />
      </button>
    </header>
  );
}
