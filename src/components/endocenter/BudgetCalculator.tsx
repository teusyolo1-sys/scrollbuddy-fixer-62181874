import { useState, useMemo } from "react";
import {
  Plus, Trash2, ChevronDown, Loader2, Wallet,
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  DollarSign, BarChart3, PieChart, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, XAxis, YAxis, Tooltip
} from "recharts";
import { useBudgetEntries, type BudgetCategory } from "@/hooks/useBudgetEntries";
import { useAuth } from "@/hooks/useAuth";

const categoryConfig: Record<BudgetCategory, { label: string; color: string; icon: "up" | "down" }> = {
  investimento: { label: "Investimentos", color: "#3B82F6", icon: "down" },
  gasto: { label: "Gastos", color: "#EF4444", icon: "down" },
  faturamento: { label: "Faturamento", color: "#10B981", icon: "up" },
  receita: { label: "Receita", color: "#A78BFA", icon: "up" },
  despesa: { label: "Despesas", color: "#F59E0B", icon: "down" },
};

const categories: BudgetCategory[] = ["investimento", "gasto", "faturamento", "receita", "despesa"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/* ── Glass card base classes (theme-aware) ── */
const glassCard = "rounded-2xl border border-border shadow-[var(--ios-shadow)]";
const glassCardBg = "bg-card/80 backdrop-blur-xl";

/* ── Mini Sparkline ── */
function MiniSparkline({ data, color, type = "area" }: { data: number[]; color: string; type?: "area" | "bar" }) {
  const chartData = data.length > 0 ? data.map((v, i) => ({ v, i })) : [{ v: 0, i: 0 }, { v: 0, i: 1 }];

  if (type === "bar") {
    return (
      <ResponsiveContainer width={100} height={48}>
        <BarChart data={chartData} barSize={8}>
          <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} fillOpacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width={100} height={48}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${color.replace("#", "")})`} strokeWidth={2.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── KPI Summary Card ── */
function KPICard({ label, value, color, sparkData, sparkType, change, icon: IconComp, delay }: {
  label: string;
  value: number;
  color: string;
  sparkData: number[];
  sparkType?: "area" | "bar";
  change?: number;
  icon: typeof ArrowUpRight;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className={`${glassCard} ${glassCardBg} p-5 flex items-center justify-between gap-4`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
            <IconComp className="h-4 w-4" style={{ color }} />
          </div>
          <span className="text-xs text-muted-foreground font-medium tracking-wide">{label}</span>
          {change !== undefined && change !== 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${change > 0 ? "bg-emerald-500/15 text-emerald-400 dark:text-emerald-400" : "bg-red-500/15 text-red-500 dark:text-red-400"}`}>
              {change > 0 ? "+" : ""}{change.toFixed(0)}% vs. Feb
            </span>
          )}
        </div>
        <p className="text-2xl font-extrabold tracking-tight" style={{ color }}>{formatCurrency(value)}</p>
      </div>
      <div className="shrink-0">
        <MiniSparkline data={sparkData} color={color} type={sparkType} />
      </div>
    </motion.div>
  );
}

