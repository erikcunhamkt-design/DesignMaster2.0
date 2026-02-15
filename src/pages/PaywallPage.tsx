import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLicense } from '@/hooks/useLicense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crown, Zap, Star, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logoImg from '@/assets/logo.png';

const plans = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ XX/mês',
    url: 'https://pay.kiwify.com.br/Y7ScUkk',
    icon: Zap,
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 'R$ XX/ano',
    url: 'https://pay.kiwify.com.br/xHOsxEt',
    icon: Star,
    highlight: true,
  },
  {
    id: 'lifetime',
    name: 'Vitalício',
    price: 'R$ XX',
    url: 'https://pay.kiwify.com.br/I0DNmTF',
    icon: Crown,
    highlight: false,
  },
];

const PaywallPage = () => {
  const { user, signOut } = useAuth();
  const { license } = useLicense();
  const [accessKey, setAccessKey] = useState('');
  const [validating, setValidating] = useState(false);

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
      if (data?.error) throw new Error(data.error === 'invalid_key' ? 'Chave inválida' : data.error);

      toast.success('Acesso ativado com sucesso!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Chave inválida');
    } finally {
      setValidating(false);
    }
  };

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <button
                key={plan.id}
                onClick={() => handleSelect(plan.url)}
                className={`glass-card rounded-xl p-6 text-left space-y-3 transition-all hover:scale-[1.02] hover:glow-sm ${
                  plan.highlight ? 'ring-1 ring-primary/50' : ''
                }`}
              >
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.price}</p>
              </button>
            );
          })}
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
