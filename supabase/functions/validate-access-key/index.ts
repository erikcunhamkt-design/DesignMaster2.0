const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { key, userId } = await req.json();

    if (!key || !userId) {
      return new Response(JSON.stringify({ error: "missing_params" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const trimmedKey = key.trim();

    // 1. Check if it's the master access key
    const masterKey = (Deno.env.get("MASTER_ACCESS_KEY") || "").trim();
    if (masterKey && trimmedKey === masterKey) {
      // Ensure user has a license row, then activate
      const { data: existing } = await supabase
        .from("licenses")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase.from("licenses").update({
          plan: "lifetime",
          status: "active",
          expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
      } else {
        await supabase.from("licenses").insert({
          user_id: userId,
          plan: "lifetime",
          status: "active",
          expires_at: null,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check if it's a generated access key from licenses table
    const { data: keyLicense, error: lookupError } = await supabase
      .from("licenses")
      .select("*")
      .eq("access_key", trimmedKey)
      .maybeSingle();

    if (lookupError || !keyLicense) {
      return new Response(JSON.stringify({ error: "invalid_key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    if (keyLicense.expires_at && new Date(keyLicense.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "key_expired" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure current user has a license row
    const { data: userLicense } = await supabase
      .from("licenses")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (keyLicense.user_id === userId) {
      // Key belongs to same user — just activate
      await supabase.from("licenses").update({
        status: "active",
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    } else if (userLicense) {
      // Current user has a license — update it with key's plan/expiry
      await supabase.from("licenses").update({
        plan: keyLicense.plan,
        status: "active",
        expires_at: keyLicense.expires_at,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);

      // Invalidate the key
      await supabase.from("licenses").update({
        access_key: null,
        updated_at: new Date().toISOString(),
      }).eq("id", keyLicense.id);
    } else {
      // Current user has no license row — create one
      await supabase.from("licenses").insert({
        user_id: userId,
        plan: keyLicense.plan,
        status: "active",
        expires_at: keyLicense.expires_at,
      });

      // Invalidate the key
      await supabase.from("licenses").update({
        access_key: null,
        updated_at: new Date().toISOString(),
      }).eq("id", keyLicense.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
