import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface GeneratingAnimationProps {
  /** Icon component (e.g. Crown, Camera) */
  icon: LucideIcon;
  /** Main loading text */
  title: string;
  /** Subtitle / description */
  subtitle: string;
  /** Optional emoji to show instead of icon inside spinner */
  emoji?: string;
}

export function GeneratingAnimation({ icon: Icon, title, subtitle, emoji }: GeneratingAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Animated icon container */}
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 animate-breathe" />
        <div className="absolute inset-[3px] rounded-[22px] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            {emoji ? (
              <span className="absolute inset-0 flex items-center justify-center text-xl">{emoji}</span>
            ) : (
              <Icon className="absolute inset-0 m-auto h-5 w-5 text-primary/60" />
            )}
          </div>
        </div>
        {/* Orbiting dots */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary/40"
            animate={{
              x: [0, 20 * Math.cos((i * 2 * Math.PI) / 3), -20 * Math.cos((i * 2 * Math.PI) / 3), 0],
              y: [0, 20 * Math.sin((i * 2 * Math.PI) / 3), -20 * Math.sin((i * 2 * Math.PI) / 3), 0],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
          />
        ))}
      </div>

      {/* Text */}
      <div className="text-center space-y-2">
        <p className="font-display text-base font-bold tracking-tight text-foreground/70">{title}</p>
        <p className="text-[11px] text-muted-foreground/40">{subtitle}</p>
      </div>

      {/* Progress bar */}
      <div className="w-52 h-1 rounded-full overflow-hidden bg-border/15">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-accent/60"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '40%' }}
        />
      </div>
    </motion.div>
  );
}
