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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify caller is admin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const callerId = claims.claims.sub;
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, password, plan, expiresAt } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let userId: string;
    let isExisting = false;

    // Try to create user; if already exists, find them instead
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      // Check if the error is "user already exists"
      if (createError.message?.toLowerCase().includes('already') || createError.status === 422) {
        // Find existing user by email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          return new Response(JSON.stringify({ error: 'Failed to find existing user' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const existingUser = users.find((u: any) => u.email === email);
        if (!existingUser) {
          return new Response(JSON.stringify({ error: 'User exists but could not be found' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        userId = existingUser.id;
        isExisting = true;

        // Update password for existing user
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      userId = newUser.user.id;
    }

    // Generate access key
    const accessKey = generateAccessKey();

    // Upsert the license (handles both existing and new users, even if trigger didn't fire)
    const { data: existingLicense } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLicense) {
      const { error: updateError } = await supabaseAdmin
        .from('licenses')
        .update({
          plan: plan || 'test',
          status: 'active',
          expires_at: expiresAt || null,
          access_key: accessKey,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        return new Response(JSON.stringify({ error: 'License update failed: ' + updateError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // No license row exists — create one
      const { error: insertError } = await supabaseAdmin
        .from('licenses')
        .insert({
          user_id: userId,
          email,
          plan: plan || 'test',
          status: 'active',
          expires_at: expiresAt || null,
          access_key: accessKey,
        });

      if (insertError) {
        return new Response(JSON.stringify({ error: 'License creation failed: ' + insertError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      userId,
      accessKey,
      email,
      renewed: isExisting,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateAccessKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}
