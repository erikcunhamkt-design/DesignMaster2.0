import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Users, CreditCard, BarChart3, Trash2, CheckCircle, XCircle, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LicenseRow {
  id: string;
  user_id: string;
  email: string | null;
  plan: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { signOut } = useAuth();
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLicenses(data as LicenseRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const updateLicenseStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('licenses').update({ status }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success(`Status alterado para ${status}`);
    fetchLicenses();
  };

  const updateLicensePlan = async (id: string, plan: string) => {
    const { error } = await supabase.from('licenses').update({ plan }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar plano'); return; }
    toast.success(`Plano alterado para ${plan}`);
    fetchLicenses();
  };

  const deleteLicense = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta licença?')) return;
    const { error } = await supabase.from('licenses').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover'); return; }
    toast.success('Licença removida');
    fetchLicenses();
  };

  const filtered = licenses.filter(l =>
    (l.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = licenses.length;
  const activeUsers = licenses.filter(l => l.status === 'active').length;
  const planCounts = licenses.reduce((acc, l) => {
    acc[l.plan] = (acc[l.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Painel Admin" showApiKey={false} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={<Users className="h-5 w-5 text-primary" />} label="Total Usuários" value={totalUsers} />
          <MetricCard icon={<CheckCircle className="h-5 w-5 text-primary" />} label="Ativos" value={activeUsers} />
          <MetricCard icon={<XCircle className="h-5 w-5 text-destructive" />} label="Inativos" value={totalUsers - activeUsers} />
          <MetricCard icon={<CreditCard className="h-5 w-5 text-primary" />} label="Planos" value={Object.entries(planCounts).map(([k, v]) => `${k}: ${v}`).join(' · ')} />
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="users">Usuários & Licenças</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <AddLicenseForm onAdded={fetchLicenses} />
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchLicenses}>Atualizar</Button>
            </div>

            <div className="rounded-xl border border-border/40 glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum resultado</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(license => (
                      <TableRow key={license.id} className="border-border/20">
                        <TableCell className="font-medium text-foreground">{license.email || '—'}</TableCell>
                        <TableCell>
                          <Select defaultValue={license.plan} onValueChange={v => updateLicensePlan(license.id, v)}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                              <SelectItem value="lifetime">Vitalício</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={license.status === 'active' ? 'default' : 'secondary'}
                            className={license.status === 'active' ? 'bg-primary/15 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}
                          >
                            {license.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {license.expires_at ? new Date(license.expires_at).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(license.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {license.status === 'active' ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => updateLicenseStatus(license.id, 'inactive')}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Desativar
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:text-primary" onClick={() => updateLicenseStatus(license.id, 'active')}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Ativar
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => deleteLicense(license.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <ContentManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{typeof value === 'number' ? value : value}</p>
      </div>
    </div>
  );
}

function ContentManager() {
  // This reads from the studios data file. In a future iteration it can be backed by a DB table.
  const [studios, setStudios] = useState<{ id: string; name: string; route: string; icon: string }[]>([]);

  useEffect(() => {
    import('@/data/studios').then(mod => {
      setStudios(mod.studios.map(s => ({ id: s.id, name: s.name, route: s.route, icon: s.icon })));
    });
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Studios Ativos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {studios.map(s => (
          <div key={s.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-sm font-medium text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.route}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Para adicionar ou remover studios, edite o arquivo de configuração de studios no código.
      </p>
    </div>
  );
}

function AddLicenseForm({ onAdded }: { onAdded: () => void }) {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [status, setStatus] = useState('active');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);

  const handleAdd = async () => {
    if (!email.trim()) { toast.error('Informe o email'); return; }
    setAdding(true);

    // Check if a license already exists for this email
    const { data: existing } = await supabase
      .from('licenses')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (existing) {
      toast.error('Já existe uma licença para este email');
      setAdding(false);
      return;
    }

    // Create license with a placeholder user_id (admin-created)
    const { error } = await supabase.from('licenses').insert({
      user_id: crypto.randomUUID(),
      email: email.trim(),
      plan,
      status,
    });

    if (error) { toast.error('Erro ao adicionar: ' + error.message); }
    else {
      toast.success('Licença adicionada com sucesso');
      setEmail('');
      setPlan('monthly');
      setStatus('active');
      setOpen(false);
      onAdded();
    }
    setAdding(false);
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" /> Adicionar Pessoa
      </Button>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs text-muted-foreground mb-1 block">Email</label>
        <Input
          placeholder="email@exemplo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
        />
      </div>
      <div className="w-32">
        <label className="text-xs text-muted-foreground mb-1 block">Plano</label>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
            <SelectItem value="lifetime">Vitalício</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-32">
        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleAdd} disabled={adding} className="gap-1.5">
        <Plus className="h-4 w-4" /> {adding ? 'Adicionando...' : 'Adicionar'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
    </div>
  );
}
