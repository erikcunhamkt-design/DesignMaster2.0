import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Loader2, Plus, MessageSquare, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AgentChatInput } from '@/components/chat/AgentChatInput';
import { CopyMessageButton } from '@/components/chat/CopyMessageButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Msg = { role: 'user' | 'assistant'; content: string };

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const AGENT_ID = 'editorial';
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-editorial`;

const SUGGESTIONS = [
  '📋 Crie linhas editoriais para um designer gráfico freelancer',
  '🎯 Linhas editoriais para uma marca de cosméticos naturais',
  '🏋️ Monte pilares de conteúdo para um personal trainer online',
  '💼 Linhas editoriais para um consultor de negócios digitais',
  '🍕 Crie linhas editoriais para uma pizzaria artesanal',
];

export default function EditorialChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { apiKey } = useGoogleApiKey();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_id', AGENT_ID)
      .order('updated_at', { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }, [user]);

  const loadMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (activeConvoId) loadMessages(activeConvoId);
    else setMessages([]);
  }, [activeConvoId, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const createConversation = async (firstMessage?: string) => {
    if (!user) return null;
    const title = firstMessage
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '…' : '')
      : 'Nova conversa';
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id, title, agent_id: AGENT_ID } as any)
      .select()
      .single();
    if (error || !data) { toast.error('Erro ao criar conversa'); return null; }
    const convo = data as Conversation;
    setConversations((prev) => [convo, ...prev]);
    setActiveConvoId(convo.id);
    setMessages([]);
    return convo.id;
  };

  const handleNewChat = () => { setActiveConvoId(null); setMessages([]); };
  const handleSelectConvo = (id: string) => { setActiveConvoId(id); };

  const handleDeleteConvo = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('conversation_id', id);
    await supabase.from('chat_conversations').delete().eq('id', id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvoId === id) { setActiveConvoId(null); setMessages([]); }
    toast.success('Conversa excluída');
  };

  const handleDeleteAll = async () => {
    if (!user || conversations.length === 0) return;
    for (const c of conversations) {
      await supabase.from('chat_messages').delete().eq('conversation_id', c.id);
    }
    await supabase.from('chat_conversations').delete().eq('user_id', user.id).eq('agent_id', AGENT_ID);
    setConversations([]);
    setActiveConvoId(null);
    setMessages([]);
    toast.success('Todas as conversas foram excluídas');
  };

  const handleRenameConvo = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await supabase.from('chat_conversations').update({ title: newTitle.trim() }).eq('id', id);
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: newTitle.trim() } : c));
    setEditingId(null);
  };

  const saveMessage = async (convoId: string, role: 'user' | 'assistant', content: string) => {
    await supabase.from('chat_messages').insert({ conversation_id: convoId, role, content });
    await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convoId);
  };

  const send = async (text?: string, attachments?: { url: string; type: string; name: string }[]) => {
    let msg = (text || input).trim();
    if (attachments?.length) {
      const lines = attachments.map(a => a.type === 'image' ? `[Imagem: ${a.url}]` : a.type === 'audio' ? `[Áudio: ${a.url}]` : `[Documento "${a.name}": ${a.url}]`).join('\n');
      msg = msg ? `${msg}\n\n${lines}` : lines;
    }
    if (!msg || isLoading) return;

    if (!apiKey || apiKey.length < 10) {
      toast.error('Configure sua API Key do Google no botão API no topo.');
      return;
    }

    let convoId = activeConvoId;
    if (!convoId) { convoId = await createConversation(msg); if (!convoId) return; }

    const userMsg: Msg = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    await saveMessage(convoId, 'user', msg);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, googleApiKey: apiKey }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }
      if (!resp.body) throw new Error('Sem resposta');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      if (assistantSoFar) await saveMessage(convoId, 'assistant', assistantSoFar);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao enviar mensagem');
      if (!assistantSoFar) setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      loadConversations();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = async () => {
    if (activeConvoId) await handleDeleteConvo(activeConvoId);
    else setMessages([]);
    toast.success('Chat limpo');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Estrategista Editorial" showApiKey={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            'flex flex-col border-r border-border/15 bg-card/30 backdrop-blur-sm transition-all duration-300 shrink-0',
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          )}
        >
          <div className="p-3 border-b border-border/10 space-y-2">
            <Button onClick={handleNewChat} variant="outline" className="w-full gap-2 h-9 text-xs font-semibold rounded-xl border-border/20 bg-secondary/30 hover:bg-secondary/50">
              <Plus className="h-3.5 w-3.5" /> Nova conversa
            </Button>
            {conversations.length > 0 && (
              <Button onClick={handleDeleteAll} variant="ghost" className="w-full gap-2 h-8 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
                <Trash2 className="h-3 w-3" /> Apagar todas
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {conversations.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/40 text-center py-8">Nenhuma conversa ainda</p>
              ) : (
                conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150',
                      activeConvoId === convo.id ? 'bg-primary/10 text-foreground' : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => handleSelectConvo(convo.id)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <div className="flex-1 min-w-0">
                      {editingId === convo.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameConvo(convo.id, editTitle);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 bg-transparent border-b border-primary/30 text-[11px] outline-none py-0.5"
                            autoFocus
                          />
                          <button onClick={() => handleRenameConvo(convo.id, editTitle)} className="p-0.5"><Check className="h-3 w-3 text-primary" /></button>
                          <button onClick={() => setEditingId(null)} className="p-0.5"><X className="h-3 w-3 text-muted-foreground" /></button>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] font-medium truncate leading-tight">{convo.title}</p>
                          <p className="text-[9px] text-muted-foreground/40 mt-0.5">{formatDate(convo.updated_at)}</p>
                        </>
                      )}
                    </div>
                    {editingId !== convo.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-secondary/60 transition-opacity">
                            <MoreHorizontal className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingId(convo.id); setEditTitle(convo.title); }}>
                            <Pencil className="h-3 w-3 mr-2" /> Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteConvo(convo.id); }}>
                            <Trash className="h-3 w-3 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-card/60 border border-border/15 rounded-r-lg p-1.5 hover:bg-card/80 transition-all"
          style={{ left: sidebarOpen ? '256px' : '0px', transition: 'left 0.3s' }}
        >
          {sidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 animate-fade-up">
                <div className="text-6xl">📰</div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold font-display text-foreground">Estrategista Editorial</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Especialista exclusivo em criação de linhas editoriais estratégicas. Me conte sobre seu negócio e eu construo seus pilares de conteúdo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 max-w-xl justify-center">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="rounded-xl border border-border/30 bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/80 transition-all duration-200 text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('group flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">📰</div>
                    )}
                    <div className={cn('rounded-2xl px-4 py-3 max-w-[85%] text-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card/60 border border-border/20 rounded-bl-md')}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h2]:mt-6 [&>h2]:mb-2 [&>h2]:text-primary [&>h2]:text-base [&>h2]:font-bold [&>hr]:my-5 [&>hr]:border-border/30 [&>p]:mb-3 [&>ul]:mb-3 [&>blockquote]:border-l-primary/40 [&>blockquote]:bg-primary/5 [&>blockquote]:rounded-r-lg [&>blockquote]:py-1 [&>blockquote]:px-3">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap select-text">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'assistant' && <CopyMessageButton content={msg.content} />}
                    {msg.role === 'user' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">EU</div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">📰</div>
                    <div className="rounded-2xl px-4 py-3 bg-card/60 border border-border/20 rounded-bl-md">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Pensando...</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border/15 bg-card/20 backdrop-blur-sm p-3 md:p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descreva seu negócio, nicho, público e objetivos..."
                className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border-border/20 bg-secondary/30 text-sm placeholder:text-muted-foreground/40 focus:border-primary/30 focus:ring-primary/20"
                rows={1}
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  onClick={() => send()}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-[44px] w-[44px] rounded-xl bg-primary hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-30 disabled:shadow-none"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                {messages.length > 0 && (
                  <Button onClick={clearChat} size="icon" variant="ghost" className="h-7 w-[44px] rounded-lg text-muted-foreground/40 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
