import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  mentions: string[];
  task_id: string | null;
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

export function useChatMessages(taskId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, display_name, email, avatar_url").then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, [user]);

  const fetchMessages = useCallback(async () => {
    let query = supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);

    if (taskId) {
      query = query.eq("task_id", taskId);
    } else {
      query = query.is("task_id", null);
    }

    const { data, error } = await query;
    console.log("[ChatMessages] fetch for taskId:", taskId, "data:", data?.length, "error:", error);

    if (data) {
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
  }, [taskId]);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
  }, [user, fetchMessages]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat_${taskId || "global"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMessages, taskId]);

  const sendMessage = useCallback(
    async (content: string, mentions: string[]) => {
      if (!user) return;
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        content,
        mentions,
        task_id: taskId || null,
      } as any);
    },
    [user, taskId]
  );

  const deleteMessage = useCallback(async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
  }, []);

  return { messages, profiles, loading, sendMessage, deleteMessage };
}
