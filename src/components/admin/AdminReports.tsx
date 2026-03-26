import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Ghost, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Report {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  version: string;
  created_at: string;
}

export function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setReports(data as unknown as Report[]);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from('admin_reports').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao deletar relatório');
    } else {
      toast.success('Relatório removido');
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Ghost className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Relatórios Fantasma</h3>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          Só admin
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto">{reports.length} relatório(s)</span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-muted-foreground">Carregando...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-xs text-muted-foreground/50 space-y-2">
          <Ghost className="h-10 w-10 mx-auto opacity-20" />
          <p>Nenhum relatório fantasma ainda</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {reports.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground truncate">{r.title}</span>
                    {r.version && (
                      <Badge variant="secondary" className="text-[9px] shrink-0">
                        {r.version}
                      </Badge>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{r.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                    <span>{formatDate(r.created_at)}</span>
                    <span className="font-mono">{r.file_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(r.file_url, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <a href={r.file_url} download={r.file_name}>
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteReport(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
