import { HelpTip } from './HelpTip';
import { TipData } from '@/data/tipsConfig';

interface SectionLabelProps {
  children: React.ReactNode;
  tip?: TipData;
  tipsEnabled?: boolean;
}

export function SectionLabel({ children, tip, tipsEnabled = false }: SectionLabelProps) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/70 mb-2.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-border" />
      <span className="flex items-center gap-1.5">
        {children}
        {tip && <HelpTip tip={tip} tipsEnabled={tipsEnabled} />}
      </span>
      <span className="h-px flex-1 bg-border" />
    </h3>
  );
}
