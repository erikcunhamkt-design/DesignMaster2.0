import { useState, useEffect } from 'react';
import { useLicense } from '@/hooks/useLicense';
import { Timer } from 'lucide-react';

export function LicenseCountdown() {
  const { license } = useLicense();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!license?.expires_at) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [license?.expires_at]);

  if (!license?.expires_at) return null;

  const diff = new Date(license.expires_at).getTime() - now;
  if (diff <= 0) return null; // expired state handled by ProtectedRoute

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  let label: string;
  let urgent = false;

  if (days > 0) {
    label = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m ${seconds}s`;
    urgent = hours < 2;
  } else {
    label = `${minutes}m ${seconds}s`;
    urgent = true;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono shadow-lg backdrop-blur-md border transition-colors ${
        urgent
          ? 'bg-destructive/15 text-destructive border-destructive/30'
          : 'bg-secondary/80 text-muted-foreground border-border/40'
      }`}
    >
      <Timer className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  );
}
