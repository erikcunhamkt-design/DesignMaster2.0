import { Switch } from '@/components/ui/switch';
import { VoiceTextField } from '@/components/ui/VoiceTextField';
import { Zap, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FreePromptBlockProps {
  freePrompt: string;
  ignoreRest: boolean;
  onUpdate: (patch: { freePrompt?: string; ignoreRest?: boolean }) => void;
  placeholder?: string;
}

const PROMPT_EXAMPLES = [
  'Produto premium em fundo minimalista',
  'Jogador de futebol em ação, estilo esportivo',
  'Mockup de embalagem moderna',
  'Mulher executiva confiante, fundo urbano noturno',
  'Retrato editorial com iluminação dramática',
];

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
          <div className="flex items-center gap-1.5">
            <p className={cn(
              'text-[11px] font-semibold tracking-wide transition-colors',
              ignoreRest ? 'text-primary' : 'text-foreground'
            )}>
              Prompt Livre
            </p>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-primary/60 transition-colors cursor-help">
                    <HelpCircle className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-[10px]">
                  Descreva a imagem que deseja gerar. Seja específico sobre estilo, composição e detalhes.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-[9px] text-muted-foreground/50 mt-0.5">
            Digite ou dite um prompt — use sozinho ou com os campos abaixo
          </p>
        </div>
      </div>

      {/* Textarea */}
      <div className="px-4 pb-1">
        <VoiceTextField
          textarea
          placeholder={placeholder}
          value={freePrompt}
          onChange={(v) => onUpdate({ freePrompt: v.slice(0, 9000) })}
          className="min-h-[64px] resize-none bg-secondary/30 border-border/20 text-[10px]"
        />
        <p className="text-[8px] text-muted-foreground/40 text-right mt-1">
          {freePrompt.length.toLocaleString()}/9.000
        </p>
      </div>

      {/* Quick examples */}
      {!freePrompt && (
        <div className="px-4 pb-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40 mb-1.5">
            Exemplos rápidos
          </p>
          <div className="flex flex-wrap gap-1">
            {PROMPT_EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => onUpdate({ freePrompt: example })}
                className="rounded-full px-2.5 py-1 text-[9px] font-medium border border-border/20 bg-secondary/20 text-muted-foreground/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

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
