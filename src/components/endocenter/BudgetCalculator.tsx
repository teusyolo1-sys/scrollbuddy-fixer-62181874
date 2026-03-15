import { useState } from "react";
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Users, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function BudgetCalculator() {
  const { user } = useAuth();
  const { entries, profiles, loading, addEntry, updateEntry, removeEntry, toggleParticipant } = useBudgetEntries();
  const [expandedCategory, setExpandedCategory] = useState<BudgetCategory | null>("faturamento");

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

  const totals = categories.reduce((acc, cat) => {
    acc[cat] = entries.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<BudgetCategory, number>);

  const totalIn = totals.faturamento + totals.receita;
  const totalOut = totals.investimento + totals.gasto + totals.despesa;
  const balance = totalIn - totalOut;

  const getProfileInitial = (profile: { display_name: string | null; email: string | null }) => {
    const name = profile.display_name || profile.email || "?";
    return name[0].toUpperCase();
  };

  const getProfileName = (profile: { display_name: string | null; email: string | null }) => {
    const name = profile.display_name || profile.email || "Usuário";
    return name.split(" ")[0];
  };

  // Generate consistent color from user id
  const getColor = (id: string) => {
    const colors = ["#1E6FD9", "#059669", "#7C3AED", "#DC2626", "#F59E0B", "#EC4899", "#14B8A6", "#F97316"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ios-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Entradas</span>
          </div>
          <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalIn)}</p>
        </div>
        <div className="ios-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground font-medium">Saídas</span>
          </div>
          <p className="text-xl font-bold text-destructive">{formatCurrency(totalOut)}</p>
        </div>
        <div className="ios-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Saldo</span>
          </div>
          <p className={`text-xl font-bold ${balance >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Category sections */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const config = categoryConfig[cat];
          const catEntries = entries.filter((e) => e.category === cat);
          const isExpanded = expandedCategory === cat;

          return (
            <div key={cat} className="ios-card overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}1A` }}
                  >
                    {config.icon === "up" ? (
                      <TrendingUp className="h-4 w-4" style={{ color: config.color }} />
                    ) : (
                      <TrendingDown className="h-4 w-4" style={{ color: config.color }} />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {catEntries.length} {catEntries.length === 1 ? "item" : "itens"} · {formatCurrency(totals[cat])}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      addEntry(cat);
                      setExpandedCategory(cat);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50"
                    style={{ color: config.color }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.button>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
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
                    <div className="px-4 pb-4 space-y-2">
                      {catEntries.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Nenhum item ainda. Clique em + para adicionar.
                        </p>
                      )}
                      {catEntries.map((entry) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              className="ios-input px-3 py-2 text-sm"
                              value={entry.description}
                              onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                              placeholder="Descrição"
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                              <input
                                type="number"
                                className="ios-input px-3 py-2 text-sm pl-8"
                                value={entry.amount || ""}
                                onChange={(e) => updateEntry(entry.id, { amount: Number(e.target.value) })}
                                placeholder="0,00"
                                min={0}
                                step={0.01}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="date"
                              className="ios-input px-3 py-2 text-sm"
                              value={entry.date}
                              onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                            />
                            <input
                              className="ios-input px-3 py-2 text-sm"
                              value={entry.notes}
                              onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                              placeholder="Observações"
                            />
                          </div>

                          {/* Participants - real users from profiles */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground font-medium">Participantes</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {profiles.map((profile) => {
                                const isSelected = entry.participants.includes(profile.id);
                                const color = getColor(profile.id);
                                return (
                                  <button
                                    key={profile.id}
                                    onClick={() => toggleParticipant(entry.id, profile.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
                                    style={{
                                      backgroundColor: isSelected ? `${color}20` : "transparent",
                                      color: isSelected ? color : "var(--muted-foreground)",
                                      border: `1px solid ${isSelected ? color + "40" : "var(--border)"}`,
                                    }}
                                  >
                                    {profile.avatar_url ? (
                                      <img src={profile.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />
                                    ) : (
                                      <div
                                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                                        style={{ backgroundColor: color }}
                                      >
                                        {getProfileInitial(profile)}
                                      </div>
                                    )}
                                    {getProfileName(profile)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => removeEntry(entry.id)}
                              className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
