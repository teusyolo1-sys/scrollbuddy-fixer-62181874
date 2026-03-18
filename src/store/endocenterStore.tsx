import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MetricPeriod = "Diária" | "Semanal" | "Mensal" | "Anual";
export type TaskStatus = "pending" | "in_progress" | "done" | "blocked";
export type DeadlinePriority = "critical" | "high" | "medium" | "low";
export type DeadlineStatus = "on_track" | "at_risk" | "overdue" | "done";
export type BudgetCategory = "investimento" | "gasto" | "faturamento" | "receita" | "despesa";

export interface BudgetEntry {
  id: string;
  description: string;
  category: BudgetCategory;
  amount: number;
  date: string;
  participants: string[]; // team member ids
  notes: string;
}

export interface TeamMember {
  id: string;
  role: string;
  name: string;
  specialty: string;
  caseNotes: string;
  photoUrl: string;
  color: string;
  colorLight: string;
  colorBorder: string;
  remuneration: number;
  hours: number;
  tasks: string[];
  kpis: string[];
  status: string;
}

export interface TabLabels {
  dashboard: string;
  schedule: string;
  pipeline: string;
  matrix: string;
  workflow: string;
  deadlines: string;
  budget: string;
  team: string;
  files: string;
}

export const defaultTabLabels: TabLabels = {
  dashboard: "Dashboard",
  schedule: "Cronograma",
  pipeline: "Pipeline",
  matrix: "Responsabilidades",
  workflow: "Fluxo",
  deadlines: "Prazos & Crises",
  budget: "Orçamento",
  team: "Time",
  files: "Arquivos",
};

export interface CompanyInfo {
  name: string;
  subtitle: string;
  month: string;
  createdAt: string;
  tabLabels?: TabLabels;
}

export interface MetricEntry {
  id: string;
  name: string;
  period: MetricPeriod;
  value: number;
  target: number;
  notes: string;
  updatedAt: string;
}

export interface ScheduleTask {
  id: string;
  role: string;
  task: string;
  type: string;
  hours: number;
  color: string;
}

export interface ScheduleWeek {
  id: string;
  week: string;
  dates: string;
  theme: string;
  themeColor: string;
  tasks: ScheduleTask[];
}

export interface PipelineTask {
  id: string;
  name: string;
  responsible: string;
  hours: number;
  remuneration: number;
  status: TaskStatus;
  week: string;
}

export interface PipelineProject {
  id: string;
  name: string;
  description: string;
  icon: "settings" | "globe" | "file" | "camera" | "message";
  color: string;
  colorLight: string;
  totalHours: number;
  totalRemuneration: number;
  deadline: string;
  status: TaskStatus;
  tasks: PipelineTask[];
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface TaskChecklist {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: "image" | "link" | "file";
}

export interface ResponsibilityItem {
  id: string;
  task: string;
  done: boolean;
  critical: boolean;
  description: string;
  labels: TaskLabel[];
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignees: string[];
  checklist: TaskChecklist[];
  attachments: TaskAttachment[];
  timerSeconds: number;
  timerRunning: boolean;
  createdAt: string;
  completedAt: string;
  cover: string;
}

export interface ResponsibilityRole {
  id: string;
  role: string;
  color: string;
  colorLight: string;
  colorBorder: string;
  description: string;
  weekly: ResponsibilityItem[];
  monthly: ResponsibilityItem[];
  quality: ResponsibilityItem[];
}

export interface WorkflowTask {
  id: string;
  name: string;
  done: boolean;
}

export interface WorkflowStep {
  id: string;
  number: string;
  title: string;
  owner: string;
  color: string;
  colorLight: string;
  duration: string;
  inputs: string[];
  outputs: string[];
  rules: string[];
  tasks: WorkflowTask[];
}

export interface DeadlineRecord {
  id: string;
  task: string;
  responsible: string;
  dueDay: string;
  frequency: string;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  consequence: string;
}

export interface CrisisScenario {
  id: string;
  scenario: string;
  impact: string;
  color: string;
  steps: string[];
}

interface EndocenterStore {
  company: CompanyInfo;
  setCompany: (company: CompanyInfo) => void;

  team: TeamMember[];
  setTeam: (team: TeamMember[]) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  addMember: () => void;
  removeMember: (id: string) => void;

  metricEntries: MetricEntry[];
  addMetric: () => void;
  updateMetric: (id: string, updates: Partial<MetricEntry>) => void;
  removeMetric: (id: string) => void;

  scheduleWeeks: ScheduleWeek[];
  setScheduleWeeks: (weeks: ScheduleWeek[]) => void;
  updateScheduleWeek: (weekId: string, updates: Partial<ScheduleWeek>) => void;
  addScheduleTask: (weekId: string, role?: string) => void;
  updateScheduleTask: (weekId: string, taskId: string, updates: Partial<ScheduleTask>) => void;
  removeScheduleTask: (weekId: string, taskId: string) => void;

  pipelineProjects: PipelineProject[];
  setPipelineProjects: (projects: PipelineProject[]) => void;
  updatePipelineProject: (projectId: string, updates: Partial<PipelineProject>) => void;
  addPipelineProject: () => void;
  removePipelineProject: (projectId: string) => void;
  addPipelineTask: (projectId: string) => void;
  updatePipelineTask: (projectId: string, taskId: string, updates: Partial<PipelineTask>) => void;
  removePipelineTask: (projectId: string, taskId: string) => void;

