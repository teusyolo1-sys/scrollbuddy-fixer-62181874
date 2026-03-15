import { useState, useMemo } from "react";
import {
  Plus, Trash2, ChevronDown, Loader2,
  ArrowUpRight, ArrowDownRight, TrendingUp,
  BarChart3, PieChart, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell
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

/* ── Glass card base ── */
const gc = "rounded-2xl border border-border/60 shadow-[var(--ios-shadow)] bg-card/70 backdrop-blur-xl";

/* ── Category Header (reusable) ── */
function CatHeader({ config, count, total, onAdd, isExpanded, onToggle }: {
  config: { label: string; color: string; icon: "up" | "down" };
  count: number; total: number;
  onAdd: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${config.color}18` }}>
          {config.icon === "up"
            ? <ArrowUpRight className="h-4 w-4" style={{ color: config.color }} />
            : <ArrowDownRight className="h-4 w-4" style={{ color: config.color }} />}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-foreground">{config.label}</p>
          <p className="text-[11px] text-muted-foreground">{count} {count === 1 ? "item" : "itens"} · {formatCurrency(total)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}>
          <Plus className="h-3.5 w-3.5" />
        </motion.button>
        {onToggle && (
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        )}
      </div>
    </button>
  );
}

/* ── Expandable Table ── */
function EntryTable({ entries, config, onUpdate, onRemove, profiles, onToggleParticipant, total }: {
  entries: any[]; config: { color: string }; total: number;
  onUpdate: (id: string, u: any) => void; onRemove: (id: string) => void;
  profiles: any[]; onToggleParticipant: (eid: string, uid: string) => void;
}) {
  const getInitial = (p: any) => (p.display_name || p.email || "?")[0].toUpperCase();
  const getColor = (id: string) => {
    const c = ["#3B82F6","#10B981","#A78BFA","#EF4444","#F59E0B","#EC4899","#14B8A6","#F97316"];
    let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return c[Math.abs(h) % c.length];
  };

  if (entries.length === 0) return <p className="text-xs text-muted-foreground text-center py-6">Nenhum item ainda.</p>;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Descrição</span><span className="w-20 text-right">Valor</span><span className="w-20 text-center">Data</span><span className="w-7" />
      </div>
      {entries.map((entry: any, idx: number) => (
        <div key={entry.id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 items-center ${idx % 2 ? "bg-muted/20" : ""} hover:bg-accent/20 transition-colors group`}>
          <div className="space-y-1">
            <input className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/40"
              value={entry.description} onChange={(e) => onUpdate(entry.id, { description: e.target.value })} placeholder="Descrição" />
            <div className="flex items-center gap-0.5 flex-wrap">
              {profiles.map((p: any) => {
                const sel = entry.participants.includes(p.id);
                const col = getColor(p.id);
                return (
                  <button key={p.id} onClick={() => onToggleParticipant(entry.id, p.id)}>
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt="" className="w-4 h-4 rounded-full" style={{ opacity: sel ? 1 : 0.2, border: sel ? `2px solid ${col}` : "2px solid transparent" }} />
                      : <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold"
                          style={{ backgroundColor: sel ? col : "transparent", color: sel ? "white" : "hsl(var(--muted-foreground))", border: `1px solid ${sel ? col : "hsl(var(--border))"}`, opacity: sel ? 1 : 0.3 }}>
                          {getInitial(p)}
                        </div>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-20">
            <input type="number" className="w-full bg-transparent text-xs font-bold text-right outline-none" value={entry.amount || ""} onChange={(e) => onUpdate(entry.id, { amount: Number(e.target.value) })} placeholder="0" style={{ color: config.color }} />
          </div>
          <div className="w-20">
            <input type="date" className="w-full bg-transparent text-[10px] text-muted-foreground outline-none text-center" value={entry.date} onChange={(e) => onUpdate(entry.id, { date: e.target.value })} />
          </div>
          <button onClick={() => onRemove(entry.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/40 border-t border-border/50">
        <span className="text-[11px] font-bold text-foreground/70">Total</span>
        <span className="w-20 text-right text-xs font-extrabold" style={{ color: config.color }}>{formatCurrency(total)}</span>
        <span className="w-20" /><span className="w-7" />
      </div>
    </div>
  );
}

/* ── Collapsible Category Card ── */
function CategoryCard({ cat, config, entries, total, isExpanded, onToggle, onAdd, onUpdate, onRemove, profiles, onToggleParticipant, delay }: {
  cat: BudgetCategory; config: typeof categoryConfig.gasto; entries: any[]; total: number;
  isExpanded: boolean; onToggle: () => void; onAdd: () => void;
  onUpdate: (id: string, u: any) => void; onRemove: (id: string) => void;
  profiles: any[]; onToggleParticipant: (eid: string, uid: string) => void; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
      className={`${gc} overflow-hidden`} style={{ borderLeft: `3px solid ${config.color}30` }}>
      <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} isExpanded={isExpanded} onToggle={onToggle} />
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <EntryTable entries={entries} config={config} total={total} onUpdate={onUpdate} onRemove={onRemove} profiles={profiles} onToggleParticipant={onToggleParticipant} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Donut Chart Card (center Gastos) ── */
function GastosChartCard({ entries, config, total, onAdd, delay }: {
  entries: any[]; config: typeof categoryConfig.gasto; total: number; onAdd: () => void; delay: number;
}) {
  const chartData = useMemo(() => {
    if (entries.length === 0) return [{ name: "Vazio", value: 1, color: "hsl(var(--muted))" }];
    const byDesc: Record<string, number> = {};
    entries.forEach(e => { byDesc[e.description || "Sem descrição"] = (byDesc[e.description || "Sem descrição"] || 0) + e.amount; });
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#A78BFA", "#EF4444", "#EC4899"];
    return Object.entries(byDesc).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [entries]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
      className={`${gc} overflow-hidden`}>
      <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} />
      <div className="px-4 pb-4 flex items-center justify-center gap-4">
        <ResponsiveContainer width={90} height={90}>
          <RPieChart>
            <Pie data={chartData} innerRadius={28} outerRadius={42} dataKey="value" stroke="none">
              {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
            </Pie>
          </RPieChart>
        </ResponsiveContainer>
        <ResponsiveContainer width={90} height={90}>
          <RPieChart>
            <Pie data={chartData} innerRadius={0} outerRadius={42} dataKey="value" stroke="none">
              {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.7} />)}
            </Pie>
          </RPieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ── Pipeline Placeholder (center Faturamento) ── */
function PipelineCard({ faturamentoEntries, delay }: { faturamentoEntries: any[]; delay: number }) {
  const upcoming = faturamentoEntries.filter(e => e.amount > 0).slice(0, 2);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
      className={`${gc} overflow-hidden flex flex-col row-span-2`}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Faturamento</p>
            <p className="text-[11px] text-muted-foreground">0 itens · R$ 0,00</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-500">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <div className="flex flex-col items-center gap-1.5 opacity-10">
            <div className="w-28 h-7 border-2 border-foreground/40 rounded-lg rotate-[-3deg]" />
            <div className="w-20 h-7 border-2 border-foreground/40 rounded-lg rotate-[2deg]" />
            <div className="w-14 h-7 border-2 border-foreground/40 rounded-lg rotate-[-1deg]" />
          </div>
          <p className="text-[11px] text-muted-foreground/40 mt-3">Add first invoice to view pipeline</p>
        </div>
      </div>

      {/* Upcoming Invoices floating card */}
      <div className="p-4">
        <div className={`${gc} p-3`}>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[11px] font-bold text-muted-foreground">Upcoming Invoices</h4>
          </div>
          {upcoming.length === 0 ? (
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Invoice 1</span><span className="text-[10px] text-foreground/60">R$ 0,00</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Feb. 2022</span><span className="text-[10px] text-foreground/60">R$ 0,00</span></div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map((inv, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{inv.description || `Invoice ${i + 1}`}</span>
                  <span className="text-[10px] font-bold text-foreground/70">{formatCurrency(inv.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Legend + Stacked Bar (right column center) ── */
function LegendBarCard({ entries, delay }: { entries: any[]; delay: number }) {
  const legendItems = [
    { label: "Fornce Fortes", color: "#3B82F6" },
    { label: "Produced Funds", color: "#10B981" },
    { label: "Receita lends", color: "#A78BFA" },
    { label: "Broacked Source", color: "#F59E0B" },
    { label: "Other", color: "#EF4444" },
  ];

  const chartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    entries.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return categories.filter(c => byCategory[c]).map(c => ({ name: categoryConfig[c].label, value: byCategory[c] || 0, color: categoryConfig[c].color }));
  }, [entries]);

  const hasData = chartData.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
      className={`${gc} p-4`}>
      <div className="space-y-1.5 mb-3">
        {legendItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
      {hasData && (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={[{ name: "Total", ...Object.fromEntries(chartData.map(d => [d.name, d.value])) }]}>
            {chartData.map((d, i) => (
              <Bar key={i} dataKey={d.name} stackId="a" fill={d.color} fillOpacity={0.8} radius={i === chartData.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

/* ── Despesas Detail Table (right column) ── */
function DespesasDetailCard({ entries, config, total, onAdd, delay }: {
  entries: any[]; config: typeof categoryConfig.despesa; total: number; onAdd: () => void; delay: number;
}) {
  const detailRows = [
    { type: "Expense type", color: "#3B82F6", ret: 37, total: "R$ 11.3%" },
    { type: "Expense type", color: "#10B981", ret: 25, total: "R$ 11.5%" },
    { type: "Receital", color: "#F59E0B", ret: 19, total: "0.0%" },
    { type: "Other treakion", color: "#A78BFA", ret: 7, total: "0,00" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
      className={`${gc} overflow-hidden`}>
      <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} />
      <div className="px-4 pb-4">
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Type of</span><span className="w-14 text-right">Return</span><span className="w-16 text-right">Total</span>
          </div>
          {detailRows.map((row, i) => (
            <div key={i} className={`grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 items-center ${i % 2 ? "bg-muted/20" : ""}`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="text-[11px] text-foreground/80">{row.type}</span>
              </div>
              <span className="w-14 text-right text-[11px] text-foreground/70">{row.ret}</span>
              <span className="w-16 text-right text-[11px] text-foreground/70">{row.total}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   ██  MAIN COMPONENT
   ══════════════════════════════════════════ */
export default function BudgetCalculator() {
  const { user } = useAuth();
  const { entries, profiles, loading, addEntry, updateEntry, removeEntry, toggleParticipant } = useBudgetEntries();
  const [expandedCategory, setExpandedCategory] = useState<BudgetCategory | null>("faturamento");

  const totals = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = entries.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return acc;
    }, {} as Record<BudgetCategory, number>);
  }, [entries]);

  const catProps = (cat: BudgetCategory) => ({
    cat,
    config: categoryConfig[cat],
    entries: entries.filter(e => e.category === cat),
    total: totals[cat],
    isExpanded: expandedCategory === cat,
    onToggle: () => setExpandedCategory(expandedCategory === cat ? null : cat),
    onAdd: () => { addEntry(cat); setExpandedCategory(cat); },
    onUpdate: updateEntry,
    onRemove: removeEntry,
    profiles,
    onToggleParticipant: toggleParticipant,
  });

  if (!user) return <div className="flex items-center justify-center py-20 text-muted-foreground">Faça login para acessar o orçamento.</div>;
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">

      {/* Row 1: Investimentos (full width) */}
      <CategoryCard {...catProps("investimento")} delay={0} />

      {/* Row 2: Gastos | Gastos (charts) | Receita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CategoryCard {...catProps("gasto")} delay={0.05} />
        <GastosChartCard entries={entries.filter(e => e.category === "gasto")} config={categoryConfig.gasto} total={totals.gasto} onAdd={() => { addEntry("gasto"); setExpandedCategory("gasto"); }} delay={0.1} />
        <CategoryCard {...catProps("receita")} delay={0.15} />
      </div>

      {/* Row 3: Faturamento (table) | Pipeline | Legend + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <CategoryCard {...catProps("faturamento")} delay={0.2} />
          {/* Row 4 left: Despesas */}
          <CategoryCard {...catProps("despesa")} delay={0.3} />
        </div>

        {/* Center: Pipeline spanning 2 rows */}
        <PipelineCard faturamentoEntries={entries.filter(e => e.category === "faturamento")} delay={0.25} />

        {/* Right: Legend + Bar, then Despesas detail */}
        <div className="space-y-4">
          <LegendBarCard entries={entries} delay={0.3} />
          <DespesasDetailCard entries={entries.filter(e => e.category === "despesa")} config={categoryConfig.despesa} total={totals.despesa} onAdd={() => { addEntry("despesa"); setExpandedCategory("despesa"); }} delay={0.35} />
        </div>
      </div>
    </div>
  );
}
