import { useState } from "react";
import { Settings, Globe, FileText, Camera, MessageCircle, Clock, Radio, PenTool, Palette, Brain, Monitor, Check, RotateCw, Square } from "lucide-react";

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
    Icon: Settings, color: "#1E6FD9", colorLight: "#EFF6FF", totalHours: 40, totalRemuneration: 2400, deadline: "Semana 1-2", status: "in_progress",
    tasks: [
      { id: "s1", name: "Auditoria de contas (Meta, Google, Analytics)", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 4, remuneration: 95, status: "done", week: "S1" },
      { id: "s2", name: "Configuração de pixel Meta e tag Google", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 3, remuneration: 71, status: "done", week: "S1" },
      { id: "s3", name: "Estruturação de campanhas iniciais (funil completo)", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 8, remuneration: 190, status: "in_progress", week: "S1" },
      { id: "s4", name: "Definição de identidade visual e guia de marca", responsible: "Estrategista", responsibleIcon: "strategy", hours: 4, remuneration: 225, status: "done", week: "S1" },
      { id: "s5", name: "Briefing completo de conteúdo e tom de voz", responsible: "Estrategista", responsibleIcon: "strategy", hours: 3, remuneration: 169, status: "done", week: "S1" },
      { id: "s6", name: "Criação de templates de posts (feed, stories, reels)", responsible: "Designer", responsibleIcon: "design", hours: 8, remuneration: 200, status: "in_progress", week: "S2" },
      { id: "s7", name: "Produção de copies de referência (swipe file)", responsible: "Copywriter", responsibleIcon: "copy", hours: 6, remuneration: 160, status: "pending", week: "S2" },
      { id: "s8", name: "Configuração de CRM e fluxo de leads", responsible: "Estrategista", responsibleIcon: "strategy", hours: 4, remuneration: 225, status: "pending", week: "S2" },
    ],
  },
  {
    id: "website", name: "Criação de Website", description: "Desenvolvimento completo do site institucional da Endocenter",
    Icon: Globe, color: "#7C3AED", colorLight: "#F5F3FF", totalHours: 65, totalRemuneration: 4800, deadline: "Semanas 2-4", status: "pending",
    tasks: [
      { id: "w1", name: "Wireframe e arquitetura de informação", responsible: "Estrategista", responsibleIcon: "strategy", hours: 5, remuneration: 281, status: "pending", week: "S2" },
      { id: "w2", name: "Copywriting completo do site (todas as páginas)", responsible: "Copywriter", responsibleIcon: "copy", hours: 12, remuneration: 320, status: "pending", week: "S2" },
      { id: "w3", name: "Design das páginas (UI/UX completo)", responsible: "Designer", responsibleIcon: "design", hours: 20, remuneration: 500, status: "pending", week: "S2-S3" },
      { id: "w4", name: "Desenvolvimento front-end e integração", responsible: "Externo (Dev)", responsibleIcon: "dev", hours: 20, remuneration: 2500, status: "pending", week: "S3" },
      { id: "w5", name: "SEO On-page e otimização de velocidade", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 4, remuneration: 95, status: "pending", week: "S4" },
      { id: "w6", name: "Revisão final e aprovação do cliente", responsible: "Estrategista", responsibleIcon: "strategy", hours: 4, remuneration: 225, status: "pending", week: "S4" },
    ],
  },
  {
    id: "lp", name: "Landing Pages", description: "Criação de LPs de alta conversão para campanhas específicas",
    Icon: FileText, color: "#DC2626", colorLight: "#FFF1F2", totalHours: 25, totalRemuneration: 1800, deadline: "Semana 2", status: "in_progress",
    tasks: [
      { id: "l1", name: "Definição de objetivo e público da LP", responsible: "Estrategista", responsibleIcon: "strategy", hours: 2, remuneration: 113, status: "done", week: "S1" },
      { id: "l2", name: "Copywriting da LP (headline, benefícios, CTA)", responsible: "Copywriter", responsibleIcon: "copy", hours: 6, remuneration: 160, status: "in_progress", week: "S2" },
      { id: "l3", name: "Design completo da LP (responsivo)", responsible: "Designer", responsibleIcon: "design", hours: 8, remuneration: 200, status: "pending", week: "S2" },
      { id: "l4", name: "Integração com formulário e CRM", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 3, remuneration: 71, status: "pending", week: "S2" },
      { id: "l5", name: "Configuração de pixel e rastreamento", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 2, remuneration: 48, status: "pending", week: "S2" },
      { id: "l6", name: "Teste de velocidade e aprovação final", responsible: "Estrategista", responsibleIcon: "strategy", hours: 2, remuneration: 113, status: "pending", week: "S3" },
      { id: "l7", name: "Lançamento e vinculação às campanhas", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 2, remuneration: 48, status: "pending", week: "S3" },
    ],
  },
  {
    id: "photo", name: "Sessão Fotográfica", description: "Produção de material fotográfico da clínica e dos médicos",
    Icon: Camera, color: "#059669", colorLight: "#ECFDF5", totalHours: 16, totalRemuneration: 1200, deadline: "Semana 3", status: "pending",
    tasks: [
      { id: "p1", name: "Briefing criativo (moodboard, lista de takes)", responsible: "Designer", responsibleIcon: "design", hours: 2, remuneration: 50, status: "pending", week: "S2" },
      { id: "p2", name: "Seleção de fotógrafo e orçamento", responsible: "Estrategista", responsibleIcon: "strategy", hours: 2, remuneration: 113, status: "pending", week: "S2" },
      { id: "p3", name: "Coordenação da sessão (dia da foto)", responsible: "Designer", responsibleIcon: "design", hours: 4, remuneration: 100, status: "pending", week: "S3" },
      { id: "p4", name: "Edição e tratamento das fotos", responsible: "Designer", responsibleIcon: "design", hours: 6, remuneration: 150, status: "pending", week: "S3" },
      { id: "p5", name: "Organização do banco de imagens final", responsible: "Designer", responsibleIcon: "design", hours: 2, remuneration: 50, status: "pending", week: "S3" },
    ],
  },
  {
    id: "whatsapp", name: "Automação de WhatsApp", description: "Fluxo automatizado de atendimento e nutrição de leads via WhatsApp",
    Icon: MessageCircle, color: "#0D9488", colorLight: "#F0FDFA", totalHours: 20, totalRemuneration: 1800, deadline: "Semana 4", status: "pending",
    tasks: [
      { id: "a1", name: "Mapeamento da jornada do paciente (fluxo)", responsible: "Estrategista", responsibleIcon: "strategy", hours: 3, remuneration: 169, status: "pending", week: "S2" },
      { id: "a2", name: "Criação dos textos de todas as mensagens", responsible: "Copywriter", responsibleIcon: "copy", hours: 6, remuneration: 160, status: "pending", week: "S3" },
      { id: "a3", name: "Configuração da ferramenta (ManyChat/Z-API)", responsible: "Gestor de Tráfego", responsibleIcon: "traffic", hours: 5, remuneration: 119, status: "pending", week: "S3" },
      { id: "a4", name: "Criação de mídias visuais para o bot", responsible: "Designer", responsibleIcon: "design", hours: 3, remuneration: 75, status: "pending", week: "S3" },
      { id: "a5", name: "Testes de fluxo e QA completo", responsible: "Estrategista", responsibleIcon: "strategy", hours: 3, remuneration: 169, status: "pending", week: "S4" },
    ],
  },
];

