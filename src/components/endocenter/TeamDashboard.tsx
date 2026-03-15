import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Check, ChevronDown, ChevronUp, Clock3, DollarSign, Pencil, Target, TrendingUp, Upload, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, type MetricPeriod } from "@/store/endocenterStore";
import { useUserRole } from "@/hooks/useUserRole";
import { useTeamRole } from "@/hooks/useTeamRole";

const periodFilters: Array<MetricPeriod | "Todas"> = ["Todas", "Diária", "Semanal", "Mensal", "Anual"];

/* ── Optimized iOS 26 animation presets ── */
// Diaphragm — fast bloom with less oscillation
const diaphragm = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring", damping: 26, stiffness: 340, mass: 0.5 },
};

// Bouncy — snappy elastic with quick settle
const bouncy = {
  type: "spring" as const,
  damping: 20,
  stiffness: 380,
  mass: 0.45,
};

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function MonthYearPicker() {
  const { company, setCompany } = useEndocenter();
  const [open, setOpen] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const parts = company.month.split(" ");
  const currentMonth = parts[0] ?? "Março";
  const currentYear = parseInt(parts[1] ?? "2025", 10);

  // Build years from createdAt to now
  const createdDate = new Date(company.createdAt || Date.now());
  const createdYear = createdDate.getFullYear();
  const createdMonthIdx = createdDate.getMonth();
  const nowYear = new Date().getFullYear();
  const years = Array.from({ length: nowYear - createdYear + 1 }, (_, i) => createdYear + i);

  // Filter months: if selected year === createdYear, only show from createdMonth onward
  const availableMonths = months.filter((_, i) => {
    if (currentYear === createdYear && i < createdMonthIdx) return false;
    if (currentYear === nowYear && i > new Date().getMonth()) return false;
    return true;
  });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  const select = useCallback((month: string, year: number) => {
    setCompany({ ...company, month: `${month} ${year}` });
    setOpen(false);
  }, [company, setCompany]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative">
      <span
        ref={badgeRef}
        onContextMenu={handleContextMenu}
        className="ios-badge ios-status-info cursor-context-menu select-none"
      >
        {company.month}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", damping: 24, stiffness: 400 }}
            className="absolute right-0 top-full mt-2 z-[100] ios-card p-3 shadow-2xl w-[240px]"
          >
            {/* Year row */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-border/40">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => select(currentMonth, y)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    y === currentYear
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1">
              {availableMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => select(m, currentYear)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    m === currentMonth
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── iOS 26 Status Dropdown ── */
function StatusDropdown({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const statusColors: Record<string, string> = {
    "Ativo": "hsl(var(--ios-green, 142 71% 45%))",
    "Inativo": "hsl(var(--destructive))",
    "Férias": "hsl(var(--warning, 38 92% 50%))",
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ios-input w-full px-3 py-2 text-sm flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[value] || "hsl(var(--muted-foreground))" }} />
          <span className="text-foreground">{value}</span>
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
            style={{ borderRadius: "var(--ios-radius)", boxShadow: "var(--ios-shadow-float)" }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[opt] || "hsl(var(--muted-foreground))" }} />
                <span className="flex-1 text-left text-foreground">{opt}</span>
                {value === opt && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TeamDashboard() {
  const { team, company, metricEntries } = useEndocenter();
  const { isAdmin } = useUserRole();
  const { teamRole } = useTeamRole();
  const [selectedMember, setSelectedMember] = useState<typeof team[number] | null>(null);
  const [periodFilter, setPeriodFilter] = useState<MetricPeriod | "Todas">("Todas");

  // Filter team: non-admin users only see members matching their role
  const visibleTeam = useMemo(() => {
    if (isAdmin || !teamRole) return team;
    const filtered = team.filter((m) => m.role === teamRole);
    // If no match found, show all (role name might differ)
    return filtered.length > 0 ? filtered : team;
  }, [team, isAdmin, teamRole]);

  const totalRemuneration = useMemo(() => visibleTeam.reduce((sum, m) => sum + m.remuneration, 0), [visibleTeam]);
  const totalHours = useMemo(() => visibleTeam.reduce((sum, m) => sum + m.hours, 0), [visibleTeam]);

  const filteredMetrics = useMemo(
    () => metricEntries.filter((m) => periodFilter === "Todas" || m.period === periodFilter),
    [metricEntries, periodFilter]
  );

  const summaryCards = isAdmin ? [
    { label: "Investimento mensal", value: `R$ ${totalRemuneration.toLocaleString("pt-BR")}`, sub: "Folha total", icon: DollarSign, color: "hsl(var(--ios-blue))" },
    { label: "Horas / mês", value: `${totalHours}h`, sub: "Capacidade", icon: Clock3, color: "hsl(var(--ios-purple))" },
    { label: "Valor médio / hora", value: `R$ ${totalHours > 0 ? (totalRemuneration / totalHours).toFixed(2).replace(".", ",") : "0,00"}`, sub: "Rem ÷ Horas", icon: TrendingUp, color: "hsl(var(--ios-green))" },
    { label: "Profissionais ativos", value: String(visibleTeam.filter((m) => m.status === "Ativo").length), sub: "Operacionais", icon: BarChart3, color: "hsl(var(--ios-orange))" },
  ] : [
    { label: "Profissionais ativos", value: String(visibleTeam.filter((m) => m.status === "Ativo").length), sub: "Operacionais", icon: BarChart3, color: "hsl(var(--ios-orange))" },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Dashboard da equipe</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Resumo financeiro, cases e métricas</p>
        </div>
        <MonthYearPicker />
      </div>

      {/* Summary metrics — Diaphragm bloom entrance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={diaphragm.initial}
              animate={diaphragm.animate}
              transition={{ type: "spring", damping: 18, stiffness: 200, mass: 0.8, delay: i * 0.08 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
              className="ios-card p-5 cursor-default"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${card.color}15` }}>
                <Icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
              <div className="text-2xl font-extrabold tracking-tight" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs font-semibold mt-1 text-foreground">{card.label}</div>
              <div className="text-[11px] text-muted-foreground">{card.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Metrics — Fluid morph segmented control */}
      <div className="ios-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-foreground">Métricas registradas</h3>
          <div className="ios-segmented flex relative">
            {periodFilters.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className="ios-segmented-item relative z-10"
                data-active={periodFilter === p}
              >
                {p}
                {/* Fluid morph indicator */}
                {periodFilter === p && (
                  <motion.div
                    layoutId="metricFilter"
                    className="absolute inset-0 rounded-[calc(var(--ios-radius)-3px)] bg-card"
                    style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)", zIndex: -1 }}
                    transition={{ type: "spring", damping: 22, stiffness: 350 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {filteredMetrics.map((metric) => {
            const animKey = `${metric.id}-${periodFilter}`;
            const pct = metric.target > 0 ? Math.min(100, Math.round((metric.value / metric.target) * 100)) : 0;
            return (
              <motion.div
                key={animKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={bouncy}
                className="p-4 rounded-2xl bg-secondary/30 border border-border/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{metric.name}</span>
                  <span className="ios-badge ios-status-info">{metric.period}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Atual: {metric.value.toLocaleString("pt-BR")} · Meta: {metric.target.toLocaleString("pt-BR")}
                </div>
                <div className="mt-2 h-[6px] rounded-full overflow-hidden bg-secondary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "hsl(var(--ios-blue))" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                {metric.notes && <p className="text-[11px] text-muted-foreground mt-2">{metric.notes}</p>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Team members */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">Composição da equipe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {visibleTeam.map((member, i) => (
            <MemberCard
              key={member.id}
              member={member}
              index={i}
              isExpanded={false}
              onToggle={() => setSelectedMember(member)}
            />
          ))}
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedMember && (
          <ProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Member Card Component ── */
interface MemberCardProps {
  member: ReturnType<typeof useEndocenter>["team"][number];
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  showFinancials?: boolean;
}

function MemberCard({ member, index, isExpanded, onToggle, showFinancials = true }: MemberCardProps) {
  const hourlyRate = member.hours > 0 ? member.remuneration / member.hours : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...bouncy, delay: Math.min(index * 0.05, 0.2) }}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
      style={{ willChange: "transform, opacity" }}
      className="ios-card overflow-hidden cursor-pointer"
      onClick={() => onToggle(member.id)}
    >
      <div className="p-5" style={{ borderLeft: `4px solid ${member.color}` }}>
        <div className="flex items-center gap-3.5">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="h-12 w-12 object-cover rounded-2xl" />
          ) : (
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl" style={{ background: `${member.color}15` }}>
              <User className="h-5 w-5" style={{ color: member.color }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-foreground truncate">{member.name}</div>
            <div className="text-sm font-medium" style={{ color: member.color }}>{member.role}</div>
          </div>
          <span className={`ios-badge ${
            member.status === "Ativo" ? "ios-status-active"
              : member.status === "Férias" ? "ios-status-warning"
              : "ios-status-danger"
          }`}>
            {member.status}
          </span>
        </div>

        {showFinancials ? (
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {[
              { label: "Remuneração", value: `R$ ${member.remuneration.toLocaleString("pt-BR")}`, sub: "/ mês" },
              { label: "Carga Horária", value: `${member.hours}h`, sub: "/ mês" },
              { label: "Valor / Hora", value: `R$ ${hourlyRate.toFixed(2).replace(".", ",")}`, sub: "calculado" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 text-center rounded-2xl bg-secondary/40">
                <div className="text-[10px] font-medium text-muted-foreground">{stat.label}</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Cargo:</span> {member.role}</p>
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tarefas:</span> {member.tasks.slice(0, 2).join(", ")}{member.tasks.length > 2 ? "..." : ""}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Profile Modal ── */
function ProfileModal({ member, onClose }: { member: ReturnType<typeof useEndocenter>["team"][number]; onClose: () => void }) {
  const { updateMember } = useEndocenter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...member });
  const hourlyRate = form.hours > 0 ? form.remuneration / form.hours : 0;

  const handleSave = () => {
    updateMember(member.id, {
      name: form.name,
      role: form.role,
      specialty: form.specialty,
      remuneration: form.remuneration,
      hours: form.hours,
      color: form.color,
      status: form.status,
      caseNotes: form.caseNotes,
      tasks: form.tasks,
      kpis: form.kpis,
    });
    setEditing(false);
  };

  const handlePhotoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const url = (re.target?.result as string) ?? "";
        updateMember(member.id, { photoUrl: url });
        setForm((f) => ({ ...f, photoUrl: url }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border/50 max-h-[90vh] flex flex-col"
        style={{ borderRadius: "var(--ios-radius-xl)", boxShadow: "var(--ios-shadow-float)", overflow: "hidden" }}
      >
        <div className="overflow-y-auto flex-1">
        {/* Header with color band */}
        <div className="relative h-24 flex items-end px-6 pb-4" style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}AA)` }}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <motion.button
              onClick={() => { if (editing) handleSave(); else setEditing(true); }}
              className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/30 transition-colors"
              whileHover={{ scale: 1.15, rotate: editing ? 0 : -15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", damping: 12, stiffness: 400 }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </motion.button>
            <motion.button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/30 transition-colors"
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", damping: 12, stiffness: 400 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Avatar overlapping */}
        <div className="relative px-6 -mt-10">
          <div className="relative w-fit">
            {form.photoUrl ? (
              <img src={form.photoUrl} alt={form.name} className="h-20 w-20 rounded-3xl object-cover border-4 border-card shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-3xl border-4 border-card shadow-lg flex items-center justify-center bg-muted">
                <User className="h-8 w-8" style={{ color: form.color }} />
              </div>
            )}
            {editing && (
              <motion.button onClick={handlePhotoUpload} whileHover={{ scale: 1.15, rotate: 15 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 14 }} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Upload className="h-3 w-3" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pt-3 pb-6 space-y-5">
          {editing ? (
            /* ── Edit Mode ── */
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-2">
                <input className="ios-input px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" />
                <input className="ios-input px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Função" />
              </div>
              <input className="ios-input w-full px-3 py-2 text-sm" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Especialidade" />
              <div className="grid sm:grid-cols-2 gap-2">
                <input type="number" className="ios-input px-3 py-2 text-sm" value={form.remuneration} onChange={(e) => setForm({ ...form, remuneration: Number(e.target.value) })} placeholder="Remuneração" />
                <input type="number" className="ios-input px-3 py-2 text-sm" value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} placeholder="Horas / mês" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-10 shrink-0 rounded-lg border border-border bg-transparent cursor-pointer" />
                  <input className="ios-input flex-1 min-w-0 px-3 py-2 text-sm" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#000000" />
                </div>
                <StatusDropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["Ativo", "Inativo", "Férias"]} />
              </div>
              <textarea className="ios-input w-full px-3 py-2 text-sm min-h-20" value={form.caseNotes} onChange={(e) => setForm({ ...form, caseNotes: e.target.value })} placeholder="Case do membro" />

              {/* Tasks edit */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">Tarefas</label>
                {form.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input className="ios-input flex-1 px-3 py-1.5 text-xs" value={task} onChange={(e) => { const t = [...form.tasks]; t[i] = e.target.value; setForm({ ...form, tasks: t }); }} />
                    <button onClick={() => setForm({ ...form, tasks: form.tasks.filter((_, ci) => ci !== i) })} className="rounded-md p-1 text-destructive hover:bg-destructive/10"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button onClick={() => setForm({ ...form, tasks: [...form.tasks, ""] })} className="text-[11px] text-primary">+ adicionar tarefa</button>
              </div>

              {/* KPIs edit */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">KPIs</label>
                {form.kpis.map((kpi, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input className="ios-input flex-1 px-3 py-1.5 text-xs" value={kpi} onChange={(e) => { const k = [...form.kpis]; k[i] = e.target.value; setForm({ ...form, kpis: k }); }} />
                    <button onClick={() => setForm({ ...form, kpis: form.kpis.filter((_, ci) => ci !== i) })} className="rounded-md p-1 text-destructive hover:bg-destructive/10"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button onClick={() => setForm({ ...form, kpis: [...form.kpis, ""] })} className="text-[11px] text-primary">+ adicionar KPI</button>
              </div>

              <button onClick={handleSave} className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
                Salvar alterações
              </button>
            </div>
          ) : (
            /* ── View Mode ── */
            <>
              <div>
                <h2 className="text-xl font-extrabold text-foreground">{form.name}</h2>
                <p className="text-sm font-semibold" style={{ color: form.color }}>{form.role}</p>
                <span className={`ios-badge mt-2 inline-block ${
                  form.status === "Ativo" ? "ios-status-active" : form.status === "Férias" ? "ios-status-warning" : "ios-status-danger"
                }`}>{form.status}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Remuneração", value: `R$ ${form.remuneration.toLocaleString("pt-BR")}` },
                  { label: "Carga Horária", value: `${form.hours}h/mês` },
                  { label: "Valor / Hora", value: `R$ ${hourlyRate.toFixed(2).replace(".", ",")}` },
                ].map((s) => (
                  <div key={s.label} className="p-3 text-center rounded-2xl bg-secondary/40">
                    <div className="text-[10px] font-medium text-muted-foreground">{s.label}</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">Especialidade</div>
                <p className="text-sm text-foreground">{form.specialty || form.role}</p>
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">Principais tarefas</div>
                <ul className="space-y-1.5">
                  {form.tasks.map((task, ti) => (
                    <li key={ti} className="text-sm text-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-[6px] w-[6px] rounded-full shrink-0" style={{ backgroundColor: form.color }} />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">KPIs</div>
                <ul className="space-y-1.5">
                  {form.kpis.map((kpi, ki) => (
                    <li key={ki} className="text-sm text-foreground flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 shrink-0" style={{ color: form.color }} />
                      {kpi}
                    </li>
                  ))}
                </ul>
              </div>

              {form.caseNotes && (
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
                  <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Case</div>
                  <p className="text-sm text-foreground">{form.caseNotes}</p>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                R$ {form.remuneration.toLocaleString("pt-BR")} ÷ {form.hours}h = R$ {hourlyRate.toFixed(2).replace(".", ",")}/hora
              </p>
            </>
          )}
        </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
