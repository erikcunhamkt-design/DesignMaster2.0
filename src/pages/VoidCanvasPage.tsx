import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Sparkles, Upload,
  Loader2, Send, Trash2, ThumbsUp, ThumbsDown, Paperclip,
  Mic, MicOff, Image, User, X, ChevronDown, Download
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
  const [model, setModel] = useState('gemini-3-pro-image-preview');
  const [modelOpen, setModelOpen] = useState(false);

  // Multimedia attachments
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceDesc, setReferenceDesc] = useState('');
  const [showRefDesc, setShowRefDesc] = useState(false);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const imageModels = [
    { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro', desc: 'Qualidade máxima · Gemini 3', badge: 'PRO' },
    { id: 'gemini-3.1-flash-image-preview', label: 'Nano Banana 2', desc: 'Rápido · Gemini 3.1', badge: 'NEW' },
  ] as const;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);

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

  // File to base64
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  // Reference image handler
  const handleRefImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const base64 = await fileToBase64(e.target.files[0]);
    setReferenceImage(base64);
    setShowRefDesc(true);
  };

  // Character image handler
  const handleCharImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const base64 = await fileToBase64(e.target.files[0]);
    setCharacterImage(base64);
  };

  // Audio recording
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        toast.success('Áudio gravado!');
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Sem acesso ao microfone');
    }
  };

  // Chat: send prompt to generate
  const handleSend = async () => {
    if ((!prompt.trim() && !audioBlob) || isGenerating) return;
    if (!apiKey) {
      toast.error('Configure sua API Key primeiro');
      return;
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt || '🎤 Áudio enviado' };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsGenerating(true);

    // Capture current attachments then clear
    const currentRef = referenceImage;
    const currentRefDesc = referenceDesc;
    const currentChar = characterImage;
    const currentAudio = audioBlob;
    setReferenceImage(null);
    setReferenceDesc('');
    setShowRefDesc(false);
    setCharacterImage(null);
    setAudioBlob(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const modelId = model;

      const thinkingId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: thinkingId,
        role: 'assistant',
        content: 'Gerando sua criação...',
        model: imageModels.find(m => m.id === model)?.label || model,
      }]);

      // If audio, transcribe first via Gemini text model
      let finalPrompt = currentPrompt;
      if (currentAudio && !currentPrompt.trim()) {
        // Convert audio to base64 and send to transcription
        const audioReader = new FileReader();
        const audioBase64 = await new Promise<string>((resolve) => {
          audioReader.onloadend = () => resolve(audioReader.result as string);
          audioReader.readAsDataURL(currentAudio);
        });
        // Use the prompt as-is, Gemini will handle audio
        finalPrompt = 'Generate an image based on the audio description provided';
      }

      // Build body with references
      const body: Record<string, unknown> = {
        prompt: finalPrompt,
        googleApiKey: apiKey,
        aiModel: modelId === 'gemini-3-pro-image-preview' ? 'pro' : 'flash',
        aspectRatio: '1:1',
      };

      if (currentChar) {
        body.subjectImages = [currentChar];
      }
      if (currentRef) {
        body.styleReferenceImages = [currentRef];
        if (currentRefDesc.trim()) {
          body.referenceNotes = [currentRefDesc];
        }
      }

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (data.imageUrl || data.image) {
        const imageUrl = data.imageUrl || data.image;
        const title = finalPrompt.slice(0, 60);

        setMessages(prev => prev.map(m =>
          m.id === thinkingId
            ? { ...m, content: 'Pronto! Sua imagem foi criada e adicionada ao canvas.', imageUrl, title }
            : m
        ));

        await addImageToCanvas(imageUrl, title, finalPrompt);
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

      {/* ========== RIGHT: CHAT SIDEBAR (Lovart-style, dark) ========== */}
      <div className="w-[440px] flex flex-col border-l border-border/15 bg-[#0a0f14]">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 h-12 border-b border-border/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-[8px]">🕳️</span>
            </div>
            <span className="text-[13px] font-semibold text-foreground/90">VOID</span>
          </div>
          <div className="flex items-center gap-2">
            <ApiKeyDialog />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <Sparkles className="h-10 w-10 text-primary/30" />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground/60">Comece a criar</p>
                <p className="text-[11px] text-muted-foreground/50 max-w-[260px]">
                  Descreva o que quer criar e a imagem aparecerá no canvas ao lado.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-sm bg-[#151c24] border border-border/15 text-foreground/90 text-[12px] leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[95%] space-y-2.5">
                  <p className="text-[12px] text-foreground/75 leading-relaxed">{msg.content}</p>
                  {msg.model && (
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/40">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>{msg.model}</span>
                    </div>
                  )}
                  {msg.title && <p className="text-[12px] font-semibold text-foreground/90">{msg.title}</p>}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-border/15 shadow-cinematic max-w-[320px]">
                      <img src={msg.imageUrl} alt={msg.title || 'Generated'} className="w-full h-auto" />
                    </div>
                  )}
                  {msg.imageUrl && (
                    <div className="flex items-center gap-1 pt-0.5">
                      <button className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground/70 hover:bg-secondary/30 transition-colors">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground/70 hover:bg-secondary/30 transition-colors">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Gerando imagem...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ===== INPUT AREA ===== */}
        <div className="shrink-0 p-4 space-y-2">
          {/* Attachment previews */}
          {(referenceImage || characterImage || audioBlob) && (
            <div className="flex flex-wrap gap-2">
              {characterImage && (
                <div className="relative group">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-amber-500/40 bg-[#111820]">
                    <img src={characterImage} alt="Personagem" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-1 -left-1 bg-amber-500/80 rounded-full p-0.5">
                    <User className="h-2 w-2 text-black" />
                  </div>
                  <button onClick={() => setCharacterImage(null)} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-2 w-2 text-white" />
                  </button>
                </div>
              )}
              {referenceImage && (
                <div className="relative group">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary/40 bg-[#111820]">
                    <img src={referenceImage} alt="Referência" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-1 -left-1 bg-primary/80 rounded-full p-0.5">
                    <Image className="h-2 w-2 text-black" />
                  </div>
                  <button onClick={() => { setReferenceImage(null); setShowRefDesc(false); setReferenceDesc(''); }} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-2 w-2 text-white" />
                  </button>
                </div>
              )}
              {audioBlob && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111820] border border-border/15 text-[10px] text-foreground/70">
                  <Mic className="h-3 w-3 text-primary" />
                  <span>Áudio gravado</span>
                  <button onClick={() => setAudioBlob(null)} className="text-muted-foreground/40 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reference description field */}
          {showRefDesc && referenceImage && (
            <div className="rounded-xl border border-primary/20 bg-[#111820] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary font-medium">O que quer desta referência?</span>
                <button onClick={() => setShowRefDesc(false)} className="text-muted-foreground/30 hover:text-foreground">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <input
                value={referenceDesc}
                onChange={(e) => setReferenceDesc(e.target.value)}
                placeholder="Ex: quero a mesma pose, mesma iluminação, mesma composição..."
                className="w-full bg-transparent border-none text-[11px] text-foreground/80 placeholder:text-muted-foreground/25 focus:outline-none"
              />
            </div>
          )}

          {/* Textarea card */}
          <div className="rounded-2xl border border-border/15 bg-[#111820] focus-within:border-primary/25 transition-colors overflow-hidden">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva sua criação..."
              className="min-h-[60px] max-h-[120px] resize-none bg-transparent border-none text-[12px] text-foreground/90 focus-visible:ring-0 placeholder:text-muted-foreground/30 px-4 pt-3"
              disabled={isGenerating}
            />
            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 py-2">
              {/* Left tools */}
              <div className="flex items-center gap-0.5">
                {/* Reference image */}
                <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={handleRefImage} />
                <button
                  onClick={() => refInputRef.current?.click()}
                  className={cn('p-2 rounded-lg transition-colors', referenceImage ? 'text-primary bg-primary/10' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20')}
                  title="Referência visual"
                >
                  <Image className="h-4 w-4" />
                </button>

                {/* Character photo */}
                <input ref={charInputRef} type="file" accept="image/*" className="hidden" onChange={handleCharImage} />
                <button
                  onClick={() => charInputRef.current?.click()}
                  className={cn('p-2 rounded-lg transition-colors', characterImage ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20')}
                  title="Foto do personagem"
                >
                  <User className="h-4 w-4" />
                </button>

                {/* Audio */}
                <button
                  onClick={toggleRecording}
                  className={cn('p-2 rounded-lg transition-colors', isRecording ? 'text-destructive bg-destructive/10 animate-pulse' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20')}
                  title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Model selector */}
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-primary/25 text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors ml-1">
                      <Sparkles className="h-3 w-3" />
                      {imageModels.find(m => m.id === model)?.label.split(' ').slice(-2).join(' ') || 'Modelo'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-1.5 bg-[#111820] border-border/20" side="top" align="start">
                    <div className="space-y-0.5">
                      {imageModels.map(m => (
                        <button
                          key={m.id}
                          onClick={() => { setModel(m.id); setModelOpen(false); }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                            model === m.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-secondary/20 hover:text-foreground'
                          )}
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium truncate">{m.label}</span>
                              {m.badge && (
                                <span className={cn(
                                  'rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider leading-none',
                                  m.badge === 'PRO' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                )}>
                                  {m.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground/40 truncate">{m.desc}</p>
                          </div>
                          {model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Right: send */}
              <button
                onClick={handleSend}
                disabled={isGenerating || (!prompt.trim() && !audioBlob) || !apiKey}
                className={cn(
                  'p-2 rounded-full transition-all',
                  (prompt.trim() || audioBlob) && apiKey
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm'
                    : 'bg-secondary/20 text-muted-foreground/20 cursor-not-allowed'
                )}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
