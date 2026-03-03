import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLicense } from '@/hooks/useLicense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, MessageCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logoImg from '@/assets/logo.png';

const plans = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 14,99/mês',
    url: 'https://pay.kiwify.com.br/7b1lH1a',
    highlight: true,
  },
];

const FakeCountdown = () => {
  const [time, setTime] = useState({ h: 23, m: 59, s: 59 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      <Clock className="h-3.5 w-3.5 text-destructive animate-pulse" />
      <div className="flex items-center gap-1 font-mono text-sm font-bold text-destructive">
        <span className="bg-destructive/10 px-1.5 py-0.5 rounded">{pad(time.h)}</span>
        <span>:</span>
        <span className="bg-destructive/10 px-1.5 py-0.5 rounded">{pad(time.m)}</span>
        <span>:</span>
        <span className="bg-destructive/10 px-1.5 py-0.5 rounded">{pad(time.s)}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">restantes</span>
    </div>
  );
};

const PaywallPage = () => {
  const { user, signOut } = useAuth();
  const { license } = useLicense();
  const [accessKey, setAccessKey] = useState('');
  const [validating, setValidating] = useState(false);

  const isExpired = license?.status === 'active' && license?.expires_at && new Date(license.expires_at) < new Date();

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Olá! Minha licença do Design Master expirou. Email: ${user?.email}`);
    window.open(`https://wa.me/5551996377086?text=${msg}`, '_blank');
  };

  const handleSelect = (baseUrl: string) => {
    const url = `${baseUrl}?email=${encodeURIComponent(user?.email || '')}`;
    window.open(url, '_blank');
  };

  const handleKeySubmit = async () => {
    if (!accessKey.trim() || !user) return;
    setValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-access-key', {
        body: { key: accessKey.trim(), userId: user.id },
      });

      if (error) throw new Error(error.message);
      if (data?.error) {
        if (data.error === 'invalid_key') throw new Error('Chave inválida');
        if (data.error === 'key_expired') throw new Error('Esta chave expirou');
        throw new Error(data.error);
      }

      toast.success('Acesso ativado com sucesso!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Chave inválida');
    } finally {
      setValidating(false);
    }
  };

  if (isExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <img src={logoImg} alt="Design Master" className="h-10 w-10 rounded-full object-cover mx-auto" />
          <div className="glass-card rounded-2xl p-8 space-y-5">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">
              Sua licença expirou
            </h1>
            <p className="text-muted-foreground text-sm">
              Seu período de acesso chegou ao fim. Entre em contato com o suporte para renovar ou adquirir um novo plano.
            </p>
            <Button onClick={handleWhatsApp} className="w-full gap-2" size="lg">
              <MessageCircle className="h-5 w-5" /> Falar com Suporte via WhatsApp
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <p className="text-xs text-muted-foreground">Logado como {user?.email}</p>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-xs text-muted-foreground">Sair</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <img src={logoImg} alt="Design Master" className="h-10 w-10 rounded-full object-cover mx-auto" />
        <h1 className="text-3xl font-bold text-foreground font-['Space_Grotesk']">
          Ative seu acesso
        </h1>
        <p className="text-muted-foreground">
          {license?.status === 'inactive'
            ? 'Sua licença está inativa. Escolha um plano para começar a criar.'
            : 'Escolha o plano ideal para você e comece a usar o Design Master.'}
        </p>

        <div className="flex justify-center">
          <button
            onClick={() => handleSelect(plans[0].url)}
            className="relative group glass-card rounded-2xl p-8 text-center transition-all hover:scale-[1.02] max-w-sm w-full ring-1 ring-primary/30 overflow-hidden"
          >
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            
            <div className="relative z-10 space-y-3">
              <h3 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Assinatura Mensal</h3>
              <p className="text-sm text-muted-foreground line-through">R$ 69,99/mês</p>
              <p className="text-4xl font-extrabold text-primary font-['Space_Grotesk']">R$ 14,99<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <div className="inline-block px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-semibold animate-pulse">
                🔥 Oferta de Lançamento
              </div>
              <FakeCountdown />
              <p className="text-xs text-muted-foreground pt-1">Acesso completo a todas as ferramentas</p>
              <div className="pt-3">
                <span className="inline-block py-3 px-6 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow duration-300 animate-[pulse_3s_ease-in-out_infinite]">
                  Assinar Agora
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Access Key Section */}
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Key className="h-3 w-3" /> Possui uma chave de acesso?
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <Input
              type="password"
              placeholder="Cole sua chave aqui"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKeySubmit()}
            />
            <Button onClick={handleKeySubmit} disabled={validating || !accessKey.trim()} size="sm">
              {validating ? '...' : 'Ativar'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <p className="text-xs text-muted-foreground">
            Logado como {user?.email}
          </p>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-xs text-muted-foreground">
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaywallPage;
