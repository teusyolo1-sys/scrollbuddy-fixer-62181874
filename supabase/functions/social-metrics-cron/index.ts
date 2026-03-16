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
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RAPIDAPI_KEY) {
      return new Response(JSON.stringify({ error: "RAPIDAPI_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all Instagram accounts
    const { data: accounts, error: accError } = await supabase
      .from("social_accounts")
      .select("id, profile_name, platform")
      .eq("platform", "instagram");

    if (accError) {
      console.error("Error fetching accounts:", accError);
      return new Response(JSON.stringify({ error: accError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ message: "No Instagram accounts found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const account of accounts) {
      const username = account.profile_name.replace(/^@/, "").trim();
      if (!username) continue;

      try {
        const url = `https://simple-instagram-api.p.rapidapi.com/account-info?username=${encodeURIComponent(username)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-RapidAPI-Host": "simple-instagram-api.p.rapidapi.com",
            "X-RapidAPI-Key": RAPIDAPI_KEY,
          },
        });

        if (!response.ok) {
          console.error(`API error for ${username}: ${response.status}`);
          results.push({ username, error: `API ${response.status}` });
          continue;
        }

        const data = await response.json();
        const followers = data?.follower_count || data?.followers || data?.edge_followed_by?.count || 0;
        const postsCount = data?.media_count || data?.posts || data?.edge_owner_to_timeline_media?.count || 0;
        const today = new Date().toISOString().split("T")[0];

        // Update account
        await supabase
          .from("social_accounts")
          .update({
            followers,
            posts_count: postsCount,
            last_updated: today,
            updated_at: new Date().toISOString(),
          })
          .eq("id", account.id);

        // Upsert daily metric
        await supabase
          .from("social_metrics")
          .upsert({
            account_id: account.id,
            date: today,
            followers,
            engagement_rate: 0,
            reach: 0,
            impressions: 0,
            likes: 0,
            comments: 0,
            shares: 0,
          }, { onConflict: "account_id,date" });

        results.push({ username, followers, posts_count: postsCount, status: "ok" });
        console.log(`✅ ${username}: ${followers} seguidores, ${postsCount} posts`);

        // Small delay between requests to avoid rate limiting
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Error processing ${username}:`, err);
        results.push({ username, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ updated: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("social-metrics-cron error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
