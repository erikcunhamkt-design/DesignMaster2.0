import { useState, useEffect, useRef } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Plus, Clock, Trash2, Edit2, Send, Link2, Instagram, ImagePlus, X, Images, Image as ImageIcon, Hash } from 'lucide-react';
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

type PostType = 'single' | 'carousel';

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
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [postType, setPostType] = useState<PostType>('single');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('scheduled-media').upload(path, file);
    if (error) {
      toast({ title: 'Erro no upload da imagem', variant: 'destructive' });
      return null;
    }
    const { data: urlData } = supabase.storage.from('scheduled-media').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (postType === 'single') {
      setMediaFiles([files[0]]);
      setMediaPreviews([URL.createObjectURL(files[0])]);
    } else {
      // Carousel: up to 10 images
      const combined = [...mediaFiles, ...files].slice(0, 10);
      const previews = combined.map((f) =>
        f instanceof File ? URL.createObjectURL(f) : ''
      );
      setMediaFiles(combined);
      setMediaPreviews(previews);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMediaAt = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
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

    setUploading(true);

    // Upload all media files
    let mediaUrls: string[] = [];
    if (mediaFiles.length > 0) {
      const uploads = await Promise.all(mediaFiles.map((f) => uploadMedia(f)));
      const failed = uploads.some((u) => u === null);
      if (failed) {
        setUploading(false);
        return;
      }
      mediaUrls = uploads.filter(Boolean) as string[];
    } else if (editingPost?.media_url) {
      // Keep existing URLs
      try {
        mediaUrls = JSON.parse(editingPost.media_url);
      } catch {
        mediaUrls = editingPost.media_url ? [editingPost.media_url] : [];
      }
    }

    // Store as JSON array of URLs
    const mediaUrlJson = mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null;

    // Concatenate hashtags to content for the webhook
    const fullContent = hashtags.trim()
      ? `${content}\n\n${hashtags.trim()}`
      : content;

    if (editingPost) {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          title, content: fullContent, platform: 'instagram',
          scheduled_at: scheduledAt.toISOString(),
          webhook_url: webhookUrl || null,
          media_url: mediaUrlJson,
        })
        .eq('id', editingPost.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
        setUploading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          title, content: fullContent, platform: 'instagram',
          scheduled_at: scheduledAt.toISOString(),
          webhook_url: webhookUrl || null,
          media_url: mediaUrlJson,
        });

      if (error) {
        toast({ title: 'Erro ao salvar', variant: 'destructive' });
        setUploading(false);
        return;
      }
    }

    setUploading(false);
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

  const parseMediaUrls = (mediaUrl: string | null): string[] => {
    if (!mediaUrl) return [];
    try {
      const parsed = JSON.parse(mediaUrl);
      return Array.isArray(parsed) ? parsed : [mediaUrl];
    } catch {
      return mediaUrl ? [mediaUrl] : [];
    }
  };

  const handleManualSend = async (post: ScheduledPost) => {
    const url = post.webhook_url || webhookUrl;
    if (!url) {
      toast({ title: 'Configure o webhook primeiro', variant: 'destructive' });
      return;
    }

    const images = parseMediaUrls(post.media_url);

    try {
      // Content already has hashtags concatenated when saved
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          caption: post.content,
          platform: 'instagram',
          post_type: images.length > 1 ? 'carousel' : 'single',
          scheduled_at: post.scheduled_at,
          media_urls: images,
          media_url: images[0] || null,
          image_count: images.length,
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
    setScheduledTime('10:00');
    setPostType('single');
    setEditingPost(null);
    setMediaFiles([]);
    setMediaPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setMediaFiles([]);
    const urls = parseMediaUrls(post.media_url);
    setMediaPreviews(urls);
    setPostType(urls.length > 1 ? 'carousel' : 'single');
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
  const startPad = getDay(monthStart);

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
                  {dayPosts.slice(0, 3).map((post) => {
                    const imgs = parseMediaUrls(post.media_url);
                    return (
                      <div
                        key={post.id}
                        className="text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate border bg-pink-500/20 text-pink-400 border-pink-500/30"
                        onClick={(e) => { e.stopPropagation(); openEdit(post); }}
                      >
                        <span className="flex items-center gap-1">
                          <Instagram className="h-3 w-3 shrink-0" />
                          {imgs.length > 1 && <Images className="h-3 w-3 shrink-0" />}
                          <span className="truncate">{post.title}</span>
                        </span>
                      </div>
                    );
                  })}
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
            {posts.filter(p => p.status === 'pending').slice(0, 9).map((post) => {
              const imgs = parseMediaUrls(post.media_url);
              return (
                <Card key={post.id} className="p-3 space-y-2 bg-card border-border overflow-hidden">
                  {imgs.length > 0 && (
                    <div className="flex gap-1 -mx-3 -mt-3 mb-2">
                      {imgs.slice(0, 3).map((url, i) => (
                        <img key={i} src={url} alt="" className="h-20 flex-1 object-cover" />
                      ))}
                      {imgs.length > 3 && (
                        <div className="h-20 flex-1 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{imgs.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        <Instagram className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium truncate">{post.title}</span>
                      {imgs.length > 1 && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          <Images className="h-3 w-3 mr-0.5" /> {imgs.length}
                        </Badge>
                      )}
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Editar Post' : 'Agendar Post Instagram'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Post type selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de post</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setPostType('single');
                    if (mediaFiles.length > 1) {
                      setMediaFiles([mediaFiles[0]]);
                      setMediaPreviews([mediaPreviews[0]]);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    postType === 'single'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  Post único
                </button>
                <button
                  onClick={() => setPostType('carousel')}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    postType === 'carousel'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Images className="h-4 w-4" />
                  Carrossel
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lançamento do produto" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Legenda</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva a legenda do post..." rows={3} />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Horário</label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>

            {/* Image upload */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {postType === 'single' ? 'Imagem do post' : `Imagens do carrossel (${mediaPreviews.length}/10)`}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={postType === 'carousel'}
                onChange={handleFileSelect}
                className="hidden"
              />

              {mediaPreviews.length > 0 ? (
                <div className="space-y-2">
                  <div className={`grid gap-2 ${postType === 'carousel' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                    {mediaPreviews.map((preview, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden border border-border group">
                        <img src={preview} alt={`Imagem ${i + 1}`} className={`w-full object-cover ${postType === 'single' ? 'h-40' : 'h-24'}`} />
                        <button
                          onClick={() => removeMediaAt(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {postType === 'carousel' && (
                          <div className="absolute bottom-1 left-1 bg-background/80 rounded px-1.5 py-0.5 text-[9px] font-bold">
                            {i + 1}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {postType === 'carousel' && mediaPreviews.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Adicionar mais imagens
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-5 w-5" />
                  {postType === 'single' ? 'Adicionar imagem' : 'Adicionar imagens do carrossel'}
                </button>
              )}
            </div>

            {selectedDate && (
              <p className="text-xs text-muted-foreground">
                📅 {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {scheduledTime}
              </p>
            )}
            <Button onClick={handleSave} disabled={uploading} className="w-full">
              {uploading ? 'Enviando imagens...' : (editingPost ? 'Atualizar' : 'Agendar Post')} 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
