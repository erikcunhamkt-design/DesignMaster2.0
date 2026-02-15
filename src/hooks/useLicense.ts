import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface License {
  user_id: string;
  email: string | null;
  plan: string;
  status: string;
  expires_at: string | null;
}

export function useLicense() {
  const { user, loading: authLoading } = useAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLicense(null);
      setLoading(false);
      return;
    }

    const fetchLicense = async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setLicense(data as License);
      }
      setLoading(false);
    };

    fetchLicense();
  }, [user, authLoading]);

  const isActive = (): boolean => {
    if (!license) return false;
    if (license.status !== 'active') return false;
    if (license.expires_at && new Date(license.expires_at) < new Date()) return false;
    return true;
  };

  return { license, loading: loading || authLoading, isActive };
}
