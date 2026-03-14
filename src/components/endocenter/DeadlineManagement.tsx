import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Plus, Trash2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEndocenter, type DeadlinePriority, type DeadlineStatus } from "@/store/endocenterStore";

const priorityConfig: Record<DeadlinePriority, { label: string; className: string }> = {
  critical: { label: "Crítico", className: "bg-destructive/10 text-destructive" },
  high: { label: "Alto", className: "bg-amber-100 text-amber-700" },
  medium: { label: "Médio", className: "bg-yellow-100 text-yellow-700" },
  low: { label: "Baixo", className: "bg-emerald-100 text-emerald-700" },
};

const statusConfig: Record<DeadlineStatus, { label: string; className: string }> = {
  on_track: { label: "No prazo", className: "bg-emerald-100 text-emerald-700" },
  at_risk: { label: "Em risco", className: "bg-amber-100 text-amber-700" },
  overdue: { label: "Atrasado", className: "bg-destructive/10 text-destructive" },
  done: { label: "Concluído", className: "bg-primary/10 text-primary" },
};

const allStatuses = Object.keys(statusConfig) as DeadlineStatus[];
const allPriorities = Object.keys(priorityConfig) as DeadlinePriority[];

export default function DeadlineManagement() {
  const {
    deadlines,
    updateDeadline,
    addDeadline,
    removeDeadline,
    crisisScenarios,
    updateCrisisScenario,
    addCrisisScenario,
    removeCrisisScenario,
  } = useEndocenter();

  const [filter, setFilter] = useState("Todos");
  const [editMode, setEditMode] = useState(false);

  const filteredDeadlines = useMemo(
    () => (filter === "Todos" ? deadlines : deadlines.filter((deadline) => deadline.frequency === filter)),
    [deadlines, filter]
  );

  const countByStatus = useMemo(
    () => ({
      on_track: deadlines.filter((deadline) => deadline.status === "on_track").length,
      at_risk: deadlines.filter((deadline) => deadline.status === "at_risk").length,
      overdue: deadlines.filter((deadline) => deadline.status === "overdue").length,
      done: deadlines.filter((deadline) => deadline.status === "done").length,
    }),
    [deadlines]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Prazos e crises</h2>
          <p className="text-sm text-muted-foreground">Status selecionável por tarefa e edição completa de registros</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addDeadline}
            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Prazo
          </button>
          <button
            onClick={() => setEditMode((current) => !current)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {editMode ? "Finalizar edição" : "Editar registros"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          ["on_track", "No prazo", CheckCircle],
          ["at_risk", "Em risco", AlertTriangle],
          ["overdue", "Atrasados", XCircle],
          ["done", "Concluídos", CheckCircle],
        ] as const).map(([key, label, Icon]) => (
          <div key={key} className="ios-card p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-secondary mx-auto flex items-center justify-center mb-2">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{countByStatus[key]}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="ios-card overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold text-foreground">Tabela de prazos críticos</h3>
          <div className="p-1 rounded-xl bg-secondary/70 flex gap-1">
            {["Todos", "Semanal", "Mensal", "Contínuo"].map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  filter === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {filteredDeadlines.map((deadline, index) => (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
              className="p-4 space-y-2"
            >
              {editMode ? (
                <>
                  <div className="grid md:grid-cols-[1fr_1fr_120px_130px_28px] gap-1.5">
                    <input
                      className="ios-input px-3 py-2 text-xs"
                      value={deadline.task}
                      onChange={(event) => updateDeadline(deadline.id, { task: event.target.value })}
                    />
                    <input
                      className="ios-input px-3 py-2 text-xs"
                      value={deadline.responsible}
                      onChange={(event) => updateDeadline(deadline.id, { responsible: event.target.value })}
                    />
                    <select
                      className="ios-input px-2 py-2 text-xs"
                      value={deadline.frequency}
                      onChange={(event) => updateDeadline(deadline.id, { frequency: event.target.value })}
                    >
                      <option>Semanal</option>
                      <option>Mensal</option>
                      <option>Contínuo</option>
                    </select>
                    <select
                      className="ios-input px-2 py-2 text-xs"
                      value={deadline.priority}
                      onChange={(event) =>
                        updateDeadline(deadline.id, {
                          priority: event.target.value as DeadlinePriority,
                        })
                      }
                    >
                      {allPriorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priorityConfig[priority].label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeDeadline(deadline.id)}
                      className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-1.5">
                    <input
                      className="ios-input px-3 py-2 text-xs"
                      value={deadline.dueDay}
                      onChange={(event) => updateDeadline(deadline.id, { dueDay: event.target.value })}
                      placeholder="Vencimento"
                    />
                    <input
                      className="ios-input px-3 py-2 text-xs"
                      value={deadline.consequence}
                      onChange={(event) => updateDeadline(deadline.id, { consequence: event.target.value })}
                      placeholder="Impacto"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{deadline.task}</div>
                      <div className="text-xs text-muted-foreground">
                        {deadline.responsible} · {deadline.dueDay}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityConfig[deadline.priority].className}`}>
                        {priorityConfig[deadline.priority].label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {deadline.frequency}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Consequência: {deadline.consequence}</p>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Status da tarefa</span>
                <select
                  className={`rounded-full border-none outline-none px-3 py-1.5 text-xs font-semibold cursor-pointer ${statusConfig[deadline.status].className}`}
                  value={deadline.status}
                  onChange={(event) => updateDeadline(deadline.id, { status: event.target.value as DeadlineStatus })}
                >
                  {allStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusConfig[status].label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-foreground">Playbook de crises</h3>
          <button
            onClick={addCrisisScenario}
            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Cenário
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {crisisScenarios.map((crisis) => (
            <div key={crisis.id} className="ios-card p-4 space-y-2" style={{ borderLeft: `3px solid ${crisis.color}` }}>
              {editMode ? (
                <>
                  <div className="grid grid-cols-[1fr_80px_28px] gap-1.5">
                    <input
                      className="ios-input px-3 py-2 text-xs"
                      value={crisis.scenario}
                      onChange={(event) => updateCrisisScenario(crisis.id, { scenario: event.target.value })}
                    />
                    <input
                      className="ios-input px-2 py-2 text-xs"
                      value={crisis.impact}
                      onChange={(event) => updateCrisisScenario(crisis.id, { impact: event.target.value })}
                    />
                    <button
                      onClick={() => removeCrisisScenario(crisis.id)}
                      className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <textarea
                    className="ios-input min-h-24 w-full px-3 py-2 text-xs"
                    value={crisis.steps.join("\n")}
                    onChange={(event) =>
                      updateCrisisScenario(crisis.id, {
                        steps: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{crisis.scenario}</h4>
                    <span className="text-[11px] rounded-full px-2 py-0.5 bg-secondary text-secondary-foreground">
                      {crisis.impact}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {crisis.steps.map((step, index) => (
                      <li key={`${crisis.id}-step-${index}`} className="text-xs text-muted-foreground">
                        {index + 1}. {step}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
