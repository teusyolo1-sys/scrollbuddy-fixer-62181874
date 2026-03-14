import { useState } from "react";
import { Settings, Globe, FileText, Camera, MessageCircle, Clock, Check, RotateCw, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TaskStatus = "pending" | "in_progress" | "done" | "blocked";

interface ProjectTask {
  id: string; name: string; responsible: string; responsibleIcon: string; hours: number; remuneration: number; status: TaskStatus; week: string;
}

interface Project {
  id: string; name: string; description: string; Icon: typeof Settings; color: string; colorLight: string;
  totalHours: number; totalRemuneration: number; deadline: string; status: TaskStatus; tasks: ProjectTask[];
}

const initialProjects: Project[] = [
  {
    id: "setup", name: "Setup Inicial", description: "Configuração completa da estrutura de marketing digital",
    Icon: Settings, color: "#007AFF", colorLight: "rgba(0,122,255,0.08)", totalHours: 40, totalRemuneration: 2400, deadline: "Semana 1-2", status: "in_progress",
    tasks: [
      { id: "s1", name: "Auditoria de contas (Meta, Google, Analytics)", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 4, remuneration: 95, status: "done", week: "S1" },
      { id: "s2", name: "Configuração de pixel Meta e tag Google", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 3, remuneration: 71, status: "done", week: "S1" },
      { id: "s3", name: "Estruturação de campanhas iniciais", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 8, remuneration: 190, status: "in_progress", week: "S1" },
      { id: "s4", name: "Definição de identidade visual", responsible: "Estrategista", responsibleIcon: "strategy", hours: 4, remuneration: 225, status: "done", week: "S1" },
      { id: "s5", name: "Briefing de conteúdo e tom de voz", responsible: "Estrategista", responsibleIcon: "strategy", hours: 3, remuneration: 169, status: "done", week: "S1" },
      { id: "s6", name: "Criação de templates de posts", responsible: "Designer", responsibleIcon: "design", hours: 8, remuneration: 200, status: "in_progress", week: "S2" },
      { id: "s7", name: "Produção de copies de referência", responsible: "Copywriter", responsibleIcon: "copy", hours: 6, remuneration: 160, status: "pending", week: "S2" },
      { id: "s8", name: "Configuração de CRM e fluxo de leads", responsible: "Estrategista", responsibleIcon: "strategy", hours: 4, remuneration: 225, status: "pending", week: "S2" },
    ],
  },
  {
    id: "website", name: "Criação de Website", description: "Desenvolvimento do site institucional",
    Icon: Globe, color: "#AF52DE", colorLight: "rgba(175,82,222,0.08)", totalHours: 65, totalRemuneration: 4800, deadline: "Semanas 2-4", status: "pending",
    tasks: [
      { id: "w1", name: "Wireframe e arquitetura de informação", responsible: "Estrategista", responsibleIcon: "strategy", hours: 5, remuneration: 281, status: "pending", week: "S2" },
      { id: "w2", name: "Copywriting completo do site", responsible: "Copywriter", responsibleIcon: "copy", hours: 12, remuneration: 320, status: "pending", week: "S2" },
      { id: "w3", name: "Design das páginas (UI/UX)", responsible: "Designer", responsibleIcon: "design", hours: 20, remuneration: 500, status: "pending", week: "S2-S3" },
      { id: "w4", name: "Desenvolvimento front-end", responsible: "Externo (Dev)", responsibleIcon: "dev", hours: 20, remuneration: 2500, status: "pending", week: "S3" },
      { id: "w5", name: "SEO On-page e otimização", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 4, remuneration: 95, status: "pending", week: "S4" },
      { id: "w6", name: "Revisão final e aprovação", responsible: "Estrategista", responsibleIcon: "strategy", hours: 4, remuneration: 225, status: "pending", week: "S4" },
    ],
  },
  {
    id: "lp", name: "Landing Pages", description: "LPs de alta conversão para campanhas",
    Icon: FileText, color: "#FF3B30", colorLight: "rgba(255,59,48,0.08)", totalHours: 25, totalRemuneration: 1800, deadline: "Semana 2", status: "in_progress",
    tasks: [
      { id: "l1", name: "Definição de objetivo e público", responsible: "Estrategista", responsibleIcon: "strategy", hours: 2, remuneration: 113, status: "done", week: "S1" },
      { id: "l2", name: "Copywriting da LP", responsible: "Copywriter", responsibleIcon: "copy", hours: 6, remuneration: 160, status: "in_progress", week: "S2" },
      { id: "l3", name: "Design completo da LP (responsivo)", responsible: "Designer", responsibleIcon: "design", hours: 8, remuneration: 200, status: "pending", week: "S2" },
      { id: "l4", name: "Integração com formulário e CRM", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 3, remuneration: 71, status: "pending", week: "S2" },
      { id: "l5", name: "Configuração de pixel e rastreamento", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 2, remuneration: 48, status: "pending", week: "S2" },
      { id: "l6", name: "Teste de velocidade e aprovação", responsible: "Estrategista", responsibleIcon: "strategy", hours: 2, remuneration: 113, status: "pending", week: "S3" },
      { id: "l7", name: "Lançamento e vinculação", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 2, remuneration: 48, status: "pending", week: "S3" },
    ],
  },
  {
    id: "photo", name: "Sessão Fotográfica", description: "Material fotográfico da clínica e médicos",
    Icon: Camera, color: "#30D158", colorLight: "rgba(48,209,88,0.08)", totalHours: 16, totalRemuneration: 1200, deadline: "Semana 3", status: "pending",
    tasks: [
      { id: "p1", name: "Briefing criativo (moodboard)", responsible: "Designer", responsibleIcon: "design", hours: 2, remuneration: 50, status: "pending", week: "S2" },
      { id: "p2", name: "Seleção de fotógrafo", responsible: "Estrategista", responsibleIcon: "strategy", hours: 2, remuneration: 113, status: "pending", week: "S2" },
      { id: "p3", name: "Coordenação da sessão", responsible: "Designer", responsibleIcon: "design", hours: 4, remuneration: 100, status: "pending", week: "S3" },
      { id: "p4", name: "Edição e tratamento das fotos", responsible: "Designer", responsibleIcon: "design", hours: 6, remuneration: 150, status: "pending", week: "S3" },
      { id: "p5", name: "Organização do banco de imagens", responsible: "Designer", responsibleIcon: "design", hours: 2, remuneration: 50, status: "pending", week: "S3" },
    ],
  },
  {
    id: "whatsapp", name: "Automação WhatsApp", description: "Fluxo automatizado de atendimento",
    Icon: MessageCircle, color: "#00C7BE", colorLight: "rgba(0,199,190,0.08)", totalHours: 20, totalRemuneration: 1800, deadline: "Semana 4", status: "pending",
    tasks: [
      { id: "a1", name: "Mapeamento da jornada do paciente", responsible: "Estrategista", responsibleIcon: "strategy", hours: 3, remuneration: 169, status: "pending", week: "S2" },
      { id: "a2", name: "Criação dos textos de mensagens", responsible: "Copywriter", responsibleIcon: "copy", hours: 6, remuneration: 160, status: "pending", week: "S3" },
      { id: "a3", name: "Configuração da ferramenta", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 5, remuneration: 119, status: "pending", week: "S3" },
      { id: "a4", name: "Criação de mídias visuais", responsible: "Designer", responsibleIcon: "design", hours: 3, remuneration: 75, status: "pending", week: "S3" },
      { id: "a5", name: "Testes de fluxo e QA", responsible: "Estrategista", responsibleIcon: "strategy", hours: 3, remuneration: 169, status: "pending", week: "S4" },
    ],
  },
];

const statusConfig = {
  pending: { label: "Pendente", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
  in_progress: { label: "Em andamento", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
  done: { label: "Concluído", color: "#30D158", bg: "rgba(48,209,88,0.08)" },
  blocked: { label: "Bloqueado", color: "#FF3B30", bg: "rgba(255,59,48,0.08)" },
};

const statusIcons = { done: Check, in_progress: RotateCw, pending: Square, blocked: Square };

export default function ProjectPipeline() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const toggleTaskStatus = (projectId: string, taskId: string) => {
    setProjects((prev) => prev.map((p) => p.id === projectId
      ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status: (t.status === "done" ? "pending" : t.status === "pending" ? "in_progress" : "done") as TaskStatus } : t) }
      : p));
  };

  const getProgress = (project: Project) => {
    const done = project.tasks.filter((t) => t.status === "done").length;
    return Math.round((done / project.tasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "hsl(220,30%,10%)" }}>Pipeline de Projetos</h2>
          <p className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>Acompanhamento de projetos pontuais</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>
          {projects.filter((p) => p.status !== "pending").length}/{projects.length} em execução
        </span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((project, i) => {
          const progress = getProgress(project);
          const isActive = activeProject === project.id;
          const st = statusConfig[project.status];
          const PIcon = project.Icon;

          return (
            <motion.div key={project.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", damping: 20 }}
              className="ios-card overflow-hidden" style={{ borderTop: `3px solid ${project.color}` }}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: project.colorLight }}>
                    <PIcon size={18} style={{ color: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: "hsl(220,30%,10%)" }}>{project.name}</div>
                    <div className="text-[10px] flex items-center gap-1" style={{ color: "hsl(220,10%,55%)" }}><Clock size={10} /> {project.deadline}</div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <p className="text-xs mb-3" style={{ color: "hsl(220,10%,50%)" }}>{project.description}</p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "hsl(220,10%,55%)" }}>Progresso</span>
                    <span className="font-bold" style={{ color: project.color }}>{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(120,120,128,0.08)" }}>
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ backgroundColor: project.color }} />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: "hsl(220,10%,55%)" }}>
                    <span>{project.tasks.filter(t => t.status === "done").length}/{project.tasks.length} tarefas</span>
                    <span>{project.totalHours}h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px]" style={{ color: "hsl(220,10%,55%)" }}>Remuneração</div>
                    <div className="text-sm font-bold" style={{ color: project.color }}>R$ {project.totalRemuneration.toLocaleString("pt-BR")}</div>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveProject(isActive ? null : project.id)}
                    className="text-xs font-medium px-3.5 py-2 rounded-xl transition-colors"
                    style={{ background: project.colorLight, color: project.color }}>
                    {isActive ? "Ocultar" : "Ver tarefas"}
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {isActive && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-3" style={{ borderTop: "1px solid rgba(120,120,128,0.08)" }}>
                      <div className="text-[10px] font-bold tracking-wider mb-2" style={{ color: "hsl(220,10%,55%)" }}>TAREFAS</div>
                      <div className="space-y-1.5">
                        {project.tasks.map((task) => {
                          const SIcon = statusIcons[task.status];
                          return (
                            <motion.div key={task.id} whileTap={{ scale: 0.98 }}
                              className="flex items-start gap-2 p-2.5 rounded-xl cursor-pointer transition-colors"
                              style={{ background: "rgba(120,120,128,0.04)" }}
                              onClick={() => toggleTaskStatus(project.id, task.id)}>
                              <SIcon size={14} className="mt-0.5 shrink-0" style={{ color: statusConfig[task.status].color }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs truncate" style={{ color: "hsl(220,15%,30%)", textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.name}</div>
                                <div className="text-[10px]" style={{ color: "hsl(220,10%,55%)" }}>{task.responsible} · {task.hours}h · R$ {task.remuneration}</div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] mt-2 text-center" style={{ color: "hsl(220,10%,55%)" }}>Clique para avançar status</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Financial summary */}
      <div className="ios-card p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: "hsl(220,30%,10%)" }}>Resumo Financeiro</h3>
        <div className="space-y-2">
          {projects.map((p) => {
            const PI = p.Icon;
            return (
              <div key={p.id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl" style={{ background: "rgba(120,120,128,0.04)" }}>
                <div className="flex items-center gap-2">
                  <PI size={14} style={{ color: p.color }} />
                  <span className="text-sm font-medium" style={{ color: "hsl(220,20%,25%)" }}>{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: p.color }}>R$ {p.totalRemuneration.toLocaleString("pt-BR")}</span>
                  <span className="text-xs" style={{ color: "hsl(220,10%,55%)" }}>{p.totalHours}h</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(120,120,128,0.1)" }}>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>Total de Horas</span>
            <span className="font-bold" style={{ color: "hsl(220,20%,25%)" }}>{projects.reduce((s, p) => s + p.totalHours, 0)}h</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold" style={{ color: "hsl(220,20%,25%)" }}>Investimento Total</span>
            <span className="text-xl font-bold" style={{ color: "#007AFF" }}>R$ {projects.reduce((s, p) => s + p.totalRemuneration, 0).toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
