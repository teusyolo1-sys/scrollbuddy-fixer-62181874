import { useState, useEffect, useRef, useCallback } from "react";
import { 
  AlertTriangle, Calendar, CheckSquare, Clock, Image, Link2, Paperclip, 
  Plus, Tag, Timer, Trash2, X, Play, Pause, Square, Type, Users, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResponsibilityItem, TaskLabel, TaskChecklist, TaskAttachment } from "@/store/endocenterStore";

const priorityOptions = [
  { value: "low" as const, label: "Baixa", color: "hsl(var(--muted-foreground))" },
  { value: "medium" as const, label: "Média", color: "#F59E0B" },
  { value: "high" as const, label: "Alta", color: "#DC2626" },
  { value: "urgent" as const, label: "Urgente", color: "#7C3AED" },
];

const labelColors = ["#DC2626", "#F59E0B", "#059669", "#1E6FD9", "#7C3AED", "#EC4899", "#0EA5E9", "#64748B"];

interface Props {
  item: ResponsibilityItem;
  roleColor: string;
  roleName: string;
  teamMembers: string[];
  onUpdate: (updates: Partial<ResponsibilityItem>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const createId = () => `id_${Math.random().toString(36).slice(2, 10)}`;

export default function TaskDetailModal({ item, roleColor, roleName, teamMembers, onUpdate, onDelete, onClose }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(item.task);
  const [description, setDescription] = useState(item.description);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [timerRunning, setTimerRunning] = useState(item.timerRunning);
  const [timerSeconds, setTimerSeconds] = useState(item.timerSeconds);
  const titleRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    onUpdate({ timerSeconds, timerRunning });
  }, [timerSeconds, timerRunning]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleAddChecklist = () => {
    if (!newCheckItem.trim()) return;
    const updated = [...item.checklist, { id: createId(), text: newCheckItem.trim(), done: false }];
    onUpdate({ checklist: updated });
    setNewCheckItem("");
  };

  const handleToggleCheckItem = (id: string) => {
    onUpdate({ checklist: item.checklist.map((c) => c.id === id ? { ...c, done: !c.done } : c) });
  };

  const handleRemoveCheckItem = (id: string) => {
    onUpdate({ checklist: item.checklist.filter((c) => c.id !== id) });
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    onUpdate({ labels: [...item.labels, { id: createId(), name: newLabelName.trim(), color: newLabelColor }] });
    setNewLabelName("");
    setShowLabelForm(false);
  };

  const handleRemoveLabel = (id: string) => {
    onUpdate({ labels: item.labels.filter((l) => l.id !== id) });
  };

  const handleAddAssignee = (name: string) => {
    if (!item.assignees.includes(name)) {
      onUpdate({ assignees: [...item.assignees, name] });
    }
    setShowMentionPicker(false);
  };

  const handleRemoveAssignee = (name: string) => {
    onUpdate({ assignees: item.assignees.filter((a) => a !== name) });
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const att: TaskAttachment = { id: createId(), name: linkUrl, url: linkUrl, type: "link" };
    onUpdate({ attachments: [...item.attachments, att] });
    setLinkUrl("");
    setShowLinkForm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const att: TaskAttachment = { id: createId(), name: file.name, url, type: "image" };
      onUpdate({ attachments: [...item.attachments, att] });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate({ cover: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (id: string) => {
    onUpdate({ attachments: item.attachments.filter((a) => a.id !== id) });
  };

  const checkDone = item.checklist.filter((c) => c.done).length;
  const checkTotal = item.checklist.length;
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-12 pb-8 px-4 overflow-y-auto"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-3xl bg-card border border-border/50 overflow-hidden"
          style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}
        >
          {/* Cover */}
          {item.cover && (
            <div className="relative h-40 overflow-hidden group">
              <img src={item.cover} alt="" className="w-full h-full object-cover" />
              <button onClick={() => onUpdate({ cover: "" })} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: roleColor }}>
                    {roleName}
                  </span>
                  {item.critical && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Crítico</span>
                  )}
                </div>
                {editingTitle ? (
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => { onUpdate({ task: title }); setEditingTitle(false); }}
                    onKeyDown={(e) => e.key === "Enter" && (onUpdate({ task: title }), setEditingTitle(false))}
                    className="text-lg font-bold text-foreground bg-transparent border-b-2 border-primary outline-none w-full"
                  />
                ) : (
                  <h2 onClick={() => setEditingTitle(true)} className="text-lg font-bold text-foreground cursor-text hover:text-primary transition-colors">
                    {item.task}
                  </h2>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick actions bar */}
            <div className="flex flex-wrap gap-1.5">
              {/* Labels */}
              {item.labels.map((l) => (
                <span key={l.id} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full text-white cursor-pointer hover:opacity-80" style={{ backgroundColor: l.color }} onClick={() => handleRemoveLabel(l.id)}>
                  {l.name} ×
                </span>
              ))}
              <button onClick={() => setShowLabelForm(!showLabelForm)} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Tag className="h-3 w-3" /> Etiqueta
              </button>
            </div>

            {/* Label form */}
            {showLabelForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="p-3 rounded-xl bg-secondary/50 space-y-2">
                <input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="Nome da etiqueta" className="ios-input w-full px-3 py-2 text-xs" onKeyDown={(e) => e.key === "Enter" && handleAddLabel()} />
                <div className="flex gap-1.5">
                  {labelColors.map((c) => (
                    <button key={c} onClick={() => setNewLabelColor(c)} className="w-6 h-6 rounded-full transition-transform" style={{ backgroundColor: c, transform: newLabelColor === c ? "scale(1.3)" : "scale(1)", border: newLabelColor === c ? "2px solid white" : "none" }} />
                  ))}
                </div>
                <button onClick={handleAddLabel} className="text-xs font-medium text-primary">+ Adicionar</button>
              </motion.div>
            )}

            {/* Sidebar-style fields in grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Prioridade</label>
                <div className="flex gap-1">
                  {priorityOptions.map((p) => (
                    <button key={p.value} onClick={() => onUpdate({ priority: p.value })}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                      style={{
                        backgroundColor: item.priority === p.value ? `${p.color}20` : "hsl(var(--secondary))",
                        color: item.priority === p.value ? p.color : "hsl(var(--muted-foreground))",
                        border: item.priority === p.value ? `1px solid ${p.color}40` : "1px solid transparent",
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Data de entrega</label>
                <input type="date" value={item.dueDate} onChange={(e) => onUpdate({ dueDate: e.target.value })} className="ios-input px-3 py-1.5 text-xs w-full" />
              </div>
            </div>

            {/* Assignees / Mentions */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Responsáveis</label>
              <div className="flex flex-wrap gap-1.5">
                {item.assignees.map((name) => (
                  <span key={name} onClick={() => handleRemoveAssignee(name)} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-primary/20">
                    @{name} ×
                  </span>
                ))}
                <button onClick={() => setShowMentionPicker(!showMentionPicker)} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                  <Plus className="h-3 w-3" /> Mencionar
                </button>
              </div>
              {showMentionPicker && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-2 rounded-xl bg-secondary/50 space-y-1 max-h-32 overflow-y-auto">
                  {teamMembers.filter((m) => !item.assignees.includes(m)).map((name) => (
                    <button key={name} onClick={() => handleAddAssignee(name)} className="block w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-card transition-colors text-foreground">
                      @{name}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Timer */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> Temporizador</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-foreground tabular-nums">{formatTimer(timerSeconds)}</span>
                <button onClick={() => setTimerRunning(!timerRunning)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: timerRunning ? "rgba(220,38,38,0.1)" : "rgba(5,150,105,0.1)", color: timerRunning ? "#DC2626" : "#059669" }}>
                  {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { setTimerRunning(false); setTimerSeconds(0); onUpdate({ timerSeconds: 0, timerRunning: false }); }}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Square className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Description / Rich text area */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><Type className="h-3 w-3" /> Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => onUpdate({ description })}
                placeholder="Adicione uma descrição detalhada..."
                className="ios-input w-full px-3 py-2.5 text-sm min-h-[80px] resize-y"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><CheckSquare className="h-3 w-3" /> Checklist</label>
                {checkTotal > 0 && <span className="text-[10px] font-semibold text-muted-foreground">{checkPct}%</span>}
              </div>
              {checkTotal > 0 && (
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: roleColor }} animate={{ width: `${checkPct}%` }} transition={{ type: "spring", damping: 20 }} />
                </div>
              )}
              <div className="space-y-1">
                {item.checklist.map((ci) => (
                  <div key={ci.id} className="flex items-center gap-2 group">
                    <button onClick={() => handleToggleCheckItem(ci.id)}
                      className="w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{ borderColor: ci.done ? roleColor : "hsl(var(--border))", backgroundColor: ci.done ? roleColor : "transparent" }}>
                      {ci.done && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span className={`text-xs flex-1 ${ci.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{ci.text}</span>
                    <button onClick={() => handleRemoveCheckItem(ci.id)} className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive transition-opacity">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} placeholder="Adicionar item..." className="ios-input flex-1 px-3 py-1.5 text-xs" onKeyDown={(e) => e.key === "Enter" && handleAddChecklist()} />
                <button onClick={handleAddChecklist} className="text-xs font-medium text-primary px-2">+</button>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><Paperclip className="h-3 w-3" /> Anexos</label>
              
              {item.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {item.attachments.map((att) => (
                    <div key={att.id} className="relative group rounded-xl border border-border/60 overflow-hidden">
                      {att.type === "image" ? (
                        <img src={att.url} alt={att.name} className="w-full h-20 object-cover" />
                      ) : (
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 text-xs text-primary hover:underline">
                          <Link2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </a>
                      )}
                      <button onClick={() => handleRemoveAttachment(att.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-1.5">
                <label className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <Image className="h-3 w-3" /> Imagem
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <label className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <Image className="h-3 w-3" /> Capa
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
                <button onClick={() => setShowLinkForm(!showLinkForm)} className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Link2 className="h-3 w-3" /> Link
                </button>
              </div>

              {showLinkForm && (
                <div className="flex gap-1.5">
                  <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="ios-input flex-1 px-3 py-1.5 text-xs" onKeyDown={(e) => e.key === "Enter" && handleAddLink()} />
                  <button onClick={handleAddLink} className="text-xs font-medium text-primary px-2">+</button>
                </div>
              )}
            </div>

            {/* Critical toggle + Done toggle + Delete */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdate({ critical: !item.critical })}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors ${item.critical ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                  {item.critical ? "✦ Crítico" : "Normal"}
                </button>
                <button onClick={() => onUpdate({ done: !item.done })}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors ${item.done ? "text-white" : "bg-secondary text-muted-foreground"}`}
                  style={item.done ? { backgroundColor: roleColor } : {}}>
                  {item.done ? "✓ Concluído" : "Marcar concluído"}
                </button>
              </div>
              <button onClick={onDelete} className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Excluir
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
