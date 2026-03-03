import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------- Helpers ----------
function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function cors(req: Request) {
  const origin = req.headers.get("origin") || "*";
  const reqHeaders = req.headers.get("access-control-request-headers") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": reqHeaders,
    "Vary": "Origin",
  };
}

function nowISO() {
  return new Date().toISOString();
}

function addMonthsISO(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function addYearsISO(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

type Plan = "monthly" | "yearly" | "lifetime";

function planFromProductNameOrUrl(payload: any): Plan | null {
  const name =
    (payload?.Product?.product_name ||
      payload?.product?.name ||
      payload?.product_name ||
      payload?.product?.title ||
      payload?.offer?.name ||
      "") as string;

  const text = name.toLowerCase();

  if (text.includes("vital") || text.includes("lifetime")) return "lifetime";
  if (text.includes("anual") || text.includes("year")) return "yearly";
  // Default to monthly for subscription products
  if (text.includes("mensal") || text.includes("month") || text.includes("assinatura")) return "monthly";

  return "monthly"; // fallback to monthly
}

function planFromProductId(payload: any): Plan | null {
  const productId =
    payload?.product?.id ||
    payload?.product_id ||
    payload?.data?.product_id ||
    payload?.data?.product?.id;

  const monthly = Deno.env.get("KIWIFY_MONTHLY_PRODUCT_ID");
  const yearly = Deno.env.get("KIWIFY_YEARLY_PRODUCT_ID");
  const lifetime = Deno.env.get("KIWIFY_LIFETIME_PRODUCT_ID");

  if (!productId) return null;
  if (monthly && String(productId) === monthly) return "monthly";
  if (yearly && String(productId) === yearly) return "yearly";
  if (lifetime && String(productId) === lifetime) return "lifetime";
  return null;
}

function computeExpiresAt(plan: Plan): string | null {
  if (plan === "lifetime") return null;
  if (plan === "monthly") return addMonthsISO(1);
  return addYearsISO(1);
}

function getEmail(payload: any): string | null {
  const email =
    payload?.Customer?.email ||
    payload?.customer?.email ||
    payload?.buyer?.email ||
    payload?.client?.email ||
    payload?.email ||
    payload?.data?.customer?.email ||
    payload?.data?.buyer?.email;

  return email ? String(email).trim().toLowerCase() : null;
}

function getTrigger(payload: any): string {
  return String(
    payload?.webhook_event_type ||
      payload?.order_status ||
      payload?.trigger ||
      payload?.event ||
      payload?.type ||
      payload?.name ||
      payload?.event_name ||
      payload?.data?.event ||
      ""
  ).toLowerCase();
}

function getEventId(payload: any): string {
  return String(
    payload?.event_id ||
      payload?.id ||
      payload?.reference ||
      payload?.data?.id ||
      payload?.data?.event_id ||
      crypto.randomUUID()
  );
}

function getOrderId(payload: any): string | null {
  const id =
    payload?.order_id ||
    payload?.sale_id ||
    payload?.purchase_id ||
    payload?.data?.order_id ||
    payload?.data?.sale_id ||
    payload?.data?.id ||
    payload?.id;
  return id ? String(id) : null;
}

function getSubscriptionId(payload: any): string | null {
  const id =
    payload?.subscription_id ||
    payload?.subscription?.id ||
    payload?.data?.subscription_id ||
    payload?.data?.subscription?.id;
  return id ? String(id) : null;
}

function isActivateTrigger(trigger: string) {
  return (
    trigger.includes("aprovada") ||
    trigger.includes("approved") ||
    trigger.includes("payment_approved") ||
    trigger.includes("compra_aprovada") ||
    trigger.includes("subscription_renewed") ||
    trigger.includes("renewed")
  );
}

function isDeactivateTrigger(trigger: string) {
  return (
    trigger.includes("reembolsada") ||
    trigger.includes("refunded") ||
    trigger.includes("chargeback") ||
    trigger.includes("subscription_canceled") ||
    trigger.includes("canceled") ||
    trigger.includes("subscription_late") ||
    trigger.includes("late")
  );
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, corsHeaders);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400, corsHeaders);
  }

  // Validate webhook token - check multiple possible locations
  const expected = (Deno.env.get("KIWIFY_WEBHOOK_TOKEN") || "").trim();
  
  // Log all headers and relevant body fields for debugging
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((v, k) => { allHeaders[k] = v; });
  console.log("WEBHOOK HEADERS:", JSON.stringify(allHeaders));
  console.log("WEBHOOK BODY KEYS:", JSON.stringify(Object.keys(payload || {})));
  console.log("WEBHOOK SIGNATURE FIELD:", payload?.signature);
  
  const headerToken =
    (req.headers.get("x-kiwify-token") || "").trim() ||
    (req.headers.get("x-webhook-token") || "").trim() ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const bodyToken = String(
    payload?.token || payload?.webhook_token || payload?.signature || payload?.secret || ""
  ).trim();

  if (expected && headerToken !== expected && bodyToken !== expected) {
    return json({ error: "unauthorized" }, 401, corsHeaders);
  }

  const email = getEmail(payload);
  if (!email) return json({ error: "missing_email", payload }, 400, corsHeaders);

  const trigger = getTrigger(payload);
  const eventId = getEventId(payload);
  const orderId = getOrderId(payload);
  const subscriptionId = getSubscriptionId(payload);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return json({ error: "missing_supabase_secrets" }, 500, corsHeaders);
  }

  const admin = createClient(supabaseUrl, serviceRole);

  // Idempotency
  const { error: idemErr } = await admin.from("webhook_events").insert({ event_id: eventId });
  if (idemErr) {
    return json({ ok: true, skipped: true, eventId }, 200, corsHeaders);
  }

  // Find user by email
  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers();
  if (usersErr) return json({ error: "cannot_list_users", details: usersErr }, 500, corsHeaders);

  const user = usersData.users.find((u) => (u.email || "").toLowerCase() === email);
  if (!user) {
    return json({ ok: true, pending_user: true, email }, 200, corsHeaders);
  }

  // Determine plan
  const plan = planFromProductId(payload) || planFromProductNameOrUrl(payload);
  if (!plan) {
    return json(
      { error: "unknown_plan", hint: "Configure KIWIFY_*_PRODUCT_ID or adjust fallback.", payload },
      400,
      corsHeaders
    );
  }

  // Activate / deactivate
  const activate = isActivateTrigger(trigger);
  const deactivate = isDeactivateTrigger(trigger);

  if (!activate && !deactivate) {
    return json({ ok: true, ignored: true, trigger, plan }, 200, corsHeaders);
  }

  const status = activate ? "active" : "inactive";
  const expiresAt = activate ? computeExpiresAt(plan) : null;

  const { error: upErr } = await admin.from("licenses").upsert(
    {
      user_id: user.id,
      email,
      plan,
      status,
      expires_at: plan === "lifetime" ? null : expiresAt,
      kiwify_order_id: orderId,
      kiwify_subscription_id: subscriptionId,
      updated_at: nowISO(),
    },
    { onConflict: "user_id" }
  );

  if (upErr) return json({ error: "db_upsert_failed", details: upErr }, 500, corsHeaders);

  return json(
    {
      ok: true,
      user_id: user.id,
      email,
      plan,
      status,
      expires_at: plan === "lifetime" ? null : expiresAt,
      trigger,
    },
    200,
    corsHeaders
  );
});
