import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Users, CreditCard, BarChart3, Trash2, CheckCircle, XCircle, Search, Plus, Timer, Copy, Eye, EyeOff, Key, RefreshCw, Shield, MessageCircle, AlertTriangle, Ban } from 'lucide-react';
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
  access_key: string | null;
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
            <TabsTrigger value="moderation">Moderação Chat</TabsTrigger>
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
                    <TableHead>Chave</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                       <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum resultado</TableCell>
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
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {license.access_key || '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {license.expires_at ? <CountdownCell expiresAt={license.expires_at} /> : '—'}
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState('monthly');
  const [status, setStatus] = useState('active');
  const [isTest, setIsTest] = useState(false);
  const [testMinutes, setTestMinutes] = useState('10');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ email: string; password: string; accessKey: string } | null>(null);

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pwd);
  };

  const handleAdd = async () => {
    if (!email.trim()) { toast.error('Informe o email'); return; }
    if (!password.trim() || password.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
    setAdding(true);

    const expiresAt = isTest
      ? new Date(Date.now() + parseInt(testMinutes) * 60 * 1000).toISOString()
      : undefined;

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-test-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          plan: isTest ? 'test' : plan,
          expiresAt,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error('Erro: ' + (data.error || 'Falha ao criar'));
    } else {
      toast.success(data.renewed ? 'Licença renovada com sucesso!' : 'Usuário criado com sucesso!');
      setResult({ email: email.trim(), password: password.trim(), accessKey: data.accessKey });
      onAdded();
    }
    setAdding(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (result) {
    return (
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Usuário Criado com Sucesso</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CredentialField label="Email" value={result.email} onCopy={() => copyToClipboard(result.email, 'Email')} />
          <CredentialField label="Senha" value={result.password} onCopy={() => copyToClipboard(result.password, 'Senha')} secret />
          <CredentialField label="Chave de Acesso" value={result.accessKey} onCopy={() => copyToClipboard(result.accessKey, 'Chave')} />
        </div>
        <p className="text-xs text-muted-foreground">Guarde essas credenciais — a senha não poderá ser recuperada.</p>
        <Button size="sm" variant="outline" onClick={() => { setResult(null); setEmail(''); setPassword(''); setOpen(false); }}>
          Fechar
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { setIsTest(false); setOpen(true); generatePassword(); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar Pessoa
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setIsTest(true); setOpen(true); generatePassword(); }} className="gap-1.5">
          <Timer className="h-4 w-4" /> Licença Teste
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        {isTest && <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">Licença Teste</Badge>}
        <span className="text-sm font-medium text-foreground">{isTest ? 'Nova Licença Teste' : 'Adicionar Pessoa'}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground mb-1 block">Email</label>
          <Input placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div className="w-48">
          <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pr-16"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={generatePassword} title="Gerar senha">
                <Key className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        {isTest ? (
          <div className="w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Duração</label>
            <Select value={testMinutes} onValueChange={setTestMinutes}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="20">20 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="1440">24 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
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
          </>
        )}
        <Button onClick={handleAdd} disabled={adding} className="gap-1.5">
          <Plus className="h-4 w-4" /> {adding ? 'Criando...' : isTest ? 'Gerar Teste' : 'Adicionar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </div>
  );
}

function CredentialField({ label, value, onCopy, secret }: { label: string; value: string; onCopy: () => void; secret?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-sm font-mono text-foreground flex-1 truncate">
          {secret && !show ? '••••••••' : value}
        </code>
        {secret && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShow(!show)}>
            {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCopy}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function CountdownCell({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = new Date(expiresAt).getTime() - now;

  if (diff <= 0) {
    return <span className="text-destructive font-medium">Expirado</span>;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) {
    return <span className="text-muted-foreground">{days}d {hours}h {minutes}m</span>;
  }
  if (hours > 0) {
    return <span className="text-amber-400">{hours}h {minutes}m {seconds}s</span>;
  }
  return <span className="text-destructive">{minutes}m {seconds}s</span>;
}
