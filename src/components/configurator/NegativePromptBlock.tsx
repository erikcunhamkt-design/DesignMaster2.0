import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { Ban, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NegativePromptBlockProps {
  negativePrompt: string;
  negativePromptEnabled: boolean;
  onUpdate: (patch: {negativePrompt?: string;negativePromptEnabled?: boolean;}) => void;
  placeholder?: string;
}

export function NegativePromptBlock({
  negativePrompt,
  negativePromptEnabled,
  onUpdate,
  placeholder = 'Ex: desfocado, baixa qualidade, marca d\'água, dedos extras, mãos deformadas'
}: NegativePromptBlockProps) {
  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300 overflow-hidden',
      negativePromptEnabled ?
      'border-destructive/30 bg-destructive/5' :
      'border-border/15 bg-card/20'
    )}>
      {/* Header toggle */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300',
          negativePromptEnabled ? 'bg-destructive/15 text-destructive' : 'bg-secondary/50 text-muted-foreground/40'
        )}>
          <Ban className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[11px] font-semibold tracking-wide transition-colors',
            negativePromptEnabled ? 'text-destructive' : 'text-foreground/50'
          )}>O que eu não quero na minha imagem?

          </p>
          <p className="text-[9px] text-muted-foreground/40 mt-0.5">
            Elementos que a IA deve evitar gerar na imagem
          </p>
        </div>
        <Switch
          checked={negativePromptEnabled}
          onCheckedChange={(v) => onUpdate({ negativePromptEnabled: v })} />
        
      </div>

      {/* Textarea (visible when enabled) */}
      {negativePromptEnabled &&
      <div className="px-4 pb-3">
          <VoiceTextField
          textarea
          placeholder={placeholder}
          value={negativePrompt}
          onChange={(v) => onUpdate({ negativePrompt: v })}
          className="min-h-[56px] resize-none bg-secondary/30 border-border/20 text-[10px]" />
        
        </div>
      }
    </div>);

}