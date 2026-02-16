const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        status: 400,
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
      const { error } = await supabase.from("licenses").upsert(
        {
          user_id: userId,
          plan: "lifetime",
          status: "active",
          expires_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        return new Response(JSON.stringify({ error: "db_error", details: error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check if it's a generated access key from licenses table
    const { data: license, error: lookupError } = await supabase
      .from("licenses")
      .select("*")
      .eq("access_key", trimmedKey)
      .maybeSingle();

    if (lookupError || !license) {
      return new Response(JSON.stringify({ error: "invalid_key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "key_expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transfer the license to the current user
    const { error: updateError } = await supabase
      .from("licenses")
      .update({
        user_id: userId,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", license.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "db_error", details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
