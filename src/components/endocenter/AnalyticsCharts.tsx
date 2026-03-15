import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEndocenter } from "@/store/endocenterStore";
import { useBudgetEntries, type BudgetCategory } from "@/hooks/useBudgetEntries";
import { useAuth } from "@/hooks/useAuth";

const formatCurrency = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  investimento: "#3b82f6",
  gasto: "#ef4444",
  faturamento: "#10b981",
  receita: "#8b5cf6",
  despesa: "#f59e0b",
};

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  investimento: "Investimentos",
  gasto: "Gastos",
  faturamento: "Faturamento",
  receita: "Receita",
  despesa: "Despesas",
};

const STATUS_COLORS: Record<string, string> = {
  Ativo: "#22c55e",
  Inativo: "#ef4444",
  Férias: "#f59e0b",
};

export default function AnalyticsCharts() {
  const { user } = useAuth();
  const { team, metricEntries } = useEndocenter();
  const { entries: budgetEntries, loading } = useBudgetEntries();

  // ── Budget by category (pie/bar) ──
  const budgetByCategory = useMemo(() => {
    const cats: BudgetCategory[] = ["investimento", "gasto", "faturamento", "receita", "despesa"];
    return cats.map((cat) => ({
      name: CATEGORY_LABELS[cat],
      value: budgetEntries.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
      color: CATEGORY_COLORS[cat],
    }));
  }, [budgetEntries]);

  // ── Budget timeline (area chart grouped by month) ──
  const budgetTimeline = useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {};
    budgetEntries.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = {};
      byMonth[key][e.category] = (byMonth[key][e.category] || 0) + e.amount;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cats]) => {
        const [y, m] = month.split("-");
        const label = `${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(m) - 1]}/${y.slice(2)}`;
        return { name: label, ...cats };
      });
  }, [budgetEntries]);

  // ── Team composition (pie) ──
  const teamByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    team.forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || "#94a3b8",
    }));
  }, [team]);

  // ── Team remuneration bar chart ──
  const teamRemuneration = useMemo(
    () => team.map((m) => ({ name: m.name.split(" ")[0], remuneracao: m.remuneration, horas: m.hours })),
    [team]
  );

  // ── Metrics progress ──
  const metricsProgress = useMemo(
    () =>
      metricEntries.slice(0, 8).map((m) => ({
        name: m.name.length > 15 ? m.name.slice(0, 15) + "…" : m.name,
        atual: m.value,
        meta: m.target,
      })),
    [metricEntries]
  );

  // ── Summary KPIs ──
  const totalIn = budgetByCategory.filter((c) => ["Faturamento", "Receita"].includes(c.name)).reduce((s, c) => s + c.value, 0);
  const totalOut = budgetByCategory.filter((c) => ["Investimentos", "Gastos", "Despesas"].includes(c.name)).reduce((s, c) => s + c.value, 0);
  const activeMembers = team.filter((m) => m.status === "Ativo").length;

  const kpis = [
    { label: "Entrada total", value: formatCurrency(totalIn), icon: TrendingUp, color: "#10b981" },
    { label: "Saída total", value: formatCurrency(totalOut), icon: DollarSign, color: "#ef4444" },
    { label: "Balanço", value: formatCurrency(totalIn - totalOut), icon: Activity, color: totalIn - totalOut >= 0 ? "#10b981" : "#ef4444" },
    { label: "Membros ativos", value: String(activeMembers), icon: Users, color: "#3b82f6" },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Visão analítica</h3>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", damping: 22 }}
              className="ios-card p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              </div>
              <div className="text-xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Budget timeline — area chart */}
        {budgetTimeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="ios-card p-5"
          >
            <h4 className="text-sm font-bold text-foreground mb-4">Fluxo financeiro mensal</h4>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={budgetTimeline}>
                <defs>
                  <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradInvest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                  formatter={(value: number, name: string) => [formatCurrency(value), CATEGORY_LABELS[name as BudgetCategory] || name]}
                />
                <Area type="monotone" dataKey="faturamento" stroke="#10b981" fill="url(#gradFat)" strokeWidth={2} />
                <Area type="monotone" dataKey="gasto" stroke="#ef4444" fill="url(#gradGasto)" strokeWidth={2} />
                <Area type="monotone" dataKey="investimento" stroke="#3b82f6" fill="url(#gradInvest)" strokeWidth={2} />
                <Area type="monotone" dataKey="receita" stroke="#8b5cf6" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="despesa" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v) => CATEGORY_LABELS[v as BudgetCategory] || v} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Budget by category — pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="ios-card p-5"
        >
          <h4 className="text-sm font-bold text-foreground mb-4">Distribuição por categoria</h4>
          {budgetByCategory.some((c) => c.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={budgetByCategory.filter((c) => c.value > 0)}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3} dataKey="value" stroke="none"
                >
                  {budgetByCategory.filter((c) => c.value > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                  formatter={(value: number) => [formatCurrency(value)]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Nenhum lançamento registrado</p>
                <p className="text-xs mt-1">Adicione entradas no Orçamento para ver o gráfico</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Team remuneration — bar chart */}
        {teamRemuneration.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="ios-card p-5"
          >
            <h4 className="text-sm font-bold text-foreground mb-4">Remuneração por membro</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={teamRemuneration} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                  formatter={(value: number, name: string) => [name === "remuneracao" ? formatCurrency(value) : `${value}h`, name === "remuneracao" ? "Remuneração" : "Horas"]}
                />
                <Bar dataKey="remuneracao" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="horas" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} formatter={(v) => v === "remuneracao" ? "Remuneração" : "Horas"} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Metrics progress — bar chart */}
        {metricsProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="ios-card p-5"
          >
            <h4 className="text-sm font-bold text-foreground mb-4">Progresso das métricas</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={metricsProgress} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                />
                <Bar dataKey="atual" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Atual" />
                <Bar dataKey="meta" fill="#e2e8f0" radius={[0, 6, 6, 0]} name="Meta" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Team status — mini pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ios-card p-5"
        >
          <h4 className="text-sm font-bold text-foreground mb-4">Status da equipe</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={teamByStatus}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {teamByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
