import { Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { TipData } from '@/data/tipsConfig';

interface HelpTipProps {
  tip: TipData;
  tipsEnabled: boolean;
}

export function HelpTip({ tip, tipsEnabled }: HelpTipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-primary transition-colors"
          aria-label={`Dica: ${tip.title}`}
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-64 p-3 text-xs space-y-2">
        <p className="font-semibold text-foreground">{tip.title}</p>
        <ul className="space-y-1 text-muted-foreground">
          {tip.bullets.map((b, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-primary shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {tip.example && (
          <p className="text-[10px] italic text-muted-foreground/70 border-t border-border pt-1.5 mt-1.5">
            {tip.example}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
