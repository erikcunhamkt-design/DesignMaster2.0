import { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Plus, ChevronLeft, ChevronRight, Eye, Palette, Type, Image, Layout, Sparkles, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AssistantMessageContent, UserMessageContent } from '@/components/chat/MessageContent';
import { CopyMessageButton } from '@/components/chat/CopyMessageButton';
import { TypingDots } from '@/components/chat/TypingDots';
import { SelectionCopyTooltip } from '@/components/chat/SelectionCopyTooltip';

type Msg = { role: 'user' | 'assistant'; content: string };

interface BrandKit {
  id: string;
  name: string;
  colors: string[];
}

const FORMATS = [
  { value: 'feed-quadrado', label: 'Feed Quadrado (1080×1080)', ratio: '1:1' },
  { value: 'feed-retrato', label: 'Feed Retrato (1080×1350)', ratio: '4:5' },
  { value: 'stories', label: 'Stories (1080×1920)', ratio: '9:16' },
  { value: 'horizontal', label: 'Horizontal (1920×1080)', ratio: '16:9' },
  { value: 'pinterest', label: 'Pinterest (1000×1500)', ratio: '2:3' },
];

const FONT_STYLES = [
  'Sans-serif moderna', 'Serif clássica', 'Handwritten', 'Bold/Impact',
  'Minimal/Thin', 'Retro/Vintage', 'Futurista', 'Script elegante',
  'Gothic/Blackletter', 'Brush/Graffiti',
];

const TEXT_POSITIONS = [
  { value: 'topo', label: 'Topo' },
  { value: 'centro', label: 'Centro' },
  { value: 'rodape', label: 'Rodapé' },
  { value: 'esquerda', label: 'Esquerda' },
  { value: 'direita', label: 'Direita' },
];

const VISUAL_STYLES = [
  'Minimalista', 'Glassmorphism', 'Neon/Glow', 'Gradiente vibrante',
  'Editorial/Magazine', 'Flat design', 'Fotorrealista', 'Ilustração vetorial',
  'Retro/Vintage', 'Cyberpunk', 'Orgânico/Natural', 'Luxury/Premium',
];

const COPY_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-social-copy`;

const COPY_SUGGESTIONS = [
  '📱 Crie uma arte de post para um lançamento de produto',
  '🎯 Arte para promoção de Black Friday',
  '✨ Post de bastidores / behind the scenes',
  '📣 Arte de anúncio de novidade para seguidores',
  '💡 Dica rápida educativa para meu nicho',
];

export default function SocialMediaStudioPage() {
  const { apiKey } = useGoogleApiKey();
  const { user } = useAuth();

  // ─── Config state ───
  const [format, setFormat] = useState('feed-quadrado');
  const [fontStyle, setFontStyle] = useState('Sans-serif moderna');
  const [textPosition, setTextPosition] = useState('centro');
  const [visualStyle, setVisualStyle] = useState('Minimalista');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('');
  const [niche, setNiche] = useState('');
  const [description, setDescription] = useState('');
  const [activeBrandKit, setActiveBrandKit] = useState<BrandKit | null>(null);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [logoUrl, setLogoUrl] = useState('');

  // ─── Generation state ───
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // ─── Copy chat state ───
  const [chatMessages, setChatMessages] = useState<Msg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load brand kits
  useEffect(() => {
    if (!user) return;
    supabase.from('void_brand_kits').select('*').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setBrandKits(data.map((k: any) => ({
            id: k.id,
            name: k.name,
            colors: Array.isArray(k.colors) ? k.colors : [],
          })));
        }
      });
  }, [user]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);

  // ─── Generate art ───
  const handleGenerate = async () => {
    if (!apiKey || apiKey.length < 10) {
      toast.error('Configure sua API Key do Google no botão API no topo.');
      return;
    }
    setIsGenerating(true);
    setGeneratedImage(null);

    const formatInfo = FORMATS.find(f => f.value === format);
    const brandColorsStr = activeBrandKit
      ? `CORES OBRIGATÓRIAS DA MARCA: ${activeBrandKit.colors.join(', ')}. Use APENAS essas cores como paleta principal.`
      : '';
    const logoStr = logoUrl ? `Inclua o logo da marca posicionado discretamente na arte.` : '';

    const prompt = `Crie uma arte profissional para social media com as seguintes especificações:

FORMATO: ${formatInfo?.label} (aspect ratio ${formatInfo?.ratio})
ESTILO VISUAL: ${visualStyle}
FONTE/TIPOGRAFIA: ${fontStyle}
POSIÇÃO DO TEXTO: ${textPosition}

