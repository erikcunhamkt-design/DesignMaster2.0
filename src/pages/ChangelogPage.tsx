import { useState, useMemo } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Eye, Image, Mic, FileText, Copy, MessageSquare, Sparkles,
  MousePointerClick, Pin, Pencil, Trash2, Camera, Cpu, Upload,
  Layers, Palette, Share2, Rocket, Wrench, Zap, Bug,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Category badge colors ── */
const categoryColors: Record<string, string> = {
  novo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  melhoria: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  fix: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  motor: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  ux: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  api: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
};

type ChangeTag = keyof typeof categoryColors;

const tagLabels: Record<ChangeTag, string> = {
  novo: '✨ Novo',
  melhoria: '🚀 Melhoria',
  fix: '🐛 Fix',
  motor: '⚙️ Motor',
  ux: '🎨 UX/UI',
  api: '🔌 API',
};

interface PatchNote {
  version: string;
  date: string;
  title: string;
  emoji: string;
  highlights: string[];
  changes: { icon: React.ReactNode; category: string; tag: ChangeTag; items: string[] }[];
}

const patchNotes: PatchNote[] = [
  {
    version: '2.9.1',
    date: '26 Mar 2026',
    title: 'Hero Studio — Uploads Separados & UX Refinada',
    emoji: '🦸',
    highlights: [
      'Uploads de Sujeito, Produto e Referência Visual agora são blocos independentes',
      'Botão de geração unificado — removido botão duplicado',
      'Tag de "Alta Conversão" removida para interface mais limpa',
      'Organização lógica das seções com hierarquia clara',
    ],
    changes: [
      {
        icon: <Upload className="h-4 w-4" />,
        category: 'Uploads Separados',
        tag: 'melhoria',
        items: [
          'Foto do Sujeito: upload dedicado com preview e remoção individual',
          'Foto do Produto: upload separado para mockups e produtos',
          'Referência Visual: upload independente para referências de estilo',
          'Cada bloco suporta até 3 imagens com miniaturas interativas',
        ],
      },
      {
        icon: <Layers className="h-4 w-4" />,
        category: 'UX/UI Hero Studio',
        tag: 'ux',
        items: [
          'Botão de geração único — removida duplicação de ação',
          'Tag "Alta Conversão" removida para visual mais limpo',
          'Seções colapsáveis reorganizadas em hierarquia lógica',
          'Fluxo: Tipo → Elemento → Sujeito → Produto → Referência',
        ],
      },
    ],
  },
  {
    version: '2.9.0',
    date: '26 Mar 2026',
    title: 'Animais Fantásticos — Motor Fotográfico de Fauna Brasileira',
    emoji: '🐆',
    highlights: [
      'Novo estúdio Animais Fantásticos com motor de ângulos magnéticos e iluminação cinematográfica',
      'UX/UI totalmente redesenhada com seções colapsáveis e chips visuais',
      'Ângulos heroicos (Low Angle, Eye Level, Aerial) com profundidade e movimento',
      'Iluminação magnética: Golden Hour, Rim Light, Misty e mais para cada bioma',
    ],
    changes: [
      {
        icon: <Camera className="h-4 w-4" />,
        category: 'Motor Fotográfico de Fauna',
        tag: 'motor',
        items: [
          'Ângulos magnéticos: Low Angle Heroico, Eye Level, Aerial Drone, Close-up Macro',
          'Iluminação cinematográfica: Golden Hour, Rim Light, Backlit Silhouette, Misty Atmosphere',
          'Efeitos visuais: Bokeh, Motion Blur, Partículas, Reflexos na Água, Raios de Luz',
          'Composição com regras profissionais de fotografia wildlife',
          'Prompt engine ultra-detalhado com câmera, lente e ISO automáticos',
        ],
      },
      {
        icon: <Palette className="h-4 w-4" />,
        category: 'Biomas Brasileiros',
        tag: 'novo',
        items: [
          'Amazônia, Pantanal, Cerrado, Mata Atlântica, Caatinga, Pampas',
          'Cada bioma injeta vegetação, luz e atmosfera específicas no prompt',
          'Combinação inteligente animal + bioma para resultados autênticos',
        ],
      },
      {
        icon: <Layers className="h-4 w-4" />,
        category: 'UX/UI Redesenhada',
        tag: 'ux',
        items: [
          'Seções colapsáveis para reduzir ruído visual',
          'Grid de animais em 3 colunas com emojis e seleção visual',
          'Cards clicáveis para ângulos e iluminação com ícones',
          'Resumo de seleção antes de gerar',
          'Preview com ambient glow e download direto',
          'Mobile responsivo com auto-scroll para resultado',
        ],
      },
    ],
  },
  {
    version: '2.8.0',
    date: '20 Mar 2026',
    title: 'VOID, Fotógrafo Profissional & Social Media Creator',
    emoji: '🚀',
    highlights: [
      'VOID — Cockpit Criativo com tela infinita, hub de agentes e geração direta',
      'Fotógrafo Profissional com motor técnico de elite e Identity Lock',
      'Social Media Creator com Kit de Marca, Copiloto de Copy e controles premium',
      'Smart Router classifica intenção e atribui agente especializado automaticamente',
    ],
    changes: [
      {
        icon: <Layers className="h-4 w-4" />,
        category: 'VOID — Cockpit Criativo',
        tag: 'novo',
        items: [
          'Tela infinita com pan/zoom e reposicionamento livre de imagens',
          'Hub de Agentes integrado com transferência de prompts para o gerador',
          'Sistema de projetos com galeria "Minhas Criações" (últimos 7 dias)',
          'Renomeação de projetos via clique duplo e históricos isolados',
          'Smart Router com feedback visual de roteamento em tempo real',
        ],
      },
      {
        icon: <Camera className="h-4 w-4" />,
        category: 'Fotógrafo Profissional',
        tag: 'motor',
        items: [
          'Motor interno com base de conhecimento completa de fotografia',
          'Identity Lock para preservação absoluta de traços faciais',
          'Câmeras Phase One, Sony a7R IV, Hasselblad H6D e mais',
          'Lentes 85mm f/1.2, 135mm f/2, 50mm f/1.4 mapeadas automaticamente',
          'API Google direta com seletor de modelo e retry automático',
        ],
      },
      {
        icon: <Palette className="h-4 w-4" />,
        category: 'Social Media Creator',
        tag: 'novo',
        items: [
          'Kit de Marca integrado com paleta de cores persistente',
          'Copiloto de Copy via chat com preenchimento automático',
          'Controles tipográficos independentes por campo de texto',
          'Motor Elite Designer (temperatura 0.4) com regras de composição',
          'Layout de três colunas com seções colapsáveis',
        ],
      },
      {
        icon: <Share2 className="h-4 w-4" />,
        category: 'Melhorias Gerais',
        tag: 'melhoria',
        items: [
          'Ícone do VOID atualizado na sidebar e cards',
          'Gestão de licenças com prazo efetivo no painel admin',
          'Reset de senha funcional pelo admin',
        ],
      },
    ],
  },
  {
    version: '2.7.0',
    date: '18 Mar 2026',
    title: 'Fotógrafo Profissional — Motor Fotográfico',
    emoji: '📸',
    highlights: [
      'Fotógrafo Profissional interno expande configs em prompts fotográficos ultra-detalhados',
      'Fotógrafo Profissional agora usa API Google diretamente (como todos os estúdios)',
      'Seletor de modelo (Nano Banana Pro / Nano Banana 2) no Fotógrafo Profissional',
      'Fix: Upload de fotos no criador principal restaurado',
    ],
    changes: [
      {
        icon: <Camera className="h-4 w-4" />,
        category: 'Fotógrafo Profissional',
        tag: 'motor',
        items: [
          'Motor interno com base de conhecimento completa de fotografia profissional',
          'Câmeras (Canon 5D, Hasselblad H6D, Sony a7R IV, Fujifilm GFX 100...)',
          'Lentes (85mm f/1.2, 135mm f/2, 50mm f/1.4, 70-200mm f/2.8...)',
          'Ângulos, composição, iluminação — tudo expandido automaticamente',
          'O usuário configura, o agente cria o prompt profissional nos bastidores',
        ],
      },
      {
        icon: <Cpu className="h-4 w-4" />,
        category: 'API Google Direta',
        tag: 'api',
        items: [
          'Fotógrafo Profissional migrado de gateway interno para API Google direta',
          'Mesmo padrão de todos os outros estúdios (API Key do usuário)',
          'Seletor de modelo: Nano Banana Pro (qualidade) ou Nano Banana 2 (velocidade)',
          'Retry automático com exponential backoff para erros 429',
        ],
      },
      {
        icon: <Upload className="h-4 w-4" />,
        category: 'Fix de Upload',
        tag: 'fix',
        items: [
          'Upload de fotos no criador principal (/studio/criador) restaurado',
          'Import lazy de heic2any evita quebra silenciosa do módulo',
          'Arquivos comuns (JPG, PNG, WEBP) usam URL.createObjectURL direto',
          'Try-catch em todos os handlers de upload com feedback de erro',
        ],
      },
    ],
  },
  {
    version: '2.6.0',
    date: '17 Mar 2026',
    title: 'Menu Contextual & Gestão de Conversas',
    emoji: '🖱️',
    highlights: [
      'Menu de contexto (botão direito) em todas as conversas de chat',
      'Fixar conversas importantes no topo da sidebar',
      'Renomear e excluir conversas com um clique',
    ],
    changes: [
      {
        icon: <MousePointerClick className="h-4 w-4" />,
        category: 'Menu Contextual',
        tag: 'novo',
        items: [
          'Clique com botão direito em qualquer conversa para abrir o menu',
          'Opções: Fixar, Renomear e Excluir',
          'Disponível em todos os 5 agentes de chat',
        ],
      },
      {
        icon: <Pin className="h-4 w-4" />,
        category: 'Fixar Conversas',
        tag: 'melhoria',
        items: [
          'Fixe conversas importantes no topo da lista',
          'Indicador visual com borda e ícone de pin',
          'Desafixe a qualquer momento pelo menu',
        ],
      },
      {
        icon: <Pencil className="h-4 w-4" />,
        category: 'Renomear Conversas',
        tag: 'melhoria',
        items: [
          'Renomeie qualquer conversa pelo menu contextual',
          'Edição inline com confirmação por Enter ou botão',
        ],
      },
      {
        icon: <Trash2 className="h-4 w-4" />,
        category: 'Excluir Conversas',
        tag: 'melhoria',
        items: [
          'Exclua conversas individuais pelo menu contextual',
          'Botão "Apagar todas" mantido na sidebar',
        ],
      },
      {
        icon: <Copy className="h-4 w-4" />,
        category: 'Cópia de Texto Liberada',
        tag: 'fix',
        items: [
          'Seleção de texto das respostas da IA totalmente desbloqueada',
          'Botão direito do mouse e Ctrl+C funcionam normalmente',
          'Tooltip de cópia continua disponível como atalho extra',
        ],
      },
    ],
  },
  {
    version: '2.5.0',
    date: '13 Mar 2026',
    title: 'Chat dos Agentes — Upgrade Completo de Mídia',
    emoji: '🎬',
    highlights: [
      'Visão multimodal com Gemini para análise de imagens',
      'Upload de imagens, documentos e áudio em todos os agentes',
      'Indicador visual dinâmico ao processar imagens',
    ],
    changes: [
      {
        icon: <Eye className="h-4 w-4" />,
        category: 'Visão Multimodal',
        tag: 'novo',
        items: [
          'Agentes analisam visualmente imagens enviadas (composição, cores, tipografia)',
          'Indicador "Analisando imagem..." com ícone de olho pulsante',
          'Animação de typing dots ao processar mensagens',
        ],
      },
      {
        icon: <Image className="h-4 w-4" />,
        category: 'Upload de Imagens',
        tag: 'melhoria',
        items: [
          'Envie imagens pelo botão de galeria',
          'Cole imagens do clipboard (Ctrl+V / Cmd+V)',
          'Preview da imagem antes de enviar',
        ],
      },
      {
        icon: <FileText className="h-4 w-4" />,
        category: 'Upload de Documentos',
        tag: 'melhoria',
        items: [
          'Suporte a PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPTX, JSON, XML',
          'Documentos aparecem como links clicáveis na conversa',
        ],
      },
      {
        icon: <Mic className="h-4 w-4" />,
        category: 'Gravação de Áudio',
        tag: 'novo',
        items: [
          'Grave e envie mensagens de voz pelo microfone',
          'Player de áudio inline nas mensagens',
          'Indicador visual de gravação ativa',
        ],
      },
      {
        icon: <Copy className="h-4 w-4" />,
        category: 'Copiar Mensagens',
        tag: 'melhoria',
        items: [
          'Botão de copiar ao passar o mouse nas respostas',
          'Texto das mensagens agora é selecionável',
        ],
      },
      {
        icon: <MessageSquare className="h-4 w-4" />,
        category: 'Agentes Atualizados',
        tag: 'melhoria',
        items: [
          'Creator Master',
          'Carrossel Master',
          'Estrategista Editorial',
          'Bio Master',
          'Calendário Master',
        ],
      },
    ],
  },
];

