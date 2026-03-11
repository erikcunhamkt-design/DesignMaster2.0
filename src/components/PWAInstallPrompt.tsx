import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallPrompt() {
  const { canInstall, install } = usePWAInstall();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!canInstall) return;

    // Don't show if dismissed recently (24h)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [canInstall]);

  const handleInstall = async () => {
    await install();
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', String(Date.now()));
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[100] w-[340px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.3)] overflow-hidden"
        >
          {/* Gradient accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-accent" />

          <div className="p-5">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">
                  Instalar Design Master
                </h3>
                <p className="text-xs text-muted-foreground">
                  Acesso rápido e offline
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Instale o app no seu computador para maior praticidade. Acesse direto da barra de tarefas, sem precisar abrir o navegador!
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Agora não
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
