import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Trash2, AtSign } from "lucide-react";
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

// Parse content replacing @[Name](userId) with styled spans
function renderContent(content: string, profiles: ChatProfile[]) {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="text-primary font-semibold bg-primary/10 px-1 rounded">
        @{match[1]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

interface MentionDropdownProps {
  query: string;
  profiles: ChatProfile[];
  onSelect: (profile: ChatProfile) => void;
  position: { top: number; left: number };
}

function MentionDropdown({ query, profiles, onSelect, position }: MentionDropdownProps) {
  const filtered = useMemo(
    () =>
      profiles.filter((p) => {
        const q = query.toLowerCase();
        return (
          (p.display_name && p.display_name.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q))
        );
      }).slice(0, 6),
    [query, profiles]
  );

  if (filtered.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute z-50 bg-card border border-border shadow-xl overflow-hidden"
      style={{
        bottom: position.top,
        left: position.left,
        borderRadius: "var(--ios-radius)",
        minWidth: 200,
        maxWidth: 280,
      }}
    >
      {filtered.map((p) => (
        <button
          key={p.id}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(p);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-secondary/60 transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0"
            style={{ background: "hsl(var(--primary))" }}
          >
            {getInitials(p.display_name, p.email)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {p.display_name || p.email?.split("@")[0]}
            </div>
            {p.email && (
              <div className="text-[10px] text-muted-foreground truncate">{p.email}</div>
            )}
          </div>
        </button>
      ))}
    </motion.div>
  );
}

export default function ProjectChat({ companyId }: { companyId?: string }) {
  const { user } = useAuth();
  const { messages, profiles, loading, sendMessage, deleteMessage } = useChatMessages(undefined, companyId);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages.length, open]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInput(val);

      // Detect @mention
      const cursorPos = e.target.selectionStart || 0;
      const textBefore = val.slice(0, cursorPos);
      const atMatch = textBefore.match(/@(\w*)$/);

      if (atMatch) {
        setMentionQuery(atMatch[1]);
        setMentionStart(cursorPos - atMatch[0].length);
      } else {
        setMentionQuery(null);
      }
    },
    []
  );

  const handleMentionSelect = useCallback(
    (profile: ChatProfile) => {
      const name = profile.display_name || profile.email?.split("@")[0] || "user";
      const before = input.slice(0, mentionStart);
      const after = input.slice((inputRef.current?.selectionStart || mentionStart) + (mentionQuery?.length || 0));
      const mentionTag = `@[${name}](${profile.id}) `;
      setInput(before + mentionTag + after);
      setMentionQuery(null);
      setSelectedMentions((prev) => [...prev, profile.id]);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [input, mentionStart, mentionQuery]
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Extract mention IDs from content
    const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let m;
    while ((m = mentionRegex.exec(trimmed)) !== null) {
      mentions.push(m[1]);
    }

    await sendMessage(trimmed, mentions);
    setInput("");
    setSelectedMentions([]);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const unreadCount = 0; // Can be expanded later

  return (
    <>
      {/* Floating chat button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.08 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{
          background: "hsl(var(--primary))",
          boxShadow: "0 8px 32px hsl(var(--primary) / 0.4)",
        }}
      >
        {open ? (
          <X className="h-5 w-5 text-primary-foreground" />
        ) : (
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-48px)] flex flex-col bg-card border border-border shadow-2xl overflow-hidden"
            style={{
              borderRadius: "var(--ios-radius-2xl, 20px)",
              height: "min(520px, calc(100vh - 140px))",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px hsl(var(--border))",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/30">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--primary) / 0.15)" }}
              >
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Chat do Projeto</h3>
                <p className="text-[10px] text-muted-foreground">
                  {profiles.length} membros · Use @ para mencionar
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Carregando...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/50">
                  <MessageCircle className="h-8 w-8" />
                  <p className="text-xs font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-[10px]">Comece a conversa!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
                        style={{
                          background: isOwn
                            ? "hsl(var(--primary))"
                            : "hsl(var(--muted))",
                          color: isOwn
                            ? "hsl(var(--primary-foreground))"
                            : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {getInitials(msg.profile?.display_name, msg.profile?.email)}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[75%] min-w-0 ${isOwn ? "text-right" : ""}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-semibold text-foreground/70 ${isOwn ? "ml-auto" : ""}`}>
                            {msg.profile?.display_name || msg.profile?.email?.split("@")[0] || "Usuário"}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                        <div
                          className={`text-[13px] leading-relaxed px-3 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                              : "bg-secondary/60 text-foreground rounded-2xl rounded-tl-md"
                          }`}
                        >
                          {renderContent(msg.content, profiles)}
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 text-[10px] text-destructive/60 hover:text-destructive flex items-center gap-0.5 ml-auto"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> excluir
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-border p-3 relative">
              <AnimatePresence>
                {mentionQuery !== null && (
                  <MentionDropdown
                    query={mentionQuery}
                    profiles={profiles.filter((p) => p.id !== user?.id)}
                    onSelect={handleMentionSelect}
                    position={{ top: 8, left: 12 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma mensagem... (@para mencionar)"
                    rows={1}
                    className="w-full resize-none bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    style={{
                      borderRadius: "var(--ios-radius)",
                      maxHeight: 80,
                    }}
                  />
                  <button
                    onClick={() => {
                      setInput((prev) => prev + "@");
                      setMentionQuery("");
                      setMentionStart(input.length);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-2 bottom-2 text-muted-foreground/40 hover:text-primary transition-colors"
                    title="Mencionar alguém"
                  >
                    <AtSign className="h-4 w-4" />
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
                  style={{
                    background: input.trim()
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted))",
                  }}
                >
                  <Send className="h-4 w-4 text-primary-foreground" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
