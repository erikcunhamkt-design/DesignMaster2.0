import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_url } = await req.json();

    const testPayload = {
      title: "Post de Teste 🚀",
      content: "Esta é uma legenda de teste enviada pelo Design Master!\n\n#teste #designmaster #automacao",
      platform: "instagram",
      post_type: "single",
      scheduled_at: new Date().toISOString(),
      media_urls: ["https://placehold.co/1080x1080/6366f1/white?text=Teste+Make"],
      media_url: "https://placehold.co/1080x1080/6366f1/white?text=Teste+Make",
      image_count: 1,
      post_id: "test-" + Date.now(),
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      response: responseText,
      payload_sent: testPayload,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
