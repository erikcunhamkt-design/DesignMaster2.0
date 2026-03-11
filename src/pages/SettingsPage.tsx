import { useState } from 'react';
import { Settings, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AccessibilityPanel } from '@/components/AccessibilityPanel';
import { ApiKeySection, useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { LicenseCountdown } from '@/components/LicenseCountdown';
import { useLicense } from '@/hooks/useLicense';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Crown, Clock, AlertTriangle, KeyRound, Glasses } from 'lucide-react';

function LicenseSection() {
  const { license, loading, isActive } = useLicense();

  if (loading) return <div className="text-xs text-muted-foreground">Carregando...</div>;
  if (!license) return <div className="text-xs text-muted-foreground">Nenhuma licença encontrada.</div>;

  const active = isActive();
  const isLifetime = license.plan === 'lifetime';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Status</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
          {active ? 'Ativo' : 'Inativo'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Plano</span>
        <span className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
          {isLifetime && <Crown className="h-3 w-3 text-primary" />}
          {license.plan}
        </span>
      </div>
      {license.expires_at && !isLifetime && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Expira em</span>
          <span className="text-xs text-muted-foreground">
            {new Date(license.expires_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
      {license.email && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">E-mail</span>
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{license.email}</span>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { apiKey, saveKey } = useGoogleApiKey();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 items-center gap-3 px-6 border-b border-border/30 bg-background/60 backdrop-blur-xl shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </button>
        <div className="h-5 w-px bg-border/30" />
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold tracking-tight text-foreground">Configurações</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

          {/* Licença */}
          <section className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Licença</h2>
                <p className="text-[10px] text-muted-foreground">Informações da sua assinatura</p>
              </div>
              <div className="ml-auto">
                <SubscriptionBadge />
              </div>
            </div>
            <div className="h-px bg-border/20" />
            <LicenseSection />
          </section>

          {/* API Key */}
          <section className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Chave de API</h2>
                <p className="text-[10px] text-muted-foreground">Configure sua API Key do Google</p>
              </div>
              <div className="ml-auto">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${apiKey.length >= 10 ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                  {apiKey.length >= 10 ? '● Conectada' : '● Desconectada'}
                </span>
              </div>
            </div>
            <div className="h-px bg-border/20" />
            <ApiKeySection apiKey={apiKey} onChangeKey={saveKey} />
          </section>

          {/* Acessibilidade */}
          <section className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <Glasses className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Acessibilidade</h2>
                <p className="text-[10px] text-muted-foreground">Ajuste a experiência visual do app</p>
              </div>
            </div>
            <div className="h-px bg-border/20" />
            <AccessibilityPanel />
          </section>

          {/* Trocar Senha */}
          <section className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Alterar Senha</h2>
                <p className="text-[10px] text-muted-foreground">Atualize sua senha de acesso</p>
              </div>
            </div>
            <div className="h-px bg-border/20" />
            <ChangePasswordSection />
          </section>

        </div>
      </main>
    </div>
  );
}