  responsibilityRoles: ResponsibilityRole[];
  setResponsibilityRoles: (roles: ResponsibilityRole[]) => void;
  updateResponsibilityRole: (roleId: string, updates: Partial<ResponsibilityRole>) => void;
  addResponsibilityRoleItem: (roleId: string, list: "weekly" | "monthly" | "quality") => void;
  updateResponsibilityRoleItem: (
    roleId: string,
    list: "weekly" | "monthly" | "quality",
    itemId: string,
    updates: Partial<ResponsibilityItem>
  ) => void;
  removeResponsibilityRoleItem: (roleId: string, list: "weekly" | "monthly" | "quality", itemId: string) => void;

  workflowSteps: WorkflowStep[];
  setWorkflowSteps: (steps: WorkflowStep[]) => void;
  updateWorkflowStep: (stepId: string, updates: Partial<WorkflowStep>) => void;
  addWorkflowStep: () => void;
  removeWorkflowStep: (stepId: string) => void;

  deadlines: DeadlineRecord[];
  setDeadlines: (deadlines: DeadlineRecord[]) => void;
  updateDeadline: (id: string, updates: Partial<DeadlineRecord>) => void;
  addDeadline: () => void;
  removeDeadline: (id: string) => void;

  crisisScenarios: CrisisScenario[];
  setCrisisScenarios: (scenarios: CrisisScenario[]) => void;
  updateCrisisScenario: (id: string, updates: Partial<CrisisScenario>) => void;
  addCrisisScenario: () => void;
  removeCrisisScenario: (id: string) => void;

  budgetEntries: BudgetEntry[];
  addBudgetEntry: (category: BudgetCategory) => void;
  updateBudgetEntry: (id: string, updates: Partial<BudgetEntry>) => void;
  removeBudgetEntry: (id: string) => void;

