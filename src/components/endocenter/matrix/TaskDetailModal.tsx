import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  AlertTriangle, Calendar, CheckSquare, Clock, Flag, Image, Link2, MessageCircle, Paperclip, 
  Plus, Tag, Timer, Trash2, X, Play, Pause, Square, Type, Users, Upload,
  ChevronDown, ChevronRight, Settings2, Pencil, ImagePlus, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { ResponsibilityItem, TaskLabel, TaskChecklist, TaskAttachment } from "@/store/endocenterStore";
import BlockEditor, { type BlockEditorHandle } from "./BlockEditor";
import PdfViewer from "./PdfViewer";
import TaskChat from "./TaskChat";
import { useTaskComplaints } from "@/hooks/useTaskComplaints";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuth } from "@/hooks/useAuth";

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

const COMPLAINT_CATEGORIES = ["Qualidade", "Atraso", "Refação", "Comunicação"];

const createId = () => `id_${Math.random().toString(36).slice(2, 10)}`;

function SideSection({
  icon: Icon,
  label,
  children,
  defaultOpen = false,
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-semibold text-foreground/80 hover:text-foreground hover:bg-secondary/40 transition-colors"
        style={{ borderRadius: "var(--ios-radius-sm)" }}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: open ? "500px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-4 pb-3 pt-1 space-y-2.5">{children}</div>
      </div>
    </div>
  );
}

