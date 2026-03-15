import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Plus, Trash2,
  ArrowLeft, Building2, PieChart, BarChart3, Receipt, Tag, ChevronDown,
  Target, AlertTriangle, CheckCircle2, Clock, CreditCard, Percent,
  Sun, Moon
} from "lucide-react";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useAgencyWallet } from "@/hooks/useAgencyWallet";
import { useAgencyInvoices, type AgencyInvoice, type PaymentStatus } from "@/hooks/useAgencyInvoices";
import { useAgencyGoals } from "@/hooks/useAgencyGoals";
import { useTheme } from "@/hooks/useTheme";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const gc = "rounded-2xl border border-border/60 shadow-[var(--ios-shadow)] bg-card/70 backdrop-blur-xl";

/* ── Margin Badge ── */
function MarginBadge({ profit, revenue }: { profit: number; revenue: number }) {
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const color = margin > 30 ? "#10B981" : margin >= 10 ? "#F59E0B" : "#EF4444";
  const label = margin > 30 ? "Saudável" : margin >= 10 ? "Atenção" : "Crítica";
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${color}18`, color }}>
        {margin.toFixed(1)}%
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

/* ── Goal Progress Bar ── */
function GoalProgress({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
        <span className="text-[10px] font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>{formatCurrency(current)}</span>
        <span>Meta: {formatCurrency(target)}</span>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, color, delay, children }: {
  label: string; value: number; icon: any; color: string; delay: number; children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
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
      {children}
    </motion.div>
  );
}

/* ── Status config ── */
const statusConfig: Record<PaymentStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "#F59E0B", icon: Clock },
  overdue: { label: "Atrasado", color: "#EF4444", icon: AlertTriangle },
  paid: { label: "Pago", color: "#10B981", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "#6B7280", icon: Trash2 },
};

/* ── Invoice Row ── */
function InvoiceRow({ invoice, onUpdate, onRemove, companies }: {
  invoice: AgencyInvoice; onUpdate: (id: string, u: any) => void; onRemove: (id: string) => void;
  companies: { id: string; name: string; color: string }[];
}) {
  const sc = statusConfig[invoice.payment_status];
  const StatusIcon = sc.icon;
  const isOverdue = invoice.payment_status === 'overdue';
  return (
    <div className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-3 py-2.5 items-center hover:bg-accent/20 transition-colors group ${isOverdue ? 'bg-destructive/5' : ''}`}>
      <button
        onClick={() => {
          const next: PaymentStatus = invoice.payment_status === 'paid' ? 'pending' :
            invoice.payment_status === 'pending' || invoice.payment_status === 'overdue' ? 'paid' : 'pending';
          onUpdate(invoice.id, {
            payment_status: next,
            payment_date: next === 'paid' ? new Date().toISOString().slice(0, 10) : null,
          });
        }}
        className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
        style={{ backgroundColor: `${sc.color}18` }}
        title={sc.label}
      >
        <StatusIcon className="h-3 w-3" style={{ color: sc.color }} />
      </button>
      <div className="space-y-0.5">
        <input className="w-full bg-transparent text-xs font-medium text-foreground outline-none border-b border-border/30 focus:border-primary/40 py-0.5"
          value={invoice.description} onChange={e => onUpdate(invoice.id, { description: e.target.value })} placeholder="Descrição" />
        <select className="bg-transparent text-[10px] text-muted-foreground outline-none"
          value={invoice.company_id || ""} onChange={e => onUpdate(invoice.id, { company_id: e.target.value || null })}>
          <option value="">Sem empresa</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input type="number" className="w-24 bg-transparent text-xs font-bold text-right outline-none border-b border-border/30 focus:border-primary/40 py-1"
        value={invoice.amount || ""} onChange={e => onUpdate(invoice.id, { amount: Number(e.target.value) })} placeholder="0,00"
        style={{ color: sc.color }} />
      <input type="date" className="w-28 bg-transparent text-[10px] text-muted-foreground outline-none text-center border-b border-border/30 focus:border-primary/40 py-1"
        value={invoice.due_date} onChange={e => onUpdate(invoice.id, { due_date: e.target.value })} />
      <select className="w-20 bg-transparent text-[10px] text-muted-foreground outline-none"
        value={invoice.category} onChange={e => onUpdate(invoice.id, { category: e.target.value })}>
        <option value="fee">Fee</option>
        <option value="consultoria">Consultoria</option>
        <option value="bonus">Bônus</option>
        <option value="projeto">Projeto</option>
        <option value="outro">Outro</option>
      </select>
      <button onClick={() => onRemove(invoice.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ── Expense Row ── */
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

/* ── Revenue Row ── */
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

/* ── MAIN PAGE ── */
export default function AgencyWalletPage() {
  const navigate = useNavigate();
  const {
    expenses, revenues, companySummaries,
    totalFeeRevenue, totalManualRevenue, totalRevenue, totalExpenses, profit,
    loading: walletLoading,
    addExpense, updateExpense, removeExpense,
    addRevenue, updateRevenue, removeRevenue,
  } = useAgencyWallet();

  const {
    invoices, pendingInvoices, overdueInvoices,
    totalReceivable, totalOverdue,
    loading: invoicesLoading,
    addInvoice, updateInvoice, removeInvoice,
  } = useAgencyInvoices();

  const { currentGoal } = useAgencyGoals();
  const { resolvedTheme, setTheme } = useTheme();

  const [expensesOpen, setExpensesOpen] = useState(false);
  const [revenuesOpen, setRevenuesOpen] = useState(false);
  const [invoicesOpen, setInvoicesOpen] = useState(true);

  const loading = walletLoading || invoicesLoading;

  // Companies for invoice dropdown
  const companies = companySummaries.map(c => ({ id: c.id, name: c.name, color: c.color }));

  // Pie chart data
  const pieData = useMemo(() => {
    const data = companySummaries.map(c => ({ name: c.name, value: c.totalFee, color: c.color }));
    if (totalManualRevenue > 0) data.push({ name: "Receitas Avulsas", value: totalManualRevenue, color: "#F59E0B" });
    return data.length > 0 ? data : [{ name: "Sem dados", value: 1, color: "hsl(var(--muted))" }];
  }, [companySummaries, totalManualRevenue]);

  // Trend data
  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const mExp = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const mRev = revenues.filter(r => r.date.startsWith(key)).reduce((s, r) => s + r.amount, 0);
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
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)" }} />
        <motion.div className="absolute rounded-full" style={{
          width: 500, height: 500, background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 65%)",
          filter: "blur(80px)", top: "5%", right: "15%",
        }} animate={{ x: [0, -30, 15, 0], y: [0, 20, -10, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        {/* Header */}
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/50 border border-border hover:bg-secondary transition-colors"
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-foreground" />}
          </motion.button>
        </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Receita Total" value={totalRevenue} icon={TrendingUp} color="#10B981" delay={0} />
          <StatCard label="Despesas" value={totalExpenses} icon={TrendingDown} color="#EF4444" delay={0.05} />
          <StatCard label="Lucro Líquido" value={profit} icon={DollarSign} color={profit >= 0 ? "#10B981" : "#EF4444"} delay={0.1}>
            <MarginBadge profit={profit} revenue={totalRevenue} />
          </StatCard>
          <StatCard label="Contas a Receber" value={totalReceivable} icon={CreditCard} color={totalOverdue > 0 ? "#EF4444" : "#3B82F6"} delay={0.15}>
            {totalOverdue > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-bold text-destructive">{formatCurrency(totalOverdue)} atrasado</span>
              </div>
            )}
          </StatCard>
        </div>

        {/* Goal Progress */}
        {currentGoal && (currentGoal.revenue_goal > 0 || currentGoal.profit_goal > 0) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className={`${gc} p-5 mb-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Meta do Mês</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentGoal.revenue_goal > 0 && (
                <GoalProgress label="Receita" current={totalRevenue} target={currentGoal.revenue_goal} color="#10B981" />
              )}
              {currentGoal.profit_goal > 0 && (
                <GoalProgress label="Lucro" current={profit} target={currentGoal.profit_goal} color="#3B82F6" />
              )}
              {currentGoal.clients_goal > 0 && (
                <GoalProgress label="Clientes Ativos" current={companySummaries.length} target={currentGoal.clients_goal} color="#A78BFA" />
              )}
            </div>
          </motion.div>
        )}

        {/* Overdue Alert Banner */}
        {overdueInvoices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">
                {overdueInvoices.length} cobrança{overdueInvoices.length > 1 ? "s" : ""} atrasada{overdueInvoices.length > 1 ? "s" : ""}
              </span>
              <span className="text-xs text-destructive/70 ml-auto">{formatCurrency(totalOverdue)} total</span>
            </div>
            <div className="space-y-1">
              {overdueInvoices.slice(0, 5).map(inv => {
                const company = companies.find(c => c.id === inv.company_id);
                const daysLate = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
                return (
                  <div key={inv.id} className="flex items-center justify-between py-1 px-2 rounded-lg bg-destructive/5">
                    <div className="flex items-center gap-2">
                      {company && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: company.color }} />}
                      <span className="text-[11px] text-foreground/80">{inv.description || company?.name || "Sem descrição"}</span>
                      <span className="text-[10px] text-destructive font-medium">{daysLate}d atraso</span>
                    </div>
                    <span className="text-[11px] font-bold text-destructive">{formatCurrency(inv.amount)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pie */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, type: "spring", damping: 22 }}
            className={`${gc} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Receita por Cliente</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none" paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{
                  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px",
                }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
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

          {/* Trend */}
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
                  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px",
                }} />
                <Area type="monotone" dataKey="receita" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="despesa" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Month Summary */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, type: "spring", damping: 22 }}
            className={`${gc} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Resumo do Mês</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Fee dos Clientes</span><span className="text-sm font-bold text-emerald-500">{formatCurrency(totalFeeRevenue)}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Receitas Avulsas</span><span className="text-sm font-bold text-amber-500">{formatCurrency(totalManualRevenue)}</span></div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between"><span className="text-xs font-semibold text-foreground">Receita Total</span><span className="text-sm font-extrabold text-foreground">{formatCurrency(totalRevenue)}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Despesas Internas</span><span className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</span></div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-foreground">Lucro Líquido</span>
                    <MarginBadge profit={profit} revenue={totalRevenue} />
                  </div>
                  <span className={`text-lg font-extrabold ${profit >= 0 ? "text-emerald-500" : "text-destructive"}`}>{formatCurrency(profit)}</span>
                </div>
              </div>
              {/* Receivables summary */}
              {totalReceivable > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="h-px bg-border/50" />
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">A Receber</span><span className="text-sm font-bold text-blue-500">{formatCurrency(totalReceivable)}</span></div>
                  {totalOverdue > 0 && (
                    <div className="flex justify-between"><span className="text-xs text-destructive/70">Em Atraso</span><span className="text-sm font-bold text-destructive">{formatCurrency(totalOverdue)}</span></div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom: Invoices, Expenses & Revenues */}
        <div className="space-y-4 mt-4 pb-16">
          {/* Contas a Receber */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, type: "spring", damping: 22 }}
            className={`${gc} overflow-hidden`}>
            <button onClick={() => setInvoicesOpen(!invoicesOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Contas a Receber</p>
                  <p className="text-[11px] text-muted-foreground">
                    {invoices.length} faturas · {pendingInvoices.length} pendente{pendingInvoices.length !== 1 ? "s" : ""}
                    {overdueInvoices.length > 0 && <span className="text-destructive font-semibold"> · {overdueInvoices.length} atrasada{overdueInvoices.length !== 1 ? "s" : ""}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); addInvoice(); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-500">
                  <Plus className="h-3.5 w-3.5" />
                </motion.button>
                <motion.div animate={{ rotate: invoicesOpen ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </button>
            <AnimatePresence>
              {invoicesOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden">
                  <div className="px-4 pb-4">
                    <div className="border border-border/50 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="w-6">St</span><span>Descrição</span><span className="w-24 text-right">Valor</span>
                        <span className="w-28 text-center">Vencimento</span><span className="w-20">Tipo</span><span className="w-7" />
                      </div>
                      {invoices.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma fatura registrada.</p>}
                      {invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} onUpdate={updateInvoice} onRemove={removeInvoice} companies={companies} />)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); addExpense(); setExpensesOpen(true); }}
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, type: "spring", damping: 22 }}
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
                  <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); addRevenue(); setRevenuesOpen(true); }}
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
    </div>
  );
}
