import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PublicOrDashboardProps {
  publicPage: ReactNode;
  dashboardPage: ReactNode;
}

export function PublicOrDashboard({ publicPage, dashboardPage }: PublicOrDashboardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <>{publicPage}</>;

  return <>{dashboardPage}</>;
}
