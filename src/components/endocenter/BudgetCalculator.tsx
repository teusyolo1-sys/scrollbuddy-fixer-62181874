import { useState, useMemo } from "react";
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Users, ChevronDown, ChevronUp, Loader2, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer } from "recharts";
import { useBudgetEntries, type BudgetCategory } from "@/hooks/useBudgetEntries";
import { useAuth } from "@/hooks/useAuth";

const categoryConfig: Record<BudgetCategory, { label: string; color: string; icon: "up" | "down" }> = {
  investimento: { label: "Investimentos", color: "#1E6FD9", icon: "down" },
  gasto: { label: "Gastos", color: "#DC2626", icon: "down" },
  faturamento: { label: "Faturamento", color: "#059669", icon: "up" },
  receita: { label: "Receita", color: "#7C3AED", icon: "up" },
  despesa: { label: "Despesas", color: "#F59E0B", icon: "down" },
};

const categories: BudgetCategory[] = ["investimento", "gasto", "faturamento", "receita", "despesa"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/* ── Mini Sparkline ── */
function MiniSparkline({ data, color, type = "area" }: { data: number[]; color: string; type?: "area" | "bar" }) {
  const chartData = data.length > 0 ? data.map((v, i) => ({ v, i })) : [{ v: 0, i: 0 }, { v: 0, i: 1 }];

  if (type === "bar") {
    return (
      <ResponsiveContainer width={80} height={40}>
        <BarChart data={chartData} barSize={6}>
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} fillOpacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width={80} height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${color.replace("#", "")})`} strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Summary Card ── */
function SummaryCard({ label, value, icon: IconComp, color, sparkData, sparkType, change, delay }: {
  label: string;
  value: number;
  icon: typeof TrendingUp;
  color: string;
  sparkData: number[];
  sparkType?: "area" | "bar";
  change?: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className="ios-card p-5 flex items-center justify-between gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <IconComp className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {change !== undefined && change !== 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${change > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
              {change > 0 ? "+" : ""}{change.toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-xl font-extrabold truncate" style={{ color }}>{formatCurrency(value)}</p>
      </div>
      <div className="shrink-0">
        <MiniSparkline data={sparkData} color={color} type={sparkType} />
      </div>
    </motion.div>
  );
}

/* ── Category Section ── */
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
  const getProfileName = (profile: { display_name: string | null; email: string | null }) => {
    const name = profile.display_name || profile.email || "Usuário";
    return name.split(" ")[0];
  };
  const getColor = (id: string) => {
    const colors = ["#1E6FD9", "#059669", "#7C3AED", "#DC2626", "#F59E0B", "#EC4899", "#14B8A6", "#F97316"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className="ios-card overflow-hidden"
      style={{ borderLeft: `3px solid ${config.color}30` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${config.color}15` }}
          >
            {config.icon === "up" ? (
              <ArrowUpRight className="h-4 w-4" style={{ color: config.color }} />
            ) : (
              <ArrowDownRight className="h-4 w-4" style={{ color: config.color }} />
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
            style={{ backgroundColor: `${config.color}15`, color: config.color }}
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
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhum item ainda. Clique em + para adicionar.
                </p>
              ) : (
                <div className="border border-border/40 rounded-xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                      className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 items-center ${idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"} hover:bg-muted/20 transition-colors group`}
                    >
                      <div className="space-y-1.5">
                        <input
                          className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-primary/30 transition-colors"
                          value={entry.description}
                          onChange={(e) => onUpdate(entry.id, { description: e.target.value })}
                          placeholder="Descrição do item"
                        />
                        {/* Participants inline */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {profiles.map((profile: any) => {
                            const isSelected = entry.participants.includes(profile.id);
                            const color = getColor(profile.id);
                            return (
                              <button
                                key={profile.id}
                                onClick={() => onToggleParticipant(entry.id, profile.id)}
                                title={getProfileName(profile)}
                                className="transition-all"
                              >
                                {profile.avatar_url ? (
                                  <img
                                    src={profile.avatar_url}
                                    alt=""
                                    className="w-5 h-5 rounded-full"
                                    style={{ opacity: isSelected ? 1 : 0.3, border: isSelected ? `2px solid ${color}` : "2px solid transparent" }}
                                  />
                                ) : (
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all"
                                    style={{
                                      backgroundColor: isSelected ? color : "transparent",
                                      color: isSelected ? "white" : "var(--muted-foreground)",
                                      border: `1.5px solid ${isSelected ? color : "var(--border)"}`,
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
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                          <input
                            type="number"
                            className="w-full bg-transparent text-sm font-bold text-right outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-primary/30 transition-colors pl-6 pr-1"
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
                          className="w-full bg-transparent text-[11px] text-muted-foreground outline-none text-center border-b border-transparent focus:border-primary/30 transition-colors"
                          value={entry.date}
                          onChange={(e) => onUpdate(entry.id, { date: e.target.value })}
                        />
                      </div>
                      <button
                        onClick={() => onRemove(entry.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  {/* Total row */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 bg-muted/30 border-t border-border/40">
                    <span className="text-xs font-bold text-foreground">Total</span>
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

export default function BudgetCalculator() {
  const { user } = useAuth();
  const { entries, profiles, loading, addEntry, updateEntry, removeEntry, toggleParticipant } = useBudgetEntries();
  const [expandedCategory, setExpandedCategory] = useState<BudgetCategory | null>("faturamento");

  // Compute totals and sparkline data
  const { totals, totalIn, totalOut, balance, sparkIn, sparkOut, sparkBalance } = useMemo(() => {
    const totals = categories.reduce((acc, cat) => {
      acc[cat] = entries.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return acc;
    }, {} as Record<BudgetCategory, number>);

    const totalIn = totals.faturamento + totals.receita;
    const totalOut = totals.investimento + totals.gasto + totals.despesa;
    const balance = totalIn - totalOut;

    // Generate sparkline data from entries by date
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
    };
  }, [entries]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Faça login para acessar o orçamento.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards with sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Entradas"
          value={totalIn}
          icon={ArrowUpRight}
          color="#059669"
          sparkData={sparkIn}
          sparkType="area"
          delay={0}
        />
        <SummaryCard
          label="Saídas"
          value={totalOut}
          icon={ArrowDownRight}
          color="#DC2626"
          sparkData={sparkOut}
          sparkType="area"
          delay={0.06}
        />
        <SummaryCard
          label="Saldo"
          value={balance}
          icon={Wallet}
          color={balance >= 0 ? "#1E6FD9" : "#DC2626"}
          sparkData={sparkBalance}
          sparkType="bar"
          delay={0.12}
        />
      </div>

      {/* Category sections */}
      <div className="space-y-3">
        {categories.map((cat, i) => {
          const config = categoryConfig[cat];
          const catEntries = entries.filter((e) => e.category === cat);

          return (
            <CategorySection
              key={cat}
              cat={cat}
              config={config}
              entries={catEntries}
              totals={totals[cat]}
              isExpanded={expandedCategory === cat}
              onToggle={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
              onAdd={() => { addEntry(cat); setExpandedCategory(cat); }}
              onUpdate={updateEntry}
              onRemove={removeEntry}
              profiles={profiles}
              onToggleParticipant={toggleParticipant}
              delay={0.18 + i * 0.05}
            />
          );
        })}
      </div>
    </div>
  );
}
