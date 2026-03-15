import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Plus, Trash2,
  ArrowLeft, Building2, PieChart, BarChart3, Receipt, Tag, ChevronDown
} from "lucide-react";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useAgencyWallet } from "@/hooks/useAgencyWallet";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const gc = "rounded-2xl border border-border/60 shadow-[var(--ios-shadow)] bg-card/70 backdrop-blur-xl";

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, color, delay }: {
  label: string; value: number; icon: any; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className={`${gc} p-5 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: color, filter: "blur(30px)" }} />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{formatCurrency(value)}</p>
    </motion.div>
  );
}

/* ── Expense row ── */
function ExpenseRow({ expense, onUpdate, onRemove }: {
  expense: any; onUpdate: (id: string, u: any) => void; onRemove: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 items-center hover:bg-accent/20 transition-colors group">
      <input className="w-full bg-transparent text-xs font-medium text-foreground outline-none border-b border-border/30 focus:border-primary/40 py-1"
        value={expense.description} onChange={e => onUpdate(expense.id, { description: e.target.value })} placeholder="Descrição da despesa" />
      <input type="number" className="w-24 bg-transparent text-xs font-bold text-right text-destructive outline-none border-b border-border/30 focus:border-primary/40 py-1"
        value={expense.amount || ""} onChange={e => onUpdate(expense.id, { amount: Number(e.target.value) })} placeholder="0,00" />
      <input type="date" className="w-28 bg-transparent text-[10px] text-muted-foreground outline-none text-center border-b border-border/30 focus:border-primary/40 py-1"
        value={expense.date} onChange={e => onUpdate(expense.id, { date: e.target.value })} />
      <button onClick={() => onRemove(expense.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ── Revenue row ── */
function RevenueRow({ revenue, onUpdate, onRemove }: {
  revenue: any; onUpdate: (id: string, u: any) => void; onRemove: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 items-center hover:bg-accent/20 transition-colors group">
      <input className="w-full bg-transparent text-xs font-medium text-foreground outline-none border-b border-border/30 focus:border-primary/40 py-1"
        value={revenue.description} onChange={e => onUpdate(revenue.id, { description: e.target.value })} placeholder="Consultoria, bônus..." />
      <input type="number" className="w-24 bg-transparent text-xs font-bold text-right text-emerald-500 outline-none border-b border-border/30 focus:border-primary/40 py-1"
        value={revenue.amount || ""} onChange={e => onUpdate(revenue.id, { amount: Number(e.target.value) })} placeholder="0,00" />
      <input type="date" className="w-28 bg-transparent text-[10px] text-muted-foreground outline-none text-center border-b border-border/30 focus:border-primary/40 py-1"
        value={revenue.date} onChange={e => onUpdate(revenue.id, { date: e.target.value })} />
      <button onClick={() => onRemove(revenue.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function AgencyWalletPage() {
  const navigate = useNavigate();
  const {
    expenses, revenues, companySummaries,
    totalFeeRevenue, totalManualRevenue, totalRevenue, totalExpenses, profit,
    monthlyRevenue, monthlyExpenses, monthlyProfit,
    loading,
    addExpense, updateExpense, removeExpense,
    addRevenue, updateRevenue, removeRevenue,
  } = useAgencyWallet();

  const [expensesOpen, setExpensesOpen] = useState(true);
  const [revenuesOpen, setRevenuesOpen] = useState(false);

  // Pie chart data: revenue by company
  const pieData = useMemo(() => {
    const data = companySummaries.map(c => ({ name: c.name, value: c.totalFee, color: c.color }));
    if (totalManualRevenue > 0) data.push({ name: "Receitas Avulsas", value: totalManualRevenue, color: "#F59E0B" });
    return data.length > 0 ? data : [{ name: "Sem dados", value: 1, color: "hsl(var(--muted))" }];
  }, [companySummaries, totalManualRevenue]);

  // Monthly trend data (last 6 months)
  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const mExp = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const mRev = revenues.filter(r => r.date.startsWith(key)).reduce((s, r) => s + r.amount, 0);
      // Add fee revenue proportionally (simplified — all fees shown in current month for now)
      months.push({ name: label, receita: i === 0 ? totalFeeRevenue + mRev : mRev, despesa: mExp });
    }
    return months;
  }, [expenses, revenues, totalFeeRevenue]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Wallet className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative" style={{ isolation: "isolate" }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)",
        }} />
        <motion.div className="absolute rounded-full" style={{
          width: 500, height: 500, background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 65%)",
          filter: "blur(80px)", top: "5%", right: "15%",
        }} animate={{ x: [0, -30, 15, 0], y: [0, 20, -10, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute rounded-full" style={{
          width: 400, height: 400, background: "radial-gradient(circle, hsl(152 69% 38% / 0.05), transparent 65%)",
          filter: "blur(60px)", bottom: "10%", left: "10%",
        }} animate={{ x: [0, 20, -15, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} />
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/")}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/50 border border-border hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <Wallet className="h-7 w-7 text-primary" />
                Caixa da Agência
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Visão consolidada do fluxo financeiro</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Receita Total" value={totalRevenue} icon={TrendingUp} color="#10B981" delay={0} />
          <StatCard label="Despesas" value={totalExpenses} icon={TrendingDown} color="#EF4444" delay={0.05} />
          <StatCard label="Lucro Líquido" value={profit} icon={DollarSign} color={profit >= 0 ? "#10B981" : "#EF4444"} delay={0.1} />
          <StatCard label="MRR (Fee Clientes)" value={totalFeeRevenue} icon={Building2} color="#3B82F6" delay={0.15} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left: Revenue by Client (Pie) */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring", damping: 22 }}
            className={`${gc} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Receita por Cliente</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RPieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={85} dataKey="value" stroke="none" paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{
                  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                  borderRadius: "12px", fontSize: "12px",
                }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-3">
              {pieData.filter(d => d.name !== "Sem dados").map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-foreground">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Center: Trend chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: "spring", damping: 22 }}
            className={`${gc} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Tendência (6 meses)</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{
                  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                  borderRadius: "12px", fontSize: "12px",
                }} />
                <Area type="monotone" dataKey="receita" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="despesa" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Right: Month summary */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring", damping: 22 }}
            className={`${gc} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Resumo do Mês</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fee dos Clientes</span>
                  <span className="text-sm font-bold text-emerald-500">{formatCurrency(totalFeeRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Receitas Avulsas</span>
                  <span className="text-sm font-bold text-amber-500">{formatCurrency(totalManualRevenue)}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground">Receita Total</span>
                  <span className="text-sm font-extrabold text-foreground">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Despesas Internas</span>
                  <span className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground">Lucro Líquido</span>
                  <span className={`text-lg font-extrabold ${profit >= 0 ? "text-emerald-500" : "text-destructive"}`}>{formatCurrency(profit)}</span>
                </div>
              </div>
              {/* Client breakdown */}
              {companySummaries.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fee por Cliente</p>
                  {companySummaries.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-[11px] text-foreground/80">{c.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground">{formatCurrency(c.totalFee)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom: Expenses & Manual Revenues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 pb-16">
          {/* Expenses */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: "spring", damping: 22 }}
            className={`${gc} overflow-hidden`}>
            <button onClick={() => setExpensesOpen(!expensesOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-destructive/10">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Despesas da Agência</p>
                  <p className="text-[11px] text-muted-foreground">{expenses.length} itens · {formatCurrency(totalExpenses)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); addExpense(); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-destructive/20 text-destructive">
                  <Plus className="h-3.5 w-3.5" />
                </motion.button>
                <motion.div animate={{ rotate: expensesOpen ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </button>
            <AnimatePresence>
              {expensesOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden">
                  <div className="px-4 pb-4">
                    <div className="border border-border/50 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Descrição</span><span className="w-24 text-right">Valor</span><span className="w-28 text-center">Data</span><span className="w-7" />
                      </div>
                      {expenses.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma despesa registrada.</p>}
                      {expenses.map(exp => <ExpenseRow key={exp.id} expense={exp} onUpdate={updateExpense} onRemove={removeExpense} />)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Manual Revenues */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring", damping: 22 }}
            className={`${gc} overflow-hidden`}>
            <button onClick={() => setRevenuesOpen(!revenuesOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10">
                  <Tag className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Receitas Avulsas</p>
                  <p className="text-[11px] text-muted-foreground">{revenues.length} itens · {formatCurrency(totalManualRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); addRevenue(); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-500">
                  <Plus className="h-3.5 w-3.5" />
                </motion.button>
                <motion.div animate={{ rotate: revenuesOpen ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </button>
            <AnimatePresence>
              {revenuesOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden">
                  <div className="px-4 pb-4">
                    <div className="border border-border/50 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Descrição</span><span className="w-24 text-right">Valor</span><span className="w-28 text-center">Data</span><span className="w-7" />
                      </div>
                      {revenues.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma receita avulsa.</p>}
                      {revenues.map(rev => <RevenueRow key={rev.id} revenue={rev} onUpdate={updateRevenue} onRemove={removeRevenue} />)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
