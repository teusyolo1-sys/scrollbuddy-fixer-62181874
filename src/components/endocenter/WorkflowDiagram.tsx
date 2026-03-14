import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEndocenter } from "@/store/endocenterStore";

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function WorkflowDiagram() {
  const { workflowSteps, updateWorkflowStep, addWorkflowStep, removeWorkflowStep } = useEndocenter();
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Fluxo de trabalho integrado</h2>
          <p className="text-sm text-muted-foreground">Editar etapas, regras, entradas e saídas do processo</p>
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
            onClick={() => setEditMode((current) => !current)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {editMode ? "Finalizar edição" : "Editar fluxo"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {workflowSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, type: "spring", damping: 24, stiffness: 280 }}
            className="ios-card overflow-hidden"
            style={{ borderLeft: `3px solid ${step.color}` }}
          >
            <div className="p-4 space-y-3">
              {editMode ? (
                <>
                  <div className="grid sm:grid-cols-[80px_1fr_1fr_120px_28px] gap-1.5">
                    <input
                      className="ios-input px-2 py-2 text-xs"
                      value={step.number}
                      onChange={(event) => updateWorkflowStep(step.id, { number: event.target.value })}
                    />
                    <input
                      className="ios-input px-3 py-2 text-sm"
                      value={step.title}
                      onChange={(event) => updateWorkflowStep(step.id, { title: event.target.value })}
                    />
                    <input
                      className="ios-input px-3 py-2 text-sm"
                      value={step.owner}
                      onChange={(event) => updateWorkflowStep(step.id, { owner: event.target.value })}
                    />
                    <input
                      className="ios-input px-2 py-2 text-xs"
                      value={step.duration}
                      onChange={(event) => updateWorkflowStep(step.id, { duration: event.target.value })}
                    />
                    <button
                      onClick={() => removeWorkflowStep(step.id)}
                      className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-2">
                    <textarea
                      className="ios-input min-h-24 px-3 py-2 text-xs"
                      value={step.inputs.join("\n")}
                      onChange={(event) =>
                        updateWorkflowStep(step.id, {
                          inputs: splitLines(event.target.value),
                        })
                      }
                      placeholder="Entradas (1 por linha)"
                    />
                    <textarea
                      className="ios-input min-h-24 px-3 py-2 text-xs"
                      value={step.outputs.join("\n")}
                      onChange={(event) =>
                        updateWorkflowStep(step.id, {
                          outputs: splitLines(event.target.value),
                        })
                      }
                      placeholder="Saídas (1 por linha)"
                    />
                    <textarea
                      className="ios-input min-h-24 px-3 py-2 text-xs"
                      value={step.rules.join("\n")}
                      onChange={(event) =>
                        updateWorkflowStep(step.id, {
                          rules: splitLines(event.target.value),
                        })
                      }
                      placeholder="Regras (1 por linha)"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[11px] rounded-lg px-2 py-0.5 bg-secondary text-secondary-foreground">{step.number}</span>
                      <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <span className="text-xs font-medium" style={{ color: step.color }}>
                      {step.duration}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">Responsável: {step.owner}</p>

                  <div className="grid md:grid-cols-3 gap-2">
                    <div className="rounded-xl bg-secondary/45 p-3">
                      <div className="text-[11px] font-semibold text-muted-foreground mb-1">Entradas</div>
                      <ul className="space-y-1">
                        {step.inputs.map((entry, entryIndex) => (
                          <li key={`${step.id}-input-${entryIndex}`} className="text-xs text-foreground">
                            • {entry}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl p-3" style={{ background: step.colorLight }}>
                      <div className="text-[11px] font-semibold mb-1" style={{ color: step.color }}>
                        Saídas
                      </div>
                      <ul className="space-y-1">
                        {step.outputs.map((entry, entryIndex) => (
                          <li key={`${step.id}-output-${entryIndex}`} className="text-xs" style={{ color: step.color }}>
                            • {entry}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-amber-100/60 p-3">
                      <div className="text-[11px] font-semibold text-amber-700 mb-1">Regras</div>
                      <ul className="space-y-1">
                        {step.rules.map((entry, entryIndex) => (
                          <li key={`${step.id}-rule-${entryIndex}`} className="text-xs text-amber-800">
                            • {entry}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
