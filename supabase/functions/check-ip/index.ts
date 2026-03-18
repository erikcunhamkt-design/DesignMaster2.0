import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await sb.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Admins bypass
    const { data: isAdmin } = await sb.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (isAdmin) {
      return new Response(JSON.stringify({ allowed: true, ip: clientIp, reason: "admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current active IP for this user
    const { data: existingIps } = await sb
      .from("user_allowed_ips")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    // First login — register IP
    if (!existingIps || existingIps.length === 0) {
      await sb.from("user_allowed_ips").insert({ user_id: user.id, ip_address: clientIp });
      return new Response(JSON.stringify({ allowed: true, ip: clientIp, reason: "first_login" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentRecord = existingIps[0];

    // Same IP — all good
    if (currentRecord.ip_address === clientIp) {
      return new Response(JSON.stringify({ allowed: true, ip: clientIp, reason: "registered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Different IP — update to new IP (switch device)
    // Deactivate old IP(s)
    await sb
      .from("user_allowed_ips")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Register new IP
    await sb.from("user_allowed_ips").insert({ user_id: user.id, ip_address: clientIp });

    return new Response(
      JSON.stringify({
        allowed: true,
        ip: clientIp,
        reason: "ip_switched",
        message: "Sessão transferida para este dispositivo. Outros dispositivos serão deslogados.",
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
