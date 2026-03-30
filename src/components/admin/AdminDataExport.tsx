import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Database, Users, HardDrive, MessageSquare, Bell, Star,
  Shield, Globe, Mail, Calendar, Download, Loader2, Copy, Code, ChevronDown, ChevronUp
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

  const [sqlOpen, setSqlOpen] = useState(false);

  const SCHEMA_SQL = `-- ============================================
-- SCHEMA SQL — Design Master (Lovable Cloud)
-- Gerado em: ${new Date().toISOString().slice(0, 10)}
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.chat_status AS ENUM ('active', 'muted', 'banned');

-- Licenças
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'inactive',
  expires_at timestamptz,
  access_key text,
  kiwify_order_id text,
  kiwify_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Perfis
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  username text,
  title text,
  cargo text,
  bio text DEFAULT '',
  avatar_url text,
  instagram text DEFAULT '',
  behance text DEFAULT '',
  tiktok text DEFAULT '',
  linkedin text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Notificações
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id),
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now()
);

-- Chat IA
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id text NOT NULL DEFAULT 'design-master',
  title text NOT NULL DEFAULT 'Nova conversa',
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id),
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_user_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status chat_status NOT NULL DEFAULT 'active',
  muted_until timestamptz,
  updated_by uuid,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comunidade
CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DMs
CREATE TABLE public.direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL,
  participant_2 uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id),
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Amizades
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Favoritos & Recentes
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  studio_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_recent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  studio_id text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

-- IPs Permitidos
CREATE TABLE public.user_allowed_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- Posts Agendados
CREATE TABLE public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'instagram',
  media_url text,
  webhook_url text,
  webhook_response text,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin Reports
CREATE TABLE public.admin_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  file_url text NOT NULL,
  file_name text NOT NULL,
  version text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Webhook Events
CREATE TABLE public.webhook_events (
  event_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Void Canvas
CREATE TABLE public.void_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Sem título',
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.void_canvas_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.void_projects(id),
  label text NOT NULL DEFAULT '',
  node_type text NOT NULL DEFAULT 'image',
  image_url text,
  prompt text,
  position_x double precision NOT NULL DEFAULT 0,
  position_y double precision NOT NULL DEFAULT 0,
  width double precision NOT NULL DEFAULT 256,
  height double precision NOT NULL DEFAULT 256,
  z_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.void_canvas_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_node_id uuid NOT NULL REFERENCES public.void_canvas_nodes(id),
  target_node_id uuid NOT NULL REFERENCES public.void_canvas_nodes(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.void_brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Minha Marca',
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    toast.success('SQL copiado para a área de transferência!');
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

      {/* SQL Schema Section */}
      <div className="mt-6 border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">SQL das Tabelas</h3>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              Migração
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopySQL}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copiar SQL
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSqlOpen(v => !v)}>
              {sqlOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {sqlOpen && (
          <div className="relative">
            <pre className="max-h-[500px] overflow-auto rounded-lg border border-border bg-muted/50 p-4 text-xs font-mono text-foreground whitespace-pre-wrap">
              {SCHEMA_SQL}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
