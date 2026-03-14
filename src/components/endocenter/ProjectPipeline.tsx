import { useMemo, useState } from "react";
import { Camera, FileText, Globe, MessageCircle, Plus, Settings, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEndocenter, type TaskStatus } from "@/store/endocenterStore";

const iconMap = {
  settings: Settings,
  globe: Globe,
  file: FileText,
  camera: Camera,
  message: MessageCircle,
} as const;

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Em andamento", className: "bg-primary/10 text-primary" },
  done: { label: "Concluído", className: "bg-emerald-100 text-emerald-700" },
  blocked: { label: "Bloqueado", className: "bg-destructive/10 text-destructive" },
};

const allStatus = Object.keys(statusConfig) as TaskStatus[];

export default function ProjectPipeline() {
  const {
    pipelineProjects,
    updatePipelineProject,
    addPipelineProject,
    removePipelineProject,
    addPipelineTask,
    updatePipelineTask,
    removePipelineTask,
  } = useEndocenter();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const totalInvestment = useMemo(
    () => pipelineProjects.reduce((sum, project) => sum + project.tasks.reduce((taskSum, task) => taskSum + task.remuneration, 0), 0),
    [pipelineProjects]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pipeline de projetos</h2>
          <p className="text-sm text-muted-foreground">Adicionar, editar e acompanhar projetos e tarefas</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addPipelineProject}
            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Projeto
          </button>

          <button
            onClick={() => setEditMode((current) => !current)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {editMode ? "Finalizar edição" : "Editar pipeline"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pipelineProjects.map((project, index) => {
          const Icon = iconMap[project.icon] ?? Settings;
          const projectHours = project.tasks.reduce((sum, task) => sum + task.hours, 0);
          const projectRemuneration = project.tasks.reduce((sum, task) => sum + task.remuneration, 0);
          const doneTasks = project.tasks.filter((task) => task.status === "done").length;
          const progress = project.tasks.length > 0 ? Math.round((doneTasks / project.tasks.length) * 100) : 0;
          const open = activeProjectId === project.id;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, type: "spring", damping: 24, stiffness: 280 }}
              className="ios-card overflow-hidden"
              style={{ borderTop: `3px solid ${project.color}` }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: project.colorLight }}>
                    <Icon className="h-4 w-4" style={{ color: project.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <input
                        className="ios-input w-full px-3 py-1.5 text-sm"
                        value={project.name}
                        onChange={(event) => updatePipelineProject(project.id, { name: event.target.value })}
                      />
                    ) : (
                      <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
                    )}

                    <div className="text-[11px] text-muted-foreground mt-0.5">{project.deadline}</div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[project.status].className}`}>
                    {statusConfig[project.status].label}
                  </span>
                </div>

                {editMode ? (
                  <>
                    <textarea
                      className="ios-input w-full px-3 py-2 text-xs min-h-16"
                      value={project.description}
                      onChange={(event) => updatePipelineProject(project.id, { description: event.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        className="ios-input px-3 py-1.5 text-xs"
                        value={project.deadline}
                        onChange={(event) => updatePipelineProject(project.id, { deadline: event.target.value })}
                      />
                      <select
                        className="ios-input px-2 py-1.5 text-xs"
                        value={project.status}
                        onChange={(event) =>
                          updatePipelineProject(project.id, {
                            status: event.target.value as TaskStatus,
                          })
                        }
                      >
                        {allStatus.map((status) => (
                          <option key={status} value={status}>
                            {statusConfig[status].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                )}

                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{doneTasks}/{project.tasks.length} tarefas concluídas</span>
                  <span>{projectHours}h</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Investimento</div>
                    <div className="text-sm font-semibold" style={{ color: project.color }}>
                      R$ {projectRemuneration.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveProjectId(open ? null : project.id)}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground"
                    >
                      {open ? "Ocultar" : "Tarefas"}
                    </button>
                    {editMode && (
                      <button
                        onClick={() => removePipelineProject(project.id)}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {open && (
                <div className="border-t border-border/60 px-4 py-3 space-y-2 animate-fade-in">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="rounded-xl bg-secondary/45 p-2.5 space-y-1.5">
                      {editMode ? (
                        <>
                          <input
                            className="ios-input w-full px-3 py-1.5 text-xs"
                            value={task.name}
                            onChange={(event) => updatePipelineTask(project.id, task.id, { name: event.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              className="ios-input px-2 py-1.5 text-xs"
                              value={task.responsible}
                              onChange={(event) => updatePipelineTask(project.id, task.id, { responsible: event.target.value })}
                            />
                            <select
                              className="ios-input px-2 py-1.5 text-xs"
                              value={task.status}
                              onChange={(event) =>
                                updatePipelineTask(project.id, task.id, {
                                  status: event.target.value as TaskStatus,
                                })
                              }
                            >
                              {allStatus.map((status) => (
                                <option key={status} value={status}>
                                  {statusConfig[status].label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-1.5">
                            <input
                              type="number"
                              className="ios-input px-2 py-1.5 text-xs"
                              value={task.hours}
                              onChange={(event) => updatePipelineTask(project.id, task.id, { hours: Number(event.target.value) })}
                              placeholder="Horas"
                            />
                            <input
                              type="number"
                              className="ios-input px-2 py-1.5 text-xs"
                              value={task.remuneration}
                              onChange={(event) =>
                                updatePipelineTask(project.id, task.id, {
                                  remuneration: Number(event.target.value),
                                })
                              }
                              placeholder="R$"
                            />
                            <input
                              className="ios-input px-2 py-1.5 text-xs"
                              value={task.week}
                              onChange={(event) => updatePipelineTask(project.id, task.id, { week: event.target.value })}
                              placeholder="Semana"
                            />
                            <button
                              onClick={() => removePipelineTask(project.id, task.id)}
                              className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-foreground">{task.name}</p>
                            <select
                              className={`text-[10px] px-2 py-0.5 rounded-full border-none outline-none cursor-pointer appearance-none text-center font-semibold ${statusConfig[task.status].className}`}
                              value={task.status}
                              onChange={(e) =>
                                updatePipelineTask(project.id, task.id, {
                                  status: e.target.value as TaskStatus,
                                })
                              }
                            >
                              {allStatus.map((s) => (
                                <option key={s} value={s}>
                                  {statusConfig[s].label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {task.responsible} · {task.hours}h · R$ {task.remuneration.toLocaleString("pt-BR")}
                          </p>
                        </>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addPipelineTask(project.id)}
                    className="inline-flex items-center gap-1 text-xs text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar tarefa
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="ios-card p-5">
        <h3 className="text-base font-semibold text-foreground">Resumo financeiro do pipeline</h3>
        <div className="mt-2 text-sm text-muted-foreground">
          Investimento total estimado: <span className="font-semibold text-foreground">R$ {totalInvestment.toLocaleString("pt-BR")}</span>
        </div>
      </div>
    </div>
  );
}
