import { Compass, PenTool, Image, Zap, Plus, User, Wand2, KeyRound, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ApiKeySection } from '@/components/configurator/sections/ApiKeySection';

interface TopNavProps {
  activePage: 'explorar' | 'criar' | 'galeria' | 'extrator';
  onNavigate: (page: 'explorar' | 'criar' | 'galeria' | 'extrator') => void;
  onNewProject: () => void;
  apiKey?: string;
  onChangeApiKey?: (key: string) => void;
}

const navItems = [
  { id: 'explorar' as const, label: 'Explorar', icon: Compass },
  { id: 'criar' as const, label: 'Criar', icon: PenTool },
  { id: 'extrator' as const, label: 'Extrator', icon: Wand2 },
  { id: 'galeria' as const, label: 'Galeria', icon: Image },
];

export function TopNav({ activePage, onNavigate, onNewProject, apiKey = '', onChangeApiKey }: TopNavProps) {
  const hasKey = apiKey.length >= 10;

  return (
    <header className="relative z-30 flex h-14 items-center border-b border-border/30 bg-background/95 backdrop-blur-xl px-5 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0 mr-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-sm">
          <Zap className="h-4 w-4" />
        </div>
        <span className="font-display text-base font-bold tracking-tight text-foreground hidden lg:block">
          Design<span className="text-gradient">Master</span>
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border/40" />

      {/* Nav items */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-300',
                active
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <item.icon className={cn('h-3.5 w-3.5', active && 'text-primary')} />
              <span className="hidden sm:inline">{item.label}</span>
              {active && (
                <span className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full bg-primary shadow-glow-sm" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* API Key */}
      {onChangeApiKey && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 border',
                hasKey
                  ? 'bg-primary/8 text-primary/90 border-primary/20 hover:bg-primary/12 hover:text-primary'
                  : 'bg-destructive/8 text-destructive/80 border-destructive/20 hover:bg-destructive/12'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', hasKey ? 'bg-primary' : 'bg-destructive')} />
              <KeyRound className="h-3 w-3" />
              <span className="hidden md:inline">API</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4 glass-card shadow-elevation-3 rounded-xl">
            <ApiKeySection apiKey={apiKey} onChangeKey={onChangeApiKey} />
          </PopoverContent>
        </Popover>
      )}

      {/* New project */}
      <Button
        size="sm"
        onClick={onNewProject}
        className="h-8 gap-1.5 text-[10px] font-semibold tracking-wider rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border/40 shadow-none transition-all duration-300 uppercase"
      >
        <Plus className="h-3 w-3" />
        <span className="hidden sm:inline">Novo</span>
      </Button>

      {/* User avatar */}
      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary/80 transition-all duration-300 shrink-0">
        <User className="h-3.5 w-3.5" />
      </button>
    </header>
  );
}
