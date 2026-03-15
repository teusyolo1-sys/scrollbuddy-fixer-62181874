import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Loader2, TrendingUp, TrendingDown, User, Clock, CheckCircle2,
  AlertTriangle, Flag, ChevronDown, ChevronRight, BarChart3, Timer, Trash2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { useTeamActivities } from "@/hooks/useTeamActivities";
import { useTaskComplaints } from "@/hooks/useTaskComplaints";
import { useEndocenter, type ResponsibilityItem } from "@/store/endocenterStore";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const MEMBER_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#84cc16"];
type TimePeriod = "day" | "week" | "month" | "year";
const periodLabels: Record<TimePeriod, string> = { day: "Dia", week: "Semana", month: "Mês", year: "Ano" };

/* ── Helper: get all tasks across all roles ── */
function getAllTasks(roles: { role: string; weekly: ResponsibilityItem[]; monthly: ResponsibilityItem[]; quality: ResponsibilityItem[] }[]) {
  const tasks: (ResponsibilityItem & { roleName: string })[] = [];
  for (const r of roles) {
    for (const tab of ["weekly", "monthly", "quality"] as const) {
      for (const item of r[tab]) {
        tasks.push({ ...item, roleName: r.role });
      }
    }
  }
  return tasks;
}

/* ── Filter by period ── */
function isInPeriod(dateStr: string, period: TimePeriod): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  switch (period) {
    case "day":
      return date.toDateString() === now.toDateString();
    case "week": {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    case "month":
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case "year":
      return date.getFullYear() === now.getFullYear();
  }
}

