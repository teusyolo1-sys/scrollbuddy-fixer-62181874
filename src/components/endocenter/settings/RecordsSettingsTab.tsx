import { Plus, Trash2 } from "lucide-react";
import { useEndocenter, type DeadlineStatus, type TaskStatus } from "@/store/endocenterStore";

const taskStatuses: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluído" },
  { value: "blocked", label: "Bloqueado" },
];

const deadlineStatuses: { value: DeadlineStatus; label: string }[] = [
  { value: "on_track", label: "No prazo" },
  { value: "at_risk", label: "Em risco" },
  { value: "overdue", label: "Atrasado" },
  { value: "done", label: "Concluído" },
];

export default function RecordsSettingsTab() {
  const {
    scheduleWeeks,
    updateScheduleWeek,
    addScheduleTask,
    updateScheduleTask,
    removeScheduleTask,
    pipelineProjects,
    updatePipelineProject,
    addPipelineProject,
    removePipelineProject,
    responsibilityRoles,
    updateResponsibilityRole,
    addResponsibilityRoleItem,
    updateResponsibilityRoleItem,
    workflowSteps,
    updateWorkflowStep,
    addWorkflowStep,
    removeWorkflowStep,
    deadlines,
    updateDeadline,
    addDeadline,
    removeDeadline,
  } = useEndocenter();

  return (
    <div className="space-y-3">
      <details className="ios-card p-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Cronograma</summary>
        <div className="mt-3 space-y-3">
          {scheduleWeeks.map((week) => (
            <div key={week.id} className="rounded-xl border border-border/60 p-3 space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  className="ios-input px-3 py-2 text-xs"
                  value={week.week}
                  onChange={(event) => updateScheduleWeek(week.id, { week: event.target.value })}
                />
                <input
                  className="ios-input px-3 py-2 text-xs"
                  value={week.theme}
                  onChange={(event) => updateScheduleWeek(week.id, { theme: event.target.value })}
                />
              </div>

              {week.tasks.map((task) => (
                <div key={task.id} className="grid grid-cols-[1fr_80px_28px] gap-1.5">
                  <input
                    className="ios-input px-3 py-1.5 text-xs"
                    value={task.task}
                    onChange={(event) => updateScheduleTask(week.id, task.id, { task: event.target.value })}
                  />
                  <input
                    type="number"
                    className="ios-input px-2 py-1.5 text-xs"
                    value={task.hours}
                    onChange={(event) => updateScheduleTask(week.id, task.id, { hours: Number(event.target.value) })}
                  />
                  <button
                    onClick={() => removeScheduleTask(week.id, task.id)}
                    className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addScheduleTask(week.id)}
                className="inline-flex items-center gap-1 text-xs text-primary"
              >
                <Plus className="h-3 w-3" />
                Adicionar tarefa
              </button>
            </div>
          ))}
        </div>
      </details>

      <details className="ios-card p-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Pipeline</summary>
        <div className="mt-3 space-y-2">
          {pipelineProjects.map((project) => (
            <div key={project.id} className="rounded-xl border border-border/60 p-3 space-y-2">
              <div className="grid sm:grid-cols-[1fr_130px_28px] gap-1.5">
                <input
                  className="ios-input px-3 py-2 text-xs"
                  value={project.name}
                  onChange={(event) => updatePipelineProject(project.id, { name: event.target.value })}
                />
                <select
                  className="ios-input px-2 py-2 text-xs"
                  value={project.status}
                  onChange={(event) => updatePipelineProject(project.id, { status: event.target.value as TaskStatus })}
                >
                  {taskStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removePipelineProject(project.id)}
                  className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <input
                className="ios-input w-full px-3 py-2 text-xs"
                value={project.deadline}
                onChange={(event) => updatePipelineProject(project.id, { deadline: event.target.value })}
                placeholder="Prazo"
              />
            </div>
          ))}

          <button onClick={addPipelineProject} className="inline-flex items-center gap-1 text-xs text-primary">
            <Plus className="h-3 w-3" />
            Adicionar projeto
          </button>
        </div>
      </details>

      <details className="ios-card p-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Responsabilidades</summary>
        <div className="mt-3 space-y-2">
          {responsibilityRoles.map((role) => (
            <div key={role.id} className="rounded-xl border border-border/60 p-3 space-y-2">
              <input
                className="ios-input w-full px-3 py-2 text-xs"
                value={role.role}
                onChange={(event) => updateResponsibilityRole(role.id, { role: event.target.value })}
              />
              {(role.weekly ?? []).map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_28px] gap-1.5">
                  <input
                    className="ios-input px-3 py-1.5 text-xs"
                    value={item.task}
                    onChange={(event) =>
                      updateResponsibilityRoleItem(role.id, "weekly", item.id, {
                        task: event.target.value,
                      })
                    }
                  />
                  <button
                    onClick={() =>
                      updateResponsibilityRoleItem(role.id, "weekly", item.id, {
                        done: !item.done,
                      })
                    }
                    className="rounded-md p-1 text-primary hover:bg-primary/10"
                  >
                    ✓
                  </button>
                </div>
              ))}
              <button
                onClick={() => addResponsibilityRoleItem(role.id, "weekly")}
                className="inline-flex items-center gap-1 text-xs text-primary"
              >
                <Plus className="h-3 w-3" />
                Adicionar item semanal
              </button>
            </div>
          ))}
        </div>
      </details>

      <details className="ios-card p-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Fluxo</summary>
        <div className="mt-3 space-y-2">
          {workflowSteps.map((step) => (
            <div key={step.id} className="rounded-xl border border-border/60 p-3">
              <div className="grid sm:grid-cols-[80px_1fr_28px] gap-1.5">
                <input
                  className="ios-input px-2 py-1.5 text-xs"
                  value={step.number}
                  onChange={(event) => updateWorkflowStep(step.id, { number: event.target.value })}
                />
                <input
                  className="ios-input px-3 py-1.5 text-xs"
                  value={step.title}
                  onChange={(event) => updateWorkflowStep(step.id, { title: event.target.value })}
                />
                <button
                  onClick={() => removeWorkflowStep(step.id)}
                  className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          <button onClick={addWorkflowStep} className="inline-flex items-center gap-1 text-xs text-primary">
            <Plus className="h-3 w-3" />
            Adicionar etapa
          </button>
        </div>
      </details>

      <details className="ios-card p-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Prazos e crises</summary>
        <div className="mt-3 space-y-2">
          {deadlines.map((deadline) => (
            <div key={deadline.id} className="rounded-xl border border-border/60 p-3 space-y-1.5">
              <div className="grid sm:grid-cols-[1fr_140px_28px] gap-1.5">
                <input
                  className="ios-input px-3 py-1.5 text-xs"
                  value={deadline.task}
                  onChange={(event) => updateDeadline(deadline.id, { task: event.target.value })}
                />
                <select
                  className="ios-input px-2 py-1.5 text-xs"
                  value={deadline.status}
                  onChange={(event) => updateDeadline(deadline.id, { status: event.target.value as DeadlineStatus })}
                >
                  {deadlineStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
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
            </div>
          ))}

          <button onClick={addDeadline} className="inline-flex items-center gap-1 text-xs text-primary">
            <Plus className="h-3 w-3" />
            Adicionar prazo
          </button>
        </div>
      </details>
    </div>
  );
}
