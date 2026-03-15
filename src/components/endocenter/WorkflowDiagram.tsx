import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, type WorkflowStep } from "@/store/endocenterStore";

const splitLines = (value: string) =>
  value.split("\n").map((line) => line.trim()).filter(Boolean);

export default function WorkflowDiagram() {
  const { workflowSteps, updateWorkflowStep, addWorkflowStep, removeWorkflowStep } = useEndocenter();
  const [editMode, setEditMode] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  const toggleTask = (stepId: string, taskId: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    if (!step) return;
    const updatedTasks = (step.tasks || []).map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    updateWorkflowStep(stepId, { tasks: updatedTasks });
    // Keep modal in sync
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...step, tasks: updatedTasks });
    }
  };

  const addTask = (stepId: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    if (!step) return;
    const newTask = { id: `ft_${Math.random().toString(36).slice(2, 8)}`, name: "Nova tarefa", done: false };
    const updatedTasks = [...(step.tasks || []), newTask];
    updateWorkflowStep(stepId, { tasks: updatedTasks });
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...step, tasks: updatedTasks });
    }
  };

  const removeTask = (stepId: string, taskId: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    if (!step) return;
    const updatedTasks = (step.tasks || []).filter((t) => t.id !== taskId);
    updateWorkflowStep(stepId, { tasks: updatedTasks });
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...step, tasks: updatedTasks });
    }
  };

  // Keep selectedStep synced with store
  const currentStep = selectedStep ? workflowSteps.find((s) => s.id === selectedStep.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Fluxo de trabalho integrado</h2>
          <p className="text-sm text-muted-foreground">Clique em uma etapa para acompanhar as tarefas</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addWorkflowStep}
            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Etapa
          </button>
          <button
            onClick={() => setEditMode((c) => !c)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
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
              className="ios-card overflow-hidden cursor-pointer"
              style={{ borderLeft: `3px solid ${step.color}` }}
              onClick={() => !editMode && setSelectedStep(step)}
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
                        onChange={(e) => updateWorkflowStep(step.id, { inputs: splitLines(e.target.value) })}
                        placeholder="Entradas (1 por linha)" />
                      <textarea className="ios-input min-h-24 px-3 py-2 text-xs" value={step.outputs.join("\n")}
                        onChange={(e) => updateWorkflowStep(step.id, { outputs: splitLines(e.target.value) })}
                        placeholder="Saídas (1 por linha)" />
                      <textarea className="ios-input min-h-24 px-3 py-2 text-xs" value={step.rules.join("\n")}
                        onChange={(e) => updateWorkflowStep(step.id, { rules: splitLines(e.target.value) })}
                        placeholder="Regras (1 por linha)" />
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

                    {/* Progress bar */}
                    {totalCount > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-[5px] rounded-full overflow-hidden bg-secondary">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: step.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                          {doneCount}/{totalCount} tarefas
                        </span>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-2">
                      <div className="rounded-xl bg-secondary/45 p-3">
                        <div className="text-[11px] font-semibold text-muted-foreground mb-1">Entradas</div>
                        <ul className="space-y-1">
                          {step.inputs.map((entry, i) => (
                            <li key={`${step.id}-in-${i}`} className="text-xs text-foreground">• {entry}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: step.colorLight }}>
                        <div className="text-[11px] font-semibold mb-1" style={{ color: step.color }}>Saídas</div>
                        <ul className="space-y-1">
                          {step.outputs.map((entry, i) => (
                            <li key={`${step.id}-out-${i}`} className="text-xs" style={{ color: step.color }}>• {entry}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl bg-amber-100/60 p-3">
                        <div className="text-[11px] font-semibold text-amber-700 mb-1">Regras</div>
                        <ul className="space-y-1">
                          {step.rules.map((entry, i) => (
                            <li key={`${step.id}-rule-${i}`} className="text-xs text-amber-800">• {entry}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Task detail modal */}
      <AnimatePresence>
        {currentStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            onClick={() => setSelectedStep(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 380 }}
              className="relative z-10 w-full max-w-lg ios-card p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[11px] rounded-lg px-2 py-0.5 font-bold text-white"
                      style={{ background: currentStep.color }}
                    >
                      {currentStep.number}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{currentStep.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentStep.owner} · {currentStep.duration}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStep(null)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Progress */}
              {(() => {
                const tasks = currentStep.tasks || [];
                const done = tasks.filter((t) => t.done).length;
                const total = tasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return total > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-secondary">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: currentStep.color }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <span className="text-xs font-bold" style={{ color: currentStep.color }}>
                      {pct}%
                    </span>
                  </div>
                ) : null;
              })()}

              {/* Tasks */}
              <div className="space-y-1.5">
                {(currentStep.tasks || []).map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                  >
                    <button
                      onClick={() => toggleTask(currentStep.id, task.id)}
                      className="shrink-0"
                    >
                      {task.done ? (
                        <CheckCircle2 className="h-5 w-5" style={{ color: currentStep.color }} />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.name}
                    </span>
                    <button
                      onClick={() => removeTask(currentStep.id, task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => addTask(currentStep.id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar tarefa
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