  // Visual persistence
  chartStyles: Record<string, string>;
  setChartStyles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  chartColors: Record<string, string>;
  setChartColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  funnelPalette: Record<string, string>;
  setFunnelPalette: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sectionCollapsed: Record<string, boolean>;
  setSectionCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeFilters: Record<string, string>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const getStorageKey = (companyId?: string) => companyId ? `endocenter_${companyId}` : "endocenter_settings";
const STORAGE_KEY = "endocenter_settings";

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const createRespItem = (task: string, critical: boolean): ResponsibilityItem => ({
  id: createId("resp"),
  task,
  done: false,
  critical,
  description: "",
  labels: [],
  dueDate: "",
  priority: critical ? "high" : "medium",
  assignees: [],
  checklist: [],
  attachments: [],
  timerSeconds: 0,
  timerRunning: false,
  createdAt: new Date().toISOString(),
  completedAt: "",
  cover: "",
});

const hydrateRespItem = (item: any): ResponsibilityItem => ({
  description: "", labels: [], dueDate: "", priority: item.critical ? "high" : "medium",
  assignees: [], checklist: [], attachments: [], timerSeconds: 0, timerRunning: false,
  createdAt: new Date().toISOString(), completedAt: "", cover: "",
  ...item,
});

const withColorPalette = (member: TeamMember): TeamMember => ({
  ...member,
  colorLight: `${member.color}1A`,
  colorBorder: `${member.color}33`,
});

const defaultCompany: CompanyInfo = {
  name: "Endocenter",
  subtitle: "Gestão operacional de marketing",
  month: "Março 2025",
  createdAt: new Date().toISOString(),
};

const defaultTeam: TeamMember[] = [
  {
    id: "traffic",
    role: "Gestor de Tráfego",
    name: "Rafael Almeida",
    specialty: "Meta Ads, Google Ads e análise de funil",
    caseNotes: "Escalou campanhas de leads qualificados com ROAS consistente acima de 3,5x.",
    photoUrl: "",
    color: "#1E6FD9",
    colorLight: "#EFF6FF",
    colorBorder: "#BFDBFE",
    remuneration: 3800,
    hours: 160,
    tasks: ["Gestão Meta Ads & Google Ads", "Otimização de campanhas", "Relatórios de performance"],
    kpis: ["CPL < R$25", "ROAS > 3.5x", "CTR > 2%"],
    status: "Ativo",
  },
  {
    id: "copy",
    role: "Copywriter",
    name: "Fernanda Costa",
    specialty: "Copy de anúncios, e-mails e WhatsApp",
    caseNotes: "Aumentou taxa de resposta em campanhas de reativação com novos scripts curtos.",
    photoUrl: "",
    color: "#7C3AED",
    colorLight: "#F5F3FF",
    colorBorder: "#DDD6FE",
    remuneration: 3200,
    hours: 120,
    tasks: ["Textos para anúncios", "Legendas de posts", "Scripts de vídeo"],
    kpis: ["4 copies/semana", "Aprovação em 1ª rodada > 80%", "Taxa abertura email > 30%"],
    status: "Ativo",
  },
  {
    id: "design",
    role: "Designer",
    name: "Daniel Bryan",
    specialty: "Criativos de performance e identidade visual",
    caseNotes: "Padronizou templates e reduziu retrabalho de aprovação semanal.",
    photoUrl: "",
    color: "#DC2626",
    colorLight: "#FFF1F2",
    colorBorder: "#FECDD3",
    remuneration: 3000,
    hours: 120,
    tasks: ["Criação de posts e stories", "Artes para anúncios", "Diagramação de LPs"],
    kpis: ["12 peças/semana", "Aprovação em 1ª rodada > 75%", "Entrega no prazo > 95%"],
    status: "Ativo",
  },
  {
    id: "strategy",
    role: "Estrategista",
    name: "João Leão",
    specialty: "Planejamento e direção estratégica",
    caseNotes: "Consolidou governança mensal com briefing antecipado e maior previsibilidade da operação.",
    photoUrl: "",
    color: "#059669",
    colorLight: "#ECFDF5",
    colorBorder: "#A7F3D0",
    remuneration: 4500,
    hours: 80,
    tasks: ["Planejamento mensal", "Briefings da equipe", "Relatório estratégico"],
    kpis: ["Briefing até dia 25", "Aprovação em <24h", "Meta mensal de leads"],
    status: "Ativo",
  },
];

const defaultMetricEntries: MetricEntry[] = [
  {
    id: createId("metric"),
    name: "Leads qualificados",
    period: "Diária",
    value: 18,
    target: 20,
    notes: "Média da última semana.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: createId("metric"),
    name: "CPL médio",
    period: "Semanal",
    value: 22,
    target: 25,
    notes: "Abaixo da meta de custo.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: createId("metric"),
    name: "ROAS",
    period: "Mensal",
    value: 3.8,
    target: 3.5,
    notes: "Campanhas médicas em crescimento.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: createId("metric"),
    name: "Receita atribuída",
    period: "Anual",
    value: 840000,
    target: 900000,
    notes: "Meta anual vigente.",
    updatedAt: new Date().toISOString(),
  },
];

const defaultScheduleWeeks: ScheduleWeek[] = [
  {
    id: "week_1",
    week: "Semana 1",
    dates: "01 – 07",
    theme: "Planejamento e lançamento",
    themeColor: "#1E6FD9",
    tasks: [
      { id: createId("sched"), role: "Estrategista", task: "Briefing mensal completo", type: "planejamento", hours: 3, color: "#059669" },
      { id: createId("sched"), role: "Gestor de Tráfego", task: "Ajuste inicial de campanhas", type: "operação", hours: 4, color: "#1E6FD9" },
      { id: createId("sched"), role: "Copywriter", task: "4 copies para anúncios", type: "entregável", hours: 5, color: "#7C3AED" },
      { id: createId("sched"), role: "Designer", task: "Criativos da semana", type: "entregável", hours: 8, color: "#DC2626" },
    ],
  },
  {
    id: "week_2",
    week: "Semana 2",
    dates: "08 – 14",
    theme: "Execução e otimização",
    themeColor: "#7C3AED",
    tasks: [
      { id: createId("sched"), role: "Gestor de Tráfego", task: "Teste A/B de criativos", type: "análise", hours: 3, color: "#1E6FD9" },
      { id: createId("sched"), role: "Copywriter", task: "Legendas para 8 posts", type: "entregável", hours: 4, color: "#7C3AED" },
      { id: createId("sched"), role: "Designer", task: "Adaptações de anúncios", type: "revisão", hours: 5, color: "#DC2626" },
      { id: createId("sched"), role: "Estrategista", task: "Alinhamento tático semanal", type: "reunião", hours: 1, color: "#059669" },
    ],
  },
  {
    id: "week_3",
    week: "Semana 3",
    dates: "15 – 21",
    theme: "Escala e ajustes",
    themeColor: "#DC2626",
    tasks: [
      { id: createId("sched"), role: "Gestor de Tráfego", task: "Escalada de orçamento dos melhores anúncios", type: "operação", hours: 4, color: "#1E6FD9" },
      { id: createId("sched"), role: "Copywriter", task: "Mensagens de WhatsApp da campanha", type: "entregável", hours: 3, color: "#7C3AED" },
      { id: createId("sched"), role: "Designer", task: "Peças especiais para datas", type: "entregável", hours: 6, color: "#DC2626" },
      { id: createId("sched"), role: "Estrategista", task: "Revisão de KPIs quinzenais", type: "análise", hours: 2, color: "#059669" },
    ],
  },
  {
    id: "week_4",
    week: "Semana 4",
    dates: "22 – 31",
    theme: "Fechamento e próximo ciclo",
    themeColor: "#059669",
    tasks: [
      { id: createId("sched"), role: "Estrategista", task: "Relatório mensal e metas", type: "entregável", hours: 4, color: "#059669" },
      { id: createId("sched"), role: "Gestor de Tráfego", task: "Consolidado Meta + Google", type: "entregável", hours: 5, color: "#1E6FD9" },
      { id: createId("sched"), role: "Copywriter", task: "Copies antecipadas do próximo mês", type: "planejamento", hours: 5, color: "#7C3AED" },
      { id: createId("sched"), role: "Designer", task: "Pacote visual antecipado", type: "entregável", hours: 7, color: "#DC2626" },
    ],
  },
];

const defaultPipelineProjects: PipelineProject[] = [
  {
    id: "pipeline_setup",
    name: "Setup Inicial",
    description: "Estrutura de marketing e rastreamento",
    icon: "settings",
    color: "#1E6FD9",
    colorLight: "#DBEAFE",
    totalHours: 34,
    totalRemuneration: 2400,
    deadline: "Semanas 1-2",
    status: "in_progress",
    tasks: [
      { id: createId("ptask"), name: "Auditoria de contas", responsible: "Gestor de Tráfego", hours: 4, remuneration: 95, status: "done", week: "S1" },
      { id: createId("ptask"), name: "Configuração de pixel", responsible: "Gestor de Tráfego", hours: 3, remuneration: 71, status: "done", week: "S1" },
      { id: createId("ptask"), name: "Briefing base de conteúdo", responsible: "Estrategista", hours: 3, remuneration: 169, status: "in_progress", week: "S1" },
      { id: createId("ptask"), name: "Templates iniciais", responsible: "Designer", hours: 8, remuneration: 200, status: "pending", week: "S2" },
    ],
  },
  {
    id: "pipeline_site",
    name: "Criação de Website",
    description: "Site institucional e páginas de conversão",
    icon: "globe",
    color: "#7C3AED",
    colorLight: "#EDE9FE",
    totalHours: 65,
    totalRemuneration: 4800,
    deadline: "Semanas 2-4",
    status: "pending",
    tasks: [
      { id: createId("ptask"), name: "Arquitetura e wireframe", responsible: "Estrategista", hours: 5, remuneration: 280, status: "pending", week: "S2" },
      { id: createId("ptask"), name: "Copy das páginas", responsible: "Copywriter", hours: 10, remuneration: 320, status: "pending", week: "S2" },
      { id: createId("ptask"), name: "UI das páginas", responsible: "Designer", hours: 16, remuneration: 500, status: "pending", week: "S3" },
    ],
  },
  {
    id: "pipeline_lp",
    name: "Landing Pages",
    description: "LPs de alta conversão para campanhas",
    icon: "file",
    color: "#DC2626",
    colorLight: "#FEE2E2",
    totalHours: 25,
    totalRemuneration: 1800,
    deadline: "Semana 2",
    status: "in_progress",
    tasks: [
      { id: createId("ptask"), name: "Estrutura da LP", responsible: "Estrategista", hours: 2, remuneration: 113, status: "done", week: "S1" },
      { id: createId("ptask"), name: "Copy da LP", responsible: "Copywriter", hours: 6, remuneration: 160, status: "in_progress", week: "S2" },
      { id: createId("ptask"), name: "Design responsivo", responsible: "Designer", hours: 8, remuneration: 200, status: "pending", week: "S2" },
    ],
  },
];

const defaultResponsibilityRoles: ResponsibilityRole[] = [
  {
    id: "resp_strategy", role: "Estrategista", color: "#059669", colorLight: "#ECFDF5", colorBorder: "#A7F3D0",
    description: "Direção estratégica e aprovação final.",
    weekly: [createRespItem("Briefing semanal entregue até segunda", true), createRespItem("Aprovação de criativos e copies", true)],
    monthly: [createRespItem("Planejamento mensal até dia 25", true), createRespItem("Relatório estratégico mensal", true)],
    quality: [createRespItem("Nada é publicado sem aprovação", true), createRespItem("Checklist de qualidade preenchido", false)],
  },
  {
    id: "resp_traffic", role: "Gestor de Tráfego", color: "#1E6FD9", colorLight: "#EFF6FF", colorBorder: "#BFDBFE",
    description: "Performance e escala de campanhas.",
    weekly: [createRespItem("Otimizações de campanha 3x na semana", true), createRespItem("Relatório semanal de mídia", true)],
    monthly: [createRespItem("Consolidado mensal de desempenho", true), createRespItem("Revisão de públicos e verba", false)],
    quality: [createRespItem("CPL dentro da meta", true), createRespItem("Pixels e tags revisados", true)],
  },
  {
    id: "resp_copy", role: "Copywriter", color: "#7C3AED", colorLight: "#F5F3FF", colorBorder: "#DDD6FE",
    description: "Mensagens de alto impacto e conversão.",
    weekly: [createRespItem("Copies de anúncios até terça", true), createRespItem("Legendas da semana prontas", true)],
    monthly: [createRespItem("Banco de copies atualizado", false), createRespItem("4 copies antecipadas", true)],
    quality: [createRespItem("CTA claro em toda copy", true), createRespItem("Tom de voz consistente", true)],
  },
  {
    id: "resp_design", role: "Designer", color: "#DC2626", colorLight: "#FFF1F2", colorBorder: "#FECDD3",
    description: "Execução visual com padrão de marca.",
    weekly: [createRespItem("Criativos semanais no prazo", true), createRespItem("Adaptações em até 24h", false)],
    monthly: [createRespItem("Pacote visual antecipado", true), createRespItem("Organização do acervo", false)],
    quality: [createRespItem("Uso correto do guia de marca", true), createRespItem("Checagem final de peças", true)],
  },
];

const defaultWorkflowSteps: WorkflowStep[] = [
  {
    id: "flow_1", number: "01", title: "Planejamento Estratégico", owner: "Estrategista",
    color: "#059669", colorLight: "#ECFDF5", duration: "Dia 25 do mês anterior",
    inputs: ["Metas mensais", "Resultados do mês anterior"],
    outputs: ["Calendário editorial", "Briefings por função"],
    rules: ["Briefing entregue até segunda", "Mudança estratégica comunicada com 48h"],
    tasks: [
      { id: "ft_1a", name: "Definir metas do mês", done: false },
      { id: "ft_1b", name: "Montar calendário editorial", done: false },
      { id: "ft_1c", name: "Enviar briefings por função", done: false },
    ],
  },
  {
    id: "flow_2", number: "02", title: "Produção de Copy", owner: "Copywriter",
    color: "#7C3AED", colorLight: "#F5F3FF", duration: "48h após briefing",
    inputs: ["Briefing aprovado", "Tom de voz"],
    outputs: ["Copy para anúncios", "Legendas e scripts"],
    rules: ["Máximo 2 rodadas de revisão", "Entrega até terça"],
    tasks: [
      { id: "ft_2a", name: "Redigir copies de anúncios", done: false },
      { id: "ft_2b", name: "Criar legendas para posts", done: false },
      { id: "ft_2c", name: "Escrever scripts de vídeo", done: false },
    ],
  },
  {
    id: "flow_3", number: "03", title: "Criação Visual", owner: "Designer",
    color: "#DC2626", colorLight: "#FFF1F2", duration: "48-72h após aprovação",
    inputs: ["Copy aprovada", "Guia de marca"],
    outputs: ["Criativos e artes", "Peças para campanha"],
    rules: ["Sem copy aprovada não inicia", "Correções em até 24h"],
    tasks: [
      { id: "ft_3a", name: "Criar criativos para ads", done: false },
      { id: "ft_3b", name: "Adaptar peças por formato", done: false },
      { id: "ft_3c", name: "Enviar para aprovação", done: false },
    ],
  },
  {
    id: "flow_4", number: "04", title: "Aprovação Final", owner: "Estrategista",
    color: "#0EA5E9", colorLight: "#E0F2FE", duration: "24h",
    inputs: ["Peças finalizadas", "Contexto da campanha"],
    outputs: ["Aprovação registrada", "Liberado para publicação"],
    rules: ["Registro escrito obrigatório", "Follow-up se passar de 24h"],
    tasks: [
      { id: "ft_4a", name: "Revisar peças visuais", done: false },
      { id: "ft_4b", name: "Validar copies finais", done: false },
      { id: "ft_4c", name: "Registrar aprovação", done: false },
    ],
  },
  {
    id: "flow_5", number: "05", title: "Publicação e Tráfego", owner: "Gestor de Tráfego",
    color: "#1E6FD9", colorLight: "#EFF6FF", duration: "Conforme calendário",
    inputs: ["Aprovação final", "Públicos e orçamento"],
    outputs: ["Campanhas ativas", "Relatório semanal"],
    rules: ["Não publicar sem aprovação", "Monitoramento diário"],
    tasks: [
      { id: "ft_5a", name: "Subir campanhas", done: false },
      { id: "ft_5b", name: "Configurar públicos", done: false },
      { id: "ft_5c", name: "Monitorar métricas diárias", done: false },
    ],
  },
  {
    id: "flow_6", number: "06", title: "Análise e Feedback", owner: "Estrategista + Gestor",
    color: "#F59E0B", colorLight: "#FFFBEB", duration: "Sexta-feira",
    inputs: ["Relatórios semanais", "Métricas de engajamento"],
    outputs: ["Ajustes da semana seguinte", "Plano de ação"],
    rules: ["Reunião semanal fixa", "Plano de crise se 2 semanas abaixo da meta"],
    tasks: [
      { id: "ft_6a", name: "Compilar relatório semanal", done: false },
      { id: "ft_6b", name: "Reunião de alinhamento", done: false },
      { id: "ft_6c", name: "Definir ajustes da próxima semana", done: false },
    ],
  },
];

const defaultDeadlines: DeadlineRecord[] = [
  {
    id: createId("deadline"),
    task: "Briefing mensal entregue",
    responsible: "Estrategista",
    dueDay: "Dia 25",
    frequency: "Mensal",
    priority: "critical",
    status: "on_track",
    consequence: "Equipe sem direção",
  },
  {
    id: createId("deadline"),
    task: "Calendário editorial publicado",
    responsible: "Estrategista",
    dueDay: "Dia 27",
    frequency: "Mensal",
    priority: "critical",
    status: "on_track",
    consequence: "Produção desorganizada",
  },
  {
    id: createId("deadline"),
    task: "Copies da semana",
    responsible: "Copywriter",
    dueDay: "3ª-feira",
    frequency: "Semanal",
    priority: "high",
    status: "at_risk",
    consequence: "Atraso nas artes",
  },
  {
    id: createId("deadline"),
    task: "Criativos semanais",
    responsible: "Designer",
    dueDay: "4ª-feira",
    frequency: "Semanal",
    priority: "high",
    status: "on_track",
    consequence: "Campanhas sem criativos",
  },
  {
    id: createId("deadline"),
    task: "Relatório de performance",
    responsible: "Gestor de Tráfego",
    dueDay: "6ª-feira",
    frequency: "Semanal",
    priority: "high",
    status: "on_track",
    consequence: "Decisão sem dados",
  },
  {
    id: createId("deadline"),
    task: "Aprovação de peças",
    responsible: "Estrategista",
    dueDay: "24h",
    frequency: "Contínuo",
    priority: "critical",
    status: "overdue",
    consequence: "Fluxo bloqueado",
  },
];

const defaultCrisisScenarios: CrisisScenario[] = [
  {
    id: createId("crisis"),
    scenario: "Membro da equipe indisponível",
    impact: "Alto",
    color: "#DC2626",
    steps: ["Comunicar imediatamente", "Redistribuir tarefas críticas", "Acionar apoio em 24h"],
  },
  {
    id: createId("crisis"),
    scenario: "Campanha com baixa performance",
    impact: "Médio",
    color: "#F59E0B",
    steps: ["Abrir diagnóstico", "Trocar criativos em 24h", "Revisar segmentação"],
  },
  {
    id: createId("crisis"),
    scenario: "Mudança urgente do cliente",
    impact: "Variável",
    color: "#1E6FD9",
    steps: ["Repriorizar backlog", "Definir novo prazo", "Comunicar ETA"],
  },
  {
    id: createId("crisis"),
    scenario: "Conta de anúncios suspensa",
    impact: "Crítico",
    color: "#7C3AED",
    steps: ["Abrir recurso imediato", "Ativar plano de backup", "Informar impacto"],
  },
];

interface PersistedData {
  company: CompanyInfo;
  team: TeamMember[];
  metricEntries: MetricEntry[];
  scheduleWeeks: ScheduleWeek[];
  pipelineProjects: PipelineProject[];
  responsibilityRoles: ResponsibilityRole[];
  workflowSteps: WorkflowStep[];
  deadlines: DeadlineRecord[];
  crisisScenarios: CrisisScenario[];
  budgetEntries: BudgetEntry[];
  chartStyles?: Record<string, string>;
  chartColors?: Record<string, string>;
  funnelPalette?: Record<string, string>;
  sectionCollapsed?: Record<string, boolean>;
  activeFilters?: Record<string, string>;
}

const loadFromStorage = (companyId?: string): Partial<PersistedData> | null => {
  try {
    const key = getStorageKey(companyId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    return null;
  }
  // NÃO fazer fallback para outra chave — empresa nova começa vazia
  return null;
};

const saveToStorage = (data: PersistedData, companyId?: string) => {
  const key = getStorageKey(companyId);
  localStorage.setItem(key, JSON.stringify(data));
};

const EndocenterContext = createContext<EndocenterStore | null>(null);

export function EndocenterProvider({ children, companyId }: { children: ReactNode; companyId?: string }) {
  const stored = loadFromStorage(companyId);

  const [company, setCompanyState] = useState<CompanyInfo>(stored?.company ?? defaultCompany);
  const [team, setTeamState] = useState<TeamMember[]>(
    (stored?.team?.length ? stored.team : defaultTeam).map((member) => ({
      ...member,
      specialty: member.specialty ?? member.role,
      caseNotes: member.caseNotes ?? "",
      tasks: member.tasks ?? [],
      kpis: member.kpis ?? [],
      status: member.status ?? "Ativo",
    }))
  );

  const [metricEntries, setMetricEntriesState] = useState<MetricEntry[]>(
    stored?.metricEntries?.length ? stored.metricEntries : defaultMetricEntries
  );
  const [scheduleWeeks, setScheduleWeeksState] = useState<ScheduleWeek[]>(
    stored?.scheduleWeeks?.length ? stored.scheduleWeeks : defaultScheduleWeeks
  );
  const [pipelineProjects, setPipelineProjectsState] = useState<PipelineProject[]>(
    stored?.pipelineProjects?.length ? stored.pipelineProjects : defaultPipelineProjects
  );
  const [responsibilityRoles, setResponsibilityRolesState] = useState<ResponsibilityRole[]>(() => {
    const raw = stored?.responsibilityRoles?.length ? stored.responsibilityRoles : defaultResponsibilityRoles;
    // Hydrate old items missing new fields
    return raw.map((role: any) => ({
      ...role,
      weekly: (role.weekly ?? []).map((i: any) => hydrateRespItem(i)),
      monthly: (role.monthly ?? []).map((i: any) => hydrateRespItem(i)),
      quality: (role.quality ?? []).map((i: any) => hydrateRespItem(i)),
    }));
  });
  const [workflowSteps, setWorkflowStepsState] = useState<WorkflowStep[]>(
    stored?.workflowSteps?.length ? stored.workflowSteps : defaultWorkflowSteps
  );
  const [deadlines, setDeadlinesState] = useState<DeadlineRecord[]>(
    stored?.deadlines?.length ? stored.deadlines : defaultDeadlines
  );
  const [crisisScenarios, setCrisisScenariosState] = useState<CrisisScenario[]>(
    stored?.crisisScenarios?.length ? stored.crisisScenarios : defaultCrisisScenarios
  );
  const [budgetEntries, setBudgetEntriesState] = useState<BudgetEntry[]>(
    stored?.budgetEntries?.length ? stored.budgetEntries : []
  );

  // Visual persistence states
  const [chartStyles, setChartStyles] = useState<Record<string, string>>(stored?.chartStyles ?? {});
  const [chartColors, setChartColors] = useState<Record<string, string>>(stored?.chartColors ?? {});
  const [funnelPalette, setFunnelPalette] = useState<Record<string, string>>(stored?.funnelPalette ?? {});
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>(stored?.sectionCollapsed ?? {});
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(stored?.activeFilters ?? {});

  // Debounced save to localStorage
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedSave = useCallback((data: PersistedData) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(data, companyId);
    }, 300);
  }, [companyId]);

