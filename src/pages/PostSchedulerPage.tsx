import { useState, useEffect } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Plus, Clock, Trash2, Edit2, Send, Link2, Instagram, Facebook, Twitter, Linkedin, Globe } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  media_url: string | null;
  platform: string;
  scheduled_at: string;
  webhook_url: string | null;
  status: string;
  created_at: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  outro: <Globe className="h-4 w-4" />,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  twitter: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  linkedin: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  outro: 'bg-muted text-muted-foreground border-border',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  sent: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

const statusLabels: Record<string, string> = {
  pending: 'Agendado',
  sent: 'Publicado',
  failed: 'Falhou',
};

export default function PostSchedulerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [scheduledTime, setScheduledTime] = useState('10:00');

  useEffect(() => {
    if (user) {
      loadPosts();
      loadWebhookUrl();
    }
  }, [user]);

  const loadWebhookUrl = () => {
    const saved = localStorage.getItem('make_webhook_url');
    if (saved) setWebhookUrl(saved);
  };

  const saveWebhookUrl = (url: string) => {
    localStorage.setItem('make_webhook_url', url);
    setWebhookUrl(url);
    toast({ title: '✅ Webhook salvo!' });
    setSettingsOpen(false);
  };

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (!error && data) setPosts(data as ScheduledPost[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !selectedDate) return;
    if (!title.trim()) {
      toast({ title: 'Preencha o título', variant: 'destructive' });
      return;
    }

    const [h, m] = scheduledTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(h, m, 0, 0);

    if (editingPost) {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          title, content, platform,
          scheduled_at: scheduledAt.toISOString(),
          webhook_url: webhookUrl || null,
        })
        .eq('id', editingPost.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          title, content, platform,
          scheduled_at: scheduledAt.toISOString(),
          webhook_url: webhookUrl || null,
        });

      if (error) {
        toast({ title: 'Erro ao salvar', variant: 'destructive' });
        return;
      }
    }

    toast({ title: editingPost ? '✅ Post atualizado!' : '✅ Post agendado!' });
    resetForm();
    setDialogOpen(false);
    loadPosts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_posts').delete().eq('id', id);
    toast({ title: '🗑️ Post removido' });
    loadPosts();
  };

  const handleManualSend = async (post: ScheduledPost) => {
    const url = post.webhook_url || webhookUrl;
    if (!url) {
      toast({ title: 'Configure o webhook primeiro', variant: 'destructive' });
      return;
    }

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          platform: post.platform,
          scheduled_at: post.scheduled_at,
          timestamp: new Date().toISOString(),
        }),
      });

      await supabase.from('scheduled_posts').update({ status: 'sent' }).eq('id', post.id);
      toast({ title: '🚀 Post enviado para o Make!' });
      loadPosts();
    } catch {
      toast({ title: 'Erro ao enviar', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPlatform('instagram');
    setScheduledTime('10:00');
    setEditingPost(null);
  };

  const openEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setPlatform(post.platform);
    const d = new Date(post.scheduled_at);
    setScheduledTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setSelectedDate(d);
    setDialogOpen(true);
  };

  const openNewPost = (date: Date) => {
    resetForm();
    setSelectedDate(date);
    setDialogOpen(true);
  };

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const getPostsForDay = (date: Date) =>
    posts.filter((p) => isSameDay(new Date(p.scheduled_at), date));

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Agendador de Posts" showApiKey={false} />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex gap-1 ml-2">
              <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</Button>
              <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Link2 className="h-4 w-4 mr-1" /> Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Configurar Webhook (Make / Zapier)</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Cole a URL do webhook do seu cenário no Make ou Zap no Zapier. Os posts serão enviados para lá.
                </p>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hook.us1.make.com/..."
                />
                <Button onClick={() => saveWebhookUrl(webhookUrl)}>Salvar</Button>
              </DialogContent>
            </Dialog>

            <Badge variant={webhookUrl ? 'default' : 'destructive'} className="text-xs">
              {webhookUrl ? '🟢 Webhook ativo' : '🔴 Sem webhook'}
            </Badge>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px rounded-xl border border-border overflow-hidden bg-border">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}

          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-card min-h-[80px] md:min-h-[110px]" />
          ))}

          {days.map((day) => {
            const dayPosts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`bg-card min-h-[80px] md:min-h-[110px] p-1.5 cursor-pointer hover:bg-accent/10 transition-colors relative group ${isToday ? 'ring-1 ring-primary ring-inset' : ''}`}
                onClick={() => openNewPost(day)}
              >
                <span className={`text-xs font-medium ${isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </span>

                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate border ${platformColors[post.platform] || platformColors.outro}`}
                      onClick={(e) => { e.stopPropagation(); openEdit(post); }}
                    >
                      <span className="flex items-center gap-1">
                        {platformIcons[post.platform]}
                        <span className="truncate">{post.title}</span>
                      </span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[9px] text-muted-foreground">+{dayPosts.length - 3} mais</span>
                  )}
                </div>

                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming posts list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> Próximos agendamentos
          </h3>
          {posts.filter(p => p.status === 'pending').length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum post agendado. Clique em um dia no calendário para criar.</p>
          )}
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {posts.filter(p => p.status === 'pending').slice(0, 9).map((post) => (
              <Card key={post.id} className="p-3 space-y-2 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded ${platformColors[post.platform]}`}>{platformIcons[post.platform]}</span>
                    <span className="text-sm font-medium truncate">{post.title}</span>
                  </div>
                  <Badge className={`text-[10px] ${statusColors[post.status]}`}>{statusLabels[post.status]}</Badge>
                </div>
                {post.content && <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{format(new Date(post.scheduled_at), "dd/MM 'às' HH:mm")}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleManualSend(post)}>
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(post)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Editar Post' : 'Agendar Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lançamento do produto" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Conteúdo / Legenda</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Texto do post..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Horário</label>
                <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              </div>
            </div>
            {selectedDate && (
              <p className="text-xs text-muted-foreground">
                📅 {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {scheduledTime}
              </p>
            )}
            <Button onClick={handleSave} className="w-full">
              {editingPost ? 'Atualizar' : 'Agendar Post'} 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