/* ── Calculate SLA (average resolution time in hours) ── */
function calcSLA(tasks: ResponsibilityItem[]): number {
  const completed = tasks.filter((t) => t.done && t.completedAt && t.createdAt);
  if (completed.length === 0) return 0;
  const totalHours = completed.reduce((sum, t) => {
    const diff = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
    return sum + diff / (1000 * 60 * 60);
  }, 0);
  return totalHours / completed.length;
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

/* ── Member Raio-X Card ── */
function MemberRaioX({
  memberName, color, delay, tasks, activities, complaints, isAdmin, period,
  onRemoveComplaint,
}: {
  memberName: string;
  color: string;
  delay: number;
  tasks: (ResponsibilityItem & { roleName: string })[];
  activities: { activity_type: string; value: number; unit: string; date: string }[];
  complaints: { id: string; task_name: string; category: string; description: string; created_at: string }[];
  isAdmin: boolean;
  period: TimePeriod;
  onRemoveComplaint: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Filter tasks by period (using completedAt for done tasks, createdAt for all)
  const periodTasks = tasks.filter((t) => {
    if (t.done && t.completedAt) return isInPeriod(t.completedAt, period);
    return isInPeriod(t.createdAt, period);
  });

  const completedTasks = periodTasks.filter((t) => t.done);
  const pendingTasks = periodTasks.filter((t) => !t.done);
  const avgSLA = calcSLA(completedTasks);

  // Filter activities by period
  const periodActivities = activities.filter((a) => isInPeriod(a.date, period));

  // Filter complaints by period
  const periodComplaints = complaints.filter((c) => isInPeriod(c.created_at, period));

  // SLA chart data (last 7 completed tasks)
  const slaChartData = completedTasks
    .filter((t) => t.completedAt && t.createdAt)
    .slice(-7)
    .map((t) => {
      const hours = (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
      const d = new Date(t.completedAt);
      return { name: `${d.getDate()}/${d.getMonth() + 1}`, value: Math.round(hours * 10) / 10 };
    });

  // Activity chart data
  const activityByType = useMemo(() => {
    const map: Record<string, { values: { name: string; value: number }[]; unit: string }> = {};
    periodActivities.forEach((a) => {
      if (!map[a.activity_type]) map[a.activity_type] = { values: [], unit: a.unit };
      const d = new Date(a.date + "T00:00:00");
      map[a.activity_type].values.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, value: a.value });
    });
    Object.values(map).forEach((e) => e.values.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [periodActivities]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className="ios-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-5 hover:bg-secondary/20 transition-colors"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <User className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-base font-bold text-foreground">{memberName}</h4>
          <p className="text-xs text-muted-foreground">
            {completedTasks.length} concluída{completedTasks.length !== 1 ? "s" : ""} · SLA {formatHours(avgSLA)}
            {periodComplaints.length > 0 && isAdmin && (
              <span className="text-amber-500 ml-2">· {periodComplaints.length} sinalização{periodComplaints.length !== 1 ? "ões" : ""}</span>
            )}
          </p>
        </div>
        {/* KPI pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" /> {completedTasks.length}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary text-muted-foreground text-[11px] font-semibold">
            <Clock className="h-3 w-3" /> {pendingTasks.length}
          </div>
          {isAdmin && periodComplaints.length > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 text-[11px] font-semibold">
              <Flag className="h-3 w-3" /> {periodComplaints.length}
            </div>
          )}
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
      </button>

      {/* Expanded Raio-X */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/30">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
                <KPICard label="Concluídas" value={completedTasks.length} icon={CheckCircle2} color="#059669" />
                <KPICard label="Pendentes" value={pendingTasks.length} icon={Clock} color="#f59e0b" />
                <KPICard label="SLA Médio" value={formatHours(avgSLA)} icon={Timer} color="#3b82f6" />
                <KPICard label="Sinalizações" value={periodComplaints.length} icon={Flag} color="#ef4444" />
              </div>

              {/* SLA Chart */}
              {slaChartData.length > 1 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-muted-foreground">Tempo de Resolução (horas)</h5>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={slaChartData}>
                      <defs>
                        <linearGradient id={`sla-${memberName}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }} />
                      <Area type="monotone" dataKey="value" stroke={color} fill={`url(#sla-${memberName})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Activity charts (from team_activities) */}
              {Object.keys(activityByType).length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-muted-foreground">Atividades Registradas</h5>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(activityByType).map(([type, { values, unit }]) => (
                      <div key={type} className="space-y-1.5">
                        <div className="text-[11px] font-medium text-foreground">{type} {unit ? `(${unit})` : ""}</div>
                        <ResponsiveContainer width="100%" height={100}>
                          <BarChart data={values} barSize={12}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={25} />
                            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 10 }} />
                            <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complaint History — Admin only */}
              {isAdmin && periodComplaints.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                    <Flag className="h-3 w-3" /> Histórico de Sinalizações
                  </h5>
                  <div className="space-y-1.5">
                    {periodComplaints.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                              {c.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-1">{c.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Tarefa: {c.task_name}</p>
                        </div>
                        <button
                          onClick={() => onRemoveComplaint(c.id)}
                          className="shrink-0 w-6 h-6 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── KPI Card ── */
function KPICard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/30">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3" style={{ color }} />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-extrabold text-foreground">{value}</div>
    </div>
  );
}

/* ── Main Component ── */
export default function TeamAnalytics() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { team, responsibilityRoles } = useEndocenter();
  const { activities, loading: activitiesLoading, addActivity } = useTeamActivities();
  const { complaints, loading: complaintsLoading, removeComplaint } = useTaskComplaints();
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [showForm, setShowForm] = useState(false);
  const [formMember, setFormMember] = useState("");
  const [formType, setFormType] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  const allTasks = useMemo(() => getAllTasks(responsibilityRoles), [responsibilityRoles]);

  // Get unique member names from team + tasks assignees + activities
  const memberNames = useMemo(() => {
    const names = new Set<string>();
    team.forEach((m) => names.add(m.name));
    activities.forEach((a) => names.add(a.member_name));
    allTasks.forEach((t) => t.assignees.forEach((a) => names.add(a)));
    return Array.from(names).sort();
  }, [team, activities, allTasks]);

  // Activity type suggestions
  const activitySuggestions = useMemo(() => {
    const types = new Set<string>();
    activities.forEach((a) => types.add(a.activity_type));
    ["Posts", "Horas trabalhadas", "Remuneração", "Leads gerados", "Vendas", "Reuniões", "Entregas"].forEach((t) => types.add(t));
    return Array.from(types);
  }, [activities]);

  const handleAdd = async () => {
    if (!formMember) { toast.error("Selecione um membro"); return; }
    if (!formType) { toast.error("Selecione o tipo de atividade"); return; }
    if (!formValue) { toast.error("Informe o valor"); return; }
    try {
      await addActivity(formMember, formType, parseFloat(formValue), formUnit, formDate);
      toast.success("Atividade registrada!");
      setFormValue("");
      setShowForm(false);
    } catch (e: any) {
      toast.error("Erro ao registrar: " + (e?.message || "tente novamente"));
    }
  };

  if (!user) return null;
  const loading = activitiesLoading || complaintsLoading;
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Raio-X do Time</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Performance individual com SLA, atividades e sinalizações</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filter */}
          <div className="flex bg-secondary/60 rounded-xl p-0.5">
            {(Object.keys(periodLabels) as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Registrar atividade
            </button>
          )}
        </div>
      </div>

      {/* Add activity form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ios-card p-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <select value={formMember} onChange={(e) => setFormMember(e.target.value)} className="ios-input px-3 py-2 text-sm">
                <option value="">Selecionar membro</option>
                {memberNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="ios-input px-3 py-2 text-sm">
                <option value="">Tipo de atividade</option>
                {activitySuggestions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="number"
                placeholder="Valor"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="ios-input px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Unidade (h, R$, un)"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="ios-input px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="ios-input px-3 py-2 text-sm"
              />
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                Adicionar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Raio-X cards */}
      {memberNames.length > 0 ? (
        <div className="space-y-3">
          {memberNames.map((name, i) => {
            const memberTasks = allTasks.filter((t) =>
              t.assignees.some((a) => a.toLowerCase() === name.toLowerCase()) ||
              t.roleName === team.find((m) => m.name === name)?.role
            );
            const memberActivities = activities.filter((a) => a.member_name === name);
            const memberComplaints = complaints.filter((c) =>
              c.assigned_to.toLowerCase().includes(name.toLowerCase())
            );

            return (
              <MemberRaioX
                key={name}
                memberName={name}
                color={MEMBER_COLORS[i % MEMBER_COLORS.length]}
                delay={i * 0.05}
                tasks={memberTasks}
                activities={memberActivities}
                complaints={memberComplaints}
                isAdmin={isAdmin}
                period={period}
                onRemoveComplaint={removeComplaint}
              />
            );
          })}
        </div>
      ) : (
        <div className="ios-card p-10 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum membro registrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione membros ao time ou registre atividades para ver o Raio-X
          </p>
        </div>
      )}
    </div>
  );
}
