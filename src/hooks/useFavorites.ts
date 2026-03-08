import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch favorites
  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_favorites')
        .select('studio_id')
        .eq('user_id', user.id);

      setFavorites(new Set((data || []).map((r: any) => r.studio_id)));
      setLoading(false);
    };

    fetch();
  }, [user]);

  const toggleFavorite = useCallback(async (studioId: string) => {
    if (!user) return;

    const isFav = favorites.has(studioId);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(studioId);
      else next.add(studioId);
      return next;
    });

    if (isFav) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('studio_id', studioId);
    } else {
      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, studio_id: studioId });
    }
  }, [user, favorites]);

  const isFavorite = useCallback((studioId: string) => favorites.has(studioId), [favorites]);

  return { favorites, loading, toggleFavorite, isFavorite };
}
