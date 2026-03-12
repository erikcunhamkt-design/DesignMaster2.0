import { Loader2, Sparkles } from 'lucide-react';

interface MobileGenerateButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
  label?: string;
}

export function MobileGenerateButton({ onGenerate, isGenerating, label = 'Gerar ✨' }: MobileGenerateButtonProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-lg border border-white/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
    </div>
  );
}
