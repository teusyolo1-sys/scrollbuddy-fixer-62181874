import { useState, useEffect } from "react";
import { Target, Save, Trash2 } from "lucide-react";
import { useAgencyGoals } from "@/hooks/useAgencyGoals";

const formatMonth = (m: string) => {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

export default function GoalsSettingsTab() {
  const { goals, currentGoal, upsertGoal, removeGoal, currentMonth } = useAgencyGoals();
  const [month, setMonth] = useState(currentMonth);
  const [revenueGoal, setRevenueGoal] = useState(0);
  const [profitGoal, setProfitGoal] = useState(0);
  const [clientsGoal, setClientsGoal] = useState(0);
  const [notes, setNotes] = useState("");

  // Load selected month
  useEffect(() => {
    const g = goals.find(g => g.month === month);
    if (g) {
      setRevenueGoal(g.revenue_goal);
      setProfitGoal(g.profit_goal);
      setClientsGoal(g.clients_goal);
      setNotes(g.notes);
    } else {
      setRevenueGoal(0); setProfitGoal(0); setClientsGoal(0); setNotes("");
    }
  }, [month, goals]);

  const handleSave = () => {
    upsertGoal(month, { revenue_goal: revenueGoal, profit_goal: profitGoal, clients_goal: clientsGoal, notes });
  };

  // Generate next 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i - 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Metas Mensais</h3>
        </div>
      </div>

      <select
        className="ios-input px-3 py-2 text-sm w-full"
        value={month}
        onChange={e => setMonth(e.target.value)}
      >
        {monthOptions.map(m => (
          <option key={m} value={m}>{formatMonth(m)}{m === currentMonth ? " (atual)" : ""}</option>
        ))}
      </select>

      <div className="ios-card p-4 space-y-3">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Meta de Receita (R$)</label>
          <input type="number" className="ios-input w-full px-3 py-2 text-sm mt-1"
            value={revenueGoal || ""} onChange={e => setRevenueGoal(Number(e.target.value))} placeholder="Ex: 50000" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Meta de Lucro (R$)</label>
          <input type="number" className="ios-input w-full px-3 py-2 text-sm mt-1"
            value={profitGoal || ""} onChange={e => setProfitGoal(Number(e.target.value))} placeholder="Ex: 20000" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Meta de Clientes Ativos</label>
          <input type="number" className="ios-input w-full px-3 py-2 text-sm mt-1"
            value={clientsGoal || ""} onChange={e => setClientsGoal(Number(e.target.value))} placeholder="Ex: 10" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Observações</label>
          <textarea className="ios-input w-full px-3 py-2 text-sm mt-1 min-h-16"
            value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas sobre a meta..." />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-4 py-2 text-xs font-medium hover:bg-primary/20 transition-colors">
            <Save className="h-3.5 w-3.5" /> Salvar Meta
          </button>
          {goals.find(g => g.month === month) && (
            <button onClick={() => { const g = goals.find(g => g.month === month); if (g) removeGoal(g.id); }}
              className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* History */}
      {goals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Histórico</p>
          {goals.map(g => (
            <div key={g.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
              <span className="text-[11px] text-foreground/80">{formatMonth(g.month)}</span>
              <span className="text-[11px] font-bold text-primary">
                R$ {g.revenue_goal.toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
