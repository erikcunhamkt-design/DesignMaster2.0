interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
      {children}
    </h3>
  );
}
