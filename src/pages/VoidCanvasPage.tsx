import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Sparkles,
  Loader2, Send, Trash2, ThumbsUp, ThumbsDown,
  Mic, MicOff, Image, User, X, ChevronDown, Download,
  Bot, ArrowRight, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus,
  Paperclip, Pencil, FolderOpen, Clock, Home, Palette, UserCircle, Info,
  MousePointer2, Hand, Target, Square, Minus, Circle, Triangle, Star,
  Type, Layers, Hash, Upload, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ── Types ──
type CanvasTool = 'select' | 'hand' | 'mark' | 'rectangle' | 'line' | 'arrow' | 'ellipse' | 'polygon' | 'star' | 'pencil' | 'text';

const SHAPES = [
  { id: 'rectangle' as CanvasTool, icon: Square, label: 'Retângulo', shortcut: 'R' },
  { id: 'line' as CanvasTool, icon: Minus, label: 'Linha', shortcut: 'L' },
  { id: 'arrow' as CanvasTool, icon: ArrowUpRight, label: 'Seta', shortcut: '↑L' },
  { id: 'ellipse' as CanvasTool, icon: Circle, label: 'Elipse', shortcut: 'O' },
  { id: 'polygon' as CanvasTool, icon: Triangle, label: 'Polígono', shortcut: '' },
  { id: 'star' as CanvasTool, icon: Star, label: 'Estrela', shortcut: '' },
];

interface CanvasImage {
  id: string;
  image_url: string;
  label: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  node_type?: string;
}

interface CanvasMarker {
  imageId: string;
  relX: number;
  relY: number;
  number: number;
}

interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  model?: string;
  title?: string;
}

type AgentMsg = { role: 'user' | 'assistant'; content: string };

interface VoidProject {
  id: string;
  title: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

interface BrandKit {
  id: string;
  name: string;
  colors: string[];
  created_at: string;
  updated_at: string;
}

interface RecentCreation {
  id: string;
  image_url: string;
  label: string;
  created_at: string;
}

type HomeView = 'home' | 'projects' | 'brand-kit' | 'profile';

// ── Constants ──
const IMAGE_MODELS = [
  { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro', desc: 'Qualidade máxima · Gemini 3', badge: 'PRO' },
  { id: 'gemini-3.1-flash-image-preview', label: 'Nano Banana 2', desc: 'Rápido · Gemini 3.1', badge: 'NEW' },
] as const;

const AGENTS = [
  { id: 'general', label: 'Geral', emoji: '🤖', desc: 'IA versátil para qualquer tarefa' },
  { id: 'prompt-architect', label: 'Gerador de Prompts Pro', emoji: '🧠', desc: 'Prompts cinematográficos hiper-detalhados' },
];

const CHAT_MODELS = [
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', label: 'Flash Lite' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-hub`;

export default function VoidCanvasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiKey } = useGoogleApiKey();

  // ── Project state ──
  const [projects, setProjects] = useState<VoidProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [homePrompt, setHomePrompt] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [homeView, setHomeView] = useState<HomeView>('home');
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [activeBrandKit, setActiveBrandKit] = useState<BrandKit | null>(null);
  const [recentCreations, setRecentCreations] = useState<RecentCreation[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandColors, setNewBrandColors] = useState<string[]>(['#10B981', '#0EA5E9', '#8B5CF6']);
  const [newColorInput, setNewColorInput] = useState('#10B981');

  // ── Canvas state ──
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // ── Right panel: Image gen chat ──
  const [genMessages, setGenMessages] = useState<ChatMessage[]>([]);
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS[0].id);
  const [modelOpen, setModelOpen] = useState(false);

