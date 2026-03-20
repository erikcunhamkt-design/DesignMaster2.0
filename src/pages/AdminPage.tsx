import { useCallback, useEffect, useMemo, useState } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Plus, RefreshCw, Search, Timer, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type PlanType = 'monthly' | 'yearly' | 'lifetime' | 'test';
type StatusType = 'active' | 'inactive';

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

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
  lifetime: 'Vitalício',
  test: 'Teste',
};

function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

function getPlanExpiry(plan: PlanType) {
  if (plan === 'lifetime') return null;
  const date = new Date();
  if (plan === 'monthly') date.setDate(date.getDate() + 30);
  if (plan === 'yearly') date.setFullYear(date.getFullYear() + 1);
  if (plan === 'test') date.setMinutes(date.getMinutes() + 10);
  return date.toISOString();
}

function formatRemaining(expiresAt: string | null) {
  if (!expiresAt) return '—';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expirado';

  const minutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function CredentialField({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [visible, setVisible] = useState(!secret);

  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all text-xs text-foreground">
          {visible ? value : '•'.repeat(Math.max(value.length, 8))}
        </code>
        {secret && (
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setVisible((v) => !v)}>
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success(`${label} copiado`);
          }}
        >
          Copiar
        </Button>
      </div>
    </div>
  );
}

function CountdownCell({ expiresAt }: { expiresAt: string }) {
  return (
    <div className="space-y-0.5 text-xs">
      <div className="text-foreground">{formatRemaining(expiresAt)}</div>
      <div className="text-muted-foreground">{new Date(expiresAt).toLocaleDateString('pt-BR')}</div>
    </div>
  );
}

function ResetPasswordButton({ userId, email }: { userId: string; email: string | null }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const openDialog = (next: boolean) => {
    setOpen(next);
    if (next) {
      setPassword(generatePassword());
      setShowPassword(false);
    }
  };

  const handleSave = async () => {
    if (password.trim().length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId, newPassword: password.trim() }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        toast.error('Erro: ' + (data.error || 'Falha ao alterar senha'));
        return;
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Erro inesperado');
      return;
    }

    navigator.clipboard.writeText(password.trim());
    toast.success(`Senha alterada para ${email || 'usuário'}`);
    toast.info('Nova senha copiada para a área de transferência');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={openDialog}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 text-xs">
          <Lock className="mr-1 h-3.5 w-3.5" /> Alterar senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>Defina uma nova senha para {email || 'este usuário'}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              className="pr-20"
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setPassword(generatePassword())}>
                <KeyRound className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => setPassword(generatePassword())}>
            Gerar nova senha
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar senha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddLicenseForm({ onAdded }: { onAdded: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<PlanType>('monthly');
  const [isTest, setIsTest] = useState(false);
  const [testMinutes, setTestMinutes] = useState('10');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; password: string; accessKey: string } | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword(generatePassword());
    setShowPassword(false);
    setPlan('monthly');
    setIsTest(false);
    setTestMinutes('10');
  };

  const handleCreate = async () => {
    if (!email.trim()) {
      toast.error('Informe o email');
      return;
    }

    if (password.trim().length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    const expiresAt = isTest
      ? new Date(Date.now() + Number(testMinutes) * 60 * 1000).toISOString()
      : getPlanExpiry(plan);

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    try {
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
      setLoading(false);

      if (!response.ok) {
        toast.error('Erro: ' + (data.error || 'Falha ao criar'));
        return;
      }

      toast.success(data.renewed ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
      setResult({
        email: email.trim(),
        password: password.trim(),
        accessKey: data.accessKey || '—',
      });
      onAdded();
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Erro inesperado');
    }
  };

  if (result) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Credenciais geradas
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <CredentialField label="Email" value={result.email} />
          <CredentialField label="Senha" value={result.password} secret />
          <CredentialField label="Chave de acesso" value={result.accessKey} />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setResult(null);
              resetForm();
            }}
          >
            Criar outro usuário
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => setIsTest(false)}>
          <Plus className="mr-1 h-4 w-4" /> Criar usuário
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setIsTest(true)}>
          <Timer className="mr-1 h-4 w-4" /> Licença teste
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Email</div>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Senha</div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-20"
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setPassword(generatePassword())}>
                <KeyRound className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {isTest ? (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Duração do teste</div>
            <Select value={testMinutes} onValueChange={setTestMinutes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Plano</div>
            <Select value={plan} onValueChange={(value: PlanType) => setPlan(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={handleCreate} disabled={loading}>
          {loading ? 'Salvando...' : isTest ? 'Criar teste' : 'Criar usuário'}
        </Button>
        <Button type="button" variant="outline" onClick={resetForm}>
          Limpar
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar usuários');
    } else {
      setLicenses((data || []) as LicenseRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return licenses;
    return licenses.filter((license) => (license.email || '').toLowerCase().includes(query));
  }, [licenses, search]);

  const updateLicenseStatus = async (id: string, status: StatusType) => {
    setSavingId(id);
    const { error } = await supabase.from('licenses').update({ status }).eq('id', id);
    setSavingId(null);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    setLicenses((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    toast.success('Status atualizado');
  };

  const updateLicensePlan = async (id: string, plan: PlanType) => {
    setSavingId(id);
    const expires_at = getPlanExpiry(plan);

    const { error } = await supabase
      .from('licenses')
      .update({ plan, status: 'active', expires_at })
      .eq('id', id);

    setSavingId(null);

    if (error) {
      toast.error('Erro ao atualizar plano');
      return;
    }

    setLicenses((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              plan,
              status: 'active',
              expires_at,
            }
          : item,
      ),
    );

    toast.success('Plano e prazo atualizados');
  };

  const deleteLicense = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta licença?')) return;

    const { error } = await supabase.from('licenses').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover licença');
      return;
    }

    setLicenses((prev) => prev.filter((item) => item.id !== id));
    toast.success('Licença removida');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <StudioTopbar title="Painel Admin" showApiKey={false} />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Total de usuários</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">{licenses.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Usuários ativos</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {licenses.filter((item) => item.status === 'active').length}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Planos</div>
            <div className="mt-1 text-sm text-foreground">
              {Object.entries(
                licenses.reduce<Record<string, number>>((acc, item) => {
                  acc[item.plan] = (acc[item.plan] || 0) + 1;
                  return acc;
                }, {}),
              )
                .map(([plan, count]) => `${PLAN_LABELS[plan] || plan}: ${count}`)
                .join(' · ') || '—'}
            </div>
          </div>
        </div>

        <AddLicenseForm onAdded={fetchLicenses} />

        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email..." className="pl-9" />
            </div>
            <Button type="button" variant="outline" onClick={fetchLicenses}>
              <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum resultado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium text-foreground">{license.email || '—'}</TableCell>
                      <TableCell>
                        <Select value={license.plan} onValueChange={(value: PlanType) => updateLicensePlan(license.id, value)}>
                          <SelectTrigger className="h-8 w-28 text-xs">
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
                        <Badge variant={license.status === 'active' ? 'default' : 'secondary'}>
                          {license.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                        {license.access_key || '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {license.expires_at ? <CountdownCell expiresAt={license.expires_at} /> : 'Vitalício'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(license.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1">
                          {license.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => updateLicenseStatus(license.id, 'inactive')}
                              disabled={savingId === license.id}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" /> Desativar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => updateLicenseStatus(license.id, 'active')}
                              disabled={savingId === license.id}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Ativar
                            </Button>
                          )}
                          <ResetPasswordButton userId={license.user_id} email={license.email} />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => deleteLicense(license.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
