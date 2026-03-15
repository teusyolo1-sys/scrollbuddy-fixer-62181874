import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, ChevronDown, FileText, Globe, MessageCircle, Plus, Settings, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, type TaskStatus } from "@/store/endocenterStore";
import { useNotificationStore } from "@/store/notificationStore";

const iconMap = {
  settings: Settings,
  globe: Globe,
  file: FileText,
  camera: Camera,
  message: MessageCircle,
} as const;

const statusConfig: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Pendente", bg: "rgba(245, 158, 11, 0.12)", text: "#B45309" },
  in_progress: { label: "Em andamento", bg: "hsl(var(--primary) / 0.1)", text: "hsl(var(--primary))" },
  done: { label: "Concluído", bg: "rgba(16, 185, 129, 0.12)", text: "#059669" },
  blocked: { label: "Bloqueado", bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" },
};

const allStatus = Object.keys(statusConfig) as TaskStatus[];

/* ── Custom StatusPill dropdown ── */
function StatusPill({ value, onChange }: { value: TaskStatus; onChange: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setOpenUp(rect.bottom + 160 > window.innerHeight);
    }
    setOpen((p) => !p);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const cfg = statusConfig[value];

  return (
    <div ref={ref} className="relative" style={{ zIndex: open ? 50 : 1 }}>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 font-semibold transition-all"
        style={{
          background: cfg.bg,
          color: cfg.text,
          borderRadius: "var(--ios-radius)",
          border: `1px solid ${cfg.text}20`,
        }}
      >
        {cfg.label}
        <ChevronDown className="h-3 w-3" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUp ? 4 : -4 }}
            transition={{ type: "spring", damping: 24, stiffness: 400 }}
            className="absolute right-0 min-w-[150px] p-1.5"
            style={{
              ...(openUp ? { bottom: "100%", marginBottom: 6 } : { top: "100%", marginTop: 6 }),
              background: "hsl(var(--card))",
              borderRadius: "var(--ios-radius-lg)",
              border: "1px solid hsl(var(--border) / 0.5)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              zIndex: 60,
            }}
          >
            {allStatus.map((s) => {
              const sc = statusConfig[s];
              const active = s === value;
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors"
                  style={{
                    borderRadius: "var(--ios-radius-sm)",
                    background: active ? sc.bg : "transparent",
                    color: active ? sc.text : "hsl(var(--foreground))",
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sc.text }} />
                  {sc.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProjectPipeline() {
  const {
    pipelineProjects, updatePipelineProject, addPipelineProject, removePipelineProject,
    addPipelineTask, updatePipelineTask, removePipelineTask,
  } = useEndocenter();

  const addNotification = useNotificationStore((s) => s.addNotification);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleProjectStatus = (projectId: string, status: TaskStatus) => {
    const project = pipelineProjects.find((p) => p.id === projectId);
    updatePipelineProject(projectId, { status });
    const label = statusConfig[status].label;
    addNotification({ title: `Pipeline: ${label}`, description: project?.name || "Projeto", icon: status === "done" ? "check" : "move" });
  };

  const handleTaskStatus = (projectId: string, taskId: string, status: TaskStatus) => {
    const project = pipelineProjects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    updatePipelineTask(projectId, taskId, { status });
    const label = statusConfig[status].label;
    addNotification({ title: `Tarefa pipeline: ${label}`, description: task?.name || "Tarefa", icon: status === "done" ? "check" : "move" });
  };

  const totalInvestment = pipelineProjects.reduce(
    (sum, p) => sum + p.tasks.reduce((ts, t) => ts + t.remuneration, 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pipeline de projetos</h2>
          <p className="text-sm text-muted-foreground">Adicionar, editar e acompanhar projetos e tarefas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={addPipelineProject}
            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" /> Projeto
          </button>
          <button onClick={() => setEditMode((c) => !c)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {editMode ? "Finalizar edição" : "Editar pipeline"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pipelineProjects.map((project, index) => {
          const Icon = iconMap[project.icon] ?? Settings;
          const projectHours = project.tasks.reduce((s, t) => s + t.hours, 0);
          const projectRemuneration = project.tasks.reduce((s, t) => s + t.remuneration, 0);
          const doneTasks = project.tasks.filter((t) => t.status === "done").length;
          const progress = project.tasks.length > 0 ? Math.round((doneTasks / project.tasks.length) * 100) : 0;
          const open = activeProjectId === project.id;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, type: "spring", damping: 24, stiffness: 280 }}
              className="ios-card overflow-visible"
              style={{ borderTop: `3px solid ${project.color}` }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: project.colorLight }}>
                    <Icon className="h-4 w-4" style={{ color: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <input className="ios-input w-full px-3 py-1.5 text-sm" value={project.name}
                        onChange={(e) => updatePipelineProject(project.id, { name: e.target.value })} />
                    ) : (
                      <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5">{project.deadline}</div>
                  </div>
                  <StatusPill value={project.status} onChange={(s) => handleProjectStatus(project.id, s)} />
                </div>

                {editMode ? (
                  <>
                    <textarea className="ios-input w-full px-3 py-2 text-xs min-h-16" value={project.description}
                      onChange={(e) => updatePipelineProject(project.id, { description: e.target.value })} />
                    <input className="ios-input px-3 py-1.5 text-xs w-full" value={project.deadline}
                      onChange={(e) => updatePipelineProject(project.id, { deadline: e.target.value })} />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                )}

                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Progresso</span><span>{progress}%</span>
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
                    <button onClick={() => setActiveProjectId(open ? null : project.id)}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground">
                      {open ? "Ocultar" : "Tarefas"}
                    </button>
                    {editMode && (
                      <button onClick={() => removePipelineProject(project.id)}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10">
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
                          <input className="ios-input w-full px-3 py-1.5 text-xs" value={task.name}
                            onChange={(e) => updatePipelineTask(project.id, task.id, { name: e.target.value })} />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input className="ios-input px-2 py-1.5 text-xs" value={task.responsible}
                              onChange={(e) => updatePipelineTask(project.id, task.id, { responsible: e.target.value })} />
                            <StatusPill value={task.status} onChange={(s) => handleTaskStatus(project.id, task.id, s)} />
                          </div>
                          <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-1.5">
                            <input type="number" className="ios-input px-2 py-1.5 text-xs" value={task.hours}
                              onChange={(e) => updatePipelineTask(project.id, task.id, { hours: Number(e.target.value) })} placeholder="Horas" />
                            <input type="number" className="ios-input px-2 py-1.5 text-xs" value={task.remuneration}
                              onChange={(e) => updatePipelineTask(project.id, task.id, { remuneration: Number(e.target.value) })} placeholder="R$" />
                            <input className="ios-input px-2 py-1.5 text-xs" value={task.week}
                              onChange={(e) => updatePipelineTask(project.id, task.id, { week: e.target.value })} placeholder="Semana" />
                            <button onClick={() => removePipelineTask(project.id, task.id)}
                              className="rounded-md p-1 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-foreground">{task.name}</p>
                            <StatusPill value={task.status} onChange={(s) => updatePipelineTask(project.id, task.id, { status: s })} />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {task.responsible} · {task.hours}h · R$ {task.remuneration.toLocaleString("pt-BR")}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addPipelineTask(project.id)}
                    className="inline-flex items-center gap-1 text-xs text-primary">
                    <Plus className="h-3.5 w-3.5" /> Adicionar tarefa
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
