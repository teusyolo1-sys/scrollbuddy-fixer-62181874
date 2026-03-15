import { useState, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Plus, Trash2, ChevronDown, Loader2,
  ArrowUpRight, ArrowDownRight, TrendingUp,
  FileText, CalendarDays,
  ChevronLeft, ChevronRight, X, Pencil, Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, ResponsiveContainer, CartesianGrid,
  PieChart as RPieChart, Pie, Cell,
  AreaChart, Area, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ComposedChart, XAxis, YAxis
} from "recharts";
import { CHART_STYLES, type ChartStyle, ChartStyleMenuItem } from "./ChartStylePicker";
import { useBudgetEntries, type BudgetCategory } from "@/hooks/useBudgetEntries";
import { useAuth } from "@/hooks/useAuth";
import { CardContextMenu } from "./budget/CardContextMenu";
import { FullscreenPanel } from "./budget/FullscreenPanel";
import { useCardMenu } from "./budget/useCardMenu";

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
function CatHeader({ config, count, total, onAdd, isExpanded, onToggle, customLabel, isRenaming, onRenameSubmit }: {
  config: { label: string; color: string; icon: "up" | "down" };
  count: number; total: number;
  onAdd: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  customLabel?: string;
  isRenaming?: boolean;
  onRenameSubmit?: (name: string) => void;
}) {
  const [renameValue, setRenameValue] = useState(customLabel || config.label);
  const displayLabel = customLabel || config.label;

  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${config.color}18` }}>
          {config.icon === "up"
            ? <ArrowUpRight className="h-4 w-4" style={{ color: config.color }} />
            : <ArrowDownRight className="h-4 w-4" style={{ color: config.color }} />}
        </div>
        <div className="text-left">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => onRenameSubmit?.(renameValue)}
              onKeyDown={(e) => { if (e.key === "Enter") onRenameSubmit?.(renameValue); }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-bold text-foreground bg-transparent border-b border-primary outline-none w-full"
            />
          ) : (
            <p className="text-sm font-bold text-foreground">{displayLabel}</p>
          )}
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
  const { isAdmin } = useUserRole();
  const getInitial = (p: any) => (p.display_name || p.email || "?")[0].toUpperCase();
  const getColor = (id: string) => {
    const c = ["#3B82F6","#10B981","#A78BFA","#EF4444","#F59E0B","#EC4899","#14B8A6","#F97316"];
    let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return c[Math.abs(h) % c.length];
  };

  if (entries.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">Nenhum item ainda.</p>;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <div className={`grid ${isAdmin ? "grid-cols-[1fr_auto_auto_auto_auto]" : "grid-cols-[1fr_auto_auto_auto]"} gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider`}>
        <span>Descrição</span><span className="w-20 text-right">Valor</span>
        {isAdmin && <span className="w-24 text-right">Fee Agência</span>}
        <span className="w-20 text-center">Data</span><span className="w-7" />
      </div>
      {entries.map((entry: any, idx: number) => (
        <div key={entry.id} className={`grid ${isAdmin ? "grid-cols-[1fr_auto_auto_auto_auto]" : "grid-cols-[1fr_auto_auto_auto]"} gap-2 px-3 py-2 items-center ${idx % 2 ? "bg-muted/20" : ""} hover:bg-accent/20 transition-colors group`}>
          <div className="space-y-1">
            <input className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/60 border-b border-border/30 focus:border-primary/40 transition-colors py-1"
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
            <input type="number" className="w-full bg-transparent text-xs font-bold text-right outline-none border-b border-border/30 focus:border-primary/40 transition-colors py-1" value={entry.amount || ""} onChange={(e) => onUpdate(entry.id, { amount: Number(e.target.value) })} placeholder="0,00" style={{ color: config.color }} />
          </div>
          {isAdmin && (
            <div className="w-24 flex items-center gap-1">
              <button
                onClick={() => onUpdate(entry.id, { agency_fee_type: entry.agency_fee_type === 'fixed' ? 'percent' : 'fixed' })}
                className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                title="Alternar entre R$ e %"
              >
                {entry.agency_fee_type === 'percent' ? '%' : 'R$'}
              </button>
              <input type="number" className="w-full bg-transparent text-xs font-bold text-right outline-none border-b border-emerald-500/30 focus:border-emerald-500/60 transition-colors py-1 text-emerald-500"
                value={entry.agency_fee || ""} onChange={(e) => onUpdate(entry.id, { agency_fee: Number(e.target.value) })} placeholder="0" />
            </div>
          )}
          <div className="w-20">
            <input type="date" className="w-full bg-transparent text-[10px] text-muted-foreground outline-none text-center border-b border-border/30 focus:border-primary/40 transition-colors py-1" value={entry.date} onChange={(e) => onUpdate(entry.id, { date: e.target.value })} />
          </div>
          <button onClick={() => onRemove(entry.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className={`grid ${isAdmin ? "grid-cols-[1fr_auto_auto_auto_auto]" : "grid-cols-[1fr_auto_auto_auto]"} gap-2 px-3 py-2 bg-muted/40 border-t border-border/50`}>
        <span className="text-[11px] font-bold text-foreground/70">Total</span>
        <span className="w-20 text-right text-xs font-extrabold" style={{ color: config.color }}>{formatCurrency(total)}</span>
        {isAdmin && (
          <span className="w-24 text-right text-xs font-extrabold text-emerald-500">
            {formatCurrency(entries.reduce((s, e) => s + (e.agency_fee_type === 'percent' ? (e.amount * e.agency_fee / 100) : e.agency_fee), 0))}
          </span>
        )}
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
  const { ctxPos, setCtxPos, isRenaming, setIsRenaming, isFullscreen, setIsFullscreen, handleContextMenu } = useCardMenu();
  const [customLabel, setCustomLabel] = useState<string | undefined>();
  const showTable = isExpanded && entries.length > 0;
  const displayLabel = customLabel || config.label;

  const cardContent = (
    <>
      <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} isExpanded={isExpanded} onToggle={onToggle}
        customLabel={customLabel} isRenaming={isRenaming} onRenameSubmit={(name) => { setCustomLabel(name); setIsRenaming(false); }} />
      {showTable && (
        <div className="px-4 pb-4">
          <EntryTable entries={entries} config={config} total={total} onUpdate={onUpdate} onRemove={onRemove} profiles={profiles} onToggleParticipant={onToggleParticipant} />
        </div>
      )}
    </>
  );

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
        className={`${gc}`} style={{ borderLeft: `3px solid ${config.color}30` }}
        onContextMenu={handleContextMenu}>
        {cardContent}
      </motion.div>
      {ctxPos && <CardContextMenu pos={ctxPos} onClose={() => setCtxPos(null)} onRename={() => setIsRenaming(true)} onFullscreen={() => setIsFullscreen(true)} />}
      {isFullscreen && (
        <FullscreenPanel title={displayLabel} onClose={() => setIsFullscreen(false)}>
          <div className={`${gc} max-w-4xl mx-auto`} style={{ borderLeft: `3px solid ${config.color}30` }}>
            <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} isExpanded={true} onToggle={() => {}} customLabel={customLabel} />
            {entries.length > 0 && (
              <div className="px-4 pb-4">
                <EntryTable entries={entries} config={config} total={total} onUpdate={onUpdate} onRemove={onRemove} profiles={profiles} onToggleParticipant={onToggleParticipant} />
              </div>
            )}
          </div>
        </FullscreenPanel>
      )}
    </>
  );
}

/* ── Donut Chart Card (center Gastos) ── */
function GastosChartCard({ entries, config, total, onAdd, delay, isExpanded, onToggle }: {
  entries: any[]; config: typeof categoryConfig.gasto; total: number; onAdd: () => void; delay: number;
  isExpanded: boolean; onToggle: () => void;
}) {
  const { ctxPos, setCtxPos, isRenaming, setIsRenaming, isFullscreen, setIsFullscreen, handleContextMenu } = useCardMenu();
  const [customLabel, setCustomLabel] = useState<string | undefined>();
  const chartData = useMemo(() => {
    if (entries.length === 0) return [{ name: "Vazio", value: 1, color: "hsl(var(--muted))" }];
    const byDesc: Record<string, number> = {};
    entries.forEach(e => { byDesc[e.description || "Sem descrição"] = (byDesc[e.description || "Sem descrição"] || 0) + e.amount; });
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#A78BFA", "#EF4444", "#EC4899"];
    return Object.entries(byDesc).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [entries]);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
        className={`${gc} overflow-hidden`} onContextMenu={handleContextMenu}>
        <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} isExpanded={isExpanded} onToggle={onToggle}
          customLabel={customLabel} isRenaming={isRenaming} onRenameSubmit={(name) => { setCustomLabel(name); setIsRenaming(false); }} />
        {isExpanded && (
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
        )}
      </motion.div>
      {ctxPos && <CardContextMenu pos={ctxPos} onClose={() => setCtxPos(null)} onRename={() => setIsRenaming(true)} onFullscreen={() => setIsFullscreen(true)} />}
      {isFullscreen && (
        <FullscreenPanel title={customLabel || config.label} onClose={() => setIsFullscreen(false)}>
          <div className={`${gc} max-w-2xl mx-auto p-6`}>
            <div className="flex items-center justify-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <RPieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Pie>
                </RPieChart>
              </ResponsiveContainer>
              <ResponsiveContainer width={200} height={200}>
                <RPieChart>
                  <Pie data={chartData} innerRadius={0} outerRadius={90} dataKey="value" stroke="none">
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.7} />)}
                  </Pie>
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FullscreenPanel>
      )}
    </>
  );
}

/* ── Pipeline Placeholder (center Faturamento) ── */
function PipelineCard({ faturamentoEntries, onAdd, delay, isExpanded, onToggle }: {
  faturamentoEntries: any[]; onAdd: () => void; delay: number; isExpanded: boolean; onToggle: () => void;
}) {
  const upcoming = faturamentoEntries.filter(e => e.amount > 0).slice(0, 2);
  const total = faturamentoEntries.reduce((s, e) => s + e.amount, 0);
  const { ctxPos, setCtxPos, isRenaming, setIsRenaming, isFullscreen, setIsFullscreen, handleContextMenu: handleCtx } = useCardMenu();
  const [customLabel, setCustomLabel] = useState("Faturamento");
  const [renameValue, setRenameValue] = useState("Faturamento");

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
        className={`${gc} overflow-hidden flex flex-col ${isExpanded ? "row-span-2" : "h-fit"}`}
        onContextMenu={handleCtx}>
        <button onClick={onToggle} className="p-4 hover:bg-accent/20 transition-colors w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-left">
              {isRenaming ? (
                <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => { setCustomLabel(renameValue); setIsRenaming(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setCustomLabel(renameValue); setIsRenaming(false); } }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-bold text-foreground bg-transparent border-b border-primary outline-none w-full" />
              ) : (
                <p className="text-sm font-bold text-foreground">{customLabel}</p>
              )}
              <p className="text-[11px] text-muted-foreground">{faturamentoEntries.length} {faturamentoEntries.length === 1 ? "item" : "itens"} · {formatCurrency(total)}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <motion.div whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-500 cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
              </motion.div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </button>

        {isExpanded && (
          <>
            <AnimatePresence>
              {faturamentoEntries.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden px-4 pb-3">
                  <div className="space-y-1.5">
                    {faturamentoEntries.map((e, i) => (
                      <div key={e.id} className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-muted/30">
                        <span className="text-[11px] text-foreground/80 truncate max-w-[140px]">{e.description || `Item ${i + 1}`}</span>
                        <span className="text-[11px] font-bold text-emerald-500">{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {faturamentoEntries.length === 0 && (
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
            )}

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
          </>
        )}
      </motion.div>
      {ctxPos && <CardContextMenu pos={ctxPos} onClose={() => setCtxPos(null)} onRename={() => setIsRenaming(true)} onFullscreen={() => setIsFullscreen(true)} />}
      {isFullscreen && (
        <FullscreenPanel title={customLabel} onClose={() => setIsFullscreen(false)}>
          <div className={`${gc} max-w-2xl mx-auto p-6 space-y-4`}>
            {faturamentoEntries.map((e, i) => (
              <div key={e.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm text-foreground/80">{e.description || `Item ${i + 1}`}</span>
                <span className="text-sm font-bold text-emerald-500">{formatCurrency(e.amount)}</span>
              </div>
            ))}
            {faturamentoEntries.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum item de faturamento.</p>}
          </div>
        </FullscreenPanel>
      )}
    </>
  );
}

/* ── Legend + Stacked Bar (right column center) ── */
function LegendBarCard({ entries, delay }: { entries: any[]; delay: number }) {
  const [chartStyle, setChartStyle] = useState<ChartStyle>("column");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [customLabel, setCustomLabel] = useState("Resumo");
  const [renameValue, setRenameValue] = useState("Resumo");
  const menuRef = useRef<HTMLDivElement>(null);

  const legendItems = [
    { label: "Fornce Fortes", color: "#3B82F6" },
    { label: "Produced Funds", color: "#10B981" },
    { label: "Receita lends", color: "#A78BFA" },
    { label: "Broacked Source", color: "#F59E0B" },
    { label: "Other", color: "#EF4444" },
  ];

  const chartData = useMemo(() => {
    const months: { name: string; [key: string]: number | string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const row: any = { name: label };
      categories.forEach(cat => {
        row[categoryConfig[cat].label] = entries
          .filter(e => e.category === cat && e.date.startsWith(key))
          .reduce((s, e) => s + e.amount, 0);
      });
      months.push(row);
    }
    return months;
  }, [entries]);

  const catColors = categories.map(c => ({ name: categoryConfig[c].label, color: categoryConfig[c].color }));

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setCtxMenu(null), []);

  const pieData = useMemo(() => catColors.map(c => ({
    name: c.name,
    value: chartData.reduce((s, row) => s + ((row[c.name] as number) || 0), 0),
    color: c.color,
  })).filter(d => d.value > 0), [chartData, catColors]);

  const renderChart = (h = 110) => {
    switch (chartStyle) {
      case "line":
        return (<ResponsiveContainer width="100%" height={h}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />{catColors.map((d, i) => <Line key={i} type="monotone" dataKey={d.name} stroke={d.color} strokeWidth={2} dot={false} />)}</LineChart></ResponsiveContainer>);
      case "area":
        return (<ResponsiveContainer width="100%" height={h}><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />{catColors.map((d, i) => <Area key={i} type="monotone" dataKey={d.name} stroke={d.color} fill={d.color} fillOpacity={0.2} strokeWidth={2} />)}</AreaChart></ResponsiveContainer>);
      case "bar":
        return (<ResponsiveContainer width="100%" height={h}><BarChart data={chartData} layout="vertical" barSize={10}><XAxis type="number" hide /><YAxis type="category" dataKey="name" hide />{catColors.map((d, i) => <Bar key={i} dataKey={d.name} stackId="a" fill={d.color} fillOpacity={0.85} radius={[0, 4, 4, 0]} />)}</BarChart></ResponsiveContainer>);
      case "pie":
        return (<ResponsiveContainer width="100%" height={h}><RPieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={h * 0.18} outerRadius={h * 0.4} stroke="none">{pieData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}</Pie></RPieChart></ResponsiveContainer>);
      case "radar":
        return (<ResponsiveContainer width="100%" height={h}><RadarChart data={pieData} cx="50%" cy="50%" outerRadius={h * 0.35}><PolarGrid stroke="hsl(var(--border))" /><PolarAngleAxis dataKey="name" tick={{ fontSize: 7 }} /><Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} /></RadarChart></ResponsiveContainer>);
      case "pareto":
        return (<ResponsiveContainer width="100%" height={h}><ComposedChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />{catColors.map((d, i) => <Bar key={i} dataKey={d.name} stackId="a" fill={d.color} barSize={20} radius={[3, 3, 0, 0]} />)}</ComposedChart></ResponsiveContainer>);
      default:
        return (<ResponsiveContainer width="100%" height={h}><BarChart data={chartData} barSize={16} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />{catColors.map((d, i) => <Bar key={i} dataKey={d.name} stackId="a" fill={d.color} fillOpacity={0.85} radius={i === catColors.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />)}</BarChart></ResponsiveContainer>);
    }
  };

  const supportedStyles: ChartStyle[] = ["column", "bar", "line", "area", "pie", "radar", "pareto"];
  const filteredStyles = CHART_STYLES.filter(s => supportedStyles.includes(s.key));

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
        className={`${gc} p-4`} onContextMenu={handleContextMenu}>
        <div className="flex items-start gap-4">
          <div className="space-y-1.5 shrink-0 pt-1">
            {legendItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0">{renderChart()}</div>
        </div>
      </motion.div>

      {ctxMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} />
          <div ref={menuRef}
            className="fixed z-[9999] bg-card border border-border/60 rounded-xl shadow-xl py-1.5 px-1 min-w-[200px] backdrop-blur-xl"
            style={{ left: Math.min(ctxMenu.x, window.innerWidth - 220), top: Math.min(ctxMenu.y, window.innerHeight - 500) }}>
            <button onClick={() => { setIsRenaming(true); closeMenu(); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent/40 transition-colors text-foreground">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" /><span>Renomear</span>
            </button>
            <button onClick={() => { setIsFullscreen(true); closeMenu(); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent/40 transition-colors text-foreground">
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" /><span>Abrir em tela cheia</span>
            </button>
            <div className="h-px bg-border/40 my-1" />
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estilo do Gráfico</div>
            {filteredStyles.map(cfg => (
              <ChartStyleMenuItem key={cfg.key} config={cfg} isActive={chartStyle === cfg.key}
                onSelect={() => { setChartStyle(cfg.key); closeMenu(); }} />
            ))}
          </div>
        </>,
        document.body
      )}

      {isRenaming && createPortal(
        <div className="fixed inset-0 z-[9990] bg-background/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => { setCustomLabel(renameValue); setIsRenaming(false); }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`${gc} p-6 min-w-[300px]`} onClick={e => e.stopPropagation()}>
            <p className="text-xs font-bold text-muted-foreground mb-2">Renomear painel</p>
            <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setCustomLabel(renameValue); setIsRenaming(false); } }}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          </motion.div>
        </div>,
        document.body
      )}

      {isFullscreen && (
        <FullscreenPanel title={customLabel} onClose={() => setIsFullscreen(false)}>
          <div className={`${gc} max-w-4xl mx-auto p-6`}>
            <div className="flex items-start gap-6">
              <div className="space-y-2 shrink-0">
                {legendItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1">{renderChart(350)}</div>
            </div>
          </div>
        </FullscreenPanel>
      )}
    </>
  );
}

/* ── Despesas Detail Table (right column) ── */
function DespesasDetailCard({ entries, config, total, onAdd, delay, isExpanded, onToggle }: {
  entries: any[]; config: typeof categoryConfig.despesa; total: number; onAdd: () => void; delay: number;
  isExpanded: boolean; onToggle: () => void;
}) {
  const { ctxPos, setCtxPos, isRenaming, setIsRenaming, isFullscreen, setIsFullscreen, handleContextMenu } = useCardMenu();
  const [customLabel, setCustomLabel] = useState<string | undefined>();
  const [rowNames, setRowNames] = useState(["Expense type", "Expense type", "Receital", "Other treakion"]);
  const [editingRow, setEditingRow] = useState<{ idx: number; pos: { x: number; y: number } } | null>(null);
  const [editValue, setEditValue] = useState("");

  const detailColors = ["#3B82F6", "#10B981", "#F59E0B", "#A78BFA"];
  const detailData = [
    { ret: 37, total: "R$ 11.3%" },
    { ret: 25, total: "R$ 11.5%" },
    { ret: 19, total: "0.0%" },
    { ret: 7, total: "0,00" },
  ];

  const handleRowContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingRow({ idx, pos: { x: e.clientX, y: e.clientY } });
    setEditValue(rowNames[idx]);
  };

  const submitRowRename = () => {
    if (editingRow !== null) {
      setRowNames(prev => prev.map((n, i) => i === editingRow.idx ? editValue : n));
      setEditingRow(null);
    }
  };

  const renderTable = (allowEdit: boolean) => (
    <div className="px-4 pb-4">
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Type of</span><span className="w-14 text-right">Return</span><span className="w-16 text-right">Total</span>
        </div>
        {rowNames.map((name, i) => (
          <div key={i}
            className={`grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 items-center ${i % 2 ? "bg-muted/20" : ""} ${allowEdit ? "cursor-context-menu" : ""}`}
            onContextMenu={allowEdit ? (e) => handleRowContextMenu(e, i) : undefined}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: detailColors[i] }} />
              <span className="text-[11px] text-foreground/80">{name}</span>
            </div>
            <span className="w-14 text-right text-[11px] text-foreground/70">{detailData[i].ret}</span>
            <span className="w-16 text-right text-[11px] text-foreground/70">{detailData[i].total}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", damping: 22 }}
        className={`${gc} overflow-hidden`} onContextMenu={handleContextMenu}>
        <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} isExpanded={isExpanded} onToggle={onToggle}
          customLabel={customLabel} isRenaming={isRenaming} onRenameSubmit={(name) => { setCustomLabel(name); setIsRenaming(false); }} />
        {isExpanded && renderTable(false)}
      </motion.div>
      {ctxPos && <CardContextMenu pos={ctxPos} onClose={() => setCtxPos(null)} onRename={() => setIsRenaming(true)} onFullscreen={() => setIsFullscreen(true)} />}
      {isFullscreen && (
        <FullscreenPanel title={customLabel || config.label} onClose={() => setIsFullscreen(false)}>
          <div className={`${gc} max-w-2xl mx-auto overflow-hidden`}>
            <CatHeader config={config} count={entries.length} total={total} onAdd={onAdd} isExpanded={true} onToggle={() => {}} customLabel={customLabel} />
            {renderTable(true)}
          </div>
        </FullscreenPanel>
      )}
      {editingRow !== null && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={submitRowRename} onContextMenu={(e) => { e.preventDefault(); submitRowRename(); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 22, stiffness: 400 }}
            className="fixed z-[9999] bg-card border border-border/60 rounded-xl shadow-xl p-4 min-w-[240px] backdrop-blur-xl"
            style={{
              left: Math.min(editingRow.pos.x, window.innerWidth - 260),
              top: Math.min(editingRow.pos.y, window.innerHeight - 100),
            }}
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Renomear item</p>
            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitRowRename(); }}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          </motion.div>
        </>,
        document.body
      )}
    </>
  );
}
function BudgetCalendar({ entries, open, onClose }: { entries: any[]; open: boolean; onClose: () => void }) {
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const entriesByDate = useMemo(() => {
    const map: Record<string, { total: number; items: any[] }> = {};
    entries.forEach(e => {
      if (!map[e.date]) map[e.date] = { total: 0, items: [] };
      map[e.date].total += e.amount;
      map[e.date].items.push(e);
    });
    return map;
  }, [entries]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedEntries = selectedDate ? entriesByDate[selectedDate]?.items || [] : [];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prev = () => setViewMonth(new Date(year, month - 1, 1));
  const next = () => setViewMonth(new Date(year, month + 1, 1));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: "spring", damping: 22 }}
          className={`${gc} overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Economias</p>
                <p className="text-[11px] text-muted-foreground">Acompanhe todos os registros por data</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent/30 transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <motion.button whileTap={{ scale: 0.9 }} onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent/30 transition-colors">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </motion.button>
            <span className="text-xs font-bold text-foreground capitalize">{monthName}</span>
            <motion.button whileTap={{ scale: 0.9 }} onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent/30 transition-colors">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 px-4 pt-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground/60 uppercase pb-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 px-4 pb-3">
            {days.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const data = entriesByDate[dateStr];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().slice(0, 10);

              return (
                <motion.button
                  key={dateStr}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg transition-all text-[11px]
                    ${isSelected ? "bg-primary text-primary-foreground font-bold" : isToday ? "bg-accent/40 text-foreground font-semibold" : "hover:bg-accent/20 text-foreground/70"}`}
                >
                  {day}
                  {data && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-primary-foreground/70" : data.total > 0 ? "bg-emerald-500" : "bg-destructive"}`} />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Selected date details */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="overflow-hidden border-t border-border/40"
              >
                <div className="p-4 space-y-2">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  {selectedEntries.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/50 text-center py-3">Nenhum registro nesta data.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedEntries.map((entry: any) => {
                        const cfg = categoryConfig[entry.category as BudgetCategory];
                        return (
                          <div key={entry.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                              <span className="text-[11px] text-foreground/80 truncate max-w-[140px]">{entry.description || cfg.label}</span>
                              <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">{cfg.label}</span>
                            </div>
                            <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{formatCurrency(entry.amount)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between pt-1.5 border-t border-border/30">
                        <span className="text-[10px] font-bold text-muted-foreground">Total do dia</span>
                        <span className="text-[11px] font-extrabold text-foreground">{formatCurrency(entriesByDate[selectedDate]?.total || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════
   ██  MAIN COMPONENT
   ══════════════════════════════════════════ */
const CACHE_KEY = 'budget-open-panels';

function loadCachedPanels(): Set<string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveCachedPanels(panels: Set<string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...panels]));
  } catch {}
}

export default function BudgetCalculator({ companyId }: { companyId?: string }) {
  const { user } = useAuth();
  const { entries, profiles, loading, addEntry, updateEntry, removeEntry, toggleParticipant } = useBudgetEntries(companyId);
  const [openPanels, setOpenPanels] = useState<Set<string>>(() => loadCachedPanels());
  const [calendarOpen, setCalendarOpen] = useState(() => {
    try { return localStorage.getItem('budget-calendar-open') === 'true'; } catch { return false; }
  });

  const totals = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = entries.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return acc;
    }, {} as Record<BudgetCategory, number>);
  }, [entries]);

  const togglePanel = (panelKey: string) => {
    setOpenPanels(prev => {
      const next = new Set(prev);
      if (next.has(panelKey)) next.delete(panelKey); else next.add(panelKey);
      saveCachedPanels(next);
      return next;
    });
  };

  const openPanelAndAdd = (panelKey: string, cat: BudgetCategory) => {
    addEntry(cat);
    setOpenPanels(prev => {
      const next = new Set(prev);
      next.add(panelKey);
      saveCachedPanels(next);
      return next;
    });
  };

  const handleCalendarToggle = () => {
    setCalendarOpen(prev => {
      const next = !prev;
      try { localStorage.setItem('budget-calendar-open', String(next)); } catch {}
      return next;
    });
  };

  const catProps = (cat: BudgetCategory) => ({
    cat,
    config: categoryConfig[cat],
    entries: entries.filter(e => e.category === cat),
    total: totals[cat],
    isExpanded: openPanels.has(cat),
    onToggle: () => togglePanel(cat),
    onAdd: () => openPanelAndAdd(cat, cat),
    onUpdate: updateEntry,
    onRemove: removeEntry,
    profiles,
    onToggleParticipant: toggleParticipant,
  });

  if (!user) return <div className="flex items-center justify-center py-20 text-muted-foreground">Faça login para acessar o orçamento.</div>;
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">

      {/* Calendar toggle button */}
      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCalendarToggle}
          className={`${gc} px-4 py-2.5 flex items-center gap-2.5 hover:bg-accent/20 transition-colors`}
        >
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Economias</span>
          <motion.div animate={{ rotate: calendarOpen ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        </motion.button>
      </div>

      {/* Budget Calendar */}
      <BudgetCalendar entries={entries} open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      {/* Row 1: Investimentos (full width) */}
      <CategoryCard {...catProps("investimento")} delay={0} />

      {/* Row 2: Gastos | Gastos (charts) | Receita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <CategoryCard {...catProps("gasto")} delay={0.05} />
        <GastosChartCard
          entries={entries.filter(e => e.category === "gasto")}
          config={categoryConfig.gasto}
          total={totals.gasto}
          onAdd={() => openPanelAndAdd("gasto-chart", "gasto")}
          isExpanded={openPanel === "gasto-chart"}
          onToggle={() => togglePanel("gasto-chart")}
          delay={0.1}
        />
        <CategoryCard {...catProps("receita")} delay={0.15} />
      </div>

      {/* Row 3: Faturamento (table) | Pipeline | Legend + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="space-y-4">
          <CategoryCard {...catProps("faturamento")} delay={0.2} />
          {/* Row 4 left: Despesas */}
          <CategoryCard {...catProps("despesa")} delay={0.3} />
        </div>

        {/* Center: Pipeline spanning 2 rows */}
        <PipelineCard
          faturamentoEntries={entries.filter(e => e.category === "faturamento")}
          onAdd={() => openPanelAndAdd("pipeline", "faturamento")}
          isExpanded={openPanel === "pipeline"}
          onToggle={() => togglePanel("pipeline")}
          delay={0.25}
        />

        {/* Right: Legend + Bar, then Despesas detail */}
        <div className="space-y-4">
          <LegendBarCard entries={entries} delay={0.3} />
          <DespesasDetailCard
            entries={entries.filter(e => e.category === "despesa")}
            config={categoryConfig.despesa}
            total={totals.despesa}
            onAdd={() => openPanelAndAdd("despesa-detail", "despesa")}
            isExpanded={openPanel === "despesa-detail"}
            onToggle={() => togglePanel("despesa-detail")}
            delay={0.35}
          />
        </div>
      </div>
    </div>
  );
}
