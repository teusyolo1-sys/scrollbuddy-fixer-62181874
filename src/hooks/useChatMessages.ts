import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  mentions: string[];
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface ChatProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function useChatMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load profiles for @mention suggestions
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, display_name, email, avatar_url").then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, [user]);

  // Load messages
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);

    if (data) {
      // Enrich with profiles
      const profileMap = new Map<string, ChatProfile>();
      const { data: profs } = await supabase.from("profiles").select("id, display_name, email, avatar_url");
      profs?.forEach((p) => profileMap.set(p.id, p));

      const enriched: ChatMessage[] = data.map((m: any) => ({
        ...m,
        mentions: m.mentions || [],
        profile: profileMap.get(m.user_id),
      }));
      setMessages(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
  }, [user, fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat_messages_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string, mentions: string[]) => {
      if (!user) return;
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        content,
        mentions,
      } as any);
    },
    [user]
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      await supabase.from("chat_messages").delete().eq("id", id);
    },
    []
  );

  return { messages, profiles, loading, sendMessage, deleteMessage };
}
