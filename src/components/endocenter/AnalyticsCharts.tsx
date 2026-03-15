import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, Users, ShoppingCart, Target, Eye, Plus, Loader2, ChevronDown, Check } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

const CHART_TYPES: Array<"area" | "bar" | "line"> = ["area", "bar", "line"];

/* ── iOS 26 Custom Dropdown ── */
function IosDropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; color?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ios-input w-full px-3 py-2 text-sm flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          {selected?.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />}
          <span className="text-foreground">{selected?.label || "Selecionar"}</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 400 }}
            className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-card border border-border/60 shadow-lg p-1"
            style={{ borderRadius: "var(--ios-radius, 16px)", boxShadow: "var(--ios-shadow-float, 0 8px 32px rgba(0,0,0,0.12))" }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-secondary/60 transition-colors"
              >
                {opt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                <span className="flex-1 text-left text-foreground">{opt.label}</span>
                {value === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Individual Metric Chart Card ── */
function MetricChartCard({ type, data, delay }: {
  type: MetricType;
  data: { name: string; value: number }[];
  delay: number;
}) {
  const cfg = METRIC_CONFIG[type];
  const Icon = ICONS[type];
  const chartIdx = METRIC_TYPES.indexOf(type) % 3;
  const chartType = CHART_TYPES[chartIdx];

  const latest = data[data.length - 1]?.value ?? 0;
  const prev = data.length > 1 ? data[data.length - 2].value : latest;
  const change = prev > 0 ? ((latest - prev) / prev * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className="ios-card p-5 min-h-[280px]"
      style={{ overflow: "visible" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
            <Icon className="h-4 w-4" style={{ color: cfg.color }} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{cfg.label}</h4>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold" style={{ color: cfg.color }}>{cfg.format(latest)}</span>
              {change !== 0 && (
                <span className={`text-[11px] font-semibold ${change > 0 ? "text-green-500" : "text-red-500"}`}>
                  {change > 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        {chartType === "area" ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-card-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }} formatter={(v: number) => [cfg.format(v), cfg.label]} />
            <Area type="monotone" dataKey="value" stroke={cfg.color} fill={`url(#grad-card-${type})`} strokeWidth={2} />
          </AreaChart>
        ) : chartType === "bar" ? (
          <BarChart data={data} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }} formatter={(v: number) => [cfg.format(v), cfg.label]} />
            <Bar dataKey="value" fill={cfg.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }} formatter={(v: number) => [cfg.format(v), cfg.label]} />
            <Line type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2.5} dot={{ r: 3, fill: cfg.color }} activeDot={{ r: 5 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
}

export default function AnalyticsCharts() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { metrics, loading, addMetric } = useClientMetrics();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<MetricType>("seguidores");
  const [formValue, setFormValue] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  // ── Per-metric timeline data ──
  const perMetricData = useMemo(() => {
    const result: Record<MetricType, { name: string; value: number }[]> = {} as any;
    METRIC_TYPES.forEach((type) => {
      const filtered = metrics.filter((m) => m.metric_type === type);
      if (filtered.length === 0) return;
      const byDate: Record<string, number> = {};
      filtered.forEach((m) => {
        byDate[m.date] = (byDate[m.date] || 0) + m.value;
      });
      result[type] = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => {
          const d = new Date(date + "T00:00:00");
          return { name: `${d.getDate()}/${d.getMonth() + 1}`, value };
        });
    });
    return result;
  }, [metrics]);

  const activeTypes = METRIC_TYPES.filter((t) => perMetricData[t]?.length > 0);

  const handleAdd = async () => {
    const val = parseFloat(formValue);
    if (isNaN(val)) return;
    await addMetric(formType, val, formDate);
    setFormValue("");
    setShowForm(false);
  };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const dropdownOptions = METRIC_TYPES.map((t) => ({
    value: t,
    label: METRIC_CONFIG[t].label,
    color: METRIC_CONFIG[t].color,
  }));

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

      {/* Add metric form — iOS 26 dropdown */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ios-card p-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <IosDropdown
                value={formType}
                onChange={(v) => setFormType(v as MetricType)}
                options={dropdownOptions}
              />
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

      {/* Individual charts per metric — one card each */}
      {activeTypes.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeTypes.map((type, i) => (
            <MetricChartCard
              key={type}
              type={type}
              data={perMetricData[type]}
              delay={i * 0.06}
            />
          ))}
        </div>
      ) : (
        <div className="ios-card p-8 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma métrica registrada ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Registrar" para adicionar seguidores, vendas, conversão e mais</p>
        </div>
      )}
    </div>
  );
}
