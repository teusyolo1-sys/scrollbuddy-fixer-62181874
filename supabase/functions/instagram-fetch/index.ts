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
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    const { username } = await req.json();
    if (!username) {
      return new Response(
        JSON.stringify({ error: "username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace(/^@/, "").trim();

    // Fetch profile info from Instagram120 API
    const profileResponse = await fetch(
      "https://instagram120.p.rapidapi.com/api/instagram/userInfo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Host": "instagram120.p.rapidapi.com",
          "X-RapidAPI-Key": RAPIDAPI_KEY,
        },
        body: JSON.stringify({ username: cleanUsername }),
      }
    );

    if (!profileResponse.ok) {
      const errText = await profileResponse.text();
      console.error("Instagram120 API error:", profileResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `API error: ${profileResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileData = await profileResponse.json();
    console.log("Instagram120 raw response keys:", Object.keys(profileData));

    // Extract user data - the API may return data in different structures
    const user = profileData?.user || profileData?.data?.user || profileData;

    const result = {
      username: user?.username || cleanUsername,
      full_name: user?.full_name || "",
      profile_pic_url: user?.profile_pic_url || user?.profile_pic_url_hd || "",
      followers: user?.follower_count || user?.edge_followed_by?.count || 0,
      following: user?.following_count || user?.edge_follow?.count || 0,
      posts_count: user?.media_count || user?.edge_owner_to_timeline_media?.count || 0,
      biography: user?.biography || "",
      is_verified: user?.is_verified || false,
      external_url: user?.external_url || "",
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
