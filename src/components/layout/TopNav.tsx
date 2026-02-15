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
    <header className="flex h-12 items-center border-b border-border bg-card px-4 gap-6">
      {/* Logo */}
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
        <Zap className="h-4 w-4" />
      </div>

      {/* Nav items */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative max-w-[200px]">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="h-7 pl-7 bg-muted border-none text-[11px] rounded-lg w-full"
        />
      </div>

      {/* API Key Pill */}
      {onChangeApiKey && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide transition-colors',
                hasKey
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              <KeyRound className="h-3 w-3" />
              <span className="hidden sm:inline">API KEY</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-3">
            <ApiKeySection apiKey={apiKey} onChangeKey={onChangeApiKey} />
          </PopoverContent>
        </Popover>
      )}

      {/* Status */}
      <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary tracking-wide">
        <Activity className="h-3 w-3" />
        ONLINE
      </div>

      {/* New */}
      <Button
        size="sm"
        onClick={onNewProject}
        className="h-7 gap-1 text-[10px] font-semibold rounded-lg bg-primary hover:bg-primary/85 text-primary-foreground shadow-sm shadow-primary/20"
      >
        <Plus className="h-3 w-3" />
        Novo
      </Button>

      {/* User */}
      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <User className="h-3.5 w-3.5" />
      </button>
    </header>
  );
}
