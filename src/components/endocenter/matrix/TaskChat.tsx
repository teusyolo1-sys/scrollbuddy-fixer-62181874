import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, AtSign, Trash2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useChatMessages, type ChatProfile } from "@/hooks/useChatMessages";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function renderContent(content: string) {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
    parts.push(
      <span key={match.index} className="text-primary font-semibold">@{match[1]}</span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts.length > 0 ? parts : content;
}

export default function TaskChat() {
  const { user } = useAuth();
  const { messages, profiles, loading, sendMessage, deleteMessage } = useChatMessages();
  const [input, setInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const cursorPos = e.target.selectionStart || 0;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionStart(cursorPos - atMatch[0].length);
    } else {
      setMentionQuery(null);
    }
  }, []);

  const filteredProfiles = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return profiles
      .filter((p) => p.id !== user?.id && (
        (p.display_name && p.display_name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      ))
      .slice(0, 4);
  }, [mentionQuery, profiles, user?.id]);

  const handleMentionSelect = useCallback((profile: ChatProfile) => {
    const name = profile.display_name || profile.email?.split("@")[0] || "user";
    const before = input.slice(0, mentionStart);
    const after = input.slice((inputRef.current?.selectionStart || mentionStart) + (mentionQuery?.length || 0));
    setInput(before + `@[${name}](${profile.id}) ` + after);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, mentionStart, mentionQuery]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let m;
    while ((m = mentionRegex.exec(trimmed)) !== null) mentions.push(m[1]);
    await sendMessage(trimmed, mentions);
    setInput("");
  }, [input, sendMessage]);

  if (loading) {
    return <p className="text-[10px] text-muted-foreground text-center py-2">Carregando...</p>;
  }

  return (
    <div className="space-y-2">
      {/* Messages */}
      <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-3 text-muted-foreground/40">
            <MessageCircle className="h-5 w-5" />
            <p className="text-[10px]">Nenhuma mensagem</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} className="group">
                <div className="flex items-start gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 mt-0.5"
                    style={{
                      background: isOwn ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      color: isOwn ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {getInitials(msg.profile?.display_name, msg.profile?.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold text-foreground/70 truncate">
                        {msg.profile?.display_name || msg.profile?.email?.split("@")[0] || "Usuário"}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{formatTime(msg.created_at)}</span>
                      {isOwn && (
                        <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 ml-auto text-destructive/50 hover:text-destructive">
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground leading-relaxed break-words">
                      {renderContent(msg.content)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention dropdown */}
      {mentionQuery !== null && filteredProfiles.length > 0 && (
        <div className="rounded-lg bg-card border border-border/50 overflow-hidden shadow-lg">
          {filteredProfiles.map((p) => (
            <button
              key={p.id}
              onMouseDown={(e) => { e.preventDefault(); handleMentionSelect(p); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-secondary/60 transition-colors"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-primary-foreground" style={{ background: "hsl(var(--primary))" }}>
                {getInitials(p.display_name, p.email)}
              </div>
              <span className="text-[10px] font-medium text-foreground truncate">
                {p.display_name || p.email?.split("@")[0]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-1">
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          placeholder="Mensagem... @mencionar"
          className="ios-input flex-1 px-2 py-1.5 text-[11px]"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors"
          style={{ background: input.trim() ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
        >
          <Send className="h-3 w-3 text-primary-foreground" />
        </motion.button>
      </div>
    </div>
  );
}
