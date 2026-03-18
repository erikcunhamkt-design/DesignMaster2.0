import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, Link2, ArrowLeft, ZoomIn, ZoomOut, RotateCcw,
  Sparkles, Upload, GripVertical, X, Loader2, MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';

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

export default function VoidCanvasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiKey } = useGoogleApiKey();

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
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tool, setTool] = useState<'select' | 'connect'>('select');

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Save node position after drag
  const saveNodePosition = useCallback(async (node: CanvasNode) => {
    await supabase.from('void_canvas_nodes').update({
      position_x: node.position_x,
      position_y: node.position_y,
    }).eq('id', node.id);
  }, []);

  // Mouse handlers for drag & pan
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
        if (connecting !== nodeId) {
          createConnection(connecting, nodeId);
        }
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

  // Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.1, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  // Create connection
  const createConnection = async (sourceId: string, targetId: string) => {
    if (!user) return;
    const { data, error } = await supabase.from('void_canvas_connections').insert({
      user_id: user.id,
      source_node_id: sourceId,
      target_node_id: targetId,
    }).select().single();
    if (data) setConnections(prev => [...prev, data]);
    if (error) toast.error('Erro ao conectar nós');
  };

  // Delete node
  const deleteNode = async (nodeId: string) => {
    await supabase.from('void_canvas_nodes').delete().eq('id', nodeId);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.source_node_id !== nodeId && c.target_node_id !== nodeId));
    setSelectedNode(null);
  };

  // Generate image via edge function
  const handleGenerate = async () => {
    if (!user || !genPrompt.trim()) return;
    if (!apiKey) {
      toast.error('Configure sua API Key primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
          body: JSON.stringify({
            prompt: genPrompt,
            googleApiKey: apiKey,
            model: 'gemini-2.5-flash',
            aspectRatio: '1:1',
          }),
        }
      );

      const data = await res.json();
      if (data.imageUrl || data.image) {
        const imageUrl = data.imageUrl || data.image;
        // Create node at center of viewport
        const centerX = (-pan.x + (window.innerWidth / 2)) / zoom;
        const centerY = (-pan.y + (window.innerHeight / 2)) / zoom;

        const { data: newNode } = await supabase.from('void_canvas_nodes').insert({
          user_id: user.id,
          label: genPrompt.slice(0, 50),
          node_type: 'image',
          image_url: imageUrl,
          prompt: genPrompt,
          position_x: centerX - 128,
          position_y: centerY - 128,
          width: 256,
          height: 256,
          z_index: nodes.length,
        }).select().single();

        if (newNode) setNodes(prev => [...prev, newNode]);
        setGenPrompt('');
        setGenerateOpen(false);
        toast.success('Imagem gerada e adicionada ao canvas!');
      } else {
        toast.error(data.error || 'Erro ao gerar imagem');
      }
    } catch (err) {
      toast.error('Erro ao gerar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add empty node
  const addEmptyNode = async () => {
    if (!user) return;
    const centerX = (-pan.x + (window.innerWidth / 2)) / zoom;
    const centerY = (-pan.y + (window.innerHeight / 2)) / zoom;

    const { data: newNode } = await supabase.from('void_canvas_nodes').insert({
      user_id: user.id,
      label: 'Novo nó',
      node_type: 'empty',
      position_x: centerX - 64,
      position_y: centerY - 64,
      width: 128,
      height: 128,
      z_index: nodes.length,
    }).select().single();

    if (newNode) setNodes(prev => [...prev, newNode]);
  };

  // Upload image to node
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);

    const centerX = (-pan.x + (window.innerWidth / 2)) / zoom;
    const centerY = (-pan.y + (window.innerHeight / 2)) / zoom;

    const { data: newNode } = await supabase.from('void_canvas_nodes').insert({
      user_id: user.id,
      label: file.name.slice(0, 50),
      node_type: 'image',
      image_url: objectUrl,
      position_x: centerX - 128,
      position_y: centerY - 128,
      width: 256,
      height: 256,
      z_index: nodes.length,
    }).select().single();

    if (newNode) setNodes(prev => [...prev, newNode]);
  };

  // Get node center for SVG lines
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.position_x + node.width / 2, y: node.position_y + node.height / 2 };
  };

  return (
    <div className="fixed inset-0 bg-[#050a0e] overflow-hidden select-none">
      {/* Background void effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-breathe" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[60px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-[#050a0e] shadow-[0_0_60px_30px_rgba(0,0,0,0.8)]" />
        {/* Star field */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 30%, hsl(var(--primary) / 0.3) 1px, transparent 0), radial-gradient(1px 1px at 60% 70%, hsl(var(--primary) / 0.2) 1px, transparent 0), radial-gradient(1px 1px at 80% 20%, hsl(var(--primary) / 0.15) 1px, transparent 0), radial-gradient(1px 1px at 40% 80%, hsl(var(--primary) / 0.2) 1px, transparent 0), radial-gradient(1px 1px at 10% 60%, hsl(var(--primary) / 0.1) 1px, transparent 0)',
          backgroundSize: '200px 200px, 300px 300px, 250px 250px, 180px 180px, 350px 350px',
        }} />
      </div>

      {/* Top toolbar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-background/60 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
              <span className="text-[10px]">🕳️</span>
            </div>
            <h1 className="text-sm font-bold font-display text-foreground tracking-tight">VOID</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold border border-primary/25">CANVAS</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tool selector */}
          <button
            onClick={() => { setTool('select'); setConnecting(null); }}
            className={cn('p-2 rounded-lg text-xs transition-colors', tool === 'select' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}
            title="Selecionar & Arrastar"
          >
            <MousePointer2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('connect')}
            className={cn('p-2 rounded-lg text-xs transition-colors', tool === 'connect' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}
            title="Conectar nós"
          >
            <Link2 className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-border/30 mx-1" />

          {/* Zoom controls */}
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-muted-foreground font-mono min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-border/30 mx-1" />

          <ApiKeyDialog />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/70 backdrop-blur-xl border border-border/40 shadow-cinematic">
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
              <Sparkles className="h-3.5 w-3.5" />
              Gerar com IA
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border/40 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Gerar imagem no VOID</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Descreva a imagem que deseja criar..."
                className="min-h-[100px] bg-secondary/50 border-border/40"
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !genPrompt.trim() || !apiKey}
                className="w-full gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? 'Gerando...' : 'Gerar e adicionar ao canvas'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground" asChild>
            <span>
              <Upload className="h-3.5 w-3.5" />
              Importar
            </span>
          </Button>
        </label>

        <Button size="sm" variant="ghost" onClick={addEmptyNode} className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" />
          Nó vazio
        </Button>

        {selectedNode && (
          <Button size="sm" variant="ghost" onClick={() => deleteNode(selectedNode)} className="gap-1.5 rounded-xl text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        )}
      </div>

      {/* Connecting indicator */}
      {connecting && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-primary/20 border border-primary/40 backdrop-blur-xl text-primary text-xs font-medium animate-pulse">
          Clique no nó de destino para conectar
          <button onClick={() => setConnecting(null)} className="ml-2 text-primary/60 hover:text-primary">
            <X className="h-3 w-3 inline" />
          </button>
        </div>
      )}

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="absolute inset-0 pt-14 cursor-grab active:cursor-grabbing"
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
                'absolute rounded-xl border transition-shadow duration-200 cursor-grab active:cursor-grabbing group',
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
                <img
                  src={node.image_url}
                  alt={node.label}
                  className="w-full h-full object-cover rounded-xl"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-card/40 backdrop-blur-sm">
                  <Plus className="h-6 w-6 text-muted-foreground/50" />
                  <span className="text-[9px] text-muted-foreground/50 mt-1">{node.label}</span>
                </div>
              )}

              {/* Node label on hover */}
              {node.label && node.image_url && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-white/80 truncate">{node.label}</p>
                </div>
              )}

              {/* Grip handle */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3 w-3 text-white/40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-3 animate-fade-up">
            <div className="text-4xl">🕳️</div>
            <h2 className="text-lg font-display font-bold text-foreground/60">O VOID está vazio</h2>
            <p className="text-xs text-muted-foreground max-w-xs">
              Gere imagens com IA, importe criações ou adicione nós para começar a organizar seu universo criativo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
