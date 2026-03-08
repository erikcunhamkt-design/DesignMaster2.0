import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useRecentTools() {
  const { user } = useAuth();
  const [recents, setRecents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecents([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_recent_tools')
        .select('studio_id, used_at')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false })
        .limit(10);

      setRecents((data || []).map((r: any) => r.studio_id));
      setLoading(false);
    };

    fetch();
  }, [user]);

  const trackUsage = useCallback(async (studioId: string) => {
    if (!user) return;

    // Optimistic: move to front
    setRecents((prev) => [studioId, ...prev.filter((id) => id !== studioId)].slice(0, 10));

    // Upsert: insert or update used_at
    const { error } = await supabase
      .from('user_recent_tools')
      .upsert(
        { user_id: user.id, studio_id: studioId, used_at: new Date().toISOString() },
        { onConflict: 'user_id,studio_id' }
      );

    if (error) {
      console.error('Failed to track tool usage:', error);
    }
  }, [user]);

  return { recents, loading, trackUsage };
}
