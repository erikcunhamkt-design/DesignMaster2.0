import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { Users, CreditCard, BarChart3, Trash2, CheckCircle, XCircle, Search, Plus, Timer, Copy, Eye, EyeOff, Key, RefreshCw, Shield, MessageCircle, AlertTriangle, Ban, Bell, Send, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
...
function ResetPasswordButton({ userId, email }: { userId: string; email: string | null }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pwd);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !password) generatePassword();
    if (!nextOpen) {
      setPassword('');
      setShowPwd(false);
    }
  };

  const handleReset = async () => {
    if (!password || password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ userId, newPassword: password }),
    });

    if (response.ok) {
      toast.success(`Senha alterada para ${email || userId}`);
      navigator.clipboard.writeText(password);
      toast.info('Nova senha copiada para a área de transferência');
      handleOpenChange(false);
    } else {
      const data = await response.json();
      toast.error('Erro: ' + (data.error || 'Falha ao resetar senha'));
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs whitespace-nowrap">
          <Lock className="mr-1 h-3.5 w-3.5" /> Alterar senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para {email || 'este usuário'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-20"
              placeholder="Nova senha"
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowPwd((value) => !value)}>
                {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={generatePassword}>
                <Key className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={generatePassword} className="w-full">
            Gerar senha
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleReset} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar senha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