  useEffect(() => {
    debouncedSave({
      company, team, metricEntries, scheduleWeeks, pipelineProjects,
      responsibilityRoles, workflowSteps, deadlines, crisisScenarios, budgetEntries,
      chartStyles, chartColors, funnelPalette, sectionCollapsed, activeFilters,
    });
  }, [company, team, metricEntries, scheduleWeeks, pipelineProjects, responsibilityRoles,
      workflowSteps, deadlines, crisisScenarios, budgetEntries, chartStyles, chartColors,
      funnelPalette, sectionCollapsed, activeFilters, debouncedSave]);

  // Sync visual config to Supabase every 30s
  useEffect(() => {
    if (!companyId) return;
    const interval = setInterval(async () => {
      try {
        const { data: current } = await supabase
          .from('companies')
          .select('company_data')
          .eq('id', companyId)
          .single();
        const merged = {
          ...(typeof current?.company_data === 'object' && current?.company_data !== null ? current.company_data : {}),
          chartStyles, chartColors, funnelPalette, sectionCollapsed, activeFilters,
        };
        await supabase.from('companies').update({ company_data: merged }).eq('id', companyId);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [companyId, chartStyles, chartColors, funnelPalette, sectionCollapsed, activeFilters]);

  // Load visual config from Supabase on mount
  useEffect(() => {
    if (!companyId) return;
    supabase.from('companies')
      .select('company_data')
      .eq('id', companyId)
      .single()
      .then(({ data }) => {
        if (data?.company_data && typeof data.company_data === 'object') {
          const remote = data.company_data as Record<string, any>;
          if (remote.chartStyles) setChartStyles(prev => ({ ...prev, ...remote.chartStyles }));
          if (remote.chartColors) setChartColors(prev => ({ ...prev, ...remote.chartColors }));
          if (remote.funnelPalette) setFunnelPalette(prev => ({ ...prev, ...remote.funnelPalette }));
          if (remote.sectionCollapsed) setSectionCollapsed(prev => ({ ...prev, ...remote.sectionCollapsed }));
          if (remote.activeFilters) setActiveFilters(prev => ({ ...prev, ...remote.activeFilters }));
        }
      });
  }, [companyId]);

  const updateMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamState((prev) =>
      prev.map((member) => {
        if (member.id !== id) return member;
        const next = { ...member, ...updates };
        if (updates.color) {
          return withColorPalette(next as TeamMember);
        }
        return next;
      })
    );
  };

  const addMember = () => {
    const newMember = withColorPalette({
      id: createId("member"),
      role: "Nova função",
      name: "Novo membro",
      specialty: "Especialidade",
      caseNotes: "Descreva aqui o case do membro, responsabilidades e entregas-chave.",
      photoUrl: "",
      color: "#64748B",
      colorLight: "#F1F5F9",
      colorBorder: "#CBD5E1",
      remuneration: 0,
      hours: 0,
      tasks: ["Nova tarefa"],
      kpis: ["Novo KPI"],
      status: "Ativo",
    });

    setTeamState((prev) => [...prev, newMember]);
  };

  const removeMember = (id: string) => setTeamState((prev) => prev.filter((member) => member.id !== id));

  const addMetric = () => {
    setMetricEntriesState((prev) => [
      ...prev,
      {
        id: createId("metric"),
        name: "Nova métrica",
        period: "Diária",
        value: 0,
        target: 0,
        notes: "",
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const updateMetric = (id: string, updates: Partial<MetricEntry>) => {
    setMetricEntriesState((prev) =>
      prev.map((metric) => (metric.id === id ? { ...metric, ...updates, updatedAt: new Date().toISOString() } : metric))
    );
  };

  const removeMetric = (id: string) => setMetricEntriesState((prev) => prev.filter((metric) => metric.id !== id));

  const updateScheduleWeek = (weekId: string, updates: Partial<ScheduleWeek>) => {
    setScheduleWeeksState((prev) => prev.map((week) => (week.id === weekId ? { ...week, ...updates } : week)));
  };

  const addScheduleTask = (weekId: string, role = "Estrategista") => {
    setScheduleWeeksState((prev) =>
      prev.map((week) =>
        week.id === weekId
          ? {
              ...week,
              tasks: [
                ...week.tasks,
                {
                  id: createId("sched"),
                  role,
                  task: "Nova tarefa",
                  type: "entregável",
                  hours: 1,
                  color: role === "Gestor de Tráfego" ? "#1E6FD9" : role === "Copywriter" ? "#7C3AED" : role === "Designer" ? "#DC2626" : "#059669",
                },
              ],
            }
          : week
      )
    );
  };

  const updateScheduleTask = (weekId: string, taskId: string, updates: Partial<ScheduleTask>) => {
    setScheduleWeeksState((prev) =>
      prev.map((week) =>
        week.id === weekId
          ? {
              ...week,
              tasks: week.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
            }
          : week
      )
    );
  };

  const removeScheduleTask = (weekId: string, taskId: string) => {
    setScheduleWeeksState((prev) =>
      prev.map((week) =>
        week.id === weekId
          ? {
              ...week,
              tasks: week.tasks.filter((task) => task.id !== taskId),
            }
          : week
      )
    );
  };

  const updatePipelineProject = (projectId: string, updates: Partial<PipelineProject>) => {
    setPipelineProjectsState((prev) => prev.map((project) => (project.id === projectId ? { ...project, ...updates } : project)));
  };

  const addPipelineProject = () => {
    setPipelineProjectsState((prev) => [
      ...prev,
      {
        id: createId("project"),
        name: "Novo projeto",
        description: "Descrição do projeto",
        icon: "settings",
        color: "#1E6FD9",
        colorLight: "#DBEAFE",
        totalHours: 0,
        totalRemuneration: 0,
        deadline: "Definir prazo",
        status: "pending",
        tasks: [],
      },
    ]);
  };

  const removePipelineProject = (projectId: string) => {
    setPipelineProjectsState((prev) => prev.filter((project) => project.id !== projectId));
  };

  const addPipelineTask = (projectId: string) => {
    setPipelineProjectsState((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: [
                ...project.tasks,
                {
                  id: createId("ptask"),
                  name: "Nova tarefa",
                  responsible: "Responsável",
                  hours: 1,
                  remuneration: 0,
                  status: "pending",
                  week: "S1",
                },
              ],
            }
          : project
      )
    );
  };

  const updatePipelineTask = (projectId: string, taskId: string, updates: Partial<PipelineTask>) => {
    setPipelineProjectsState((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
            }
          : project
      )
    );
  };

  const removePipelineTask = (projectId: string, taskId: string) => {
    setPipelineProjectsState((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.filter((task) => task.id !== taskId),
            }
          : project
      )
    );
  };

  const updateResponsibilityRole = (roleId: string, updates: Partial<ResponsibilityRole>) => {
    setResponsibilityRolesState((prev) => prev.map((role) => (role.id === roleId ? { ...role, ...updates } : role)));
  };

  const addResponsibilityRoleItem = (roleId: string, list: "weekly" | "monthly" | "quality") => {
    setResponsibilityRolesState((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? { ...role, [list]: [...role[list], createRespItem("Novo item", false)] }
          : role
      )
    );
  };

  const updateResponsibilityRoleItem = (
    roleId: string,
    list: "weekly" | "monthly" | "quality",
    itemId: string,
    updates: Partial<ResponsibilityItem>
  ) => {
    setResponsibilityRolesState((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              [list]: role[list].map((item) => {
                if (item.id !== itemId) return item;
                const merged = { ...item, ...updates };
                // Auto-populate completedAt when done is toggled
                if (updates.done === true && !item.completedAt) {
                  merged.completedAt = new Date().toISOString();
                } else if (updates.done === false) {
                  merged.completedAt = "";
                }
                return merged;
              }),
            }
          : role
      )
    );
  };

  const removeResponsibilityRoleItem = (roleId: string, list: "weekly" | "monthly" | "quality", itemId: string) => {
    setResponsibilityRolesState((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              [list]: role[list].filter((item) => item.id !== itemId),
            }
          : role
      )
    );
  };

  const updateWorkflowStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowStepsState((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step)));
  };