${headline ? `HEADLINE: "${headline}"` : ''}
${subheadline ? `SUBHEADLINE: "${subheadline}"` : ''}
${cta ? `CTA (call-to-action): "${cta}"` : ''}
${niche ? `NICHO/SEGMENTO: ${niche}` : ''}
${description ? `DESCRIÇÃO ADICIONAL: ${description}` : ''}
${brandColorsStr}
${logoStr}

REGRAS:
- Arte deve ser PROFISSIONAL e pronta para publicação
- Texto deve ser LEGÍVEL e hierarquicamente organizado
- Layout limpo e equilibrado
- Paleta de cores harmoniosa${activeBrandKit ? ' seguindo as cores da marca' : ''}
- Elementos gráficos devem complementar, não competir com o texto
- A arte deve comunicar a mensagem de forma clara e impactante`;

    try {
      const model = 'gemini-3-pro-image-preview';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 0.8,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Generation error:', errText);
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData);
      if (imagePart) {
        setGeneratedImage(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
        toast.success('Arte gerada com sucesso!');
      } else {
        toast.error('Nenhuma imagem foi gerada. Tente novamente.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao gerar arte');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Copy chat ───
  const sendChatMessage = async (text?: string) => {
    const msg = (text || chatInput).trim();
    if (!msg || isChatLoading) return;
    if (!apiKey || apiKey.length < 10) {
      toast.error('Configure sua API Key do Google.');
      return;
    }

    const userMsg: Msg = { role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    let assistantSoFar = '';
    const allMessages = [...chatMessages, userMsg];

    try {
      const resp = await fetch(COPY_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          googleApiKey: apiKey,
          context: {
            niche,
            format: FORMATS.find(f => f.value === format)?.label,
            visualStyle,
            headline,
            subheadline,
            cta,
            brandColors: activeBrandKit?.colors,
          },
        }),
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
        setChatMessages(prev => {
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
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            if (content) upsertAssistant(content);
          } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro no chat');
      if (!assistantSoFar) setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

  const applyCopyToFields = (content: string) => {
    // Extract headline, subheadline, cta from assistant message
    const headlineMatch = content.match(/headline[:\s]*["""]([^"""]+)["""]/i);
    const subMatch = content.match(/sub(?:headline|título)[:\s]*["""]([^"""]+)["""]/i);
    const ctaMatch = content.match(/cta[:\s]*["""]([^"""]+)["""]/i);

    if (headlineMatch) setHeadline(headlineMatch[1]);
    if (subMatch) setSubheadline(subMatch[1]);
    if (ctaMatch) setCta(ctaMatch[1]);

    if (headlineMatch || subMatch || ctaMatch) {
      toast.success('Textos aplicados à arte!');
    } else {
      toast.info('Copie manualmente os textos desejados.');
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Social Media Studio" showApiKey={true} />
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Config Panel */}
        <ScrollArea className="w-80 shrink-0 border-r border-border/15 bg-card/20 backdrop-blur-sm">
          <div className="p-4 space-y-5">
            {/* Format */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Layout className="h-3.5 w-3.5" /> Formato
              </Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Visual Style */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Estilo Visual
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {VISUAL_STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setVisualStyle(s)}
                    className={cn(
                      'rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-all',
                      visualStyle === s
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/20 text-muted-foreground hover:border-border/40 hover:bg-secondary/30'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> Tipografia
              </Label>
              <Select value={fontStyle} onValueChange={setFontStyle}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_STYLES.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Text Position */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Posição do Texto</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_POSITIONS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setTextPosition(p.value)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all',
                      textPosition === p.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/20 text-muted-foreground hover:border-border/40'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Texts */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground">Textos da Arte</Label>
              <Input
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="Headline principal"
                className="h-8 text-xs"
              />
              <Input
                value={subheadline}
                onChange={e => setSubheadline(e.target.value)}
                placeholder="Subheadline"
                className="h-8 text-xs"
              />
              <Input
                value={cta}
                onChange={e => setCta(e.target.value)}
                placeholder="Call-to-Action (ex: Saiba mais)"
                className="h-8 text-xs"
              />
            </div>

            {/* Niche & Description */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground">Contexto</Label>
              <Input
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="Nicho (ex: fitness, gastronomia...)"
                className="h-8 text-xs"
              />
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrição adicional da arte..."
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            {/* Brand Kit */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Kit de Marca
              </Label>
              {brandKits.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/60">Nenhum kit de marca. Crie um no VOID.</p>
              ) : (
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveBrandKit(null)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-[10px] font-medium text-left transition-all',
                      !activeBrandKit ? 'border-primary bg-primary/10 text-primary' : 'border-border/20 text-muted-foreground hover:border-border/40'
                    )}
                  >
                    Sem kit (cores livres)
                  </button>
                  {brandKits.map(kit => (
                    <button
                      key={kit.id}
                      onClick={() => setActiveBrandKit(kit)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-left transition-all',
                        activeBrandKit?.id === kit.id ? 'border-primary bg-primary/10' : 'border-border/20 hover:border-border/40'
                      )}
                    >
                      <span className="text-[10px] font-medium">{kit.name}</span>
                      <div className="flex gap-1 mt-1">
                        {kit.colors.slice(0, 5).map((c, i) => (
                          <div key={i} className="h-3 w-3 rounded-full border border-border/30" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !apiKey || apiKey.length < 10}
              className="w-full gap-2 h-10 font-bold text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando arte...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4" />
                  Gerar Arte
                </>
              )}
            </Button>
          </div>
        </ScrollArea>

        {/* CENTER: Preview */}
        <div className="flex-1 flex items-center justify-center bg-background/50 p-6 overflow-auto">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Criando sua arte...</p>
            </div>
          ) : generatedImage ? (
            <div className="relative group">
              <img
                src={generatedImage}
                alt="Arte gerada"
                className="max-h-[75vh] max-w-full rounded-xl shadow-2xl border border-border/20"
              />
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <a
                  href={generatedImage}
                  download="social-media-art.png"
                  className="rounded-lg bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium border border-border/30 hover:bg-background transition-colors"
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={handleGenerate}
                  className="rounded-lg bg-primary/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary transition-colors"
                >
                  🔄 Regerar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="text-7xl">🎨</div>
              <h2 className="text-2xl font-bold font-display">Social Media Studio</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configure sua arte no painel à esquerda e use o chat de copy à direita para gerar textos com IA. O melhor criador de artes do Brasil.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Copy Chat */}
        <div className="w-80 shrink-0 border-l border-border/15 flex flex-col bg-card/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 h-11 border-b border-border/15 shrink-0">
            <span className="text-lg">✍️</span>
            <span className="text-xs font-bold text-foreground">Copiloto de Copy</span>
            <span className="ml-auto text-[9px] text-muted-foreground/60 uppercase tracking-wider">IA</span>
          </div>

          <ScrollArea className="flex-1 px-3 py-4" ref={chatScrollRef}>
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-8 animate-fade-up">
                <div className="text-4xl">💬</div>
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
                  Peça textos para sua arte: headlines, legendas, CTAs, hashtags. Eu crio e você aplica!
                </p>
                <div className="space-y-1.5 w-full">
                  {COPY_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendChatMessage(s)}
                      className="w-full text-left rounded-lg border border-border/20 bg-card/40 px-3 py-2 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4" ref={chatContainerRef}>
                <SelectionCopyTooltip containerRef={chatContainerRef} />
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">✍️</div>
                    )}
                    <div className={cn(
                      'rounded-xl px-3 py-2 max-w-[85%] text-[11px]',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card/60 border border-border/20 rounded-bl-sm'
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="space-y-2">
                          <AssistantMessageContent
                            content={msg.content}
                            proseClasses="prose prose-xs prose-invert max-w-none select-text cursor-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:mb-2 [&>p]:leading-relaxed"
                          />
                          <button
                            onClick={() => applyCopyToFields(msg.content)}
                            className="text-[9px] text-primary hover:underline font-medium"
                          >
                            📋 Aplicar textos à arte
                          </button>
                        </div>
                      ) : (
                        <UserMessageContent content={msg.content} />
                      )}
                    </div>
                    {msg.role === 'assistant' && <CopyMessageButton content={msg.content} />}
                  </div>
                ))}
                {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-2 justify-start">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">✍️</div>
                    <div className="rounded-xl px-3 py-2 bg-card/60 border border-border/20">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-border/15 p-3">
            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
                }}
                placeholder="Peça uma copy, headline, legenda..."
                className="text-[11px] min-h-[36px] max-h-[80px] resize-none flex-1"
              />
              <Button
                size="icon"
                onClick={() => sendChatMessage()}
                disabled={isChatLoading || !chatInput.trim()}
                className="h-9 w-9 shrink-0"
              >
                {isChatLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
