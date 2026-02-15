import { useLicense } from '@/hooks/useLicense';
import { Crown, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

function getTimeRemaining(expiresAt: string | null, plan: string): { label: string; urgent: boolean } {
  if (plan === 'lifetime') return { label: 'Vitalício', urgent: false };
  if (!expiresAt) return { label: 'Ativo', urgent: false };

  const now = new Date().getTime();
  const exp = new Date(expiresAt).getTime();
  const diff = exp - now;

  if (diff <= 0) return { label: 'Expirado', urgent: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 30) return { label: `${days}d restantes`, urgent: false };
  if (days > 0) return { label: `${days}d ${hours}h`, urgent: days <= 7 };
  return { label: `${hours}h`, urgent: true };
}

export function SubscriptionBadge({ compact = false }: { compact?: boolean }) {
  const { license, loading } = useLicense();

  if (loading || !license || license.status !== 'active') return null;

  const { label, urgent } = getTimeRemaining(license.expires_at, license.plan);
  const isLifetime = license.plan === 'lifetime';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold tracking-wider uppercase transition-all border',
        isLifetime
          ? 'bg-primary/8 text-primary/80 border-primary/20'
          : urgent
          ? 'bg-destructive/8 text-destructive/80 border-destructive/20'
          : 'bg-accent/8 text-accent-foreground/70 border-accent/20'
      )}
    >
      {isLifetime ? (
        <Crown className="h-2.5 w-2.5" />
      ) : urgent ? (
        <AlertTriangle className="h-2.5 w-2.5" />
      ) : (
        <Clock className="h-2.5 w-2.5" />
      )}
      {!compact && <span>{label}</span>}
    </div>
  );
}
