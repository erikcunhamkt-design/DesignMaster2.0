import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye, Image, Mic, FileText, Copy, MessageSquare, Sparkles } from 'lucide-react';

interface PatchNote {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  changes: { icon: React.ReactNode; category: string; items: string[] }[];
}

const patchNotes: PatchNote[] = [
  {
    version: '2.5.0',
    date: '13 Mar 2026',
    title: 'Chat dos Agentes — Upgrade Completo de Mídia',
    highlights: [
      'Visão multimodal com Gemini para análise de imagens',
      'Upload de imagens, documentos e áudio em todos os agentes',
      'Indicador visual dinâmico ao processar imagens',
    ],
    changes: [
      {
        icon: <Eye className="h-4 w-4 text-primary" />,
        category: 'Visão Multimodal',
        items: [
          'Agentes analisam visualmente imagens enviadas (composição, cores, tipografia)',
          'Indicador "Analisando imagem..." com ícone de olho pulsante',
          'Animação de typing dots ao processar mensagens',
        ],
      },
      {
        icon: <Image className="h-4 w-4 text-blue-400" />,
        category: 'Upload de Imagens',
        items: [
          'Envie imagens pelo botão de galeria',
          'Cole imagens do clipboard (Ctrl+V / Cmd+V)',
          'Preview da imagem antes de enviar',
        ],
      },
      {
        icon: <FileText className="h-4 w-4 text-orange-400" />,
        category: 'Upload de Documentos',
        items: [
          'Suporte a PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPTX, JSON, XML',
          'Documentos aparecem como links clicáveis na conversa',
        ],
      },
      {
        icon: <Mic className="h-4 w-4 text-red-400" />,
        category: 'Gravação de Áudio',
        items: [
          'Grave e envie mensagens de voz pelo microfone',
          'Player de áudio inline nas mensagens',
          'Indicador visual de gravação ativa',
        ],
      },
      {
        icon: <Copy className="h-4 w-4 text-emerald-400" />,
        category: 'Copiar Mensagens',
        items: [
          'Botão de copiar ao passar o mouse nas respostas',
          'Texto das mensagens agora é selecionável',
        ],
      },
      {
        icon: <MessageSquare className="h-4 w-4 text-purple-400" />,
        category: 'Agentes Atualizados',
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

export default function ChangelogPage() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Novidades" showApiKey={false} />
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Changelog</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground">Novidades & Atualizações</h1>
            <p className="text-sm text-muted-foreground">Acompanhe todas as melhorias do DesignMaster</p>
          </div>

          {/* Patch notes */}
          {patchNotes.map((note) => (
            <article key={note.version} className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm overflow-hidden">
              {/* Version header */}
              <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-xs font-mono px-2.5 py-0.5">v{note.version}</Badge>
                  <h2 className="text-lg font-bold text-foreground">{note.title}</h2>
                </div>
                <span className="text-xs text-muted-foreground">{note.date}</span>
              </div>

              {/* Highlights */}
              <div className="px-6 py-4 bg-primary/5 border-b border-border/10">
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Destaques</p>
                <ul className="space-y-1.5">
                  {note.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                      <span className="text-primary mt-0.5">✦</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Changes */}
              <div className="px-6 py-5 space-y-5">
                {note.changes.map((change, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-2">
                      {change.icon}
                      <span className="text-sm font-semibold text-foreground">{change.category}</span>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {change.items.map((item, j) => (
                        <li key={j} className="text-xs text-muted-foreground list-disc">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
