import { studios } from '@/data/studios';
import { StudioCard } from '@/components/StudioCard';
import logoImg from '@/assets/logo.png';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function StudiosPage() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/4 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-accent/3 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(hsl(220 12% 20%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 12% 20%) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex h-14 items-center px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="Design Master" className="h-8 w-8 rounded-lg shadow-glow-sm" />
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            Design<span className="text-gradient">Master</span>
          </span>
          <SubscriptionBadge />
        </div>
        <div className="flex-1" />
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </button>
        )}
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pb-12">
        <div className="text-center space-y-3 mb-12 mt-8 animate-fade-up">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-6xl font-display">
            Studios
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-lg mx-auto">
            Escolha seu studio e comece a criar
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-6xl animate-fade-up"
          style={{ animationDelay: '100ms' }}
        >
          {studios.map((studio, i) => (
            <StudioCard key={studio.id} studio={studio} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