const statusConfig = {
  pending: { label: "Pendente", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  in_progress: { label: "Em andamento", color: "#1E6FD9", bg: "#EFF6FF", border: "#BFDBFE" },
  done: { label: "Concluído", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  blocked: { label: "Bloqueado", color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" },
};

const statusIcons = { done: Check, in_progress: RotateCw, pending: Square, blocked: Square };

export default function ProjectPipeline() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const toggleTaskStatus = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status: (t.status === "done" ? "pending" : t.status === "pending" ? "in_progress" : "done") as TaskStatus } : t) }
          : p
      )
    );
  };

  const getProgress = (project: Project) => {
    const done = project.tasks.filter((t) => t.status === "done").length;
    return Math.round((done / project.tasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#0A1628" }}>Pipeline de Projetos Pontuais</h2>
          <p className="text-sm text-slate-500">Acompanhamento de projetos com início, meio e fim</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#1E6FD9" }}>
          {projects.filter((p) => p.status !== "pending").length}/{projects.length} em execução
        </span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const progress = getProgress(project);
          const isActive = activeProject === project.id;
          const st = statusConfig[project.status];
          const PIcon = project.Icon;

          return (
            <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ borderTop: `3px solid ${project.color}` }}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: project.colorLight }}>
                    <PIcon size={20} style={{ color: project.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-800">{project.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> {project.deadline}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                </div>
                <p className="text-xs text-slate-500">{project.description}</p>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Progresso</span>
                    <span className="font-bold" style={{ color: project.color }}>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{project.tasks.filter(t => t.status === "done").length}/{project.tasks.length} tarefas</span>
                    <span>{project.totalHours}h estimadas</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Remuneração adicional</div>
                    <div className="text-sm font-bold" style={{ color: project.color }}>R$ {project.totalRemuneration.toLocaleString("pt-BR")}</div>
                  </div>
                  <button onClick={() => setActiveProject(isActive ? null : project.id)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: project.colorLight, color: project.color, border: `1px solid ${project.color}30` }}
                  >
                    {isActive ? "Ocultar" : "Ver tarefas"}
                  </button>
                </div>
              </div>

              {isActive && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-3">
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">TAREFAS DO PROJETO</div>
                  <div className="space-y-1.5">
                    {project.tasks.map((task) => {
                      const SIcon = statusIcons[task.status];
                      return (
                        <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleTaskStatus(project.id, task.id)}>
                          <SIcon size={14} className="mt-0.5 shrink-0" style={{ color: statusConfig[task.status].color }} />
                          <div className="flex-1">
                            <div className="text-xs text-slate-700" style={{ textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{task.responsible} · {task.hours}h · R$ {task.remuneration} · {task.week}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">Clique em uma tarefa para avançar seu status</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: "#0A1628" }}>Resumo Financeiro dos Projetos Pontuais</h3>
        <div className="space-y-2">
          {projects.map((p) => {
            const PI = p.Icon;
            return (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <PI size={14} style={{ color: p.color }} />
                  <span className="text-sm font-medium text-slate-700">{p.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold" style={{ color: p.color }}>R$ {p.totalRemuneration.toLocaleString("pt-BR")}</span>
                  <span className="text-xs text-slate-400">{p.totalHours}h</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Total de Horas Adicionais</span>
            <span className="font-bold text-slate-700">{projects.reduce((s, p) => s + p.totalHours, 0)}h</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold text-slate-700">Investimento Total (Projetos)</span>
            <span className="text-xl font-bold" style={{ color: "#1E6FD9" }}>R$ {projects.reduce((s, p) => s + p.totalRemuneration, 0).toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
