import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Database, Users, HardDrive, MessageSquare, Bell, Star,
  Shield, Globe, Mail, Calendar, Download, Loader2
} from 'lucide-react';

interface ExportItem {
  id: string;
  label: string;
  table: string;
  icon: React.ReactNode;
}

const EXPORT_ITEMS: ExportItem[] = [
  { id: 'licenses', label: 'Licenças', table: 'licenses', icon: <Database className="h-4 w-4" /> },
  { id: 'profiles', label: 'Perfis (Users)', table: 'profiles', icon: <Users className="h-4 w-4" /> },
  { id: 'admin_reports', label: 'Relatórios', table: 'admin_reports', icon: <HardDrive className="h-4 w-4" /> },
  { id: 'chat_conversations', label: 'Conversas IA', table: 'chat_conversations', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'chat_messages', label: 'Mensagens IA', table: 'chat_messages', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'community_messages', label: 'Comunidade', table: 'community_messages', icon: <Globe className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notificações', table: 'notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'user_favorites', label: 'Favoritos', table: 'user_favorites', icon: <Star className="h-4 w-4" /> },
  { id: 'user_roles', label: 'Roles', table: 'user_roles', icon: <Shield className="h-4 w-4" /> },
  { id: 'user_allowed_ips', label: 'IPs Permitidos', table: 'user_allowed_ips', icon: <Globe className="h-4 w-4" /> },
  { id: 'direct_messages', label: 'DMs', table: 'direct_messages', icon: <Mail className="h-4 w-4" /> },
  { id: 'direct_conversations', label: 'Conversas DM', table: 'direct_conversations', icon: <Mail className="h-4 w-4" /> },
  { id: 'scheduled_posts', label: 'Posts Agendados', table: 'scheduled_posts', icon: <Calendar className="h-4 w-4" /> },
];

function jsonToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminDataExport() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleExport = async (item: ExportItem) => {
    setLoadingId(item.id);
    try {
      const { data, error } = await supabase
        .from(item.table as any)
        .select('*');

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info(`Nenhum dado encontrado em "${item.label}"`);
        setLoadingId(null);
        return;
      }

      const csv = jsonToCsv(data as unknown as Record<string, unknown>[]);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `${item.table}_${timestamp}.csv`);
      toast.success(`${item.label} exportado (${data.length} registros)`);
    } catch (err: any) {
      toast.error(`Erro ao exportar ${item.label}: ${err.message}`);
    }
    setLoadingId(null);
  };

  const handleExportAll = async () => {
    for (const item of EXPORT_ITEMS) {
      await handleExport(item);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Exportar Dados (CSV)</h3>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            Admin
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={handleExportAll} disabled={!!loadingId}>
          <Download className="mr-1 h-3.5 w-3.5" /> Exportar Tudo
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {EXPORT_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant="outline"
            size="sm"
            className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs"
            onClick={() => handleExport(item)}
            disabled={!!loadingId}
          >
            {loadingId === item.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <span className="text-primary">{item.icon}</span>
            )}
            <span className="truncate w-full text-center">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
