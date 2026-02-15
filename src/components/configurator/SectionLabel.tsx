import { HelpTip } from './HelpTip';
import { TipData } from '@/data/tipsConfig';

interface SectionLabelProps {
  children: React.ReactNode;
  tip?: TipData;
  tipsEnabled?: boolean;
}

export function SectionLabel({ children, tip, tipsEnabled = false }: SectionLabelProps) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/40 mb-3 flex items-center gap-2.5">
      <span className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
      <span className="flex items-center gap-1.5 shrink-0">
        {children}
        {tip && <HelpTip tip={tip} tipsEnabled={tipsEnabled} />}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-border/50 to-transparent" />
    </h3>
  );
}
