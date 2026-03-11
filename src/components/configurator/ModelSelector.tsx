import { cn } from '@/lib/utils';
import { Zap, Crown } from 'lucide-react';

export type AiModel = 'pro' | 'flash';

interface ModelSelectorProps {
  value: AiModel;
  onChange: (model: AiModel) => void;
}

const models: { id: AiModel; label: string; desc: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'flash', label: 'Nano Banana 2', desc: 'Gemini 3.1 · Rápido e potente', icon: Zap, badge: '3.1' },
];

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {models.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            'flex-1 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all duration-150',
            value === m.id
              ? 'bg-primary/12 border-primary/30 text-primary shadow-glow-sm'
              : 'bg-secondary/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          <m.icon className="h-3.5 w-3.5 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold truncate">{m.label}</span>
              {m.badge && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider leading-none',
                  m.id === 'pro' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                )}>
                  {m.badge}
                </span>
              )}
            </div>
            <p className="text-[8px] text-muted-foreground/50 truncate">{m.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
