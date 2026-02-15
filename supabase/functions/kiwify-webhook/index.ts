import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate token
    const webhookToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || req.headers.get("x-webhook-token");

    if (webhookToken && token !== webhookToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const eventType = body.order_status || body.event || body.type;
    const email = body.Customer?.email || body.customer?.email || body.email;
    const orderId = body.order_id || body.Order?.order_id;
    const subscriptionId = body.subscription_id || body.Subscription?.id;

    if (!email) {
      return new Response(JSON.stringify({ error: "No email in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check
    const eventId = `${orderId || subscriptionId || email}_${eventType}_${Date.now()}`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      return new Response(JSON.stringify({ message: "Already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("webhook_events").insert({ event_id: eventId });

    // Determine plan from product or body
    const productName = (body.Product?.name || body.product_name || "").toLowerCase();
    let plan = "monthly";
    if (productName.includes("anual") || productName.includes("yearly")) plan = "yearly";
    if (productName.includes("vitalicio") || productName.includes("lifetime")) plan = "lifetime";

    // Handle events
    const normalizedEvent = eventType?.toLowerCase() || "";

    if (
      normalizedEvent.includes("approved") ||
      normalizedEvent.includes("aprovada") ||
      normalizedEvent.includes("paid") ||
      normalizedEvent.includes("renewed")
    ) {
      // Activate license
      const expiresAt =
        plan === "lifetime"
          ? null
          : plan === "yearly"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: license } = await supabase
        .from("licenses")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (license) {
        await supabase
          .from("licenses")
          .update({
            status: "active",
            plan,
            expires_at: expiresAt,
            kiwify_order_id: orderId || null,
            kiwify_subscription_id: subscriptionId || null,
          })
          .eq("email", email);
      }
      // If no license yet, user hasn't signed up — will be activated when they do
    } else if (
      normalizedEvent.includes("refund") ||
      normalizedEvent.includes("reembolsada") ||
      normalizedEvent.includes("chargeback") ||
      normalizedEvent.includes("canceled") ||
      normalizedEvent.includes("late")
    ) {
      // Deactivate license
      await supabase
        .from("licenses")
        .update({ status: "inactive" })
        .eq("email", email);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
