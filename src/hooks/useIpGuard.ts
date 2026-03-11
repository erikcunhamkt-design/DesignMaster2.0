import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IpGuardState {
  checking: boolean;
  allowed: boolean | null;
  ip: string | null;
  message: string | null;
}

export function useIpGuard() {
  const [state, setState] = useState<IpGuardState>({
    checking: true,
    allowed: null,
    ip: null,
    message: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkIp() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState({ checking: false, allowed: true, ip: null, message: null });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("check-ip");

        if (error) {
          console.error("IP check error:", error);
          if (!cancelled) setState({ checking: false, allowed: true, ip: null, message: null });
          return;
        }

        // If IP switched, show toast info
        if (data.reason === "ip_switched") {
          toast.info("Sessão transferida para este dispositivo.", {
            description: "Outros dispositivos foram deslogados automaticamente.",
            duration: 5000,
          });
        }

        if (!cancelled) {
          setState({
            checking: false,
            allowed: data.allowed,
            ip: data.ip,
            message: data.message || null,
          });
        }
      } catch (err) {
        console.error("IP check failed:", err);
        if (!cancelled) setState({ checking: false, allowed: true, ip: null, message: null });
      }
    }

    checkIp();
    return () => { cancelled = true; };
  }, []);

  return state;
}
