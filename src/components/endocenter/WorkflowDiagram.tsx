import { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Edit3, Eye, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, type WorkflowStep } from "@/store/endocenterStore";
import { useNotificationStore } from "@/store/notificationStore";

const splitLines = (value: string) =>
  value.split("\n").map((l) => l.trim()).filter(Boolean);

type EditingSection = { stepId: string; section: "inputs" | "outputs" | "rules" } | null;

export default function WorkflowDiagram() {
  const { workflowSteps, updateWorkflowStep, addWorkflowStep, removeWorkflowStep } = useEndocenter();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [editMode, setEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [detailStep, setDetailStep] = useState<WorkflowStep | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Clamp activeIndex
  useEffect(() => {
    if (activeIndex >= workflowSteps.length) setActiveIndex(Math.max(0, workflowSteps.length - 1));
  }, [workflowSteps.length, activeIndex]);

  const goNext = () => {
    if (activeIndex < workflowSteps.length - 1) {
      setDirection(1);
      setActiveIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (activeIndex > 0) {
      setDirection(-1);
      setActiveIndex((i) => i - 1);
    }
  };

  const toggleTask = (stepId: string, taskId: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    if (!step) return;
    const task = (step.tasks || []).find((t) => t.id === taskId);
    const tasks = (step.tasks || []).map((t) => t.id === taskId ? { ...t, done: !t.done } : t);
    updateWorkflowStep(stepId, { tasks });
    if (task) {
      addNotification({
        title: !task.done ? `Fluxo: tarefa concluída` : `Fluxo: tarefa reaberta`,
        description: `${task.name} — ${step.title}`,
        icon: !task.done ? "check" : "move",
      });
    }
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
    const task = (step.tasks || []).find((t) => t.id === taskId);
    addNotification({ title: "Fluxo: tarefa removida", description: `${task?.name || "Tarefa"} — ${step.title}`, icon: "delete" });
    updateWorkflowStep(stepId, { tasks: (step.tasks || []).filter((t) => t.id !== taskId) });
  };

  const currentDetail = detailStep ? workflowSteps.find((s) => s.id === detailStep.id) : null;
  const step = workflowSteps[activeIndex];

  // Roulette animation variants
  const rouletteVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.85,
      rotateX: dir > 0 ? 25 : -25,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      rotateX: 0,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.85,
      rotateX: dir > 0 ? -25 : 25,
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Fluxo de trabalho integrado</h2>
          <p className="text-sm text-muted-foreground">Navegue entre etapas · Clique nas seções para editar</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { addWorkflowStep(); setActiveIndex(workflowSteps.length); setDirection(1); }}
            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" /> Etapa
          </button>
          <button onClick={() => setEditMode((c) => !c)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {editMode ? "Finalizar edição" : "Editar fluxo"}
          </button>
        </div>
      </div>

      {/* Step indicator / mind-map timeline */}
      <div className="flex items-center justify-center gap-1">
        {workflowSteps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => { setDirection(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
              className={`relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                i === activeIndex
                  ? "text-white shadow-lg scale-110"
                  : i < activeIndex
                  ? "bg-secondary text-muted-foreground ring-2 ring-primary/30"
                  : "bg-secondary/50 text-muted-foreground/50"
              }`}
              style={i === activeIndex ? { background: s.color } : undefined}
            >
              {s.number}
              {i === activeIndex && (
                <motion.div
                  layoutId="active-ring"
                  className="absolute inset-[-3px] border-2"
                  style={{ borderColor: s.color, borderRadius: 'inherit' }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
            {i < workflowSteps.length - 1 && (
              <div className={`w-6 h-0.5 rounded-full transition-colors duration-300 ${
                i < activeIndex ? "bg-primary/40" : "bg-secondary"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Navigation + Card */}
      {step && (
        <div className="flex flex-col items-center gap-4">
          {/* Prev button */}
          <button
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="h-4 w-4" /> Etapa anterior
          </button>

          {/* Roulette container */}
          <div className="w-full relative overflow-hidden" style={{ perspective: "1200px", minHeight: "280px" }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id}
                custom={direction}
                variants={rouletteVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
                className="ios-card overflow-hidden w-full"
                style={{ borderLeft: `4px solid ${step.color}`, transformStyle: "preserve-3d" }}
              >
                <StepCard
                  step={step}
                  editMode={editMode}
                  editingSection={editingSection}
                  setEditingSection={setEditingSection}
                  updateWorkflowStep={updateWorkflowStep}
                  removeWorkflowStep={removeWorkflowStep}
                  addNotification={addNotification}
                  onViewDetails={() => setDetailStep(step)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next button */}
          <button
            onClick={goNext}
            disabled={activeIndex === workflowSteps.length - 1}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: step.color }}
          >
            Próxima etapa <ChevronDown className="h-4 w-4" />
          </button>

          {/* Counter */}
          <span className="text-xs text-muted-foreground font-medium">
            {activeIndex + 1} de {workflowSteps.length}
          </span>
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {currentDetail && (
          <DetailModal
            step={currentDetail}
            onClose={() => setDetailStep(null)}
            toggleTask={toggleTask}
            addTask={addTask}
            removeTask={removeTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Step Card ── */
interface StepCardProps {
  step: WorkflowStep;
  editMode: boolean;
  editingSection: EditingSection;
  setEditingSection: (s: EditingSection) => void;
  updateWorkflowStep: (id: string, data: Partial<WorkflowStep>) => void;
  removeWorkflowStep: (id: string) => void;
  addNotification: (n: any) => void;
  onViewDetails: () => void;
}

function StepCard({ step, editMode, editingSection, setEditingSection, updateWorkflowStep, removeWorkflowStep, addNotification, onViewDetails }: StepCardProps) {
  const tasks = step.tasks || [];
  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="p-5 space-y-4">
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
            <button onClick={() => { addNotification({ title: "Fluxo: etapa removida", description: step.title, icon: "delete" }); removeWorkflowStep(step.id); }}
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
            <div className="inline-flex items-center gap-3">
              <span className="text-xs rounded-xl px-3 py-1 font-bold text-white" style={{ background: step.color }}>{step.number}</span>
              <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: step.color }}>{step.duration}</span>
              <button onClick={onViewDetails}
                className="rounded-lg p-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Responsável: {step.owner}</p>

          {totalCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-secondary">
                <motion.div className="h-full rounded-full" style={{ background: step.color }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>
              <span className="text-xs font-bold text-muted-foreground">{doneCount}/{totalCount}</span>
            </div>
          )}

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
  );
}

/* ── Detail Modal ── */
interface DetailModalProps {
  step: WorkflowStep;
  onClose: () => void;
  toggleTask: (stepId: string, taskId: string) => void;
  addTask: (stepId: string) => void;
  removeTask: (stepId: string, taskId: string) => void;
}

function DetailModal({ step, onClose, toggleTask, addTask, removeTask }: DetailModalProps) {
  const tasks = step.tasks || [];
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 24, stiffness: 380 }}
        className="relative z-10 w-full max-w-lg ios-card overflow-hidden max-h-[85vh] overflow-y-auto"
        style={{ borderTop: `4px solid ${step.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-1" style={{ background: `${step.color}08` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs rounded-lg px-2 py-0.5 font-bold text-white" style={{ background: step.color }}>{step.number}</span>
              <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{step.owner} · {step.duration}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-secondary/45 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground mb-1">Entradas</div>
              {step.inputs.map((e, i) => <p key={i} className="text-xs text-foreground">• {e}</p>)}
            </div>
            <div className="rounded-xl p-3" style={{ background: step.colorLight }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: step.color }}>Saídas</div>
              {step.outputs.map((e, i) => <p key={i} className="text-xs" style={{ color: step.color }}>• {e}</p>)}
            </div>
            <div className="rounded-xl bg-amber-100/60 p-3">
              <div className="text-[11px] font-semibold text-amber-700 mb-1">Regras</div>
              {step.rules.map((e, i) => <p key={i} className="text-xs text-amber-800">• {e}</p>)}
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-secondary">
                <motion.div className="h-full rounded-full" style={{ background: step.color }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
              </div>
              <span className="text-xs font-bold" style={{ color: step.color }}>{pct}%</span>
            </div>
          )}

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tarefas</h4>
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                <button onClick={() => toggleTask(step.id, task.id)} className="shrink-0">
                  {task.done
                    ? <CheckCircle2 className="h-5 w-5" style={{ color: step.color }} />
                    : <Circle className="h-5 w-5 text-muted-foreground/50" />}
                </button>
                <span className={`flex-1 text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.name}</span>
                <button onClick={() => removeTask(step.id, task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => addTask(step.id)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Plus className="h-3.5 w-3.5" /> Adicionar tarefa
          </button>
        </div>
      </motion.div>
    </motion.div>
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
        <textarea autoFocus className="ios-input w-full min-h-20 px-2 py-1.5 text-xs" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-1.5 mt-1.5">
          <button onClick={() => onSave(splitLines(text))} className="text-[10px] font-semibold text-primary px-2 py-1 rounded-lg bg-primary/10">Salvar</button>
          <button onClick={onCancel} className="text-[10px] font-medium text-muted-foreground px-2 py-1 rounded-lg hover:bg-secondary">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${bg || ""}`} style={bgStyle} onClick={onEdit} title="Clique para editar">
      <div className={`text-[11px] font-semibold mb-1 ${labelColor || ""}`} style={labelStyle}>{label}</div>
      <ul className="space-y-1">
        {items.map((entry, i) => <li key={i} className={`text-xs ${itemColor || ""}`} style={itemStyle}>• {entry}</li>)}
      </ul>
    </div>
  );
}
