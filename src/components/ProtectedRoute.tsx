import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLicense } from '@/hooks/useLicense';
import AuthPage from '@/pages/AuthPage';
import PaywallPage from '@/pages/PaywallPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { loading: licenseLoading, isActive } = useLicense();

  if (authLoading || licenseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (!isActive()) return <PaywallPage />;

  return <>{children}</>;
}