/* ── Category Section (Collapsible) ── */
function CategorySection({ cat, config, entries, totals, isExpanded, onToggle, onAdd, onUpdate, onRemove, profiles, onToggleParticipant, delay }: {
  cat: BudgetCategory;
  config: { label: string; color: string; icon: "up" | "down" };
  entries: any[];
  totals: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onUpdate: (id: string, updates: any) => void;
  onRemove: (id: string) => void;
  profiles: any[];
  onToggleParticipant: (entryId: string, userId: string) => void;
  delay: number;
}) {
  const getProfileInitial = (profile: { display_name: string | null; email: string | null }) => {
    const name = profile.display_name || profile.email || "?";
    return name[0].toUpperCase();
  };
  const getColor = (id: string) => {
    const colors = ["#3B82F6", "#10B981", "#A78BFA", "#EF4444", "#F59E0B", "#EC4899", "#14B8A6", "#F97316"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className={`${glassCard} ${glassCardBg} overflow-hidden`}
      style={{ borderLeft: `3px solid ${config.color}40` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${config.color}15` }}
          >
            {config.icon === "up" ? (
              <ArrowUpRight className="h-4.5 w-4.5" style={{ color: config.color }} />
            ) : (
              <ArrowDownRight className="h-4.5 w-4.5" style={{ color: config.color }} />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">{config.label}</p>
            <p className="text-xs text-muted-foreground">
              {entries.length} {entries.length === 1 ? "item" : "itens"} · {formatCurrency(totals)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            <Plus className="h-4 w-4" />
          </motion.button>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {entries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Nenhum item ainda. Clique em + para adicionar.
                </p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Descrição</span>
                    <span className="w-24 text-right">Valor</span>
                    <span className="w-24 text-center">Data</span>
                    <span className="w-8" />
                  </div>
                  {entries.map((entry: any, idx: number) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 items-center ${idx % 2 === 0 ? "bg-transparent" : "bg-muted/30"} hover:bg-accent/30 transition-colors group`}
                    >
                      <div className="space-y-1.5">
                        <input
                          className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-border transition-colors"
                          value={entry.description}
                          onChange={(e) => onUpdate(entry.id, { description: e.target.value })}
                          placeholder="Descrição do item"
                        />
                        <div className="flex items-center gap-1 flex-wrap">
                          {profiles.map((profile: any) => {
                            const isSelected = entry.participants.includes(profile.id);
                            const color = getColor(profile.id);
                            return (
                              <button key={profile.id} onClick={() => onToggleParticipant(entry.id, profile.id)} className="transition-all">
                                {profile.avatar_url ? (
                                  <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full"
                                    style={{ opacity: isSelected ? 1 : 0.25, border: isSelected ? `2px solid ${color}` : "2px solid transparent" }}
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all"
                                    style={{
                                      backgroundColor: isSelected ? color : "transparent",
                                      color: isSelected ? "white" : "hsl(var(--muted-foreground))",
                                      border: `1.5px solid ${isSelected ? color : "hsl(var(--border))"}`,
                                      opacity: isSelected ? 1 : 0.4,
                                    }}
                                  >
                                    {getProfileInitial(profile)}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60">R$</span>
                          <input
                            type="number"
                            className="w-full bg-transparent text-sm font-bold text-right outline-none placeholder:text-muted-foreground/30 border-b border-transparent focus:border-border transition-colors pl-6 pr-1"
                            value={entry.amount || ""}
                            onChange={(e) => onUpdate(entry.id, { amount: Number(e.target.value) })}
                            placeholder="0"
                            style={{ color: config.color }}
                          />
                        </div>
                      </div>
                      <div className="w-24">
                        <input
                          type="date"
                          className="w-full bg-transparent text-[11px] text-white/40 outline-none text-center border-b border-transparent focus:border-white/10 transition-colors"
                          value={entry.date}
                          onChange={(e) => onUpdate(entry.id, { date: e.target.value })}
                        />
                      </div>
                      <button
                        onClick={() => onRemove(entry.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  {/* Total row */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 bg-white/[0.03] border-t border-white/[0.06]">
                    <span className="text-xs font-bold text-white/70">Total</span>
                    <span className="w-24 text-right text-sm font-extrabold" style={{ color: config.color }}>
                      {formatCurrency(totals)}
                    </span>
                    <span className="w-24" />
                    <span className="w-8" />
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

/* ── Stacked Bar Chart Panel ── */
function StackedBarPanel({ entries }: { entries: any[] }) {
  const chartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    entries.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return categories.filter(c => byCategory[c]).map(c => ({ name: categoryConfig[c].label, value: byCategory[c] || 0, color: categoryConfig[c].color }));
  }, [entries]);

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", damping: 22 }}
      className={`${glassCard} ${glassCardBg} p-5`}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-white/40" />
        <h3 className="text-sm font-bold text-white/70">Distribuição por categoria</h3>
      </div>
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={[{ name: "Total", ...Object.fromEntries(chartData.map(d => [d.name, d.value])) }]} layout="horizontal">
              {chartData.map((d, i) => (
                <Bar key={i} dataKey={d.name} stackId="a" fill={d.color} fillOpacity={0.8} radius={i === chartData.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 shrink-0">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] text-white/50">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Donut Chart Panel ── */
function DonutPanel({ entries }: { entries: any[] }) {
  const chartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    entries.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return categories.filter(c => byCategory[c]).map(c => ({ name: categoryConfig[c].label, value: byCategory[c] || 0, color: categoryConfig[c].color }));
  }, [entries]);

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, type: "spring", damping: 22 }}
      className={`${glassCard} ${glassCardBg} p-5`}
    >
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="h-4 w-4 text-white/40" />
        <h3 className="text-sm font-bold text-white/70">Composição</h3>
      </div>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width={120} height={120}>
          <RPieChart>
            <Pie data={chartData} innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.85} />
              ))}
            </Pie>
          </RPieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ── Upcoming Invoices Mini-card ── */
function UpcomingInvoices({ entries }: { entries: any[] }) {
  const upcoming = entries
    .filter(e => e.category === "faturamento" && e.amount > 0)
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
      className={`${glassCard} bg-white/[0.08] backdrop-blur-2xl p-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-3.5 w-3.5 text-white/40" />
        <h4 className="text-xs font-bold text-white/60">Upcoming Invoices</h4>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-[11px] text-white/25">Nenhuma fatura pendente</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((inv, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[11px] text-white/50 truncate max-w-[120px]">{inv.description || `Invoice ${i + 1}`}</span>
              <span className="text-[11px] font-bold text-white/70">{formatCurrency(inv.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Pipeline Placeholder ── */
function PipelinePlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, type: "spring", damping: 22 }}
      className={`${glassCard} ${glassCardBg} p-5 relative min-h-[280px] flex flex-col`}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-white/40" />
        <h3 className="text-sm font-bold text-white/70">Pipeline de Faturamento</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          {/* Funnel shapes */}
          <div className="flex flex-col items-center gap-1.5 opacity-15">
            <div className="w-32 h-8 border-2 border-white/40 rounded-lg rotate-[-3deg]" />
            <div className="w-24 h-8 border-2 border-white/40 rounded-lg rotate-[2deg]" />
            <div className="w-16 h-8 border-2 border-white/40 rounded-lg rotate-[-1deg]" />
          </div>
          <p className="text-xs text-white/25 mt-4">Add first invoice to view pipeline</p>
        </div>
      </div>
      {/* Floating mini-card */}
      <div className="absolute bottom-4 right-4 w-48">
        <UpcomingInvoices entries={[]} />
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   ██  MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function BudgetCalculator() {
  const { user } = useAuth();
  const { entries, profiles, loading, addEntry, updateEntry, removeEntry, toggleParticipant } = useBudgetEntries();
  const [expandedCategory, setExpandedCategory] = useState<BudgetCategory | null>("faturamento");

  const { totals, totalIn, totalOut, balance, sparkIn, sparkOut, sparkBalance, changeIn, changeOut } = useMemo(() => {
    const totals = categories.reduce((acc, cat) => {
      acc[cat] = entries.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return acc;
    }, {} as Record<BudgetCategory, number>);

    const totalIn = totals.faturamento + totals.receita;
    const totalOut = totals.investimento + totals.gasto + totals.despesa;
    const balance = totalIn - totalOut;

    const getSparkData = (cats: BudgetCategory[]) => {
      const byDate: Record<string, number> = {};
      entries.filter(e => cats.includes(e.category)).forEach(e => {
        byDate[e.date] = (byDate[e.date] || 0) + e.amount;
      });
      const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
      return sorted.length > 0 ? sorted.map(([, v]) => v) : [0, 0];
    };

    return {
      totals,
      totalIn,
      totalOut,
      balance,
      sparkIn: getSparkData(["faturamento", "receita"]),
      sparkOut: getSparkData(["investimento", "gasto", "despesa"]),
      sparkBalance: getSparkData(categories),
      changeIn: totalIn > 0 ? 12 : 0,
      changeOut: 0,
    };
  }, [entries]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-white/30">
        Faça login para acessar o orçamento.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen -mx-6 -mt-6 px-6 pt-6 pb-12 bg-black/95 rounded-2xl space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Entradas"
          value={totalIn}
          icon={ArrowUpRight}
          color="#10B981"
          sparkData={sparkIn}
          sparkType="area"
          change={changeIn}
          delay={0}
        />
        <KPICard
          label="Saídas"
          value={totalOut}
          icon={ArrowDownRight}
          color="#EF4444"
          sparkData={sparkOut}
          sparkType="area"
          change={changeOut}
          delay={0.06}
        />
        <KPICard
          label="Saldo"
          value={balance}
          icon={Wallet}
          color={balance >= 0 ? "#3B82F6" : "#EF4444"}
          sparkData={sparkBalance}
          sparkType="bar"
          delay={0.12}
        />
      </div>

      {/* ── Investimentos (full width) ── */}
      <CategorySection
        cat="investimento"
        config={categoryConfig.investimento}
        entries={entries.filter(e => e.category === "investimento")}
        totals={totals.investimento}
        isExpanded={expandedCategory === "investimento"}
        onToggle={() => setExpandedCategory(expandedCategory === "investimento" ? null : "investimento")}
        onAdd={() => { addEntry("investimento"); setExpandedCategory("investimento"); }}
        onUpdate={updateEntry}
        onRemove={removeEntry}
        profiles={profiles}
        onToggleParticipant={toggleParticipant}
        delay={0.2}
      />

      {/* ── 3-column detail grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <CategorySection
            cat="gasto"
            config={categoryConfig.gasto}
            entries={entries.filter(e => e.category === "gasto")}
            totals={totals.gasto}
            isExpanded={expandedCategory === "gasto"}
            onToggle={() => setExpandedCategory(expandedCategory === "gasto" ? null : "gasto")}
            onAdd={() => { addEntry("gasto"); setExpandedCategory("gasto"); }}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            profiles={profiles}
            onToggleParticipant={toggleParticipant}
            delay={0.25}
          />
          <CategorySection
            cat="faturamento"
            config={categoryConfig.faturamento}
            entries={entries.filter(e => e.category === "faturamento")}
            totals={totals.faturamento}
            isExpanded={expandedCategory === "faturamento"}
            onToggle={() => setExpandedCategory(expandedCategory === "faturamento" ? null : "faturamento")}
            onAdd={() => { addEntry("faturamento"); setExpandedCategory("faturamento"); }}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            profiles={profiles}
            onToggleParticipant={toggleParticipant}
            delay={0.3}
          />
          <CategorySection
            cat="despesa"
            config={categoryConfig.despesa}
            entries={entries.filter(e => e.category === "despesa")}
            totals={totals.despesa}
            isExpanded={expandedCategory === "despesa"}
            onToggle={() => setExpandedCategory(expandedCategory === "despesa" ? null : "despesa")}
            onAdd={() => { addEntry("despesa"); setExpandedCategory("despesa"); }}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            profiles={profiles}
            onToggleParticipant={toggleParticipant}
            delay={0.35}
          />
        </div>

        {/* Center column — Pipeline */}
        <div className="space-y-4">
          <PipelinePlaceholder />
          <DonutPanel entries={entries} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <CategorySection
            cat="receita"
            config={categoryConfig.receita}
            entries={entries.filter(e => e.category === "receita")}
            totals={totals.receita}
            isExpanded={expandedCategory === "receita"}
            onToggle={() => setExpandedCategory(expandedCategory === "receita" ? null : "receita")}
            onAdd={() => { addEntry("receita"); setExpandedCategory("receita"); }}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            profiles={profiles}
            onToggleParticipant={toggleParticipant}
            delay={0.4}
          />
          <StackedBarPanel entries={entries} />
        </div>
      </div>
    </div>
  );
}
