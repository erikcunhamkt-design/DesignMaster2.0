import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Loader2, Users, MessageCircle, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommunityMessage {
  id: string;
  user_id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

type ChatStatus = 'active' | 'muted' | 'banned';

export default function CommunityChatPage() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>('active');
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure profile exists
  const ensureProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!data) {
      const displayName = user.email?.split('@')[0] || 'Usuário';
      await supabase.from('profiles').insert({ id: user.id, display_name: displayName } as any);
    }
  }, [user]);

  // Load chat status
  const loadChatStatus = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('chat_user_status').select('*').eq('user_id', user.id).single();
    if (data) {
      const status = data as any;
      if (status.status === 'muted' && status.muted_until && new Date(status.muted_until) < new Date()) {
        setChatStatus('active');
      } else {
        setChatStatus(status.status);
        setMutedUntil(status.muted_until);
      }
    }
  }, [user]);

  // Load messages
  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200);
    if (data) setMessages(data as CommunityMessage[]);
  }, []);

  // Load profiles for message authors
  const loadProfiles = useCallback(async (userIds: string[]) => {
    const uniqueIds = [...new Set(userIds)].filter(id => !profiles[id]);
    if (uniqueIds.length === 0) return;
    const { data } = await supabase.from('profiles').select('*').in('id', uniqueIds);
    if (data) {
      const newProfiles: Record<string, Profile> = { ...profiles };
      (data as Profile[]).forEach(p => newProfiles[p.id] = p);
      setProfiles(newProfiles);
    }
  }, [profiles]);

  useEffect(() => { ensureProfile(); loadChatStatus(); loadMessages(); }, [ensureProfile, loadChatStatus, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      loadProfiles(messages.map(m => m.user_id));
    }
  }, [messages.length]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('community-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
        const newMsg = payload.new as CommunityMessage;
        setMessages(prev => [...prev, newMsg]);
        // Load profile if needed
        if (!profiles[newMsg.user_id]) {
          supabase.from('profiles').select('*').eq('id', newMsg.user_id).single().then(({ data }) => {
            if (data) setProfiles(prev => ({ ...prev, [newMsg.user_id]: data as Profile }));
          });
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, (payload) => {
        const deletedId = (payload.old as any).id;
        setMessages(prev => prev.filter(m => m.id !== deletedId));
      })
      .subscribe();

    // Presence for online count
    const presenceChannel = supabase.channel('community-presence', {
      config: { presence: { key: user?.id || 'anon' } }
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(presenceChannel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await presenceChannel.track({ user_id: user.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id]);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || isLoading || !user) return;

    if (chatStatus === 'banned') {
      toast.error('Você foi banido do chat.');
      return;
    }
    if (chatStatus === 'muted') {
      const until = mutedUntil ? new Date(mutedUntil).toLocaleString('pt-BR') : '';
      toast.error(`Você está silenciado${until ? ` até ${until}` : ''}.`);
      return;
    }

    setInput('');
    setIsLoading(true);

    const { error } = await supabase.from('community_messages').insert({
      user_id: user.id,
      content: msg,
      message_type: 'text',
    } as any);

    if (error) {
      toast.error('Erro ao enviar mensagem. Verifique seu status.');
      setInput(msg);
    }
    setIsLoading(false);
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from('community_messages').delete().eq('id', msgId);
    toast.success('Mensagem excluída');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const getDisplayName = (userId: string) => profiles[userId]?.display_name || 'Usuário';
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: CommunityMessage[] }[] = [];
  messages.forEach(msg => {
    const date = formatDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  const isBanned = chatStatus === 'banned';
  const isMuted = chatStatus === 'muted';

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Arena Social" showApiKey={false} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/15 bg-card/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{onlineCount} online</span>
          </div>
          <div className="flex items-center gap-2">
            {isBanned && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                <Shield className="h-3 w-3" /> Banido
              </span>
            )}
            {isMuted && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" /> Silenciado
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4 animate-fade-up">
              <div className="text-5xl">💬</div>
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold font-display text-foreground">Arena Social</h2>
                <p className="text-sm text-muted-foreground max-w-sm">Chat da comunidade. Converse com outros membros em tempo real.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {groupedMessages.map((group, gi) => (
                <div key={gi}>
                  <div className="flex justify-center my-4">
                    <span className="text-[10px] text-muted-foreground/50 bg-card/40 px-3 py-1 rounded-full border border-border/10">
                      {group.date}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.msgs.map((msg) => {
                      const isOwn = msg.user_id === user?.id;
                      const name = getDisplayName(msg.user_id);
                      return (
                        <div key={msg.id} className={cn('group flex gap-2.5', isOwn ? 'justify-end' : 'justify-start')}>
                          {!isOwn && (
                            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary mt-0.5">
                              {getInitials(name)}
                            </div>
                          )}
                          <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
                            {!isOwn && (
                              <p className="text-[10px] font-semibold text-muted-foreground/60 mb-0.5 ml-1">{name}</p>
                            )}
                            <div className={cn(
                              'rounded-2xl px-3.5 py-2 text-sm relative',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-card/60 border border-border/20 rounded-bl-md text-foreground'
                            )}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={cn(
                                'text-[9px] mt-1 text-right',
                                isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/40'
                              )}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                          {(isOwn || isAdmin) && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 transition-opacity self-center"
                              title="Excluir mensagem"
                            >
                              <Trash2 className="h-3 w-3 text-destructive/60" />
                            </button>
                          )}
                          {isOwn && (
                            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary mt-0.5">
                              EU
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border/15 bg-card/20 backdrop-blur-sm p-3 md:p-4">
          {isBanned ? (
            <div className="max-w-3xl mx-auto text-center text-xs text-destructive py-2">
              <Shield className="h-4 w-4 inline mr-1" />
              Você foi banido do chat. Contate um administrador.
            </div>
          ) : isMuted ? (
            <div className="max-w-3xl mx-auto text-center text-xs text-amber-500 py-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Você está silenciado{mutedUntil ? ` até ${new Date(mutedUntil).toLocaleString('pt-BR')}` : ''}.
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border-border/20 bg-secondary/30 text-sm placeholder:text-muted-foreground/40 focus:border-primary/30 focus:ring-primary/20"
                rows={1}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-[44px] w-[44px] rounded-xl bg-primary hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-30 disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
