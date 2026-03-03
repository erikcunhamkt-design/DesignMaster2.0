import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLicense } from '@/hooks/useLicense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Key, MessageCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logoImg from '@/assets/logo.png';

const plans = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 14,99/mês',
    url: 'https://pay.kiwify.com.br/7b1lH1a',
    icon: Zap,
    highlight: true,
  },
];

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
          <img src={logoImg} alt="Design Master" className="h-10 w-auto mx-auto" />
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
        <img src={logoImg} alt="Design Master" className="h-10 w-auto mx-auto" />
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
            className="relative group glass-card rounded-2xl p-8 text-center space-y-4 transition-all hover:scale-[1.03] max-w-xs w-full ring-1 ring-primary/40 overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            
            <div className="relative z-10 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide animate-pulse">
                🚀 Promoção de Lançamento
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto ring-2 ring-primary/30">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground font-['Space_Grotesk']">Assinatura Mensal</h3>
              <p className="text-3xl font-extrabold text-primary font-['Space_Grotesk']">R$ 14,99<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <p className="text-xs text-muted-foreground">Acesso completo a todas as ferramentas</p>
              <div className="pt-2">
                <span className="inline-block py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow duration-300">
                  Assinar Agora ✨
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
