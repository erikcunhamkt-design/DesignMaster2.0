import { HelpTip } from './HelpTip';
import { TipData } from '@/data/tipsConfig';

interface SectionLabelProps {
  children: React.ReactNode;
  tip?: TipData;
  tipsEnabled?: boolean;
}

export function SectionLabel({ children, tip, tipsEnabled = false }: SectionLabelProps) {
  return (
    <h3 className="flex items-center gap-2.5 mb-3.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 font-display shrink-0 flex items-center gap-2">
        {children}
        {tip && <HelpTip tip={tip} tipsEnabled={tipsEnabled} />}
      </span>
      <span className="h-px flex-1 section-divider" />
    </h3>
  );
}