  const addWorkflowStep = () => {
    setWorkflowStepsState((prev) => [
      ...prev,
      {
        id: createId("flow"),
        number: String(prev.length + 1).padStart(2, "0"),
        title: "Nova etapa",
        owner: "Responsável",
        color: "#1E6FD9",
        colorLight: "#EFF6FF",
        duration: "Definir SLA",
        inputs: ["Entrada"],
        outputs: ["Saída"],
        rules: ["Regra"],
        tasks: [],
      },
    ]);
  };

  const removeWorkflowStep = (stepId: string) => {
    setWorkflowStepsState((prev) => prev.filter((step) => step.id !== stepId));
  };

  const updateDeadline = (id: string, updates: Partial<DeadlineRecord>) => {
    setDeadlinesState((prev) => prev.map((deadline) => (deadline.id === id ? { ...deadline, ...updates } : deadline)));
  };

  const addDeadline = () => {
    setDeadlinesState((prev) => [
      ...prev,
      {
        id: createId("deadline"),
        task: "Nova tarefa crítica",
        responsible: "Responsável",
        dueDay: "Definir",
        frequency: "Semanal",
        priority: "medium",
        status: "on_track",
        consequence: "Definir impacto",
      },
    ]);
  };

  const removeDeadline = (id: string) => {
    setDeadlinesState((prev) => prev.filter((deadline) => deadline.id !== id));
  };

