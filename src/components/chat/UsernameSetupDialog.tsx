import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AtSign, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  onComplete: (username: string) => void;
}

export function UsernameSetupDialog({ userId, onComplete }: Props) {
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const sanitize = (val: string) => val.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);

  const checkAvailability = async (name: string) => {
    if (name.length < 3) { setAvailable(null); return; }
    setChecking(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', name)
      .neq('id', userId)
      .maybeSingle();
    setAvailable(!data);
    setChecking(false);
  };

  const handleChange = (val: string) => {
    const clean = sanitize(val);
    setUsername(clean);
    setAvailable(null);
    if (clean.length >= 3) {
      const timeout = setTimeout(() => checkAvailability(clean), 400);
      return () => clearTimeout(timeout);
    }
  };

  const handleSave = async () => {
    if (username.length < 3 || !available) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username } as any)
      .eq('id', userId);
    if (error) {
      if (error.code === '23505') toast.error('Nome de usuário já em uso');
      else toast.error('Erro ao salvar');
      setSaving(false);
      return;
    }
    toast.success('Nome de usuário criado! 🎉');
    onComplete(username);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 p-6 rounded-2xl bg-card border border-border/20 shadow-2xl space-y-5 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
            <AtSign className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Crie seu nome de usuário</h2>
          <p className="text-xs text-muted-foreground">Outros membros poderão te encontrar e adicionar por ele.</p>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              value={username}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="seu.usuario"
              className="pl-8 h-11 text-sm bg-secondary/30 border-border/20"
              maxLength={20}
            />
            {checking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {username.length > 0 && username.length < 3 && (
            <p className="text-[10px] text-amber-500">Mínimo 3 caracteres</p>
          )}
          {available === true && (
            <p className="text-[10px] text-emerald-500">✓ Disponível!</p>
          )}
          {available === false && (
            <p className="text-[10px] text-destructive">✗ Já está em uso</p>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={username.length < 3 || available !== true || saving}
          className="w-full h-11 rounded-xl"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
        </Button>
      </div>
    </div>
  );
}
