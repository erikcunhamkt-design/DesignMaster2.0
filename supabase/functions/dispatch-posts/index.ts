import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find posts that are due (scheduled_at <= now) and still pending
    const { data: duePosts, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching due posts:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!duePosts || duePosts.length === 0) {
      return new Response(JSON.stringify({ message: "No posts due", count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const post of duePosts) {
      if (!post.webhook_url) {
        await supabase
          .from("scheduled_posts")
          .update({ status: "failed", webhook_response: "No webhook URL configured" })
          .eq("id", post.id);
        results.push({ id: post.id, status: "failed", reason: "no_webhook" });
        continue;
      }

      try {
        // Parse media URLs (stored as JSON array)
        let mediaUrls: string[] = [];
        try {
          mediaUrls = post.media_url ? JSON.parse(post.media_url) : [];
          if (!Array.isArray(mediaUrls)) mediaUrls = post.media_url ? [post.media_url] : [];
        } catch {
          mediaUrls = post.media_url ? [post.media_url] : [];
        }

        const response = await fetch(post.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: post.title,
            content: post.content,
            platform: post.platform,
            post_type: mediaUrls.length > 1 ? "carousel" : "single",
            scheduled_at: post.scheduled_at,
            media_urls: mediaUrls,
            media_url: mediaUrls[0] || null,
            image_count: mediaUrls.length,
            post_id: post.id,
            timestamp: new Date().toISOString(),
          }),
        });

        const responseText = await response.text();

        await supabase
          .from("scheduled_posts")
          .update({
            status: response.ok ? "sent" : "failed",
            webhook_response: responseText.slice(0, 500),
          })
          .eq("id", post.id);

        results.push({ id: post.id, status: response.ok ? "sent" : "failed" });
      } catch (err) {
        await supabase
          .from("scheduled_posts")
          .update({ status: "failed", webhook_response: String(err) })
          .eq("id", post.id);
        results.push({ id: post.id, status: "failed", reason: String(err) });
      }
    }

    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dispatch-posts error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