  const updateCrisisScenario = (id: string, updates: Partial<CrisisScenario>) => {
    setCrisisScenariosState((prev) => prev.map((scenario) => (scenario.id === id ? { ...scenario, ...updates } : scenario)));
  };

  const addCrisisScenario = () => {
    setCrisisScenariosState((prev) => [
      ...prev,
      {
        id: createId("crisis"),
        scenario: "Novo cenário de crise",
        impact: "Médio",
        color: "#F59E0B",
        steps: ["Passo 1", "Passo 2"],
      },
    ]);
  };

  const removeCrisisScenario = (id: string) => {
    setCrisisScenariosState((prev) => prev.filter((scenario) => scenario.id !== id));
  };

  const addBudgetEntry = (category: BudgetCategory) => {
    setBudgetEntriesState((prev) => [
      ...prev,
      {
        id: createId("budget"),
        description: "",
        category,
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        participants: [],
        notes: "",
      },
    ]);
  };

  const updateBudgetEntry = (id: string, updates: Partial<BudgetEntry>) => {
    setBudgetEntriesState((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const removeBudgetEntry = (id: string) => {
    setBudgetEntriesState((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <EndocenterContext.Provider
      value={{
        company,
        setCompany: setCompanyState,
        team,
        setTeam: setTeamState,
        updateMember,
        addMember,
        removeMember,
        metricEntries,
        addMetric,
        updateMetric,
        removeMetric,
        scheduleWeeks,
        setScheduleWeeks: setScheduleWeeksState,
        updateScheduleWeek,
        addScheduleTask,
        updateScheduleTask,
        removeScheduleTask,
        pipelineProjects,
        setPipelineProjects: setPipelineProjectsState,
        updatePipelineProject,
        addPipelineProject,
        removePipelineProject,
        addPipelineTask,
        updatePipelineTask,
        removePipelineTask,
        responsibilityRoles,
        setResponsibilityRoles: setResponsibilityRolesState,
        updateResponsibilityRole,
        addResponsibilityRoleItem,
        updateResponsibilityRoleItem,
        removeResponsibilityRoleItem,
        workflowSteps,
        setWorkflowSteps: setWorkflowStepsState,
        updateWorkflowStep,
        addWorkflowStep,
        removeWorkflowStep,
        deadlines,
        setDeadlines: setDeadlinesState,
        updateDeadline,
        addDeadline,
        removeDeadline,
        crisisScenarios,
        setCrisisScenarios: setCrisisScenariosState,
        updateCrisisScenario,
        addCrisisScenario,
        removeCrisisScenario,
        budgetEntries,
        addBudgetEntry,
        updateBudgetEntry,
        removeBudgetEntry,
        chartStyles,
        setChartStyles,
        chartColors,
        setChartColors,
        funnelPalette,
        setFunnelPalette,
        sectionCollapsed,
        setSectionCollapsed,
        activeFilters,
        setActiveFilters,
      }}
    >
      {children}
    </EndocenterContext.Provider>
  );
}

export function useEndocenter() {
  const context = useContext(EndocenterContext);
  if (!context) {
    throw new Error("useEndocenter must be used within EndocenterProvider");
  }
  return context;
}
