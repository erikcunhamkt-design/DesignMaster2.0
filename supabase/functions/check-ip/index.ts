import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get user
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client IP from headers (Deno Deploy / Supabase Edge)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Check if user is admin (admins bypass IP check)
    const { data: isAdmin } = await supabaseAuth.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (isAdmin) {
      return new Response(JSON.stringify({ allowed: true, ip: clientIp, reason: "admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing IPs for this user
    const { data: existingIps } = await supabaseAuth
      .from("user_allowed_ips")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    // First login ever — register IP automatically
    if (!existingIps || existingIps.length === 0) {
      await supabaseAuth.from("user_allowed_ips").insert({
        user_id: user.id,
        ip_address: clientIp,
      });

      return new Response(JSON.stringify({ allowed: true, ip: clientIp, reason: "first_login" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if current IP is in allowed list
    const isAllowed = existingIps.some((entry: any) => entry.ip_address === clientIp);

    if (isAllowed) {
      return new Response(JSON.stringify({ allowed: true, ip: clientIp, reason: "registered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IP not allowed
    return new Response(
      JSON.stringify({
        allowed: false,
        ip: clientIp,
        reason: "ip_blocked",
        message: "Acesso bloqueado. Este IP não está autorizado para esta conta. Entre em contato com o administrador.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-ip error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