export default function TaskDetailModal({ item, roleColor, roleName, teamMembers, onUpdate, onDelete, onClose }: Props) {
  const { user } = useAuth();
  const { addComplaint } = useTaskComplaints();
  const { messages: chatMessages } = useChatMessages(item.id);
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<BlockEditorHandle>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const timerSaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(timerSaveRef.current);
    timerSaveRef.current = setTimeout(() => {
      onUpdate({ timerSeconds, timerRunning });
    }, 1000);
    return () => clearTimeout(timerSaveRef.current);
  }, [timerSeconds, timerRunning]);

  // Debounced description save
  const descSaveRef = useRef<ReturnType<typeof setTimeout>>();
  const handleDescriptionChange = useCallback((html: string) => {
    setDescription(html);
    clearTimeout(descSaveRef.current);
    descSaveRef.current = setTimeout(() => {
      onUpdate({ description: html });
    }, 500);
  }, [onUpdate]);

  useEffect(() => {
    return () => clearTimeout(descSaveRef.current);
  }, []);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleAddChecklist = () => {
    if (!newCheckItem.trim()) return;
    onUpdate({ checklist: [...item.checklist, { id: createId(), text: newCheckItem.trim(), done: false }] });
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
    if (!item.assignees.includes(name)) onUpdate({ assignees: [...item.assignees, name] });
    setShowMentionPicker(false);
  };

  const handleRemoveAssignee = (name: string) => {
    onUpdate({ assignees: item.assignees.filter((a) => a !== name) });
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    onUpdate({ attachments: [...item.attachments, { id: createId(), name: linkUrl, url: linkUrl, type: "link" }] });
    setLinkUrl("");
    setShowLinkForm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ attachments: [...item.attachments, { id: createId(), name: file.name, url: reader.result as string, type: "image" }] });
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

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 ios-modal-overlay"
        onClick={onClose}
      >
        {/* Main modal + chat balloon wrapper */}
        <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="rounded-3xl ios-modal-surface overflow-hidden flex flex-col transition-[max-width,height] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ 
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            maxWidth: editingDescription ? "80rem" : "28rem",
            height: editingDescription ? "85vh" : "75vh",
            width: "100%",
          }}
        >
          {/* Cover */}
          {item.cover && (
            <div className="relative h-32 overflow-hidden group shrink-0">
              <img src={item.cover} alt="" className="w-full h-full object-cover" />
              <motion.button onClick={() => onUpdate({ cover: "" })} whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 14 }} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          )}

          {/* Header bar — only when editing */}
          {editingDescription && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: roleColor }}>
                  {roleName}
                </span>
                {item.critical && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0">Crítico</span>
                )}
                {item.labels.map((l) => (
                  <span key={l.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: l.color }}>
                    {l.name}
                  </span>
                ))}
                <div className="w-px h-4 bg-border/50 mx-1 shrink-0" />
                {editingTitle ? (
                  <div className="flex-1 min-w-0 relative flex items-center border border-primary/30 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all duration-200"
                    style={{ borderRadius: "var(--ios-radius-sm)", backgroundColor: "hsl(var(--secondary) / 0.5)" }}>
                    <div className="w-1 h-6 rounded-full bg-primary shrink-0 ml-3" />
                    <input
                      ref={titleRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => { onUpdate({ task: title }); setEditingTitle(false); }}
                      onKeyDown={(e) => e.key === "Enter" && (onUpdate({ task: title }), setEditingTitle(false))}
                      className="text-base font-bold text-foreground bg-transparent outline-none flex-1 min-w-0 px-2.5 py-2"
                    />
                  </div>
                ) : (
                  <div onClick={() => setEditingTitle(true)} 
                    className="group/title relative flex-1 min-w-0 flex items-center gap-2 py-2 px-2 cursor-text rounded-xl hover:bg-secondary/40 transition-all duration-200">
                    <h2 className="text-base font-bold text-foreground truncate flex-1 min-w-0 group-hover/title:text-primary transition-colors">
                      {item.task}
                    </h2>
                    {/* Lápis com efeito diafragma */}
                    <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 scale-0 group-hover/title:opacity-100 group-hover/title:scale-100 transition-all duration-300 bg-primary/10">
                      <Pencil className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.12, rotate: 30 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${sidebarOpen ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                  title="Propriedades">
                  <Settings2 className="h-4 w-4" />
                </motion.button>
                <motion.button onClick={() => setEditingDescription(false)}
                  whileHover={{ scale: 1.12, y: 2 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Minimizar">
                  <ChevronDown className="h-4 w-4" />
                </motion.button>
                <motion.button onClick={onClose}
                  whileHover={{ scale: 1.12, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Title bar for compact 9:16 mode */}
          {!editingDescription && (
            <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: roleColor }}>
                  {roleName}
                </span>
                <h2 className="text-sm font-bold text-foreground truncate">{item.task}</h2>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button onClick={() => setChatOpen(!chatOpen)}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${chatOpen ? "bg-primary/15 text-primary" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}
                  title="Chat">
                  <MessageCircle className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button onClick={onClose}
                  whileHover={{ scale: 1.12, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className="w-7 h-7 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Main content area: Editor (75%) + Sidebar (25%) */}
          <div className="relative flex flex-1 min-h-0 overflow-hidden">
            {/* Editor / Read-only view — 75% */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              {editingDescription ? (
                <div className="flex flex-col h-full">
                  <BlockEditor
                    ref={editorRef}
                    value={description}
                    onChange={handleDescriptionChange}
                    minHeight="100%"
                    placeholder="Digite '/' para comandos · Comece a escrever..."
                  />
                </div>
              ) : (
                <div 
                  className="flex-1 overflow-y-auto cursor-pointer group relative"
                  onClick={() => setEditingDescription(true)}
                >
                  <div className="p-5 h-full">
                    {description && description !== "<br>" && description.replace(/<[^>]*>/g, "").trim() ? (
                      <div className="text-sm text-foreground prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_pre]:bg-secondary [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-2 [&_hr]:border-border/50 [&_hr]:my-3"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/40">
                        <Type className="h-10 w-10" />
                        <p className="text-sm font-medium text-center">Clique para editar</p>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-100 scale-90 pointer-events-none">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/80 px-3 py-2"
                      style={{
                        borderRadius: "var(--ios-radius)",
                        background: "hsla(var(--card), 0.75)",
                        backdropFilter: "blur(20px) saturate(1.8)",
                        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                        border: "0.5px solid hsla(var(--border), 0.4)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                      }}>
                      <Pencil className="h-3.5 w-3.5 text-primary" /> Editar
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 text-[9px] font-mono text-muted-foreground/30 bg-secondary/50 px-1.5 py-0.5 group-hover:top-12 transition-all duration-200" style={{ borderRadius: "6px" }}>
                    9:16
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — iOS 26 floating balloon panel */}
            {sidebarOpen && (
            <div
              className="absolute right-3 top-14 bottom-3 z-20 transition-all duration-300 ease-out overflow-hidden"
              style={{
                width: 300,
              }}
            >
              <div
                className="h-full overflow-hidden"
                style={{
                  width: 300,
                  background: "var(--ios-glass)",
                  backdropFilter: "blur(var(--ios-blur-heavy))",
                  WebkitBackdropFilter: "blur(var(--ios-blur-heavy))",
                  borderRadius: "var(--ios-radius)",
                  boxShadow: "var(--ios-shadow-lg)",
                  border: "1px solid hsl(var(--border) / 0.25)",
                  clipPath: "inset(0 round var(--ios-radius))",
                }}
              >
                <div className="h-full overflow-y-auto overflow-x-hidden">
                  <div className="py-2 [&>*:last-child]:overflow-hidden">
                    {/* Priority */}
                    <SideSection icon={AlertTriangle} label="Prioridade" defaultOpen={!!item.priority}>
                      <div className="flex gap-2">
                        {priorityOptions.map((p) => {
                          const isActive = item.priority === p.value;
                          return (
                            <button key={p.value} onClick={() => onUpdate({ priority: p.value })}
                              className="text-[11px] font-semibold px-3.5 py-2 transition-all flex-1"
                              style={{
                                borderRadius: "var(--ios-radius-sm)",
                                backgroundColor: isActive ? `${p.color}18` : "hsl(var(--secondary) / 0.5)",
                                color: isActive ? p.color : "hsl(var(--muted-foreground))",
                                boxShadow: isActive ? `0 0 0 1.5px ${p.color}50, var(--ios-shadow-subtle)` : "none",
                              }}>
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </SideSection>

                    {/* Due Date */}
                    <SideSection icon={Calendar} label="Data de entrega" defaultOpen={!!item.dueDate}>
                      <input type="date" value={item.dueDate} onChange={(e) => onUpdate({ dueDate: e.target.value })} className="ios-input px-3 py-1.5 text-xs w-full" />
                    </SideSection>

                    {/* Assignees */}
                    <SideSection icon={Users} label="Responsáveis" defaultOpen={item.assignees.length > 0}>
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
                        <div className="p-1 rounded-xl bg-card border border-border/50 space-y-0.5 max-h-28 overflow-y-auto">
                          {teamMembers.filter((m) => !item.assignees.includes(m)).map((name) => (
                            <button key={name} onClick={() => handleAddAssignee(name)} className="block w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors text-foreground">
                              @{name}
                            </button>
                          ))}
                        </div>
                      )}
                    </SideSection>

                    {/* Labels */}
                    <SideSection icon={Tag} label="Etiquetas" defaultOpen={item.labels.length > 0}>
                      <div className="flex flex-wrap gap-1">
                        {item.labels.map((l) => (
                          <span key={l.id} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full text-white cursor-pointer hover:opacity-80" style={{ backgroundColor: l.color }} onClick={() => handleRemoveLabel(l.id)}>
                            {l.name} ×
                          </span>
                        ))}
                      </div>
                      {!showLabelForm ? (
                        <button onClick={() => setShowLabelForm(true)} className="text-[10px] font-medium text-primary">+ Nova etiqueta</button>
                      ) : (
                        <div className="space-y-2">
                          <input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="Nome" className="ios-input w-full px-2 py-1 text-xs" onKeyDown={(e) => e.key === "Enter" && handleAddLabel()} />
                          <div className="flex gap-1">
                            {labelColors.map((c) => (
                              <button key={c} onClick={() => setNewLabelColor(c)} className="w-5 h-5 rounded-full transition-transform" style={{ backgroundColor: c, transform: newLabelColor === c ? "scale(1.3)" : "scale(1)" }} />
                            ))}
                          </div>
                          <button onClick={handleAddLabel} className="text-[10px] font-medium text-primary">Adicionar</button>
                        </div>
                      )}
                    </SideSection>

                    {/* Timer */}
                    <SideSection icon={Timer} label="Temporizador" defaultOpen={item.timerSeconds > 0 || item.timerRunning}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-foreground tabular-nums">{formatTimer(timerSeconds)}</span>
                        <button onClick={() => setTimerRunning(!timerRunning)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ backgroundColor: timerRunning ? "rgba(220,38,38,0.1)" : "rgba(5,150,105,0.1)", color: timerRunning ? "#DC2626" : "#059669" }}>
                          {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </button>
                        <button onClick={() => { setTimerRunning(false); setTimerSeconds(0); onUpdate({ timerSeconds: 0, timerRunning: false }); }}
                          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                          <Square className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </SideSection>

                    {/* Checklist */}
                    <SideSection icon={CheckSquare} label={`Checklist${checkTotal > 0 ? ` (${checkPct}%)` : ""}`} defaultOpen={checkTotal > 0}>
                      {checkTotal > 0 && (
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: roleColor }} animate={{ width: `${checkPct}%` }} transition={{ type: "spring", damping: 20 }} />
                        </div>
                      )}
                      <div className="space-y-1">
                        {item.checklist.map((ci) => (
                          <div key={ci.id} className="flex items-center gap-2 group">
                            <button onClick={() => handleToggleCheckItem(ci.id)}
                              className="w-3.5 h-3.5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors"
                              style={{ borderColor: ci.done ? roleColor : "hsl(var(--border))", backgroundColor: ci.done ? roleColor : "transparent" }}>
                              {ci.done && <svg width="7" height="5" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </button>
                            <span className={`text-[11px] flex-1 ${ci.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{ci.text}</span>
                            <button onClick={() => handleRemoveCheckItem(ci.id)} className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive">
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} placeholder="Novo item..." className="ios-input flex-1 px-2 py-1 text-[11px]" onKeyDown={(e) => e.key === "Enter" && handleAddChecklist()} />
                        <button onClick={handleAddChecklist} className="text-xs font-medium text-primary px-1">+</button>
                      </div>
                    </SideSection>

                    {/* Attachments */}
                    <SideSection icon={Paperclip} label={`Anexos${item.attachments.length > 0 ? ` (${item.attachments.length})` : ""}`} defaultOpen={item.attachments.length > 0}>
                      {item.attachments.length > 0 && (
                        <div className="space-y-1.5">
                          {item.attachments.map((att) => {
                            const isPdf = att.name?.toLowerCase().endsWith(".pdf") || att.url?.toLowerCase().endsWith(".pdf");
                            return (
                            <div key={att.id} className="relative group rounded-lg border border-border/60 overflow-hidden">
                              {att.type === "image" ? (
                                <img src={att.url} alt={att.name} className="w-full h-16 object-cover" />
                              ) : isPdf ? (
                                <button
                                  onClick={() => setViewingPdf(att.url)}
                                  className="flex items-center gap-2 p-2 text-[10px] text-primary hover:bg-primary/5 w-full transition-colors"
                                >
                                  <FileText className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate font-medium">{att.name}</span>
                                  <span className="text-[9px] text-muted-foreground ml-auto shrink-0">Preview</span>
                                </button>
                              ) : (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 text-[10px] text-primary hover:underline">
                                  <Link2 className="h-3 w-3 shrink-0" /><span className="truncate">{att.name}</span>
                                </a>
                              )}
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {att.type === "image" && editingDescription && (
                                  <button
                                    onClick={() => editorRef.current?.insertImageUrl(att.url)}
                                    className="w-5 h-5 rounded-full bg-primary/80 text-white flex items-center justify-center hover:bg-primary transition-colors"
                                    title="Inserir no texto"
                                  >
                                    <ImagePlus className="h-2.5 w-2.5" />
                                  </button>
                                )}
                                <button onClick={() => handleRemoveAttachment(att.id)} className="w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-destructive transition-colors">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        <label className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                          <Image className="h-3 w-3" /> Imagem
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <label className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                          <Image className="h-3 w-3" /> Capa
                          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                        </label>
                        <label className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                          <FileText className="h-3 w-3" /> PDF
                          <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              onUpdate({ attachments: [...item.attachments, { id: `id_${Math.random().toString(36).slice(2, 10)}`, name: file.name, url: reader.result as string, type: "link" }] });
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                        <button onClick={() => setShowLinkForm(!showLinkForm)} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Link2 className="h-3 w-3" /> Link
                        </button>
                      </div>
                      {showLinkForm && (
                        <div className="flex gap-1">
                          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="ios-input flex-1 px-2 py-1 text-[11px]" onKeyDown={(e) => e.key === "Enter" && handleAddLink()} />
                          <button onClick={handleAddLink} className="text-xs font-medium text-primary px-1">+</button>
                        </div>
                      )}
                    </SideSection>


                    {/* Sinalizar Problema — discreto */}
                    <SideSection icon={Flag} label="Sinalizar" defaultOpen={false}>
                      <div className="space-y-2">
                        <select
                          value={complaintCategory}
                          onChange={(e) => setComplaintCategory(e.target.value)}
                          className="ios-input w-full px-2 py-1.5 text-[11px]"
                        >
                          {COMPLAINT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <textarea
                          value={complaintDesc}
                          onChange={(e) => setComplaintDesc(e.target.value)}
                          placeholder="Descreva o problema..."
                          className="ios-input w-full px-2 py-1.5 text-[11px] resize-none"
                          rows={2}
                        />
                        <button
                          disabled={submittingComplaint || !complaintDesc.trim()}
                          onClick={async () => {
                            if (!complaintDesc.trim()) return;
                            setSubmittingComplaint(true);
                            try {
                              const assignedTo = item.assignees.join(", ") || roleName;
                              await addComplaint(item.id, item.task, assignedTo, roleName, complaintCategory, complaintDesc.trim());
                              toast.success("Sinalização enviada");
                              setComplaintDesc("");
                              setShowComplaintForm(false);
                            } catch (e: any) {
                              toast.error("Erro ao sinalizar: " + (e?.message || ""));
                            } finally {
                              setSubmittingComplaint(false);
                            }
                          }}
                          className="w-full text-[11px] font-medium px-3 py-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ borderRadius: "var(--ios-radius-sm)" }}
                        >
                          <Flag className="h-3 w-3" /> {submittingComplaint ? "Enviando..." : "Enviar sinalização"}
                        </button>
                      </div>
                    </SideSection>

                    {/* Footer actions */}
                    <div className="px-4 py-4 mt-2 space-y-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => onUpdate({ critical: !item.critical })}
                          className={`text-[11px] font-semibold px-3 py-2 transition-colors flex-1 ${item.critical ? "bg-destructive/10 text-destructive" : "bg-secondary/60 text-muted-foreground"}`}
                          style={{ borderRadius: "var(--ios-radius-sm)" }}>
                          {item.critical ? "✦ Crítico" : "Normal"}
                        </button>
                        <button onClick={() => onUpdate({ done: !item.done })}
                          className={`text-[11px] font-semibold px-3 py-2 transition-colors flex-1 ${item.done ? "text-white" : "bg-secondary/60 text-muted-foreground"}`}
                          style={{ borderRadius: "var(--ios-radius-sm)", ...(item.done ? { backgroundColor: roleColor } : {}) }}>
                          {item.done ? "✓ Concluído" : "Concluir"}
                        </button>
                      </div>
                      <button onClick={onDelete} 
                        className="w-full text-[11px] font-medium px-3 py-2 bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors flex items-center justify-center gap-1.5"
                        style={{ borderRadius: "var(--ios-radius-sm)" }}>
                        <Trash2 className="h-3.5 w-3.5" /> Excluir tarefa
                      </button>
                    </div>{/* footer */}
                  </div>{/* py-2 */}
                </div>{/* scroll content */}
              </div>{/* glass inner */}
            </div>
            )}
              </div>{/* flex */}
        </motion.div>

        </div>{/* wrapper div */}

        {/* PDF Viewer overlay */}
        <AnimatePresence>
          {viewingPdf && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6"
              onClick={() => setViewingPdf(null)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-3xl h-[80vh] rounded-2xl overflow-hidden"
                style={{ boxShadow: "var(--ios-shadow-float)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <PdfViewer url={viewingPdf} onClose={() => setViewingPdf(null)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
