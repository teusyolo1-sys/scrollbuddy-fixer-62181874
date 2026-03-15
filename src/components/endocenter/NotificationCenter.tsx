import { useState, useRef, useEffect } from "react";
import { Bell, Check, ArrowRightLeft, Plus, Trash2, Info, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore, type AppNotification } from "@/store/notificationStore";

const iconMap = {
  check: Check,
  move: ArrowRightLeft,
  add: Plus,
  delete: Trash2,
  info: Info,
};

const iconColorMap = {
  check: "text-emerald-500 bg-emerald-500/15",
  move: "text-blue-500 bg-blue-500/15",
  add: "text-primary bg-primary/15",
  delete: "text-destructive bg-destructive/15",
  info: "text-muted-foreground bg-secondary",
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

interface NotificationCenterProps {
  onNavigateToTask?: (roleId: string, tab: string, itemId: string) => void;
}

export default function NotificationCenter({ onNavigateToTask }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markAllRead, clearAll, unreadCount } = useNotificationStore();
  const count = unreadCount();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open && count > 0) markAllRead();
  };

  const handleClickNotification = (n: AppNotification) => {
    if (n.meta?.roleId && n.meta?.tab && n.meta?.itemId && onNavigateToTask) {
      onNavigateToTask(n.meta.roleId, n.meta.tab, n.meta.itemId);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <motion.button
        whileTap={{ scale: 0.82, rotate: -12 }}
        whileHover={{ scale: 1.15 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
        title="Notificações"
      >
        <motion.div
          whileHover={{ rotate: [0, 15, -15, 10, -10, 0] }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Bell className="h-4 w-4 text-white/80" />
        </motion.div>
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1"
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border border-border/60 overflow-hidden z-50"
            style={{
              background: "hsl(var(--card) / 0.85)",
              backdropFilter: "blur(24px) saturate(140%)",
              WebkitBackdropFilter: "blur(24px) saturate(140%)",
              boxShadow: "0 20px 60px -10px rgba(0,0,0,0.35)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <span className="text-sm font-semibold text-foreground">Notificações</span>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell className="h-8 w-8 text-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground/60">Nenhuma notificação</span>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      clickable={!!(n.meta?.itemId)}
                      onClick={() => handleClickNotification(n)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationRow({ notification: n, clickable, onClick }: {
  notification: AppNotification;
  clickable: boolean;
  onClick: () => void;
}) {
  const Icon = iconMap[n.icon];
  const colorClass = iconColorMap[n.icon];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={clickable ? { x: 2, backgroundColor: "hsl(var(--secondary) / 0.5)" } : undefined}
      onClick={clickable ? onClick : undefined}
      className={`flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-0 transition-colors ${
        !n.read ? "bg-primary/[0.04]" : ""
      } ${clickable ? "cursor-pointer" : ""}`}
    >
      <div className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.description}</p>
        {clickable && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium mt-1">
            Ver tarefa <ChevronRight className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">{timeAgo(n.timestamp)}</span>
    </motion.div>
  );
}
