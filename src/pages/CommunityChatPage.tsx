import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Send, Trash2, Loader2, Users, Shield, AlertTriangle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useFriendships } from '@/hooks/useFriendships';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChatMediaInput, MediaMessageContent } from '@/components/chat/ChatMediaInput';
import { UsernameSetupDialog } from '@/components/chat/UsernameSetupDialog';
import { UserProfilePopover } from '@/components/chat/UserProfilePopover';
import { DashboardSidebar, MobileSidebarTrigger } from '@/components/layout/DashboardSidebar';

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
  username?: string | null;
  title?: string | null;
  cargo?: string | null;
}

type ChatStatus = 'active' | 'muted' | 'banned';

// Memoized message bubble
const MessageBubble = memo(function MessageBubble({
  msg, isOwn, isAdmin, profile, friendStatus, onDelete, onAddFriend, onAcceptFriend, onStartConversation,
}: {
  msg: CommunityMessage;
  isOwn: boolean;
  isAdmin: boolean;
  profile: Profile | null;
  friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
  onDelete: () => void;
  onAddFriend: () => void;
  onAcceptFriend: () => void;
  onStartConversation: () => void;
}) {
  const name = profile?.display_name || 'Usuário';
  const uname = profile?.username || null;
  const cargo = profile?.cargo || null;
  const title = profile?.title || null;
  const initials = name.slice(0, 2).toUpperCase();
  const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getTitleBadge = (t: string) => {
    const lower = t.toLowerCase();
    if (lower.includes('master')) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-amber-400/40 shadow-[0_0_6px_rgba(251,191,36,0.25)]"
          style={{ backgroundImage: 'linear-gradient(135deg, #92400e22, #f59e0b33, #92400e22)', color: '#fbbf24' }}>
          👑 {t}
        </span>
      );
    }
    if (lower.includes('fundador') || lower.includes('founder')) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-slate-400/30"
          style={{ backgroundImage: 'linear-gradient(135deg, #47556922, #94a3b833, #47556922)', color: '#cbd5e1' }}>
          ⚜️ {t}
        </span>
      );
    }
    return <span className="text-[8px] font-medium bg-accent/30 text-accent-foreground/70 px-1.5 py-0.5 rounded-full">{t}</span>;
  };

  const cargoColors: Record<string, string> = {
    'Administrador': 'bg-destructive/15 text-destructive',
    'Moderador': 'bg-amber-500/15 text-amber-400',
    'Suporte': 'bg-blue-500/15 text-blue-400',
    'Designer': 'bg-emerald-500/15 text-emerald-400',
    'Editor': 'bg-purple-500/15 text-purple-400',
    'Curador': 'bg-yellow-500/15 text-yellow-400',
  };

  return (
    <div className={cn('group flex gap-2.5', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <UserProfilePopover
          userId={msg.user_id} displayName={name} username={uname}
          friendStatus={friendStatus} onAddFriend={onAddFriend}
          onAcceptFriend={onAcceptFriend} onStartConversation={onStartConversation}
        >
          <button className="shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary mt-0.5 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
            {initials}
          </button>
        </UserProfilePopover>
      )}
      <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Name + badges for ALL messages */}
        <div className={cn('mb-0.5 ml-1 inline-flex items-center gap-1.5 flex-wrap', isOwn && 'justify-end mr-1 ml-0')}>
          {isOwn ? (
            <span className="text-[10px] font-semibold text-primary/70">{name}</span>
          ) : (
            <UserProfilePopover
              userId={msg.user_id} displayName={name} username={uname}
              friendStatus={friendStatus} onAddFriend={onAddFriend}
              onAcceptFriend={onAcceptFriend} onStartConversation={onStartConversation}
            >
              <button className="text-[10px] font-semibold text-primary/70 hover:text-primary cursor-pointer transition-colors">
                {name} {uname && <span className="text-muted-foreground/50">@{uname}</span>}
              </button>
            </UserProfilePopover>
          )}
          {cargo && (
            <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded-full', cargoColors[cargo] || 'bg-primary/15 text-primary')}>
              {cargo}
            </span>
          )}
          {title && getTitleBadge(title)}
        </div>

        <div className={cn(
          'rounded-2xl px-3.5 py-2 text-sm relative',
          isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card/60 border border-border/20 rounded-bl-md text-foreground'
        )}>
          {msg.message_type !== 'text' && msg.media_url ? (
            <MediaMessageContent type={msg.message_type} url={msg.media_url} />
          ) : (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          )}
          <p className={cn('text-[9px] mt-1 text-right', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/40')}>{time}</p>
        </div>
      </div>
      {isAdmin && !isOwn && (
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 transition-opacity self-center" title="Excluir">
          <Trash2 className="h-3 w-3 text-destructive/60" />
        </button>
      )}
      {isOwn && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary mt-0.5">{initials}</div>
      )}
    </div>
  );
});