  // Multimedia
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceDesc, setReferenceDesc] = useState('');
  const [showRefDesc, setShowRefDesc] = useState(false);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // ── Left panel: Agent chat ──
  const [agentMessages, setAgentMessages] = useState<AgentMsg[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [chatModel, setChatModel] = useState(CHAT_MODELS[0]);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [showLayers, setShowLayers] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [usePaletteInChat, setUsePaletteInChat] = useState(false);

  // ── Refs ──
  const genChatEndRef = useRef<HTMLDivElement>(null);
  const agentChatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);
  const agentMediaRef = useRef<HTMLInputElement>(null);
  const canvasUploadRef = useRef<HTMLInputElement>(null);
  const [agentAttachment, setAgentAttachment] = useState<string | null>(null);

  // ══════════════════════════════════════════════
  // PROJECT MANAGEMENT
  // ══════════════════════════════════════════════
  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);
    const { data } = await supabase
      .from('void_projects' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setProjects(data as any as VoidProject[]);
    setLoadingProjects(false);
  }, [user]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Load brand kits
  const loadBrandKits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('void_brand_kits' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setBrandKits(data as any as BrandKit[]);
  }, [user]);

  // Load recent creations (last 7 days)
  const loadRecentCreations = useCallback(async () => {
    if (!user) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data } = await supabase
      .from('void_canvas_nodes')
      .select('id, image_url, label, created_at')
      .eq('user_id', user.id)
      .eq('node_type', 'image')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRecentCreations(data.filter((d: any) => d.image_url) as any as RecentCreation[]);
  }, [user]);

  useEffect(() => { loadBrandKits(); loadRecentCreations(); }, [loadBrandKits, loadRecentCreations]);

  const createBrandKit = async () => {
    if (!user || !newBrandName.trim() || newBrandColors.length === 0) return;
    const { data } = await supabase
      .from('void_brand_kits' as any)
      .insert({ user_id: user.id, name: newBrandName.trim(), colors: newBrandColors } as any)
      .select()
      .single();
    if (data) {
      setBrandKits(prev => [data as any as BrandKit, ...prev]);
      setNewBrandName('');
      setNewBrandColors(['#10B981', '#0EA5E9', '#8B5CF6']);
      toast.success('Kit de marca criado!');
    }
  };

  const deleteBrandKit = async (id: string) => {
    await supabase.from('void_brand_kits' as any).delete().eq('id', id);
    setBrandKits(prev => prev.filter(k => k.id !== id));
    if (activeBrandKit?.id === id) setActiveBrandKit(null);
  };

  const createProject = async (initialPrompt?: string) => {
    if (!user) return null;
    const title = initialPrompt ? initialPrompt.slice(0, 50) : 'Sem título';
    const { data, error } = await supabase
      .from('void_projects' as any)
      .insert({ user_id: user.id, title } as any)
      .select()
      .single();
    if (error || !data) { toast.error('Erro ao criar projeto'); return null; }
    const project = data as any as VoidProject;
    setProjects(prev => [project, ...prev]);
    return project.id;
  };

  const openProject = async (projectId: string) => {
    setActiveProjectId(projectId);
    setImages([]);
    setGenMessages([]);
    setAgentMessages([]);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    // Load images for this project
    if (!user) return;
    const { data } = await supabase
      .from('void_canvas_nodes')
      .select('*')
      .eq('user_id', user.id)
      .eq('node_type', 'image')
      .eq('project_id', projectId)
      .order('z_index');
    if (data) {
      setImages(data.map((d: any) => ({
        id: d.id, image_url: d.image_url || '', label: d.label,
        position_x: d.position_x, position_y: d.position_y,
        width: d.width, height: d.height, node_type: d.node_type,
      })));
    }
  };

  const renameProject = async (projectId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await supabase.from('void_projects' as any).update({ title: newTitle.trim() } as any).eq('id', projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, title: newTitle.trim() } : p));
    setEditingProjectId(null);
  };

  const deleteProject = async (projectId: string) => {
    await supabase.from('void_projects' as any).delete().eq('id', projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleHomeSubmit = async () => {
    const prompt = homePrompt.trim();
    if (!prompt) return;
    const projectId = await createProject(prompt);
    if (projectId) {
      setHomePrompt('');
      setActiveProjectId(projectId);
      // Pre-fill the gen prompt so user can generate right away
      setGenPrompt(prompt);
    }
  };

  // ── Load canvas images (when in workspace without project - legacy) ──
  useEffect(() => {
    if (!user || activeProjectId) return;
    // Don't load anything if no project selected
  }, [user, activeProjectId]);

  useEffect(() => { genChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [genMessages]);
  useEffect(() => { agentChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [agentMessages]);

  // ── Canvas interactions ──
  const savePosition = useCallback(async (img: CanvasImage) => {
    await supabase.from('void_canvas_nodes').update({ position_x: img.position_x, position_y: img.position_y }).eq('id', img.id);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, imgId?: string) => {
    // Mark tool: send image to agent for AI analysis
    if (activeTool === 'mark' && imgId) {
      const img = images.find(i => i.id === imgId);
      if (img && img.image_url) {
        setAgentAttachment(img.image_url);
        setAgentInput('Identifique e descreva os elementos principais desta imagem.');
        setLeftPanelOpen(true);
        toast.success('Imagem enviada ao agente para análise');
      }
      e.stopPropagation();
      return;
    }
    // Hand tool: always pan
    if (activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedImage(null);
      return;
    }
    if (imgId) {
      const img = images.find(i => i.id === imgId);
      if (!img) return;
      setDragging(imgId);
      setSelectedImage(imgId);
      setDragOffset({ x: e.clientX / zoom - img.position_x, y: e.clientY / zoom - img.position_y });
      e.stopPropagation();
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedImage(null);
    }
  }, [images, zoom, pan, activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setImages(prev => prev.map(i => i.id === dragging ? { ...i, position_x: e.clientX / zoom - dragOffset.x, position_y: e.clientY / zoom - dragOffset.y } : i));
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

  const addImageToCanvas = async (imageUrl: string, label: string, promptText: string) => {
    if (!user || !activeProjectId) return;
    const baseX = 80 + Math.random() * 400;
    const baseY = 80 + images.length * 140 + Math.random() * 60;
    const { data: newRow } = await supabase.from('void_canvas_nodes').insert({
      user_id: user.id, label: label.slice(0, 50), node_type: 'image',
      image_url: imageUrl, prompt: promptText,
      position_x: baseX, position_y: baseY,
      width: 200, height: 200, z_index: images.length,
      project_id: activeProjectId,
    } as any).select().single();

    if (newRow && (newRow as any).image_url) {
      const r = newRow as any;
      setImages(prev => [...prev, {
        id: r.id, image_url: r.image_url!, label: r.label,
        position_x: r.position_x, position_y: r.position_y,
        width: r.width, height: r.height,
      }]);
      // Update project thumbnail & updated_at
      await supabase.from('void_projects' as any).update({ thumbnail_url: imageUrl, updated_at: new Date().toISOString() } as any).eq('id', activeProjectId);
    }
    };

  // Upload image directly to canvas
  const handleUploadToCanvas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user || !activeProjectId) return;
    const file = e.target.files[0];
    const filePath = `void/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('chat-media').upload(filePath, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      await addImageToCanvas(publicUrl, file.name.slice(0, 50), 'Imagem carregada');
      toast.success('Imagem adicionada ao canvas!');
    } else {
      toast.error('Erro ao fazer upload');
    }
    e.target.value = '';
  };

  // Add a note/frame to canvas
  const addNoteToCanvas = async () => {
    if (!user || !activeProjectId) return;
    const text = prompt('Digite o texto da nota:');
    if (!text?.trim()) return;
    const baseX = 100 + Math.random() * 300;
    const baseY = 100 + Math.random() * 300;
    const { data: newRow } = await supabase.from('void_canvas_nodes').insert({
      user_id: user.id, label: text.trim(), node_type: 'note',
      position_x: baseX, position_y: baseY,
      width: 200, height: 120, z_index: images.length,
      project_id: activeProjectId,
    } as any).select().single();
    if (newRow) {
      const r = newRow as any;
      setImages(prev => [...prev, {
        id: r.id, image_url: '', label: r.label,
        position_x: r.position_x, position_y: r.position_y,
        width: r.width, height: r.height, node_type: 'note',
      }]);
      toast.success('Nota adicionada ao canvas!');
    }
  };

  // ── Multimedia helpers ──
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => { const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.readAsDataURL(file); });

  const handleRefImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setReferenceImage(await fileToBase64(e.target.files[0]));
    setShowRefDesc(true);
  };

  const handleCharImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setCharacterImage(await fileToBase64(e.target.files[0]));
  };

  const toggleRecording = async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => { setAudioBlob(new Blob(chunks, { type: 'audio/webm' })); stream.getTracks().forEach(t => t.stop()); toast.success('Áudio gravado!'); };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch { toast.error('Sem acesso ao microfone'); }
  };

  // ══════════════════════════════════════════════
  // IMAGE GENERATION (right panel)
  // ══════════════════════════════════════════════
  const handleGenSend = async () => {
    if ((!genPrompt.trim() && !audioBlob) || isGenerating) return;
    if (!apiKey) { toast.error('Configure sua API Key primeiro'); return; }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: genPrompt || '🎤 Áudio enviado' };
    setGenMessages(prev => [...prev, userMessage]);
    const currentPrompt = genPrompt;
    setGenPrompt('');
    setIsGenerating(true);

    const currentRef = referenceImage; const currentRefDesc = referenceDesc;
    const currentChar = characterImage; const currentAudio = audioBlob;
    setReferenceImage(null); setReferenceDesc(''); setShowRefDesc(false);
    setCharacterImage(null); setAudioBlob(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      let finalPrompt = currentPrompt;
      if (currentAudio && !currentPrompt.trim()) {
        finalPrompt = 'Generate an image based on the audio description provided';
      }

      // Smart Router
      const routerId = crypto.randomUUID();
      setGenMessages(prev => [...prev, { id: routerId, role: 'assistant', content: '🧭 Analisando seu pedido...', model: 'Smart Router' }]);

      let expandedPrompt = finalPrompt;
      let agentName = ''; let agentEmoji = '';

      try {
        const routerRes = await fetch(`https://${projectId}.supabase.co/functions/v1/void-smart-router`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
          body: JSON.stringify({ prompt: finalPrompt, googleApiKey: apiKey }),
        });
        const routerData = await routerRes.json();
        if (routerData.expandedPrompt) {
          expandedPrompt = routerData.expandedPrompt;
          agentName = routerData.agentName || '';
          agentEmoji = routerData.agentEmoji || '';
        }
      } catch { console.warn('Smart router failed'); }

      // Inject brand kit colors into prompt
      if (activeBrandKit && activeBrandKit.colors.length > 0) {
        const colorList = activeBrandKit.colors.join(', ');
        expandedPrompt += `. MANDATORY COLOR PALETTE: Use exclusively these brand colors: ${colorList}. All design elements, lighting, accents, and color scheme must strictly follow this palette.`;
      }

      setGenMessages(prev => prev.map(m => m.id === routerId ? { ...m, content: agentName ? `${agentEmoji} Agente: **${agentName}** · Prompt expandido` : '🧠 Prompt processado' } : m));

      const thinkingId = crypto.randomUUID();
      setGenMessages(prev => [...prev, { id: thinkingId, role: 'assistant', content: `Gerando com ${IMAGE_MODELS.find(m => m.id === imageModel)?.label || imageModel}...${activeBrandKit ? ` · Kit: ${activeBrandKit.name}` : ''}`, model: IMAGE_MODELS.find(m => m.id === imageModel)?.label || imageModel }]);

      const body: Record<string, unknown> = {
        prompt: expandedPrompt, googleApiKey: apiKey,
        aiModel: imageModel === 'gemini-3-pro-image-preview' ? 'pro' : 'flash',
        aspectRatio: '1:1', useArchitect: false,
      };
      if (currentChar) body.subjectImages = [currentChar];
      if (currentRef) { body.styleReferenceImages = [currentRef]; if (currentRefDesc.trim()) body.referenceNotes = [currentRefDesc]; }

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.imageUrl || data.image) {
        const imageUrl = data.imageUrl || data.image;
        const title = finalPrompt.slice(0, 60);
        setGenMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, content: 'Pronto! Imagem criada e adicionada ao canvas.', imageUrl, title } : m));
        await addImageToCanvas(imageUrl, title, finalPrompt);
      } else {
        setGenMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, content: data.error || 'Erro ao gerar imagem.' } : m));
      }
    } catch {
      setGenMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Erro de conexão.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // ══════════════════════════════════════════════
  // AGENT CHAT (left panel)
  // ══════════════════════════════════════════════
  const handleAgentSend = async () => {
    const msg = agentInput.trim();
    const attachment = agentAttachment;
    if ((!msg && !attachment) || agentLoading) return;
    if (!apiKey || apiKey.length < 10) { toast.error('Configure sua API Key do Google'); return; }

    let content = msg;
    if (attachment) {
      content = msg ? `${msg}\n\n[Imagem: ${attachment}]` : `[Imagem: ${attachment}]\n\nAnalise esta imagem.`;
    }
    // Inject brand palette if active
    if (usePaletteInChat && activeBrandKit) {
      content += `\n\n[PALETA DE CORES ATIVA: ${activeBrandKit.colors.join(', ')}] Use estas cores como referência para prompts e sugestões visuais.`;
    }

    const userMsg: AgentMsg = { role: 'user', content };
    setAgentMessages(prev => [...prev, userMsg]);
    setAgentInput('');
    setAgentAttachment(null);
    setAgentLoading(true);

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [...agentMessages, userMsg], model: chatModel.id, agentId: selectedAgent.id, googleApiKey: apiKey }),
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      if (!resp.body) throw new Error('Sem resposta');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setAgentMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        const lines = textBuffer.split('\n');
        textBuffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const j = JSON.parse(payload);
            const delta = j.choices?.[0]?.delta?.content
              || j.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) upsertAssistant(delta);
          } catch {}
        }
      }

      if (assistantSoFar.trim() === '') upsertAssistant('Sem resposta do agente.');
    } catch (e: any) {
      setAgentMessages(prev => [...prev, { role: 'assistant', content: e.message || 'Erro na conexão.' }]);
    } finally {
      setAgentLoading(false);
    }
  };

  const transferToGenerator = (text: string) => {
    setGenPrompt(text);
    toast.success('Prompt transferido para o gerador!');
  };

  const handleGenKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenSend(); } };
  const handleAgentKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAgentSend(); } };

  const activeProject = projects.find(p => p.id === activeProjectId);

  // ══════════════════════════════════════════════
  // HOME SCREEN (no project selected)
  // ══════════════════════════════════════════════
  if (!activeProjectId) {
    const sidebarItems = [
      { id: 'home' as HomeView, icon: Home, label: 'Início' },
      { id: 'projects' as HomeView, icon: FolderOpen, label: 'Projetos' },
      { id: 'brand-kit' as HomeView, icon: Palette, label: 'Kit de Marca' },
      { id: 'profile' as HomeView, icon: UserCircle, label: 'Minhas Criações' },
    ];

    return (
      <div className="fixed inset-0 bg-[#050a0e] overflow-hidden flex">
        {/* ===== LATERAL ICON SIDEBAR ===== */}
        <div className="w-16 flex flex-col items-center py-4 gap-2 border-r border-border/10 bg-[#070c10] shrink-0">
          {/* New Project */}
          <button
            onClick={async () => { const id = await createProject(); if (id) openProject(id); }}
            className="w-10 h-10 rounded-full bg-foreground/10 border border-border/20 flex items-center justify-center text-foreground/70 hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all mb-3"
            title="Novo Projeto"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Divider */}
          <div className="w-8 h-px bg-border/15 mb-1" />

          {/* Nav items */}
          <div className="flex flex-col items-center gap-1 bg-[#0d1218] rounded-2xl p-1.5 border border-border/10">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setHomeView(item.id)}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                  homeView === item.id
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20'
                )}
                title={item.label}
              >
                <item.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Spacer + back */}
          <div className="mt-auto">
            <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20 transition-all" title="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Black hole + particles bg */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-breathe" />
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[60px] animate-pulse" />
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-[#050a0e] shadow-[0_0_60px_30px_rgba(0,0,0,0.8)]" />
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(1px 1px at 20% 30%, hsl(var(--primary) / 0.3) 1px, transparent 0), radial-gradient(1px 1px at 60% 70%, hsl(var(--primary) / 0.2) 1px, transparent 0), radial-gradient(1px 1px at 40% 50%, hsl(var(--primary) / 0.15) 1px, transparent 0)',
              backgroundSize: '200px 200px, 300px 300px, 150px 150px',
            }} />
          </div>

          <div className="relative z-10">
            {/* ═══ HOME VIEW ═══ */}
            {homeView === 'home' && (
              <>
                {/* Hero Section */}
                <div className="flex flex-col items-center justify-center pt-24 pb-16 px-6">
                  <div className="text-center space-y-6 max-w-2xl w-full">
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">VOID</h1>
                      </div>
                      <p className="text-sm text-muted-foreground/60">
                        Descreva o que quer criar e comece um novo projeto
                      </p>
                    </div>

                    {/* Active brand kit indicator */}
                    {activeBrandKit && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-medium">
                          <Palette className="h-3 w-3" />
                          <span>Kit: {activeBrandKit.name}</span>
                          <div className="flex gap-0.5 ml-1">
                            {activeBrandKit.colors.slice(0, 4).map((c, i) => (
                              <div key={i} className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <button onClick={() => setActiveBrandKit(null)} className="ml-1 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                        </div>
                      </div>
                    )}

                    {/* Hero input */}
                    <div className="w-full max-w-xl mx-auto">
                      <div className="rounded-2xl border border-border/20 bg-[#0d1218] focus-within:border-primary/30 transition-all shadow-2xl overflow-hidden">
                        <Textarea
                          value={homePrompt}
                          onChange={(e) => setHomePrompt(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleHomeSubmit(); } }}
                          placeholder="Descreva o que quer criar..."
                          className="min-h-[70px] max-h-[140px] resize-none bg-transparent border-none text-sm text-foreground/90 focus-visible:ring-0 placeholder:text-muted-foreground/30 px-5 pt-4"
                        />
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/25 text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors">
                                  <Sparkles className="h-3 w-3" />
                                  {IMAGE_MODELS.find(m => m.id === imageModel)?.label.split(' ').slice(-2).join(' ') || 'Modelo'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[260px] p-1.5 bg-[#111820] border-border/20" side="top" align="end">
                                {IMAGE_MODELS.map(m => (
                                  <button key={m.id} onClick={() => setImageModel(m.id)}
                                    className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors', imageModel === m.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-secondary/20')}>
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-medium truncate">{m.label}</span>
                                        {m.badge && <span className={cn('rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase', m.badge === 'PRO' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')}>{m.badge}</span>}
                                      </div>
                                      <p className="text-[9px] text-muted-foreground/40 truncate">{m.desc}</p>
                                    </div>
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>
                            <button
                              onClick={handleHomeSubmit}
                              disabled={!homePrompt.trim()}
                              className={cn('p-2.5 rounded-full transition-all', homePrompt.trim() ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm' : 'bg-secondary/20 text-muted-foreground/20 cursor-not-allowed')}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Projects preview */}
                <div className="px-6 pb-12 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground/50" />
                      Projetos Recentes
                    </h2>
                    <button onClick={() => setHomeView('projects')} className="text-[10px] text-primary/60 hover:text-primary transition-colors">Ver todos →</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {projects.slice(0, 4).map(project => (
                      <div key={project.id} className="group relative aspect-[4/3] rounded-xl border border-border/15 bg-[#0a0f14] hover:border-primary/25 transition-all cursor-pointer overflow-hidden"
                        onClick={() => openProject(project.id)}>
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center"><FolderOpen className="h-8 w-8 text-muted-foreground/15" /></div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0f14] to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3 space-y-1">
                          <p className="text-[11px] font-medium text-foreground/80 truncate">{project.title}</p>
                          <p className="text-[9px] text-muted-foreground/40">{new Date(project.updated_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ═══ PROJECTS VIEW ═══ */}
            {homeView === 'projects' && (
              <div className="px-8 py-8 max-w-5xl mx-auto">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  Todos os Projetos
                </h2>
                {loadingProjects ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary/50" /></div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <button onClick={async () => { const id = await createProject(); if (id) openProject(id); }}
                      className="group aspect-[4/3] rounded-xl border-2 border-dashed border-border/20 bg-[#0a0f14] hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Plus className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground/50 group-hover:text-foreground/70 transition-colors">Novo Projeto</span>
                    </button>
                    {projects.map(project => (
                      <div key={project.id} className="group relative aspect-[4/3] rounded-xl border border-border/15 bg-[#0a0f14] hover:border-primary/25 transition-all cursor-pointer overflow-hidden"
                        onClick={() => openProject(project.id)}>
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center"><FolderOpen className="h-8 w-8 text-muted-foreground/15" /></div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0f14] to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3 space-y-1">
                          {editingProjectId === project.id ? (
                            <input value={editProjectTitle} onChange={(e) => setEditProjectTitle(e.target.value)}
                              onBlur={() => renameProject(project.id, editProjectTitle)}
                              onKeyDown={(e) => { if (e.key === 'Enter') renameProject(project.id, editProjectTitle); if (e.key === 'Escape') setEditingProjectId(null); }}
                              onClick={(e) => e.stopPropagation()} autoFocus
                              className="w-full bg-transparent text-[11px] font-medium text-foreground border-b border-primary/40 focus:outline-none pb-0.5" />
                          ) : (
                            <p className="text-[11px] font-medium text-foreground/80 truncate">{project.title}</p>
                          )}
                          <p className="text-[9px] text-muted-foreground/40">{new Date(project.updated_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); setEditProjectTitle(project.title); }}
                            className="p-1.5 rounded-lg bg-background/60 backdrop-blur-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); if (confirm('Excluir projeto?')) deleteProject(project.id); }}
                            className="p-1.5 rounded-lg bg-background/60 backdrop-blur-sm text-muted-foreground/60 hover:text-destructive transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ BRAND KIT VIEW ═══ */}
            {homeView === 'brand-kit' && (
              <div className="px-8 py-8 max-w-3xl mx-auto">
                <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Kit de Marca
                </h2>
                <p className="text-[12px] text-muted-foreground/50 mb-8">
                  Defina paletas de cores que serão aplicadas automaticamente em todas as suas gerações.
                </p>

                {/* Create new kit */}
                <div className="rounded-xl border border-border/15 bg-[#0a0f14] p-5 mb-6 space-y-4">
                  <h3 className="text-[13px] font-semibold text-foreground/80">Criar novo kit</h3>
                  <input
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Nome da marca..."
                    className="w-full bg-[#111820] border border-border/15 rounded-lg px-3 py-2 text-[12px] text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30"
                  />
                  <div className="space-y-2">
                    <span className="text-[11px] text-muted-foreground/60">Cores da paleta:</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {newBrandColors.map((c, i) => (
                        <div key={i} className="relative group">
                          <div className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer" style={{ backgroundColor: c }} />
                          <button onClick={() => setNewBrandColors(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-2 w-2" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1">
                        <input type="color" value={newColorInput} onChange={(e) => setNewColorInput(e.target.value)}
                          className="w-8 h-8 rounded-lg border-none cursor-pointer bg-transparent" />
                        <button onClick={() => { if (!newBrandColors.includes(newColorInput)) setNewBrandColors(prev => [...prev, newColorInput]); }}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={createBrandKit} disabled={!newBrandName.trim() || newBrandColors.length === 0}
                    className={cn('w-full py-2 rounded-lg text-[12px] font-medium transition-all', newBrandName.trim() && newBrandColors.length > 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary/20 text-muted-foreground/30 cursor-not-allowed')}>
                    Criar Kit de Marca
                  </button>
                </div>

                {/* Existing kits */}
                {brandKits.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-semibold text-foreground/70">Seus kits</h3>
                    {brandKits.map(kit => (
                      <div key={kit.id}
                        className={cn('rounded-xl border bg-[#0a0f14] p-4 flex items-center justify-between transition-all cursor-pointer',
                          activeBrandKit?.id === kit.id ? 'border-primary/40 bg-primary/5' : 'border-border/15 hover:border-border/30')}
                        onClick={() => setActiveBrandKit(activeBrandKit?.id === kit.id ? null : kit)}>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {kit.colors.slice(0, 5).map((c, i) => (
                              <div key={i} className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <div>
                            <p className="text-[12px] font-medium text-foreground/80">{kit.name}</p>
                            <p className="text-[9px] text-muted-foreground/40">{kit.colors.length} cores · {activeBrandKit?.id === kit.id ? 'Ativo' : 'Clique para ativar'}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Excluir kit?')) deleteBrandKit(kit.id); }}
                          className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ PROFILE / RECENT CREATIONS VIEW ═══ */}
            {homeView === 'profile' && (
              <div className="px-8 py-8 max-w-5xl mx-auto">
                <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Minhas Criações
                </h2>
                <p className="text-[12px] text-muted-foreground/50 mb-8">
                  Imagens geradas nos últimos 7 dias.
                </p>

                {recentCreations.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Image className="h-10 w-10 text-muted-foreground/15 mx-auto" />
                    <p className="text-[12px] text-muted-foreground/40">Nenhuma criação nos últimos 7 dias.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {recentCreations.map(creation => (
                      <div key={creation.id} className="group relative aspect-square rounded-xl border border-border/15 bg-[#0a0f14] overflow-hidden">
                        <img src={creation.image_url} alt={creation.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0f14] to-transparent p-3">
                          <p className="text-[10px] text-foreground/70 truncate">{creation.label}</p>
                          <p className="text-[8px] text-muted-foreground/40">{new Date(creation.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button onClick={() => { const a = document.createElement('a'); a.href = creation.image_url; a.download = `void-${Date.now()}.png`; a.click(); }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/60 backdrop-blur-sm text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                          <Download className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // WORKSPACE (project selected)
  // ══════════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-[#050a0e] overflow-hidden flex">

      {/* ========== LEFT: AGENT CHAT PANEL ========== */}
      {leftPanelOpen && (
        <div className="w-[360px] flex flex-col border-r border-border/15 bg-[#080d12] shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-border/10 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-[12px] font-bold text-foreground/90">Agentes</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setAgentMessages([]); }}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setLeftPanelOpen(false)}>
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Agent & Model selectors */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-border/10 shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-primary/25 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors">
                  <span>{selectedAgent.emoji}</span>
                  <span className="max-w-[100px] truncate">{selectedAgent.label}</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-1.5 bg-[#111820] border-border/20" side="bottom" align="start">
                {AGENTS.map(a => (
                  <button key={a.id} onClick={() => setSelectedAgent(a)}
                    className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-[11px]', selectedAgent.id === a.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-secondary/20')}>
                    <span>{a.emoji}</span>
                    <div><div className="font-medium">{a.label}</div><div className="text-[9px] text-muted-foreground/40">{a.desc}</div></div>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1.5 rounded-full border border-border/20 text-[9px] text-muted-foreground/60 hover:bg-secondary/10 transition-colors">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span className="max-w-[80px] truncate">{chatModel.label}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-1.5 bg-[#111820] border-border/20" side="bottom" align="start">
                {CHAT_MODELS.map(m => (
                  <button key={m.id} onClick={() => setChatModel(m)}
                    className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[10px] transition-colors', chatModel.id === m.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-secondary/20')}>
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>{m.label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Agent messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 select-text">
            {agentMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40 select-none">
                <MessageSquare className="h-8 w-8 text-primary/30" />
                <p className="text-[11px] text-muted-foreground/50 max-w-[200px]">
                  Converse com um agente para criar prompts, estratégias e ideias. Depois transfira direto para o gerador.
                </p>
              </div>
            )}

            {agentMessages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-[#151c24] border border-border/15 text-foreground/90 text-[11px] leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[95%] space-y-2">
                    <div className="prose prose-sm prose-invert max-w-none text-[11px] text-foreground/75 leading-relaxed [&_p]:mb-2 [&_li]:mb-1 [&_code]:bg-secondary/30 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-[#111820] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <button
                      onClick={() => transferToGenerator(msg.content)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-medium hover:bg-primary/20 transition-colors group select-none"
                    >
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      Usar como prompt
                    </button>
                  </div>
                )}
              </div>
            ))}

            {agentLoading && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Pensando...</span>
              </div>
            )}
            <div ref={agentChatEndRef} />
          </div>

          {/* Agent input */}
          <div className="shrink-0 p-3 space-y-2">
            {agentAttachment && (
              <div className="relative inline-block group">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-primary/30 bg-[#111820]">
                  <img src={agentAttachment} alt="Anexo" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => setAgentAttachment(null)} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-2 w-2 text-white" />
                </button>
              </div>
            )}
            <div className="rounded-2xl border border-border/15 bg-[#111820] focus-within:border-primary/25 transition-colors overflow-hidden">
              <Textarea
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={handleAgentKeyDown}
                placeholder="Peça ideias ao agente..."
                className="min-h-[50px] max-h-[100px] resize-none bg-transparent border-none text-[11px] text-foreground/90 focus-visible:ring-0 placeholder:text-muted-foreground/30 px-3.5 pt-2.5"
                disabled={agentLoading}
              />
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-0.5">
                  <input ref={agentMediaRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    if (!e.target.files?.[0]) return;
                    const b64 = await fileToBase64(e.target.files[0]);
                    setAgentAttachment(b64);
                    e.target.value = '';
                  }} />
                  <button onClick={() => agentMediaRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20 transition-colors" title="Anexar imagem">
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                  {activeBrandKit && (
                    <button onClick={() => setUsePaletteInChat(!usePaletteInChat)}
                      className={cn('p-1.5 rounded-lg transition-colors', usePaletteInChat ? 'text-primary bg-primary/10' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20')}
                      title={usePaletteInChat ? `Paleta ativa: ${activeBrandKit.name}` : 'Ativar paleta no chat'}>
                      <Palette className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleAgentSend}
                  disabled={agentLoading || (!agentInput.trim() && !agentAttachment) || !apiKey}
                  className={cn('p-1.5 rounded-full transition-all', (agentInput.trim() || agentAttachment) && apiKey ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary/20 text-muted-foreground/20 cursor-not-allowed')}
                >
                  {agentLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CENTER: CANVAS ========== */}
      <div className="flex-1 relative overflow-hidden select-none">
        {/* Void bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-breathe" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[60px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-[#050a0e] shadow-[0_0_60px_30px_rgba(0,0,0,0.8)]" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(1px 1px at 20% 30%, hsl(var(--primary) / 0.3) 1px, transparent 0), radial-gradient(1px 1px at 60% 70%, hsl(var(--primary) / 0.2) 1px, transparent 0)',
            backgroundSize: '200px 200px, 300px 300px',
          }} />
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12 bg-background/40 backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center gap-3">
            {!leftPanelOpen && (
              <button onClick={() => setLeftPanelOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setActiveProjectId(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Voltar aos projetos">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              {/* Editable project title */}
              {editingProjectId === activeProjectId ? (
                <input
                  value={editProjectTitle}
                  onChange={(e) => setEditProjectTitle(e.target.value)}
                  onBlur={() => { renameProject(activeProjectId, editProjectTitle); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') renameProject(activeProjectId, editProjectTitle); if (e.key === 'Escape') setEditingProjectId(null); }}
                  autoFocus
                  className="bg-transparent text-xs font-bold text-foreground border-b border-primary/40 focus:outline-none max-w-[200px]"
                />
              ) : (
                <button
                  onDoubleClick={() => { setEditingProjectId(activeProjectId); setEditProjectTitle(activeProject?.title || ''); }}
                  className="text-xs font-bold font-display text-foreground tracking-tight hover:text-primary transition-colors"
                  title="Clique duplo para renomear"
                >
                  {activeProject?.title || 'VOID'}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ApiKeyDialog />
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
            {!rightPanelOpen && (
              <button onClick={() => setRightPanelOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors ml-1" title="Abrir Gerador">
                <Sparkles className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div ref={canvasRef} className={cn("absolute inset-0 pt-12",
            activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' :
            activeTool === 'mark' ? 'cursor-crosshair' :
            activeTool === 'pencil' || ['rectangle','line','arrow','ellipse','polygon','star'].includes(activeTool) ? 'cursor-crosshair' :
            activeTool === 'text' ? 'cursor-text' : 'cursor-default'
          )}
          onMouseDown={(e) => handleMouseDown(e)} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }} className="absolute inset-0">
            {images.map(img => (
              <div key={img.id} onMouseDown={(e) => handleMouseDown(e, img.id)}
                className={cn('absolute rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group transition-shadow duration-200', selectedImage === img.id ? 'ring-2 ring-primary/50 shadow-glow-md' : 'hover:shadow-glow-sm')}
                style={{ left: img.position_x, top: img.position_y, width: img.width, height: img.height }}>
                {img.node_type === 'note' ? (
                  <div className="w-full h-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-center backdrop-blur-sm">
                    <p className="text-[11px] text-amber-200/80 text-center leading-relaxed">{img.label}</p>
                  </div>
                ) : (
                  <img src={img.image_url} alt={img.label} className="w-full h-full object-cover" draggable={false} />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[8px] text-white/80 truncate">{img.label}</p>
                </div>
                {selectedImage === img.id && (
                  <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setAgentAttachment(img.image_url || ''); setAgentInput('Analise esta imagem.'); setLeftPanelOpen(true); toast.success('Imagem enviada ao chat'); }}
                      className="p-1 rounded-md bg-black/60 text-primary hover:bg-black/80" title="Enviar ao chat">
                      <MessageSquare className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                      className="p-1 rounded-md bg-black/60 text-destructive hover:bg-black/80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {images.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center space-y-2 animate-fade-up">
              <Sparkles className="h-8 w-8 text-primary/30 mx-auto" />
              <h2 className="text-sm font-display font-bold text-foreground/50">Canvas vazio</h2>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">Use a toolbar abaixo ou o gerador à direita para começar.</p>
            </div>
          </div>
        )}

        {/* Hidden upload input */}
        <input ref={canvasUploadRef} type="file" accept="image/*,.heic,.avif,.webp" className="hidden" onChange={handleUploadToCanvas} />

        {/* ═══ BOTTOM TOOLBAR ═══ */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-2xl bg-[#0d1218]/90 backdrop-blur-xl border border-border/20 shadow-2xl">
            {/* Select */}
            <button onClick={() => setActiveTool('select')}
              className={cn('p-2 rounded-xl transition-all', activeTool === 'select' ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Selecionar (V)">
              <MousePointer2 className="h-4 w-4" />
            </button>
            {/* Hand */}
            <button onClick={() => setActiveTool('hand')}
              className={cn('p-2 rounded-xl transition-all', activeTool === 'hand' ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Mão (H)">
              <Hand className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border/20 mx-0.5" />

            {/* Mark (AI object extraction) */}
            <button onClick={() => { setActiveTool('mark'); toast.info('Clique em uma imagem para enviar ao agente IA'); }}
              className={cn('p-2 rounded-xl transition-all', activeTool === 'mark' ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Marcar objeto (M)">
              <Target className="h-4 w-4" />
            </button>

            {/* Upload image */}
            <button onClick={() => canvasUploadRef.current?.click()}
              className="p-2 rounded-xl text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20 transition-all"
              title="Carregar imagem">
              <Upload className="h-4 w-4" />
            </button>

            {/* Shapes */}
            <Popover open={showShapesMenu} onOpenChange={setShowShapesMenu}>
              <PopoverTrigger asChild>
                <button className={cn('p-2 rounded-xl transition-all', SHAPES.some(s => s.id === activeTool) ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
                  title="Formas">
                  <Hash className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-1.5 bg-[#111820] border-border/20" side="top" align="center">
                {SHAPES.map(s => (
                  <button key={s.id} onClick={() => { setActiveTool(s.id); setShowShapesMenu(false); toast.info(`Ferramenta: ${s.label}`); }}
                    className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[11px] transition-colors', activeTool === s.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-secondary/20')}>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-3.5 w-3.5" />
                      <span>{s.label}</span>
                    </div>
                    {s.shortcut && <span className="text-[9px] text-muted-foreground/40">{s.shortcut}</span>}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Pencil */}
            <button onClick={() => { setActiveTool('pencil'); toast.info('Ferramenta: Lápis'); }}
              className={cn('p-2 rounded-xl transition-all', activeTool === 'pencil' ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Lápis">
              <Pencil className="h-4 w-4" />
            </button>

            {/* Text */}
            <button onClick={() => { setActiveTool('text'); toast.info('Ferramenta: Texto'); }}
              className={cn('p-2 rounded-xl transition-all', activeTool === 'text' ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Texto (T)">
              <Type className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border/20 mx-0.5" />

            {/* Note/Frame */}
            <button onClick={addNoteToCanvas}
              className="p-2 rounded-xl text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20 transition-all"
              title="Adicionar nota">
              <Hash className="h-4 w-4" />
            </button>

            {/* Image Generator */}
            <button onClick={() => setRightPanelOpen(true)}
              className={cn('p-2 rounded-xl transition-all', rightPanelOpen ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Gerador de Imagens">
              <Sparkles className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border/20 mx-0.5" />

            {/* Layers */}
            <button onClick={() => { setShowLayers(!showLayers); setShowFiles(false); }}
              className={cn('p-2 rounded-xl transition-all', showLayers ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Camadas">
              <Layers className="h-4 w-4" />
            </button>

            {/* Files */}
            <button onClick={() => { setShowFiles(!showFiles); setShowLayers(false); }}
              className={cn('p-2 rounded-xl transition-all', showFiles ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-secondary/20')}
              title="Arquivos do projeto">
              <FolderOpen className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border/20 mx-0.5" />

            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground/70 transition-colors">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[9px] text-muted-foreground/50 font-mono min-w-[32px] text-center select-none">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground/70 transition-colors">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ═══ LAYERS PANEL ═══ */}
        {showLayers && (
          <div className="absolute top-14 right-2 z-50 w-[220px] bg-[#0d1218]/95 backdrop-blur-xl border border-border/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/10">
              <span className="text-[11px] font-bold text-foreground/80">Camadas</span>
              <button onClick={() => setShowLayers(false)} className="text-muted-foreground/40 hover:text-foreground"><X className="h-3 w-3" /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {images.length === 0 && <p className="text-[10px] text-muted-foreground/40 text-center py-4">Nenhuma camada</p>}
              {[...images].reverse().map((img, i) => (
                <button key={img.id} onClick={() => setSelectedImage(img.id)}
                  className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors', selectedImage === img.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-secondary/20')}>
                  {img.node_type === 'note' ? (
                    <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Hash className="h-3 w-3 text-amber-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded overflow-hidden bg-secondary/20 shrink-0">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-[10px] truncate flex-1">{img.label}</span>
                  <span className="text-[8px] text-muted-foreground/30">{images.length - i}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FILES PANEL ═══ */}
        {showFiles && (
          <div className="absolute top-14 right-2 z-50 w-[240px] bg-[#0d1218]/95 backdrop-blur-xl border border-border/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/10">
              <span className="text-[11px] font-bold text-foreground/80">Arquivos do Projeto</span>
              <button onClick={() => setShowFiles(false)} className="text-muted-foreground/40 hover:text-foreground"><X className="h-3 w-3" /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {images.filter(i => i.image_url).length === 0 && <p className="text-[10px] text-muted-foreground/40 text-center py-4">Nenhum arquivo</p>}
              {images.filter(i => i.image_url).map(img => (
                <div key={img.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/20 transition-colors group">
                  <div className="w-8 h-8 rounded overflow-hidden bg-secondary/20 shrink-0">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground/70 truncate">{img.label}</p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setAgentAttachment(img.image_url); setAgentInput(''); setLeftPanelOpen(true); }}
                      className="p-1 rounded text-muted-foreground/30 hover:text-primary" title="Enviar ao chat">
                      <MessageSquare className="h-3 w-3" />
                    </button>
                    <button onClick={() => { const a = document.createElement('a'); a.href = img.image_url; a.download = `void-${Date.now()}.png`; a.click(); }}
                      className="p-1 rounded text-muted-foreground/30 hover:text-foreground" title="Baixar">
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Palette indicator on canvas */}
        {usePaletteInChat && activeBrandKit && (
          <div className="absolute top-14 left-2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] text-primary font-medium">
            <Palette className="h-3 w-3" />
            <span>Paleta: {activeBrandKit.name}</span>
            <div className="flex gap-0.5 ml-1">
              {activeBrandKit.colors.slice(0, 4).map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== RIGHT: IMAGE GENERATOR ========== */}
      {rightPanelOpen && (
      <div className="w-[400px] flex flex-col border-l border-border/15 bg-[#0a0f14] shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 border-b border-border/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-[12px] font-bold text-foreground/90">Gerador</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground/40">{images.length} imagens</span>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRightPanelOpen(false)}>
              <PanelLeftOpen className="h-3.5 w-3.5 rotate-180" />
            </Button>
          </div>
        </div>

        {/* Gen messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {genMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <Sparkles className="h-10 w-10 text-primary/30" />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground/60">Crie imagens</p>
                <p className="text-[11px] text-muted-foreground/50 max-w-[260px]">
                  Descreva o que quer ou transfira um prompt do chat de agentes.
                </p>
              </div>
            </div>
          )}

          {genMessages.map((msg) => (
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
                      <Sparkles className="h-2.5 w-2.5" /><span>{msg.model}</span>
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
                      <button onClick={() => { const a = document.createElement('a'); a.href = msg.imageUrl!; a.download = `void-${Date.now()}.png`; a.click(); }}
                        className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground/70 hover:bg-secondary/30 transition-colors" title="Baixar imagem">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground/70 hover:bg-secondary/30 transition-colors"><ThumbsUp className="h-3.5 w-3.5" /></button>
                      <button className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground/70 hover:bg-secondary/30 transition-colors"><ThumbsDown className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /><span>Gerando imagem...</span>
            </div>
          )}
          <div ref={genChatEndRef} />
        </div>

        {/* ===== GEN INPUT AREA ===== */}
        <div className="shrink-0 p-4 space-y-2">
          {/* Attachment previews */}
          {(referenceImage || characterImage || audioBlob) && (
            <div className="flex flex-wrap gap-2">
              {characterImage && (
                <div className="relative group">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-amber-500/40 bg-[#111820]">
                    <img src={characterImage} alt="Personagem" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-1 -left-1 bg-amber-500/80 rounded-full p-0.5"><User className="h-2 w-2 text-black" /></div>
                  <button onClick={() => setCharacterImage(null)} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-2 w-2 text-white" /></button>
                </div>
              )}
              {referenceImage && (
                <div className="relative group">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary/40 bg-[#111820]">
                    <img src={referenceImage} alt="Referência" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-1 -left-1 bg-primary/80 rounded-full p-0.5"><Image className="h-2 w-2 text-black" /></div>
                  <button onClick={() => { setReferenceImage(null); setShowRefDesc(false); setReferenceDesc(''); }} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-2 w-2 text-white" /></button>
                </div>
              )}
              {audioBlob && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111820] border border-border/15 text-[10px] text-foreground/70">
                  <Mic className="h-3 w-3 text-primary" /><span>Áudio gravado</span>
                  <button onClick={() => setAudioBlob(null)} className="text-muted-foreground/40 hover:text-destructive"><X className="h-3 w-3" /></button>
                </div>
              )}
            </div>
          )}

          {/* Ref description */}
          {showRefDesc && referenceImage && (
            <div className="rounded-xl border border-primary/20 bg-[#111820] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary font-medium">O que quer desta referência?</span>
                <button onClick={() => setShowRefDesc(false)} className="text-muted-foreground/30 hover:text-foreground"><ChevronDown className="h-3 w-3" /></button>
              </div>
              <input value={referenceDesc} onChange={(e) => setReferenceDesc(e.target.value)} placeholder="Ex: mesma pose, iluminação, composição..."
                className="w-full bg-transparent border-none text-[11px] text-foreground/80 placeholder:text-muted-foreground/25 focus:outline-none" />
            </div>
          )}

          {/* Textarea */}
          <div className="rounded-2xl border border-border/15 bg-[#111820] focus-within:border-primary/25 transition-colors overflow-hidden">
            <Textarea value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} onKeyDown={handleGenKeyDown}
              placeholder="Descreva sua criação..." className="min-h-[60px] max-h-[120px] resize-none bg-transparent border-none text-[12px] text-foreground/90 focus-visible:ring-0 placeholder:text-muted-foreground/30 px-4 pt-3"
              disabled={isGenerating} />
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-0.5">
                <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={handleRefImage} />
                <button onClick={() => refInputRef.current?.click()}
                  className={cn('p-2 rounded-lg transition-colors', referenceImage ? 'text-primary bg-primary/10' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20')} title="Referência visual">
                  <Image className="h-4 w-4" />
                </button>
                <input ref={charInputRef} type="file" accept="image/*" className="hidden" onChange={handleCharImage} />
                <button onClick={() => charInputRef.current?.click()}
                  className={cn('p-2 rounded-lg transition-colors', characterImage ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20')} title="Foto do personagem">
                  <User className="h-4 w-4" />
                </button>
                <button onClick={toggleRecording}
                  className={cn('p-2 rounded-lg transition-colors', isRecording ? 'text-destructive bg-destructive/10 animate-pulse' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20')} title={isRecording ? 'Parar' : 'Gravar áudio'}>
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Model selector */}
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-primary/25 text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors ml-1">
                      <Sparkles className="h-3 w-3" />
                      {IMAGE_MODELS.find(m => m.id === imageModel)?.label.split(' ').slice(-2).join(' ') || 'Modelo'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-1.5 bg-[#111820] border-border/20" side="top" align="start">
                    {IMAGE_MODELS.map(m => (
                      <button key={m.id} onClick={() => { setImageModel(m.id); setModelOpen(false); }}
                        className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors', imageModel === m.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-secondary/20')}>
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium truncate">{m.label}</span>
                            {m.badge && <span className={cn('rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase', m.badge === 'PRO' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')}>{m.badge}</span>}
                          </div>
                          <p className="text-[9px] text-muted-foreground/40 truncate">{m.desc}</p>
                        </div>
                        {imageModel === m.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              <button onClick={handleGenSend} disabled={isGenerating || (!genPrompt.trim() && !audioBlob) || !apiKey}
                className={cn('p-2 rounded-full transition-all', (genPrompt.trim() || audioBlob) && apiKey ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm' : 'bg-secondary/20 text-muted-foreground/20 cursor-not-allowed')}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
