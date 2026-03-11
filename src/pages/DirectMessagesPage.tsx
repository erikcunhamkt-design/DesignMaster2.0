import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, ArrowLeft, MessageCircle, Plus, User, UserPlus, UserCheck, UserX, Users, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFriendships } from '@/hooks/useFriendships';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChatMediaInput, MediaMessageContent } from '@/components/chat/ChatMediaInput';

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  updated_at: string;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

type SidebarTab = 'conversations' | 'friends' | 'requests';

export default function DirectMessagesPage() {
  const { user } = useAuth();
  const {
    friends, pendingReceived, pendingSent,
    sendRequest, acceptRequest, rejectRequest, removeFriend,
    getFriendStatus, getFriendshipId, getFriendIds,
  } = useFriendships();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure own profile
  const ensureProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!data) {
      const displayName = user.email?.split('@')[0] || 'Usuário';
      await supabase.from('profiles').insert({ id: user.id, display_name: displayName } as any);
    }
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('direct_conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('updated_at', { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }, [user]);

  const loadProfiles = useCallback(async (userIds: string[]) => {
    const uniqueIds = [...new Set(userIds)].filter(id => !profiles[id]);
    if (uniqueIds.length === 0) return;
    const { data } = await supabase.from('profiles').select('*').in('id', uniqueIds);
    if (data) {
      const newProfiles: Record<string, Profile> = {};
      (data as Profile[]).forEach(p => newProfiles[p.id] = p);
      setProfiles(prev => ({ ...prev, ...newProfiles }));
    }
  }, [profiles]);

  const loadMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (data) setMessages(data as DirectMessage[]);
  }, []);

  useEffect(() => { ensureProfile(); loadConversations(); }, [ensureProfile, loadConversations]);

  // Load profiles for conversations + friends
  useEffect(() => {
    const ids: string[] = [];
    conversations.forEach(c => { ids.push(c.participant_1, c.participant_2); });
    friends.forEach(f => { ids.push(f.requester_id, f.addressee_id); });
    pendingReceived.forEach(f => ids.push(f.requester_id));
    pendingSent.forEach(f => ids.push(f.addressee_id));
    if (ids.length > 0) loadProfiles(ids);
  }, [conversations.length, friends.length, pendingReceived.length, pendingSent.length]);

  useEffect(() => {
    if (selectedConvo) loadMessages(selectedConvo.id);
  }, [selectedConvo?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dm-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const newMsg = payload.new as DirectMessage;
        if (selectedConvo && newMsg.conversation_id === selectedConvo.id) {
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        } else if (newMsg.sender_id !== user.id) {
          setUnreadMap(prev => ({
            ...prev,
            [newMsg.conversation_id]: (prev[newMsg.conversation_id] || 0) + 1,
          }));
          const showToast = async () => {
            let name = profiles[newMsg.sender_id]?.display_name;
            if (!name) {
              const { data } = await supabase.from('profiles').select('*').eq('id', newMsg.sender_id).maybeSingle();
              if (data) { name = (data as Profile).display_name; setProfiles(prev => ({ ...prev, [newMsg.sender_id]: data as Profile })); }
            }
            toast.info(`💬 Nova mensagem de ${name || 'alguém'}`);
          };
          showToast();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_conversations' }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, selectedConvo?.id]);

  useEffect(() => {
    if (selectedConvo) setUnreadMap(prev => { const c = { ...prev }; delete c[selectedConvo.id]; return c; });
  }, [selectedConvo?.id]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('display_name', `%${query}%`)
      .neq('id', user?.id || '')
      .limit(10);
    if (data) setSearchResults(data as Profile[]);
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    const existing = conversations.find(c =>
      (c.participant_1 === user.id && c.participant_2 === otherUserId) ||
      (c.participant_2 === user.id && c.participant_1 === otherUserId)
    );
    if (existing) { setSelectedConvo(existing); setShowSearch(false); setSearchQuery(''); setSearchResults([]); setSidebarTab('conversations'); return; }
    const { data, error } = await supabase.from('direct_conversations').insert({
      participant_1: user.id, participant_2: otherUserId,
    } as any).select().single();
    if (error) { toast.error('Erro ao iniciar conversa'); return; }
    const newConvo = data as Conversation;
    setConversations(prev => [newConvo, ...prev]);
    setSelectedConvo(newConvo);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSidebarTab('conversations');
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || isLoading || !user || !selectedConvo) return;
    setInput('');
    setIsLoading(true);
    const optimistic: DirectMessage = {
      id: crypto.randomUUID(), conversation_id: selectedConvo.id, sender_id: user.id,
      content: msg, message_type: 'text', media_url: null, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    const { error } = await supabase.from('direct_messages').insert({
      conversation_id: selectedConvo.id, sender_id: user.id, content: msg, message_type: 'text',
    } as any);
    if (error) { toast.error('Erro ao enviar'); setMessages(prev => prev.filter(m => m.id !== optimistic.id)); setInput(msg); }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const getOtherUserId = (convo: Conversation) =>
    convo.participant_1 === user?.id ? convo.participant_2 : convo.participant_1;
  const getName = (userId: string) => profiles[userId]?.display_name || 'Usuário';
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => {
    const dt = new Date(d); const today = new Date();
    if (dt.toDateString() === today.toDateString()) return 'Hoje';
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (dt.toDateString() === y.toDateString()) return 'Ontem';
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const groupedMessages: { date: string; msgs: DirectMessage[] }[] = [];
  messages.forEach(msg => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else groupedMessages.push({ date, msgs: [msg] });
  });

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  // Friend helpers
  const getOtherFriendId = (f: { requester_id: string; addressee_id: string }) =>
    f.requester_id === user?.id ? f.addressee_id : f.requester_id;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Mensagens Diretas" showApiKey={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border/15 flex flex-col bg-card/10",
          selectedConvo && "hidden md:flex"
        )}>
          {/* Tabs */}
          <div className="flex border-b border-border/15">
            {[
              { key: 'conversations' as SidebarTab, label: 'Conversas', icon: MessageCircle, badge: totalUnread },
              { key: 'friends' as SidebarTab, label: 'Amigos', icon: Users, badge: 0 },
              { key: 'requests' as SidebarTab, label: 'Pedidos', icon: UserPlus, badge: pendingReceived.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSidebarTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors relative",
                  sidebarTab === tab.key
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search (always visible for adding friends) */}
          {(showSearch || sidebarTab === 'friends') && (
            <div className="p-3 border-b border-border/15 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar usuários..."
                  className="h-9 text-sm bg-secondary/30 border-border/20 flex-1"
                />
                {showSearch && sidebarTab === 'conversations' && (
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map(p => {
                    const status = getFriendStatus(p.id);
                    return (
                      <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                          {getInitials(p.display_name)}
                        </div>
                        <span className="text-sm text-foreground font-medium truncate flex-1">{p.display_name}</span>
                        {status === 'none' && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary" onClick={() => sendRequest(p.id)}>
                            <UserPlus className="h-3 w-3" /> Adicionar
                          </Button>
                        )}
                        {status === 'pending_sent' && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Enviado</span>
                        )}
                        {status === 'accepted' && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => startConversation(p.id)}>
                            <MessageCircle className="h-3 w-3" /> Conversar
                          </Button>
                        )}
                        {status === 'pending_received' && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary" onClick={() => {
                            const fId = getFriendshipId(p.id);
                            if (fId) acceptRequest(fId);
                          }}>
                            <UserCheck className="h-3 w-3" /> Aceitar
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum usuário encontrado</p>
              )}
            </div>
          )}

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* CONVERSATIONS TAB */}
            {sidebarTab === 'conversations' && (
              <>
                {!showSearch && (
                  <div className="p-2 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setShowSearch(true)}>
                      <Plus className="h-3 w-3" /> Nova conversa
                    </Button>
                  </div>
                )}
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 p-6">
                    <User className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground text-center">Nenhuma conversa ainda.</p>
                  </div>
                ) : (
                  conversations.map(convo => {
                    const otherId = getOtherUserId(convo);
                    const name = getName(otherId);
                    const unread = unreadMap[convo.id] || 0;
                    const isSelected = selectedConvo?.id === convo.id;
                    return (
                      <button
                        key={convo.id}
                        onClick={() => setSelectedConvo(convo)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 border-b border-border/10 hover:bg-secondary/20 transition-colors text-left",
                          isSelected && "bg-primary/10"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                          <p className="text-[10px] text-muted-foreground/50">{formatDate(convo.updated_at)}</p>
                        </div>
                        {unread > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </>
            )}

            {/* FRIENDS TAB */}
            {sidebarTab === 'friends' && (
              <>
                {friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 p-6">
                    <Users className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground text-center">Nenhum amigo ainda.<br />Busque e adicione acima!</p>
                  </div>
                ) : (
                  friends.map(f => {
                    const otherId = getOtherFriendId(f);
                    const name = getName(otherId);
                    return (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 p-3 border-b border-border/10 hover:bg-secondary/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {getInitials(name)}
                        </div>
                        <span className="text-sm font-semibold text-foreground truncate flex-1">{name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] gap-1 text-primary"
                            onClick={() => startConversation(otherId)}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] gap-1 text-destructive/60 hover:text-destructive"
                            onClick={() => removeFriend(f.id)}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* REQUESTS TAB */}
            {sidebarTab === 'requests' && (
              <div className="space-y-1">
                {pendingReceived.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">Recebidos</p>
                    {pendingReceived.map(f => {
                      const name = getName(f.requester_id);
                      return (
                        <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/20 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {getInitials(name)}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate flex-1">{name}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary" onClick={() => acceptRequest(f.id)}>
                              <UserCheck className="h-3 w-3" /> Aceitar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-destructive/60" onClick={() => rejectRequest(f.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {pendingSent.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">Enviados</p>
                    {pendingSent.map(f => {
                      const name = getName(f.addressee_id);
                      return (
                        <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg">
                          <div className="w-9 h-9 rounded-full bg-muted/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                            {getInitials(name)}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate flex-1">{name}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Pendente
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {pendingReceived.length === 0 && pendingSent.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 p-6">
                    <UserPlus className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground text-center">Nenhuma solicitação pendente.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={cn("flex-1 flex flex-col", !selectedConvo && "hidden md:flex")}>
          {selectedConvo ? (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-border/15 bg-card/20">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSelectedConvo(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                  {getInitials(getName(getOtherUserId(selectedConvo)))}
                </div>
                <span className="text-sm font-bold text-foreground flex-1">
                  {getName(getOtherUserId(selectedConvo))}
                </span>
                {/* Add friend button in chat header if not friends */}
                {(() => {
                  const otherId = getOtherUserId(selectedConvo);
                  const status = getFriendStatus(otherId);
                  if (status === 'none') return (
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary" onClick={() => sendRequest(otherId)}>
                      <UserPlus className="h-3 w-3" /> Adicionar
                    </Button>
                  );
                  if (status === 'accepted') return (
                    <span className="text-[10px] text-primary/60 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Amigos</span>
                  );
                  if (status === 'pending_sent') return (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Solicitado</span>
                  );
                  return null;
                })()}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">Envie a primeira mensagem!</p>
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
                          {group.msgs.map(msg => {
                            const isOwn = msg.sender_id === user?.id;
                            return (
                              <div key={msg.id} className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                                <div className={cn(
                                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                                  isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-card/60 border border-border/20 rounded-bl-md text-foreground'
                                )}>
                                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                  <p className={cn('text-[9px] mt-1 text-right', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/40')}>
                                    {formatTime(msg.created_at)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border/15 bg-card/20 backdrop-blur-sm p-3">
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
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <MessageCircle className="h-14 w-14 text-muted-foreground/15" />
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-foreground">Mensagens Diretas</h2>
                <p className="text-xs text-muted-foreground max-w-xs">Selecione uma conversa, adicione amigos ou inicie uma nova.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
