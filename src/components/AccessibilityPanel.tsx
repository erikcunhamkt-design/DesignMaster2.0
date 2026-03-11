import { Glasses, Sun, ZoomIn, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibility, type ZoomLevel } from '@/hooks/useAccessibility';
import { Switch } from '@/components/ui/switch';

const zoomOptions: { value: ZoomLevel; label: string }[] = [
  { value: '100', label: '100%' },
  { value: '125', label: '125%' },
  { value: '150', label: '150%' },
  { value: '175', label: '175%' },
];

export function AccessibilityPanel() {
  const {
    largeText, lightMode, zoomLevel, highContrast, reducedMotion,
    toggleLargeText, toggleLightMode, toggleHighContrast, toggleReducedMotion, setZoomLevel,
  } = useAccessibility();

  return (
    <div className="w-72 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/30">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
          <Glasses className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Acessibilidade</h3>
          <p className="text-[10px] text-muted-foreground">Ajuste a experiência visual</p>
        </div>
      </div>

      {/* Zoom Level */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Nível de Zoom</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Ajuste o tamanho do conteúdo quando o texto grande estiver ativo
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {zoomOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setZoomLevel(opt.value)}
              className={cn(
                'rounded-lg py-1.5 text-[11px] font-bold transition-all duration-200 border',
                zoomLevel === opt.value
                  ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.2)]'
                  : 'bg-secondary/30 text-muted-foreground border-border/20 hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-1">
        <ToggleRow
          icon={<Glasses className="h-3.5 w-3.5" />}
          label="Texto Grande"
          description="Aumenta o tamanho do texto"
          checked={largeText}
          onToggle={toggleLargeText}
        />
        <ToggleRow
          icon={<Sun className="h-3.5 w-3.5" />}
          label="Modo Claro"
          description="Fundo claro com alto contraste"
          checked={lightMode}
          onToggle={toggleLightMode}
        />
        <ToggleRow
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Alto Contraste"
          description="Aumenta o contraste de cores"
          checked={highContrast}
          onToggle={toggleHighContrast}
        />
        <ToggleRow
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="Reduzir Animações"
          description="Desativa animações e transições"
          checked={reducedMotion}
          onToggle={toggleReducedMotion}
        />
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, description, checked, onToggle }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 hover:bg-secondary/30 transition-colors text-left group"
    >
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
        checked ? 'bg-primary/15 text-primary' : 'bg-secondary/40 text-muted-foreground'
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-foreground block">{label}</span>
        <span className="text-[10px] text-muted-foreground block leading-tight">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} className="shrink-0 pointer-events-none" />
    </button>
  );
}