export default function CommunityChatPage() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const profilesRef = useRef<Record<string, Profile>>({});
  const [profilesVersion, setProfilesVersion] = useState(0);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>('active');
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(true);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { sendRequest, acceptRequest, getFriendStatus, getFriendshipId } = useFriendships();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profile helpers using ref to avoid dependency loops
  const addProfiles = useCallback((newProfiles: Profile[]) => {
    let changed = false;
    newProfiles.forEach(p => {
      if (!profilesRef.current[p.id]) { profilesRef.current[p.id] = p; changed = true; }
    });
    if (changed) setProfilesVersion(v => v + 1);
  }, []);

  const loadProfiles = useCallback(async (userIds: string[]) => {
    const uniqueIds = [...new Set(userIds)].filter(id => !profilesRef.current[id]);
    if (uniqueIds.length === 0) return;
    const { data } = await supabase.from('profiles').select('*').in('id', uniqueIds);
    if (data) addProfiles(data as Profile[]);
  }, [addProfiles]);

  const ensureProfile = useCallback(async () => {
    if (!user) return;
    setCheckingUsername(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!data) {
      const displayName = user.email?.split('@')[0] || 'Usuário';
      await supabase.from('profiles').insert({ id: user.id, display_name: displayName } as any);
      setNeedsUsername(true);
    } else {
      addProfiles([data as Profile]);
      setNeedsUsername(!(data as any).username);
    }
    setCheckingUsername(false);
  }, [user, addProfiles]);

  const loadChatStatus = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('chat_user_status').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      const s = data as any;
      if (s.status === 'muted' && s.muted_until && new Date(s.muted_until) < new Date()) setChatStatus('active');
      else { setChatStatus(s.status); setMutedUntil(s.muted_until); }
    }
  }, [user]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from('community_messages').select('*').order('created_at', { ascending: true }).limit(200);
    if (data) setMessages(data as CommunityMessage[]);
  }, []);

  useEffect(() => { ensureProfile(); loadChatStatus(); loadMessages(); }, [ensureProfile, loadChatStatus, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) loadProfiles(messages.map(m => m.user_id));
  }, [messages.length, loadProfiles]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('community-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
        const newMsg = payload.new as CommunityMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev.filter(m => !(m.user_id === newMsg.user_id && m.content === newMsg.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000)), newMsg];
        });
        if (!profilesRef.current[newMsg.user_id]) {
          supabase.from('profiles').select('*').eq('id', newMsg.user_id).single().then(({ data }) => {
            if (data) addProfiles([data as Profile]);
          });
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();

    const presenceChannel = supabase.channel('community-presence', { config: { presence: { key: user?.id || 'anon' } } });
    presenceChannel.on('presence', { event: 'sync' }, () => { setOnlineCount(Object.keys(presenceChannel.presenceState()).length); })
      .subscribe(async (status) => { if (status === 'SUBSCRIBED' && user) await presenceChannel.track({ user_id: user.id }); });

    return () => { supabase.removeChannel(channel); supabase.removeChannel(presenceChannel); };
  }, [user?.id, addProfiles]);

  const sendMessage = useCallback(async (mediaUrl?: string, mediaType?: 'image' | 'audio') => {
    const msg = input.trim();
    const isMedia = !!mediaUrl;
    if (!isMedia && !msg) return;
    if (isLoading || !user) return;
    if (chatStatus === 'banned') { toast.error('Você foi banido do chat.'); return; }
    if (chatStatus === 'muted') { toast.error('Você está silenciado.'); return; }
    setInput('');
    setIsLoading(true);
    const msgType = isMedia ? mediaType! : 'text';
    const content = isMedia ? (mediaType === 'image' ? '📷 Imagem' : '🎵 Áudio') : msg;
    const optimistic: CommunityMessage = { id: crypto.randomUUID(), user_id: user.id, content, message_type: msgType, media_url: mediaUrl || null, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    const { error } = await supabase.from('community_messages').insert({ user_id: user.id, content, message_type: msgType, media_url: mediaUrl || null } as any);
    if (error) { toast.error('Erro ao enviar.'); setMessages(prev => prev.filter(m => m.id !== optimistic.id)); if (!isMedia) setInput(msg); }
    setIsLoading(false);
  }, [input, isLoading, user, chatStatus]);

  const deleteMessage = useCallback(async (msgId: string) => {
    await supabase.from('community_messages').delete().eq('id', msgId);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  // Memoized grouped messages
  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: CommunityMessage[] }[] = [];
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    messages.forEach(msg => {
      const d = new Date(msg.created_at);
      let date: string;
      if (d.toDateString() === today.toDateString()) date = 'Hoje';
      else if (d.toDateString() === yesterday.toDateString()) date = 'Ontem';
      else date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const last = groups[groups.length - 1];
      if (last && last.date === date) last.msgs.push(msg);
      else groups.push({ date, msgs: [msg] });
    });
    return groups;
  }, [messages]);

  const isBanned = chatStatus === 'banned';
  const isMuted = chatStatus === 'muted';

  if (checkingUsername) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <DashboardSidebar activeSection="social" onSectionChange={() => {}} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      {needsUsername && user && (
        <UsernameSetupDialog userId={user.id} onComplete={() => setNeedsUsername(false)} />
      )}
      <StudioTopbar title="Arena Social" showApiKey={false} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/15 bg-card/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /><span>{onlineCount} online</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/studio/direct-messages')} className="flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
              <Mail className="h-3 w-3" /> DMs
            </button>
            {isBanned && <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><Shield className="h-3 w-3" /> Banido</span>}
            {isMuted && <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full"><AlertTriangle className="h-3 w-3" /> Silenciado</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4 animate-fade-up">
              <div className="text-5xl">💬</div>
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold font-display text-foreground">Arena Social</h2>
                <p className="text-sm text-muted-foreground max-w-sm">Chat da comunidade em tempo real.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {groupedMessages.map((group, gi) => (
                <div key={gi}>
                  <div className="flex justify-center my-4">
                    <span className="text-[10px] text-muted-foreground/50 bg-card/40 px-3 py-1 rounded-full border border-border/10">{group.date}</span>
                  </div>
                  <div className="space-y-2">
                    {group.msgs.map(msg => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isOwn={msg.user_id === user?.id}
                        isAdmin={isAdmin}
                        profile={profilesRef.current[msg.user_id] || null}
                        friendStatus={msg.user_id === user?.id ? 'accepted' : getFriendStatus(msg.user_id)}
                        onDelete={() => deleteMessage(msg.id)}
                        onAddFriend={() => sendRequest(msg.user_id)}
                        onAcceptFriend={() => { const fId = getFriendshipId(msg.user_id); if (fId) acceptRequest(fId); }}
                        onStartConversation={() => navigate('/studio/direct-messages')}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/15 bg-card/20 backdrop-blur-sm p-3 md:p-4">
          {isBanned ? (
            <div className="max-w-3xl mx-auto text-center text-xs text-destructive py-2"><Shield className="h-4 w-4 inline mr-1" />Você foi banido do chat.</div>
          ) : isMuted ? (
            <div className="max-w-3xl mx-auto text-center text-xs text-amber-500 py-2"><AlertTriangle className="h-4 w-4 inline mr-1" />Você está silenciado{mutedUntil ? ` até ${new Date(mutedUntil).toLocaleString('pt-BR')}` : ''}.</div>
          ) : (
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <ChatMediaInput onMediaSent={(url, type) => sendMessage(url, type)} onEmojiSelect={(emoji) => setInput(prev => prev + emoji)} disabled={isLoading} />
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite sua mensagem..." className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border-border/20 bg-secondary/30 text-sm placeholder:text-muted-foreground/40 focus:border-primary/30 focus:ring-primary/20" rows={1} />
              <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon" className="h-[44px] w-[44px] rounded-xl bg-primary hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-30 disabled:shadow-none">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
