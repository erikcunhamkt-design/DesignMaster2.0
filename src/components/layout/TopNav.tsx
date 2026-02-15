import { Compass, PenTool, Image, Zap, Plus, Search, User, Activity, Wand2, KeyRound, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
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
    <header className="relative z-30 flex h-14 items-center border-b border-border/50 glass px-5 gap-5">
      {/* Logo */}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/50 text-primary-foreground shadow-glow-sm shrink-0">
        <Zap className="h-4.5 w-4.5" />
      </div>

      {/* Nav items */}
      <nav className="flex items-center gap-0.5">
        {navItems.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition-all duration-200',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative max-w-[220px]">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="h-8 pl-9 bg-secondary/50 border-border/50 text-xs rounded-full w-full placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
        />
      </div>

      {/* API Key Pill */}
      {onChangeApiKey && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all duration-200 border',
                hasKey
                  ? 'bg-primary/8 text-primary border-primary/20 hover:bg-primary/12'
                  : 'bg-destructive/8 text-destructive border-destructive/20 hover:bg-destructive/12'
              )}
            >
              <KeyRound className="h-3 w-3" />
              <span className="hidden sm:inline">API KEY</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4 glass glass-border shadow-elevation-3">
            <ApiKeySection apiKey={apiKey} onChangeKey={onChangeApiKey} />
          </PopoverContent>
        </Popover>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 rounded-full bg-primary/8 border border-primary/20 px-3.5 py-1.5 text-[10px] font-bold text-primary tracking-wider uppercase">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        ONLINE
      </div>

      {/* New */}
      <Button
        size="sm"
        onClick={onNewProject}
        className="h-8 gap-1.5 text-[10px] font-bold tracking-wider uppercase rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm transition-all duration-200 hover:shadow-glow-md"
      >
        <Plus className="h-3.5 w-3.5" />
        Novo
      </Button>

      {/* User */}
      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 shrink-0">
        <User className="h-3.5 w-3.5" />
      </button>
    </header>
  );
}
