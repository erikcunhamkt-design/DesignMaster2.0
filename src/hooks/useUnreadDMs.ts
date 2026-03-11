import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook that listens to realtime DM inserts and counts unread messages.
 * Returns total unread count for badge display.
 */
export function useUnreadDMs() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen for new DMs not from current user
    const channel = supabase
      .channel('global-dm-unread')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const clearUnread = () => setUnreadCount(0);

  return { unreadCount, clearUnread };
}
