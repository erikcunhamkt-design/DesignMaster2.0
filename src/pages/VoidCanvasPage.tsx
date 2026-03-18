import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { ModelSelector, AiModel } from '@/components/configurator/ModelSelector';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Sparkles, Upload,
  Loader2, Send, Trash2, ThumbsUp, ThumbsDown, Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CanvasImage {
  id: string;
  image_url: string;
  label: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  model?: string;
  title?: string;
}

export default function VoidCanvasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiKey } = useGoogleApiKey();

  // Canvas state — simple images, no nodes/connections
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState<AiModel>('pro');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load images from DB (using void_canvas_nodes table, but only image type)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('void_canvas_nodes')
        .select('*')
        .eq('user_id', user.id)
        .eq('node_type', 'image')
        .order('z_index');
      if (data) {
        setImages(data.filter(d => d.image_url).map(d => ({
          id: d.id,
          image_url: d.image_url!,
          label: d.label,
          position_x: d.position_x,
          position_y: d.position_y,
          width: d.width,
          height: d.height,
        })));
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save position
  const savePosition = useCallback(async (img: CanvasImage) => {
    await supabase.from('void_canvas_nodes').update({
      position_x: img.position_x,
      position_y: img.position_y,
    }).eq('id', img.id);
  }, []);

  // Mouse handlers — simple drag & pan, no nodes/connections
  const handleMouseDown = useCallback((e: React.MouseEvent, imgId?: string) => {
    if (imgId) {
      const img = images.find(i => i.id === imgId);
      if (!img) return;
      setDragging(imgId);
      setSelectedImage(imgId);
      setDragOffset({
        x: e.clientX / zoom - img.position_x,
        y: e.clientY / zoom - img.position_y,
      });
      e.stopPropagation();
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedImage(null);
    }
  }, [images, zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setImages(prev => prev.map(i =>
        i.id === dragging ? {
          ...i,
          position_x: e.clientX / zoom - dragOffset.x,
          position_y: e.clientY / zoom - dragOffset.y,
        } : i
      ));
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [dragging, isPanning, zoom, dragOffset, panStart]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const img = images.find(i => i.id === dragging);
      if (img) savePosition(img);
      setDragging(null);
    }
    setIsPanning(false);
  }, [dragging, images, savePosition]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.1, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  const deleteImage = async (id: string) => {
    await supabase.from('void_canvas_nodes').delete().eq('id', id);
    setImages(prev => prev.filter(i => i.id !== id));
    setSelectedImage(null);
  };

  // Add image to canvas
  const addImageToCanvas = async (imageUrl: string, label: string, promptText: string) => {
    if (!user) return;
    const baseX = 80 + Math.random() * 400;
    const baseY = 80 + images.length * 140 + Math.random() * 60;

    const { data: newRow } = await supabase.from('void_canvas_nodes').insert({
      user_id: user.id,
      label: label.slice(0, 50),
      node_type: 'image',
      image_url: imageUrl,
      prompt: promptText,
      position_x: baseX,
      position_y: baseY,
      width: 200,
      height: 200,
      z_index: images.length,
    }).select().single();

    if (newRow && newRow.image_url) {
      setImages(prev => [...prev, {
        id: newRow.id,
        image_url: newRow.image_url!,
        label: newRow.label,
        position_x: newRow.position_x,
        position_y: newRow.position_y,
        width: newRow.width,
        height: newRow.height,
      }]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    await addImageToCanvas(objectUrl, file.name, '');
    toast.success('Imagem importada!');
  };

  // Chat: send prompt to generate
  const handleSend = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (!apiKey) {
      toast.error('Configure sua API Key primeiro');
      return;
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsGenerating(true);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const modelId = model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';

      const thinkingId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: thinkingId,
        role: 'assistant',
        content: 'Gerando sua criação...',
        model: model === 'pro' ? 'Nano Banana Pro' : 'Nano Banana 2',
      }]);

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            prompt: currentPrompt,
            googleApiKey: apiKey,
            model: modelId,
            aspectRatio: '1:1',
          }),
        }
      );

      const data = await res.json();
      if (data.imageUrl || data.image) {
        const imageUrl = data.imageUrl || data.image;
        const title = currentPrompt.slice(0, 60);

        setMessages(prev => prev.map(m =>
          m.id === thinkingId
            ? { ...m, content: 'Pronto! Sua imagem foi criada e adicionada ao canvas.', imageUrl, title }
            : m
        ));

        await addImageToCanvas(imageUrl, title, currentPrompt);
      } else {
        setMessages(prev => prev.map(m =>
          m.id === thinkingId
            ? { ...m, content: data.error || 'Erro ao gerar imagem. Tente novamente.' }
            : m
        ));
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Erro de conexão. Verifique sua API Key e tente novamente.',
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050a0e] overflow-hidden select-none flex">
      {/* ========== LEFT: CANVAS ========== */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background void effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-breathe" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[60px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-[#050a0e] shadow-[0_0_60px_30px_rgba(0,0,0,0.8)]" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(1px 1px at 20% 30%, hsl(var(--primary) / 0.3) 1px, transparent 0), radial-gradient(1px 1px at 60% 70%, hsl(var(--primary) / 0.2) 1px, transparent 0), radial-gradient(1px 1px at 80% 20%, hsl(var(--primary) / 0.15) 1px, transparent 0)',
            backgroundSize: '200px 200px, 300px 300px, 250px 250px',
          }} />
        </div>

        {/* Canvas top bar */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12 bg-background/40 backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-[8px]">🕳️</span>
              </div>
              <span className="text-xs font-bold font-display text-foreground tracking-tight">VOID</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <span className="text-[9px] text-muted-foreground font-mono min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div
          ref={canvasRef}
          className="absolute inset-0 pt-12 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
            className="absolute inset-0"
          >
            {/* Images on canvas */}
            {images.map(img => (
              <div
                key={img.id}
                onMouseDown={(e) => handleMouseDown(e, img.id)}
                className={cn(
                  'absolute rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group transition-shadow duration-200',
                  selectedImage === img.id
                    ? 'ring-2 ring-primary/50 shadow-glow-md'
                    : 'hover:shadow-glow-sm',
                )}
                style={{
                  left: img.position_x,
                  top: img.position_y,
                  width: img.width,
                  height: img.height,
                }}
              >
                <img src={img.image_url} alt={img.label} className="w-full h-full object-cover" draggable={false} />
                
                {/* Label overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[8px] text-white/80 truncate">{img.label}</p>
                </div>

                {/* Delete on hover when selected */}
                {selectedImage === img.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-destructive hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/30">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground h-8 text-[10px]" asChild>
              <span><Upload className="h-3 w-3" /> Importar</span>
            </Button>
          </label>
          <span className="text-[9px] text-muted-foreground/40">{images.length} itens</span>
        </div>

        {/* Empty state */}
        {images.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center space-y-2 animate-fade-up">
              <div className="text-3xl">🕳️</div>
              <h2 className="text-sm font-display font-bold text-foreground/50">O VOID está vazio</h2>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">
                Use o chat ao lado para gerar imagens que aparecerão aqui.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========== RIGHT: CHAT SIDEBAR ========== */}
      <div className="w-[420px] flex flex-col border-l border-border/20 bg-background/80 backdrop-blur-xl">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/20 shrink-0">
          <span className="text-xs font-semibold text-foreground">VOID Chat</span>
          <ApiKeyDialog />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
              <Sparkles className="h-8 w-8 text-primary/40" />
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Descreva o que quer criar e a imagem aparecerá no canvas ao lado.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-primary/15 border border-primary/20 text-foreground text-[11px] leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[90%] space-y-2">
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{msg.content}</p>
                  {msg.model && (
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>{msg.model}</span>
                    </div>
                  )}
                  {msg.title && <p className="text-[11px] font-semibold text-foreground">{msg.title}</p>}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-border/30 shadow-cinematic max-w-[300px]">
                      <img src={msg.imageUrl} alt={msg.title || 'Generated'} className="w-full h-auto" />
                    </div>
                  )}
                  {msg.imageUrl && (
                    <div className="flex items-center gap-1 pt-1">
                      <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-colors">
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-colors">
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span>Gerando imagem...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border/20 p-3 space-y-2.5">
          <ModelSelector value={model} onChange={setModel} />
          <div className="relative rounded-xl border border-border/30 bg-secondary/20 focus-within:border-primary/30 transition-colors">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva sua criação..."
              className="min-h-[60px] max-h-[120px] resize-none bg-transparent border-none text-[11px] pr-10 focus-visible:ring-0 placeholder:text-muted-foreground/40"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-colors">
                  <Paperclip className="h-3.5 w-3.5" />
                </div>
              </label>
              <button
                onClick={handleSend}
                disabled={isGenerating || !prompt.trim() || !apiKey}
                className={cn(
                  'p-2 rounded-full transition-all',
                  prompt.trim() && apiKey
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm'
                    : 'bg-secondary/40 text-muted-foreground/30 cursor-not-allowed'
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
