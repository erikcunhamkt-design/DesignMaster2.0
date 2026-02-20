import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FreePromptBlockProps {
  freePrompt: string;
  ignoreRest: boolean;
  onUpdate: (patch: { freePrompt?: string; ignoreRest?: boolean }) => void;
  placeholder?: string;
}

export function FreePromptBlock({
  freePrompt,
  ignoreRest,
  onUpdate,
  placeholder = 'Digite seu prompt livremente aqui...',
}: FreePromptBlockProps) {
  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300 overflow-hidden',
      ignoreRest
        ? 'border-primary/40 bg-primary/8 shadow-glow-sm'
        : 'border-border/20 bg-card/30'
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <div className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300',
          ignoreRest ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground/60'
        )}>
          <Zap className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[11px] font-semibold tracking-wide transition-colors',
            ignoreRest ? 'text-primary' : 'text-foreground'
          )}>
            Prompt Livre
          </p>
          <p className="text-[9px] text-muted-foreground/50 mt-0.5">
            Digite ou dite um prompt — use sozinho ou com os campos abaixo
          </p>
        </div>
      </div>

      {/* Textarea */}
      <div className="px-4 pb-3">
        <VoiceTextField
          textarea
          placeholder={placeholder}
          value={freePrompt}
          onChange={(v) => onUpdate({ freePrompt: v })}
          className="min-h-[64px] resize-none bg-secondary/30 border-border/20 text-[10px]"
        />
      </div>

      {/* Toggle ignorar o resto */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2.5 border-t transition-colors',
        ignoreRest ? 'border-primary/20 bg-primary/5' : 'border-border/10'
      )}>
        <div>
          <p className={cn(
            'text-[10px] font-semibold transition-colors',
            ignoreRest ? 'text-primary' : 'text-foreground/70'
          )}>
            Ignorar o resto
          </p>
          <p className="text-[8px] text-muted-foreground/40 mt-0.5">
            {ignoreRest
              ? 'A IA usa só este prompt — os campos abaixo serão ignorados'
              : 'A IA combina este prompt com os campos abaixo'}
          </p>
        </div>
        <Switch
          checked={ignoreRest}
          onCheckedChange={(v) => onUpdate({ ignoreRest: v })}
        />
      </div>
    </div>
  );
}
