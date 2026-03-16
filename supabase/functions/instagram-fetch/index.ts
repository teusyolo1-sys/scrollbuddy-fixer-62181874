import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      console.error("RAPIDAPI_KEY is not set");
      return new Response(
        JSON.stringify({ error: "RAPIDAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("RAPIDAPI_KEY prefix:", RAPIDAPI_KEY.substring(0, 8), "length:", RAPIDAPI_KEY.length);

    const { username } = await req.json();
    if (!username) {
      return new Response(
        JSON.stringify({ error: "username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanUsername = username.replace(/^@/, "").trim();

    // Simple Instagram API - GET /account-info
    const url = `https://simple-instagram-api.p.rapidapi.com/account-info?username=${encodeURIComponent(cleanUsername)}`;

    console.log("Fetching:", url);

    const profileResponse = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Host": "simple-instagram-api.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY,
      },
    });

    if (!profileResponse.ok) {
      const errText = await profileResponse.text();
      console.error("Simple Instagram API error:", profileResponse.status, errText);
      
      if (profileResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (profileResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "Você não está inscrito nesta API. Acesse o RapidAPI e clique em Subscribe." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Erro na API: ${profileResponse.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await profileResponse.json();
    console.log("API response keys:", Object.keys(data));

    // Extract data - adapt to actual response structure
    const result = {
      username: data?.username || cleanUsername,
      full_name: data?.full_name || data?.fullName || "",
      profile_pic_url: data?.profile_pic_url || data?.profilePicUrl || "",
      followers: data?.follower_count || data?.followers || data?.edge_followed_by?.count || 0,
      following: data?.following_count || data?.following || data?.edge_follow?.count || 0,
      posts_count: data?.media_count || data?.posts || data?.edge_owner_to_timeline_media?.count || 0,
      biography: data?.biography || data?.bio || "",
      is_verified: data?.is_verified || false,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("instagram-fetch error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
