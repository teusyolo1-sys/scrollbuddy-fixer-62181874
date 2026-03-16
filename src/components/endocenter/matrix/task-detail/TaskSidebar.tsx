import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle, Calendar, CheckSquare, Flag, Image, Link2,
  Paperclip, Plus, Tag, Timer, Trash2, X,
  Play, Pause, Square, ImagePlus, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ResponsibilityItem } from "@/store/endocenterStore";
import { SideSection, ComplaintCategoryPicker, COMPLAINT_CATEGORIES } from "./SidebarHelpers";
import { useTaskComplaints } from "@/hooks/useTaskComplaints";

const priorityOptions = [
  { value: "low" as const, label: "Baixa", color: "hsl(var(--muted-foreground))" },
  { value: "medium" as const, label: "Média", color: "#F59E0B" },
  { value: "high" as const, label: "Alta", color: "#DC2626" },
  { value: "urgent" as const, label: "Urgente", color: "#7C3AED" },
];

const labelColors = ["#DC2626", "#F59E0B", "#059669", "#1E6FD9", "#7C3AED", "#EC4899", "#0EA5E9", "#64748B"];

const createId = () => `id_${Math.random().toString(36).slice(2, 10)}`;

interface TaskSidebarProps {
  item: ResponsibilityItem;
  roleColor: string;
  roleName: string;
  teamMembers: string[];
  companyId?: string;
  editingDescription: boolean;
  editorRef: React.RefObject<any>;
  onUpdate: (updates: Partial<ResponsibilityItem>) => void;
  onDelete: () => void;
  onViewPdf: (url: string) => void;
}

export default function TaskSidebar({
  item, roleColor, roleName, teamMembers, companyId, editingDescription, editorRef, onUpdate, onDelete, onViewPdf,
}: TaskSidebarProps) {
  const { addComplaint } = useTaskComplaints(companyId);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [timerRunning, setTimerRunning] = useState(item.timerRunning);
  const [timerSeconds, setTimerSeconds] = useState(item.timerSeconds);
  const [complaintCategory, setComplaintCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

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

  return (
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
        <SideSection icon={Tag} label="Responsáveis" defaultOpen={item.assignees.length > 0}>
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
            <button onClick={() => {
              setTimerRunning(!timerRunning);
              onUpdate({ timerRunning: !timerRunning });
            }}
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
                      onClick={() => onViewPdf(att.url)}
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
                  onUpdate({ attachments: [...item.attachments, { id: createId(), name: file.name, url: reader.result as string, type: "link" }] });
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

        {/* Sinalizar Problema */}
        <SideSection icon={Flag} label="Sinalizar" defaultOpen={false}>
          <div className="space-y-2">
            <ComplaintCategoryPicker value={complaintCategory} onChange={setComplaintCategory} />
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
        </div>
      </div>
    </div>
  );
}
