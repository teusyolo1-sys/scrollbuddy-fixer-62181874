import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, Users, ShoppingCart, Target, Eye, Plus, Trash2, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useClientMetrics, METRIC_CONFIG, METRIC_TYPES, type MetricType } from "@/hooks/useClientMetrics";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const ICONS: Record<MetricType, typeof TrendingUp> = {
  seguidores: Users,
  vendas: ShoppingCart,
  conversao: Target,
  faturamento: TrendingUp,
  leads: Eye,
  alcance: BarChart3,
};

export default function AnalyticsCharts() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { metrics, loading, addMetric, removeMetric } = useClientMetrics();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<MetricType>("seguidores");
  const [formValue, setFormValue] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  // ── KPIs: latest value per metric type ──
  const latestByType = useMemo(() => {
    const map: Record<string, { value: number; prev: number }> = {};
    METRIC_TYPES.forEach((type) => {
      const sorted = metrics.filter((m) => m.metric_type === type).sort((a, b) => b.date.localeCompare(a.date));
      if (sorted.length > 0) {
        map[type] = { value: sorted[0].value, prev: sorted[1]?.value ?? sorted[0].value };
      }
    });
    return map;
  }, [metrics]);

  // ── Timeline data grouped by date ──
  const timeline = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    metrics.forEach((m) => {
      const d = new Date(m.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!byDate[key]) byDate[key] = {};
      byDate[key][m.metric_type] = (byDate[key][m.metric_type] || 0) + m.value;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => {
        const d = new Date(date + "T00:00:00");
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        return { name: label, ...vals };
      });
  }, [metrics]);

  // ── Monthly aggregation for bar chart ──
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {};
    metrics.forEach((m) => {
      const d = new Date(m.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = {};
      byMonth[key][m.metric_type] = (byMonth[key][m.metric_type] || 0) + m.value;
    });
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => {
        const [y, m] = month.split("-");
        return { name: `${months[parseInt(m) - 1]}/${y.slice(2)}`, ...vals };
      });
  }, [metrics]);

  const handleAdd = async () => {
    const val = parseFloat(formValue);
    if (isNaN(val)) return;
    await addMetric(formType, val, formDate);
    setFormValue("");
    setShowForm(false);
  };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const kpis = METRIC_TYPES.filter((t) => latestByType[t]).map((type) => {
    const { value, prev } = latestByType[type];
    const cfg = METRIC_CONFIG[type];
    const Icon = ICONS[type];
    const change = prev > 0 ? ((value - prev) / prev * 100) : 0;
    return { type, label: cfg.label, value: cfg.format(value), icon: Icon, color: cfg.color, change };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Métricas do cliente</h3>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar
          </button>
        )}
      </div>

      {/* Add metric form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ios-card p-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as MetricType)}
                className="ios-input px-3 py-2 text-sm"
              >
                {METRIC_TYPES.map((t) => (
                  <option key={t} value={t}>{METRIC_CONFIG[t].label}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Valor"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
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

      {/* KPI cards */}
      {kpis.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", damping: 22 }}
                className="ios-card p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                </div>
                <div className="text-xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
                {kpi.change !== 0 && (
                  <span className={`text-[11px] font-semibold ${kpi.change > 0 ? "text-green-500" : "text-red-500"}`}>
                    {kpi.change > 0 ? "+" : ""}{kpi.change.toFixed(1)}%
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="ios-card p-8 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma métrica registrada ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Registrar" para adicionar seguidores, vendas, conversão e mais</p>
        </div>
      )}

      {/* Charts */}
      {metrics.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Timeline — area chart */}
          {timeline.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ios-card p-5">
              <h4 className="text-sm font-bold text-foreground mb-4">Evolução diária</h4>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={timeline}>
                  <defs>
                    {METRIC_TYPES.map((t) => (
                      <linearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={METRIC_CONFIG[t].color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={METRIC_CONFIG[t].color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                  {METRIC_TYPES.filter((t) => metrics.some((m) => m.metric_type === t)).map((t) => (
                    <Area key={t} type="monotone" dataKey={t} stroke={METRIC_CONFIG[t].color} fill={`url(#grad-${t})`} strokeWidth={2} name={METRIC_CONFIG[t].label} />
                  ))}
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Monthly — bar chart */}
          {monthlyData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="ios-card p-5">
              <h4 className="text-sm font-bold text-foreground mb-4">Resultado mensal</h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                  {METRIC_TYPES.filter((t) => metrics.some((m) => m.metric_type === t)).map((t) => (
                    <Bar key={t} dataKey={t} fill={METRIC_CONFIG[t].color} radius={[4, 4, 0, 0]} name={METRIC_CONFIG[t].label} />
                  ))}
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
