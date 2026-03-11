import { Shield, AlertTriangle } from "lucide-react";

interface IpBlockedScreenProps {
  ip: string | null;
  message: string | null;
}

export function IpBlockedScreen({ ip, message }: IpBlockedScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 px-6 text-center max-w-md">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Acesso Bloqueado
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {message || "Este IP não está autorizado para acessar esta conta. Entre em contato com o administrador."}
          </p>
        </div>

        {ip && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-2">
            <span className="text-xs text-muted-foreground">Seu IP: </span>
            <span className="text-xs font-mono text-foreground">{ip}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          Se você acredita que isto é um erro, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}
