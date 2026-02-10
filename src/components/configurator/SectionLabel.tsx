interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/70 mb-2.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </h3>
  );
}
