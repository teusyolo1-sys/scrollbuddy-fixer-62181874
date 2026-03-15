import { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, Edit3, Eye, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, type WorkflowStep } from "@/store/endocenterStore";
import { useNotificationStore } from "@/store/notificationStore";

const splitLines = (value: string) =>
  value.split("\n").map((l) => l.trim()).filter(Boolean);

type EditingSection = { stepId: string; section: "inputs" | "outputs" | "rules" } | null;

export default function WorkflowDiagram() {
  const { workflowSteps, updateWorkflowStep, addWorkflowStep, removeWorkflowStep } = useEndocenter();
  const [editMode, setEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [detailStep, setDetailStep] = useState<WorkflowStep | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; stepId: string } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const close = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [ctxMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, stepId: string) => {
    e.preventDefault();
    const menuW = 180, menuH = 120;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
    setCtxMenu({ x: Math.max(8, x), y: Math.max(8, y), stepId });
  }, []);

  const toggleTask = (stepId: string, taskId: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    if (!step) return;
    const tasks = (step.tasks || []).map((t) => t.id === taskId ? { ...t, done: !t.done } : t);
    updateWorkflowStep(stepId, { tasks });
  };

  const addTask = (stepId: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    if (!step) return;
    const newTask = { id: `ft_${Math.random().toString(36).slice(2, 8)}`, name: "Nova tarefa", done: false };
    updateWorkflowStep(stepId, { tasks: [...(step.tasks || []), newTask] });
  };

  const removeTask = (stepId: string, taskId: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    if (!step) return;
    updateWorkflowStep(stepId, { tasks: (step.tasks || []).filter((t) => t.id !== taskId) });
  };

  const currentDetail = detailStep ? workflowSteps.find((s) => s.id === detailStep.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Fluxo de trabalho integrado</h2>
          <p className="text-sm text-muted-foreground">Clique nas seções coloridas para editar · Botão direito para mais opções</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={addWorkflowStep}
            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" /> Etapa
          </button>
          <button onClick={() => setEditMode((c) => !c)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {editMode ? "Finalizar edição" : "Editar fluxo"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {workflowSteps.map((step, index) => {
          const tasks = step.tasks || [];
          const doneCount = tasks.filter((t) => t.done).length;
          const totalCount = tasks.length;
          const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, type: "spring", damping: 24, stiffness: 280 }}
              className="ios-card overflow-hidden"
              style={{ borderLeft: `3px solid ${step.color}` }}
              onContextMenu={(e) => handleContextMenu(e, step.id)}
            >
              <div className="p-4 space-y-3">
                {editMode ? (
                  <>
                    <div className="grid sm:grid-cols-[80px_1fr_1fr_120px_28px] gap-1.5">
                      <input className="ios-input px-2 py-2 text-xs" value={step.number}
                        onChange={(e) => updateWorkflowStep(step.id, { number: e.target.value })} />
                      <input className="ios-input px-3 py-2 text-sm" value={step.title}
                        onChange={(e) => updateWorkflowStep(step.id, { title: e.target.value })} />
                      <input className="ios-input px-3 py-2 text-sm" value={step.owner}
                        onChange={(e) => updateWorkflowStep(step.id, { owner: e.target.value })} />
                      <input className="ios-input px-2 py-2 text-xs" value={step.duration}
                        onChange={(e) => updateWorkflowStep(step.id, { duration: e.target.value })} />
                      <button onClick={() => removeWorkflowStep(step.id)}
                        className="rounded-md p-1 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-2">
                      <textarea className="ios-input min-h-24 px-3 py-2 text-xs" value={step.inputs.join("\n")}
                        onChange={(e) => updateWorkflowStep(step.id, { inputs: splitLines(e.target.value) })} placeholder="Entradas" />
                      <textarea className="ios-input min-h-24 px-3 py-2 text-xs" value={step.outputs.join("\n")}
                        onChange={(e) => updateWorkflowStep(step.id, { outputs: splitLines(e.target.value) })} placeholder="Saídas" />
                      <textarea className="ios-input min-h-24 px-3 py-2 text-xs" value={step.rules.join("\n")}
                        onChange={(e) => updateWorkflowStep(step.id, { rules: splitLines(e.target.value) })} placeholder="Regras" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-[11px] rounded-lg px-2 py-0.5 bg-secondary text-secondary-foreground">{step.number}</span>
                        <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <span className="text-xs font-medium" style={{ color: step.color }}>{step.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Responsável: {step.owner}</p>

                    {totalCount > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-[5px] rounded-full overflow-hidden bg-secondary">
                          <motion.div className="h-full rounded-full" style={{ background: step.color }}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }} />
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground">{doneCount}/{totalCount}</span>
                      </div>
                    )}

                    {/* Clickable colored sections */}
                    <div className="grid md:grid-cols-3 gap-2">
                      <SectionBox
                        label="Entradas" items={step.inputs}
                        bg="bg-secondary/45" labelColor="text-muted-foreground" itemColor="text-foreground"
                        editing={editingSection?.stepId === step.id && editingSection.section === "inputs"}
                        onEdit={() => setEditingSection({ stepId: step.id, section: "inputs" })}
                        onSave={(items) => { updateWorkflowStep(step.id, { inputs: items }); setEditingSection(null); }}
                        onCancel={() => setEditingSection(null)}
                      />
                      <SectionBox
                        label="Saídas" items={step.outputs}
                        bgStyle={{ background: step.colorLight }} labelStyle={{ color: step.color }} itemStyle={{ color: step.color }}
                        editing={editingSection?.stepId === step.id && editingSection.section === "outputs"}
                        onEdit={() => setEditingSection({ stepId: step.id, section: "outputs" })}
                        onSave={(items) => { updateWorkflowStep(step.id, { outputs: items }); setEditingSection(null); }}
                        onCancel={() => setEditingSection(null)}
                      />
                      <SectionBox
                        label="Regras" items={step.rules}
                        bg="bg-amber-100/60" labelColor="text-amber-700" itemColor="text-amber-800"
                        editing={editingSection?.stepId === step.id && editingSection.section === "rules"}
                        onEdit={() => setEditingSection({ stepId: step.id, section: "rules" })}
                        onSave={(items) => { updateWorkflowStep(step.id, { rules: items }); setEditingSection(null); }}
                        onCancel={() => setEditingSection(null)}
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            ref={ctxRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[100] ios-card p-1.5 shadow-2xl w-[180px]"
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
          >
            {[
              { label: "Ver detalhes", icon: Eye, action: () => {
                const s = workflowSteps.find((s) => s.id === ctxMenu.stepId);
                if (s) setDetailStep(s);
                setCtxMenu(null);
              }},
              { label: "Editar etapa", icon: Edit3, action: () => { setEditMode(true); setCtxMenu(null); }},
              { label: "Remover etapa", icon: Trash2, action: () => { removeWorkflowStep(ctxMenu.stepId); setCtxMenu(null); }, danger: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  (item as any).danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {currentDetail && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            onClick={() => setDetailStep(null)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 380 }}
              className="relative z-10 w-full max-w-lg ios-card overflow-hidden max-h-[85vh] overflow-y-auto"
              style={{ borderTop: `4px solid ${currentDetail.color}` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Colored header */}
              <div className="p-5 space-y-1" style={{ background: `${currentDetail.color}08` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs rounded-lg px-2 py-0.5 font-bold text-white"
                      style={{ background: currentDetail.color }}>{currentDetail.number}</span>
                    <h3 className="text-lg font-bold text-foreground">{currentDetail.title}</h3>
                  </div>
                  <button onClick={() => setDetailStep(null)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{currentDetail.owner} · {currentDetail.duration}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Info sections */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-secondary/45 p-3">
                    <div className="text-[11px] font-semibold text-muted-foreground mb-1">Entradas</div>
                    {currentDetail.inputs.map((e, i) => (
                      <p key={i} className="text-xs text-foreground">• {e}</p>
                    ))}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: currentDetail.colorLight }}>
                    <div className="text-[11px] font-semibold mb-1" style={{ color: currentDetail.color }}>Saídas</div>
                    {currentDetail.outputs.map((e, i) => (
                      <p key={i} className="text-xs" style={{ color: currentDetail.color }}>• {e}</p>
                    ))}
                  </div>
                  <div className="rounded-xl bg-amber-100/60 p-3">
                    <div className="text-[11px] font-semibold text-amber-700 mb-1">Regras</div>
                    {currentDetail.rules.map((e, i) => (
                      <p key={i} className="text-xs text-amber-800">• {e}</p>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                {(() => {
                  const tasks = currentDetail.tasks || [];
                  const done = tasks.filter((t) => t.done).length;
                  const total = tasks.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return total > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-secondary">
                        <motion.div className="h-full rounded-full" style={{ background: currentDetail.color }}
                          animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: currentDetail.color }}>{pct}%</span>
                    </div>
                  ) : null;
                })()}

                {/* Tasks checklist */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tarefas</h4>
                  {(currentDetail.tasks || []).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                      <button onClick={() => toggleTask(currentDetail.id, task.id)} className="shrink-0">
                        {task.done
                          ? <CheckCircle2 className="h-5 w-5" style={{ color: currentDetail.color }} />
                          : <Circle className="h-5 w-5 text-muted-foreground/50" />}
                      </button>
                      <span className={`flex-1 text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.name}
                      </span>
                      <button onClick={() => removeTask(currentDetail.id, task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={() => addTask(currentDetail.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Plus className="h-3.5 w-3.5" /> Adicionar tarefa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Inline editable section box ── */
interface SectionBoxProps {
  label: string;
  items: string[];
  bg?: string;
  bgStyle?: React.CSSProperties;
  labelColor?: string;
  labelStyle?: React.CSSProperties;
  itemColor?: string;
  itemStyle?: React.CSSProperties;
  editing: boolean;
  onEdit: () => void;
  onSave: (items: string[]) => void;
  onCancel: () => void;
}

function SectionBox({ label, items, bg, bgStyle, labelColor, labelStyle, itemColor, itemStyle, editing, onEdit, onSave, onCancel }: SectionBoxProps) {
  const [text, setText] = useState(items.join("\n"));

  useEffect(() => { setText(items.join("\n")); }, [items]);

  if (editing) {
    return (
      <div className={`rounded-xl p-3 ${bg || ""}`} style={bgStyle}>
        <div className={`text-[11px] font-semibold mb-1 ${labelColor || ""}`} style={labelStyle}>{label}</div>
        <textarea
          autoFocus
          className="ios-input w-full min-h-20 px-2 py-1.5 text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-1.5 mt-1.5">
          <button onClick={() => onSave(splitLines(text))}
            className="text-[10px] font-semibold text-primary px-2 py-1 rounded-lg bg-primary/10">Salvar</button>
          <button onClick={onCancel}
            className="text-[10px] font-medium text-muted-foreground px-2 py-1 rounded-lg hover:bg-secondary">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${bg || ""}`}
      style={bgStyle}
      onClick={onEdit}
      title="Clique para editar"
    >
      <div className={`text-[11px] font-semibold mb-1 ${labelColor || ""}`} style={labelStyle}>{label}</div>
      <ul className="space-y-1">
        {items.map((entry, i) => (
          <li key={i} className={`text-xs ${itemColor || ""}`} style={itemStyle}>• {entry}</li>
        ))}
      </ul>
    </div>
  );
}
