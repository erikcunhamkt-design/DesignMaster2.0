import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useFriendships() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`) as any;

    if (data) {
      const all = data as Friendship[];
      setFriends(all.filter(f => f.status === 'accepted'));
      setPendingReceived(all.filter(f => f.status === 'pending' && f.addressee_id === user.id));
      setPendingSent(all.filter(f => f.status === 'pending' && f.requester_id === user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('friendships-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
    } as any);
    if (error) {
      if (error.code === '23505') toast.error('Solicitação já enviada');
      else toast.error('Erro ao enviar solicitação');
      return;
    }
    toast.success('Solicitação de amizade enviada!');
    load();
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' } as any)
      .eq('id', friendshipId);
    if (error) { toast.error('Erro ao aceitar'); return; }
    toast.success('Amizade aceita! 🎉');
    load();
  };

  const rejectRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' } as any)
      .eq('id', friendshipId);
    if (error) { toast.error('Erro ao rejeitar'); return; }
    toast.info('Solicitação rejeitada');
    load();
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) { toast.error('Erro ao remover amigo'); return; }
    toast.info('Amigo removido');
    load();
  };

  const getFriendStatus = (otherUserId: string): 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked' => {
    if (!user) return 'none';
    const all = [...friends, ...pendingReceived, ...pendingSent];
    const match = all.find(f =>
      (f.requester_id === otherUserId || f.addressee_id === otherUserId)
    );
    if (!match) return 'none';
    if (match.status === 'accepted') return 'accepted';
    if (match.status === 'blocked') return 'blocked';
    if (match.status === 'pending' && match.requester_id === user.id) return 'pending_sent';
    if (match.status === 'pending' && match.addressee_id === user.id) return 'pending_received';
    return 'none';
  };

  const getFriendshipId = (otherUserId: string): string | null => {
    const all = [...friends, ...pendingReceived, ...pendingSent];
    const match = all.find(f =>
      f.requester_id === otherUserId || f.addressee_id === otherUserId
    );
    return match?.id || null;
  };

  const getFriendIds = (): string[] => {
    if (!user) return [];
    return friends.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
  };

  return {
    friends, pendingReceived, pendingSent, loading,
    sendRequest, acceptRequest, rejectRequest, removeFriend,
    getFriendStatus, getFriendshipId, getFriendIds, reload: load,
  };
}