/* ── Tag badge component ── */
function TagBadge({ tag }: { tag: ChangeTag }) {
  return (
    <span className={cn(
      'inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
      categoryColors[tag]
    )}>
      {tagLabels[tag]}
    </span>
  );
}

/* ── Animations ── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 } as const,
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } } as const,
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export default function ChangelogPage() {
  const [activeFilter, setActiveFilter] = useState<ChangeTag | 'all'>('all');
  const allTags = Object.keys(categoryColors) as ChangeTag[];

  const filteredNotes = useMemo(() => {
    if (activeFilter === 'all') return patchNotes;
    return patchNotes
      .map(note => ({
        ...note,
        changes: note.changes.filter(c => c.tag === activeFilter),
      }))
      .filter(note => note.changes.length > 0);
  }, [activeFilter]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Atualizações" showApiKey={false} />
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 text-primary">
              <Rocket className="h-5 w-5 animate-bounce" />
              <span className="text-sm font-semibold uppercase tracking-wider">Changelog</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              Novidades & Atualizações
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe todas as melhorias do DesignMaster
            </p>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  'inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all duration-200',
                  activeFilter === 'all'
                    ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.3)]'
                    : 'bg-secondary/50 text-muted-foreground border-border/30 hover:bg-secondary'
                )}
              >
                Todos
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveFilter(activeFilter === tag ? 'all' : tag)}
                  className={cn(
                    'inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all duration-200',
                    activeFilter === tag
                      ? cn(categoryColors[tag], 'shadow-lg')
                      : 'bg-secondary/50 text-muted-foreground border-border/30 hover:bg-secondary'
                  )}
                >
                  {tagLabels[tag]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative space-y-8"
          >
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-border/30 to-transparent hidden md:block" />

            {filteredNotes.map((note, noteIdx) => (
              <motion.article
                key={note.version}
                variants={cardVariants}
                className="relative md:pl-12"
              >
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-5 hidden md:flex h-[14px] w-[14px] items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
                  <div className="absolute h-5 w-5 rounded-full border-2 border-primary/30 animate-ping" />
                </div>

                <div className="group rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/20 transition-colors duration-300">
                  {/* Version header */}
                  <div className="px-5 py-4 border-b border-border/10 flex items-center justify-between gap-3 bg-gradient-to-r from-primary/[0.03] to-transparent">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{note.emoji}</span>
                      <Badge variant="default" className="text-[10px] font-mono px-2 py-0.5 shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.3)]">
                        v{note.version}
                      </Badge>
                      <h2 className="text-sm md:text-base font-bold text-foreground truncate">{note.title}</h2>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0 font-mono">{note.date}</span>
                  </div>

                  {/* Highlights */}
                  <div className="px-5 py-3.5 bg-primary/[0.04] border-b border-border/10">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-primary font-bold mb-2 flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      Destaques
                    </p>
                    <ul className="space-y-1.5">
                      {note.highlights.map((h, i) => (
                        <motion.li
                          key={i}
                          variants={itemVariants}
                          className="flex items-start gap-2 text-[13px] text-foreground/85"
                        >
                          <span className="text-primary mt-0.5 text-xs">✦</span>
                          {h}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Changes */}
                  <div className="px-5 py-4 space-y-4">
                    {note.changes.map((change, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className="group/section"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg',
                            change.tag === 'novo' && 'bg-emerald-500/10 text-emerald-400',
                            change.tag === 'melhoria' && 'bg-blue-500/10 text-blue-400',
                            change.tag === 'fix' && 'bg-amber-500/10 text-amber-400',
                            change.tag === 'motor' && 'bg-purple-500/10 text-purple-400',
                            change.tag === 'ux' && 'bg-pink-500/10 text-pink-400',
                            change.tag === 'api' && 'bg-cyan-500/10 text-cyan-400',
                          )}>
                            {change.icon}
                          </div>
                          <span className="text-sm font-semibold text-foreground">{change.category}</span>
                          <TagBadge tag={change.tag} />
                        </div>
                        <ul className="space-y-1 pl-9">
                          {change.items.map((item, j) => (
                            <li key={j} className="text-xs text-muted-foreground/80 list-disc leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}
