import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo3d from '@/assets/logo-3d.png';

const SESSION_KEY = 'ss_intro_seen';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const SplashIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'in' | 'logo' | 'sweep' | 'out' | 'done'>('in');
  const [showSkip, setShowSkip] = useState(false);
  const reduced = prefersReducedMotion();

  const finish = useCallback(() => {
    setPhase('done');
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(finish, 250);
      return () => clearTimeout(t);
    }

    const timers = [
      setTimeout(() => setShowSkip(true), 400),
      setTimeout(() => setPhase('logo'), 250),
      setTimeout(() => setPhase('sweep'), 900),
      setTimeout(() => setPhase('out'), 1400),
      setTimeout(finish, 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced, finish]);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'out' ? 0 : 1 }}
        transition={{ duration: phase === 'out' ? 0.2 : 0.25 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{ background: 'hsl(var(--background))' }}
        aria-hidden="true"
      >
        {/* Aurora bg */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-breathe"
            style={{
              background: 'hsl(var(--primary))',
              top: '20%',
              left: '30%',
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] animate-breathe"
            style={{
              background: 'hsl(var(--accent))',
              bottom: '20%',
              right: '25%',
              animationDelay: '1s',
            }}
          />
        </div>

        {/* App Name with sweep */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
          animate={{
            opacity: phase === 'in' ? 0 : 1,
            scale: phase === 'in' ? 0.98 : 1,
            filter: phase === 'in' ? 'blur(8px)' : 'blur(0px)',
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative select-none flex flex-col items-center gap-2"
        >
          <div className="relative overflow-hidden">
            <h1
              className="text-6xl md:text-8xl font-black tracking-tight"
              style={{
                textShadow: '0 0 40px hsl(var(--primary) / 0.4), 0 0 80px hsl(var(--primary) / 0.2)',
              }}
            >
              <span style={{ color: 'hsl(var(--foreground))' }}>Design</span>
              <span style={{ color: 'hsl(var(--primary))' }}>Master</span>
            </h1>
            {(phase === 'sweep' || phase === 'out') && (
              <motion.div
                initial={{ left: '-30%' }}
                animate={{ left: '130%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-[40%] pointer-events-none"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)',
                }}
              />
            )}
          </div>
        </motion.div>

        {/* Skip button */}
        {showSkip && phase !== 'out' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            whileHover={{ opacity: 1 }}
            onClick={finish}
            className="absolute top-6 right-6 text-xs font-mono px-3 py-1.5 rounded-full border transition-colors"
            style={{
              color: 'hsl(var(--muted-foreground))',
              borderColor: 'hsl(var(--border))',
            }}
          >
            Pular
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export const shouldShowIntro = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return false;
  }
};
