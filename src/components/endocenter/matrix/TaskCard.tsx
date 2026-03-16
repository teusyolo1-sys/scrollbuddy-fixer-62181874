import { useState, useRef } from "react";
import { Calendar, CheckSquare, Clock, Image, Link2, Paperclip, Tag, Timer, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { ResponsibilityItem, TaskLabel } from "@/store/endocenterStore";

const priorityConfig = {
  low: { label: "Baixa", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--secondary))" },
  medium: { label: "Média", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  high: { label: "Alta", color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  urgent: { label: "Urgente", color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
};

interface TaskCardProps {
  item: ResponsibilityItem;
  roleColor: string;
  onClick: () => void;
  onToggleDone: () => void;
}

export default function TaskCard({ item, roleColor, onClick, onToggleDone }: TaskCardProps) {
  const checklistDone = item.checklist.filter((c) => c.done).length;
  const checklistTotal = item.checklist.length;
  const hasDueDate = !!item.dueDate;
  const isOverdue = hasDueDate && new Date(item.dueDate) < new Date() && !item.done;
  const prio = priorityConfig[item.priority];

  // Auto-critical: overdue or ≤2 days remaining
  const isAutoCritical = (() => {
    if (item.done || !hasDueDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  })();
  const isCritical = item.critical || isAutoCritical;

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? `${m}m` : ""}`;
    return `${m}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-border/60 bg-card hover:border-border transition-[border-color] overflow-hidden"
      style={{ boxShadow: "var(--ios-shadow-subtle)", willChange: "transform, opacity" }}
    >
      {/* Cover image */}
      {item.cover && (
        <div className="h-32 w-full overflow-hidden">
          <img src={item.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-3.5 space-y-2.5">
        {/* Labels */}
        {item.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.labels.map((label) => (
              <span
                key={label.id}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Title + done checkbox */}
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
            className="mt-0.5 shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: item.done ? roleColor : "hsl(var(--border))",
              backgroundColor: item.done ? roleColor : "transparent",
            }}
          >
            {item.done && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          <p className={`text-sm font-medium leading-snug flex-1 ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {item.task}
          </p>
        </div>

        {/* Description preview */}
        {item.description && !item.done && (() => {
          const text = item.description.replace(/<[^>]*>/g, "").trim();
          return text ? <p className="text-xs text-muted-foreground line-clamp-2 pl-7">{text}</p> : null;
        })()}

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap pl-7">
          {/* Priority */}
          {item.priority !== "low" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ color: prio.color, background: prio.bg }}>
              <AlertTriangle className="h-2.5 w-2.5" />
              {prio.label}
            </span>
          )}

          {/* Due date */}
          {hasDueDate && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
              isOverdue ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
            }`}>
              <Calendar className="h-2.5 w-2.5" />
              {new Date(item.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          )}

          {/* Timer */}
          {item.timerSeconds > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
              <Timer className="h-2.5 w-2.5" />
              {formatTimer(item.timerSeconds)}
            </span>
          )}

          {/* Checklist progress */}
          {checklistTotal > 0 && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
              checklistDone === checklistTotal ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"
            }`}>
              <CheckSquare className="h-2.5 w-2.5" />
              {checklistDone}/{checklistTotal}
            </span>
          )}

          {/* Attachments count */}
          {item.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
              <Paperclip className="h-2.5 w-2.5" />
              {item.attachments.length}
            </span>
          )}

          {/* Assignees */}
          {item.assignees.length > 0 && (
            <div className="ml-auto flex -space-x-1.5">
              {item.assignees.slice(0, 3).map((name, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-primary/15 border-2 border-card flex items-center justify-center text-[8px] font-bold text-primary"
                  title={name}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              ))}
              {item.assignees.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                  +{item.assignees.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Critical badge */}
          {isCritical && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isAutoCritical && !item.critical ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive"}`}>
              {isOverdue ? "⚠ Atrasada" : isAutoCritical && !item.critical ? "⏰ Urgente" : "✦ Crítico"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
