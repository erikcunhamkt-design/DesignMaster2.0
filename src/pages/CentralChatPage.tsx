import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Eye, Search, Bot, ChevronDown, Sparkles } from 'lucide-react';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AgentChatInput } from '@/components/chat/AgentChatInput';
import { CopyMessageButton } from '@/components/chat/CopyMessageButton';
import { UserMessageContent, AssistantMessageContent } from '@/components/chat/MessageContent';
import { TypingDots } from '@/components/chat/TypingDots';
import { SelectionCopyTooltip } from '@/components/chat/SelectionCopyTooltip';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { DashboardSidebar, MobileSidebarTrigger } from '@/components/layout/DashboardSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

type Msg = { role: 'user' | 'assistant'; content: string };
interface Conversation { id: string; title: string; created_at: string; updated_at: string; is_pinned?: boolean; }

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-hub`;
const AGENT_ID = 'hub';

// Available Gemini models (Google API direct)
const MODELS = [
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', desc: 'Raciocínio avançado' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', desc: 'Rápido e equilibrado' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'Multimodal + contexto longo' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Custo-benefício' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', desc: 'Ultra rápido' },
];

const AGENTS = [
  { id: 'general', label: 'Assistente Geral', emoji: '🤖', desc: 'IA versátil para qualquer tarefa' },
  { id: 'design-master', label: 'Design Master', emoji: '🎨', desc: 'Mentor de design e branding' },
  { id: 'carousel-master', label: 'Carrossel Master', emoji: '📰', desc: 'Narrativas editoriais para carrossel' },
  { id: 'editorial', label: 'Estrategista Editorial', emoji: '📋', desc: 'Linhas editoriais estratégicas' },
  { id: 'calendar', label: 'Calendário Master', emoji: '📅', desc: 'Calendários de conteúdo' },
  { id: 'bio', label: 'Bio Master', emoji: '✍️', desc: 'Bios para Instagram' },
];

export default function CentralChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const { user } = useAuth();
  const { apiKey } = useGoogleApiKey();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('chat_conversations').select('*').eq('user_id', user.id).eq('agent_id', AGENT_ID).order('updated_at', { ascending: false });
    if (data) {
      const sorted = (data as Conversation[]).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      setConversations(sorted);
    }
  }, [user]);

  const loadMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', convoId).order('created_at', { ascending: true });
    if (data) setMessages(data.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (activeConvoId) loadMessages(activeConvoId); else setMessages([]); }, [activeConvoId, loadMessages]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const createConversation = async (firstMessage?: string) => {
    if (!user) return null;
    const title = firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '…' : '') : 'Nova conversa';
    const { data, error } = await supabase.from('chat_conversations').insert({ user_id: user.id, title, agent_id: AGENT_ID } as any).select().single();
    if (error || !data) { toast.error('Erro ao criar conversa'); return null; }
    const convo = data as Conversation;
    setConversations(prev => [convo, ...prev]);
    setActiveConvoId(convo.id);
    setMessages([]);
    return convo.id;
  };

  const handleNewChat = () => { setActiveConvoId(null); setMessages([]); };
  const handleSelectConvo = (id: string) => { setActiveConvoId(id); };

  const handleDeleteConvo = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('conversation_id', id);
    await supabase.from('chat_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvoId === id) { setActiveConvoId(null); setMessages([]); }
    toast.success('Conversa excluída');
  };

  const handleDeleteAll = async () => {
    if (!user || conversations.length === 0) return;
    for (const c of conversations) { await supabase.from('chat_messages').delete().eq('conversation_id', c.id); }
    await supabase.from('chat_conversations').delete().eq('user_id', user.id).eq('agent_id', AGENT_ID);
    setConversations([]); setActiveConvoId(null); setMessages([]);
    toast.success('Todas as conversas foram excluídas');
  };

  const handleRenameConvo = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await supabase.from('chat_conversations').update({ title: newTitle.trim() }).eq('id', id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle.trim() } : c));
    setEditingId(null);
  };

  const handleTogglePin = async (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (!convo) return;
    const newPinned = !convo.is_pinned;
    await supabase.from('chat_conversations').update({ is_pinned: newPinned } as any).eq('id', id);
    setConversations(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, is_pinned: newPinned } : c);
      return updated.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });
    toast.success(newPinned ? 'Conversa fixada' : 'Conversa desafixada');
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
    if (!apiKey || apiKey.length < 10) { toast.error('Configure sua API Key do Google no botão API no topo.'); return; }

    let convoId = activeConvoId;
    if (!convoId) { convoId = await createConversation(msg); if (!convoId) return; }

    const userMsg: Msg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    await saveMessage(convoId, 'user', msg);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages, model: selectedModel.id, agentId: selectedAgent.id }),
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
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { textBuffer = line + '\n' + textBuffer; break; }
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
          try { const parsed = JSON.parse(jsonStr); const content = parsed.choices?.[0]?.delta?.content as string | undefined; if (content) upsertAssistant(content); } catch { /* ignore */ }
        }
      }

      if (assistantSoFar) await saveMessage(convoId, 'assistant', assistantSoFar);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao enviar mensagem');
      if (!assistantSoFar) setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      loadConversations();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = new Date().getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Dashboard sidebar */}
      <DashboardSidebar activeSection="chat-hub" onSectionChange={() => {}} />

      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Chat conversations sidebar */}
        <div className={cn(
          'flex flex-col border-r border-border/15 bg-card/30 backdrop-blur-sm transition-all duration-300 shrink-0',
          chatSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}>
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
              ) : conversations.map(convo => (
                <ConversationItem
                  key={convo.id}
                  convo={convo}
                  isActive={activeConvoId === convo.id}
                  isEditing={editingId === convo.id}
                  editTitle={editTitle}
                  onSelect={handleSelectConvo}
                  onDelete={handleDeleteConvo}
                  onStartRename={(id, title) => { setEditingId(id); setEditTitle(title); }}
                  onConfirmRename={handleRenameConvo}
                  onCancelRename={() => setEditingId(null)}
                  onEditTitleChange={setEditTitle}
                  onTogglePin={handleTogglePin}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat sidebar toggle */}
        <button
          onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-20 bg-card/60 border border-border/15 rounded-r-lg p-1.5 hover:bg-card/80 transition-all"
          style={{ left: chatSidebarOpen ? 'calc(var(--sidebar-w, 220px) + 256px)' : 'var(--sidebar-w, 220px)', transition: 'left 0.3s' }}
        >
          {chatSidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Top bar with model & agent selectors */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/15 bg-card/20">
            <MobileSidebarTrigger activeSection="chat-hub" onSectionChange={() => {}} />

            {/* Model selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium rounded-lg">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {selectedModel.label}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Modelo</DropdownMenuLabel>
                {MODELS.map(m => (
                  <DropdownMenuItem key={m.id} onClick={() => setSelectedModel(m)} className={cn('flex flex-col items-start gap-0.5', selectedModel.id === m.id && 'bg-primary/10')}>
                    <span className="text-xs font-medium">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Agent selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium rounded-lg">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  {selectedAgent.emoji} {selectedAgent.label}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Agente</DropdownMenuLabel>
                {AGENTS.map(a => (
                  <DropdownMenuItem key={a.id} onClick={() => setSelectedAgent(a)} className={cn('flex items-start gap-2.5', selectedAgent.id === a.id && 'bg-primary/10')}>
                    <span className="text-lg mt-0.5">{a.emoji}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">{a.label}</span>
                      <span className="text-[10px] text-muted-foreground">{a.desc}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 animate-fade-up">
                <div className="text-6xl">{selectedAgent.emoji}</div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold font-display text-foreground">{selectedAgent.label}</h2>
                  <p className="text-sm text-muted-foreground max-w-md">{selectedAgent.desc}</p>
                  <p className="text-[10px] text-muted-foreground/50">Modelo: {selectedModel.label}</p>
                </div>
                <div className="flex flex-wrap gap-2 max-w-xl justify-center">
                  {selectedAgent.id === 'general' && (
                    <>
                      <button onClick={() => send('Me ajude a criar um plano de conteúdo para Instagram')} className="rounded-xl border border-border/30 bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/80 transition-all">📱 Plano de conteúdo para Instagram</button>
                      <button onClick={() => send('Quais são as tendências de design para 2025?')} className="rounded-xl border border-border/30 bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/80 transition-all">🎨 Tendências de design 2025</button>
                      <button onClick={() => send('Crie um prompt de imagem para um post de luxo minimalista')} className="rounded-xl border border-border/30 bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/80 transition-all">✨ Prompt de imagem luxo</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6 relative" ref={messagesContainerRef}>
                <SelectionCopyTooltip containerRef={messagesContainerRef} />
                {messages.map((msg, i) => (
                  <div key={i} className={cn('group flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                        {selectedAgent.emoji}
                      </div>
                    )}
                    <div className={cn(
                      'rounded-2xl px-4 py-3 max-w-[85%] text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card/60 border border-border/20 rounded-bl-md'
                    )}>
                      {msg.role === 'assistant' ? (
                        <AssistantMessageContent content={msg.content} proseClasses="prose prose-sm prose-invert max-w-none select-text cursor-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h2]:mt-6 [&>h2]:mb-2 [&>h2]:text-primary [&>h2]:text-base [&>h2]:font-bold [&>hr]:my-5 [&>hr]:border-border/30 [&>p]:mb-3 [&>p]:leading-relaxed [&>ul]:mb-3 [&>ol]:mb-3 [&>blockquote]:border-l-primary/40 [&>blockquote]:bg-primary/5 [&>blockquote]:rounded-r-lg [&>blockquote]:py-1 [&>blockquote]:px-3" />
                      ) : <UserMessageContent content={msg.content} />}
                    </div>
                    {msg.role === 'assistant' && <CopyMessageButton content={msg.content} />}
                    {msg.role === 'user' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">EU</div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">{selectedAgent.emoji}</div>
                    <div className="rounded-2xl px-4 py-3 bg-card/60 border border-border/20 rounded-bl-md">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <AgentChatInput
            input={input}
            onInputChange={setInput}
            onSend={send}
            isLoading={isLoading}
            placeholder={`Pergunte algo ao ${selectedAgent.label}...`}
            textareaRef={textareaRef}
          />
        </div>
      </div>
    </div>
  );
}
