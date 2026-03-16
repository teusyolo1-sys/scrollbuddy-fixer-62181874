import { useMemo } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TaskChat from "../TaskChat";
import type { ChatMessage } from "@/hooks/useChatMessages";

interface ChatFABProps {
  taskId: string;
  taskName: string;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  userId?: string;
  lastSeenCount: number;
}

export default function ChatFAB({
  taskId, taskName, chatOpen, setChatOpen, chatMessages, userId, lastSeenCount,
}: ChatFABProps) {
  const hasUnreadMention = useMemo(() => {
    if (!userId || chatOpen) return false;
    const newMessages = chatMessages.slice(lastSeenCount);
    return newMessages.some(
      (msg) => msg.user_id !== userId && msg.mentions?.includes(userId)
    );
  }, [chatMessages, userId, chatOpen, lastSeenCount]);

  const hasUnread = useMemo(() => {
    if (!userId || chatOpen) return false;
    const newMessages = chatMessages.slice(lastSeenCount);
    return newMessages.some((msg) => msg.user_id !== userId);
  }, [chatMessages, userId, chatOpen, lastSeenCount]);

  return (
    <div className="fixed bottom-6 right-6 z-[105] flex flex-col items-end gap-3" onClick={(e) => e.stopPropagation()}>
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              width: 340,
              height: "50vh",
              maxHeight: "60vh",
              background: "hsl(var(--card))",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              border: "1px solid hsl(var(--border) / 0.3)",
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground flex-1">Chat — {taskName}</span>
              <button onClick={() => setChatOpen(false)} className="w-6 h-6 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-3">
              <TaskChat taskId={taskId} taskName={taskName} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setChatOpen(!chatOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={hasUnreadMention ? {
          rotate: [0, -8, 8, -8, 8, 0],
          transition: { repeat: Infinity, repeatDelay: 2, duration: 0.5 },
        } : { rotate: 0 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors relative ${
          chatOpen ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border/50"
        }`}
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
      >
        <MessageCircle className="h-6 w-6" />
        {(hasUnreadMention || hasUnread) && !chatOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
            {hasUnreadMention ? "!" : "●"}
          </span>
        )}
      </motion.button>
    </div>
  );
}