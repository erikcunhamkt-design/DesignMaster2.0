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
  GripVertical, Link2, MousePointer2, X, Loader2, Send,
  Trash2, ThumbsUp, ThumbsDown, Paperclip, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CanvasNode {
  id: string;
  label: string;
  node_type: string;
  image_url: string | null;
  prompt: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
}

interface CanvasConnection {
  id: string;
  source_node_id: string;
  target_node_id: string;
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

  // Canvas state
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'connect'>('select');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState<AiModel>('pro');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load nodes & connections
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [nodesRes, connsRes] = await Promise.all([
        supabase.from('void_canvas_nodes').select('*').eq('user_id', user.id).order('z_index'),
        supabase.from('void_canvas_connections').select('*').eq('user_id', user.id),
      ]);
      if (nodesRes.data) setNodes(nodesRes.data);
      if (connsRes.data) setConnections(connsRes.data);
    };
    load();
  }, [user]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save node position
  const saveNodePosition = useCallback(async (node: CanvasNode) => {
    await supabase.from('void_canvas_nodes').update({
      position_x: node.position_x,
      position_y: node.position_y,
    }).eq('id', node.id);
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId?: string) => {
    if (nodeId && tool === 'select') {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      setDragging(nodeId);
      setSelectedNode(nodeId);
      setDragOffset({
        x: e.clientX / zoom - node.position_x,
        y: e.clientY / zoom - node.position_y,
      });
      e.stopPropagation();
    } else if (nodeId && tool === 'connect') {
      if (connecting) {
        if (connecting !== nodeId) createConnection(connecting, nodeId);
        setConnecting(null);
      } else {
        setConnecting(nodeId);
      }
      e.stopPropagation();
    } else if (!nodeId) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
    }
  }, [nodes, zoom, pan, tool, connecting]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setNodes(prev => prev.map(n =>
        n.id === dragging ? {
          ...n,
          position_x: e.clientX / zoom - dragOffset.x,
          position_y: e.clientY / zoom - dragOffset.y,
        } : n
      ));
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [dragging, isPanning, zoom, dragOffset, panStart]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const node = nodes.find(n => n.id === dragging);
      if (node) saveNodePosition(node);
      setDragging(null);
    }
    setIsPanning(false);
  }, [dragging, nodes, saveNodePosition]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.1, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  // Connections
  const createConnection = async (sourceId: string, targetId: string) => {
    if (!user) return;
    const { data } = await supabase.from('void_canvas_connections').insert({
      user_id: user.id,
      source_node_id: sourceId,
      target_node_id: targetId,
    }).select().single();
    if (data) setConnections(prev => [...prev, data]);
  };

  const deleteNode = async (nodeId: string) => {
    await supabase.from('void_canvas_nodes').delete().eq('id', nodeId);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.source_node_id !== nodeId && c.target_node_id !== nodeId));
    setSelectedNode(null);
  };

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.position_x + node.width / 2, y: node.position_y + node.height / 2 };
  };

  // Add node to canvas from generated image
  const addImageToCanvas = async (imageUrl: string, label: string, promptText: string) => {
    if (!user) return;
    // Scatter nodes in a column-like pattern with some randomness
    const baseX = 100 + Math.random() * 300;
    const baseY = 100 + nodes.length * 150 + Math.random() * 80;

    const { data: newNode } = await supabase.from('void_canvas_nodes').insert({
      user_id: user.id,
      label: label.slice(0, 50),
      node_type: 'image',
      image_url: imageUrl,
      prompt: promptText,
      position_x: baseX,
      position_y: baseY,
      width: 200,
      height: 200,
      z_index: nodes.length,
    }).select().single();

    if (newNode) setNodes(prev => [...prev, newNode]);
  };

  // Handle image upload to canvas
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    await addImageToCanvas(objectUrl, file.name, '');
    toast.success('Imagem importada ao canvas!');
  };

  // Chat: send prompt to generate
  const handleSend = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (!apiKey) {
      toast.error('Configure sua API Key primeiro');
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsGenerating(true);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const modelId = model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';

      // Add thinking message
      const thinkingId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: thinkingId,
        role: 'assistant',
        content: `I'll create this image for you with the composition and atmosphere you described.`,
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

        // Update thinking message with image
        setMessages(prev => prev.map(m =>
          m.id === thinkingId
            ? {
                ...m,
                content: `Perfect! I've created your image based on the prompt you provided.`,
                imageUrl,
                title,
              }
            : m
        ));

        // Add to canvas
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
            <button
              onClick={() => { setTool('select'); setConnecting(null); }}
              className={cn('p-1.5 rounded-lg transition-colors', tool === 'select' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTool('connect')}
              className={cn('p-1.5 rounded-lg transition-colors', tool === 'connect' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
            <div className="w-px h-5 bg-border/20 mx-1" />
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <span className="text-[9px] text-muted-foreground font-mono min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Connecting indicator */}
        {connecting && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/40 backdrop-blur-xl text-primary text-[10px] font-medium animate-pulse">
            Clique no nó de destino
            <button onClick={() => setConnecting(null)} className="ml-2"><X className="h-3 w-3 inline" /></button>
          </div>
        )}

        {/* Canvas */}
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
            {/* SVG connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {connections.map(conn => {
                const src = getNodeCenter(conn.source_node_id);
                const tgt = getNodeCenter(conn.target_node_id);
                return (
                  <g key={conn.id}>
                    <line
                      x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      stroke="hsl(var(--primary) / 0.4)"
                      strokeWidth={2 / zoom}
                      strokeDasharray={`${6 / zoom} ${4 / zoom}`}
                    />
                    <circle cx={src.x} cy={src.y} r={4 / zoom} fill="hsl(var(--primary) / 0.6)" />
                    <circle cx={tgt.x} cy={tgt.y} r={4 / zoom} fill="hsl(var(--primary) / 0.6)" />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                className={cn(
                  'absolute rounded-xl border transition-shadow duration-200 cursor-grab active:cursor-grabbing group overflow-hidden',
                  selectedNode === node.id
                    ? 'border-primary/60 shadow-glow-md ring-1 ring-primary/30'
                    : 'border-border/30 hover:border-primary/30 hover:shadow-glow-sm',
                  connecting === node.id && 'border-primary ring-2 ring-primary/40 animate-pulse',
                )}
                style={{
                  left: node.position_x,
                  top: node.position_y,
                  width: node.width,
                  height: node.height,
                  zIndex: node.z_index,
                }}
              >
                {node.image_url ? (
                  <img src={node.image_url} alt={node.label} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-card/40 backdrop-blur-sm">
                    <Plus className="h-5 w-5 text-muted-foreground/40" />
                    <span className="text-[8px] text-muted-foreground/40 mt-1">{node.label}</span>
                  </div>
                )}
                {node.label && node.image_url && (
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] text-white/80 truncate">{node.label}</p>
                  </div>
                )}
                {/* Delete button on hover */}
                {selectedNode === node.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-destructive hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-3 w-3 text-white/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar - import */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/30">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground h-8 text-[10px]" asChild>
              <span><Upload className="h-3 w-3" /> Importar</span>
            </Button>
          </label>
          <span className="text-[9px] text-muted-foreground/40">{nodes.length} itens</span>
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">VOID Chat</span>
          </div>
          <ApiKeyDialog />
        </div>

        {/* Messages area */}
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

                  {msg.title && (
                    <p className="text-[11px] font-semibold text-foreground">{msg.title}</p>
                  )}

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
          {/* Model selector */}
          <ModelSelector value={model} onChange={setModel} />

          {/* Input box */}
          <div className="relative rounded-xl border border-border/30 bg-secondary/20 focus-within:border-primary/30 transition-colors">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva sua criação..."
              className="min-h-[60px] max-h-[120px] resize-none bg-transparent border-none text-[11px] pr-10 focus-visible:ring-0 placeholder:text-muted-foreground/40"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <Paperclip className="h-3.5 w-3.5" />
                  </div>
                </label>
              </div>
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
