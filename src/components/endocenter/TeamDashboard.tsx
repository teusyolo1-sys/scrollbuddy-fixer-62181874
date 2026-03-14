import { useMemo, useState, useCallback } from "react";
import { BarChart3, ChevronDown, ChevronUp, Clock3, DollarSign, Target, TrendingUp, User } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useEndocenter, type MetricPeriod } from "@/store/endocenterStore";

const periodFilters: Array<MetricPeriod | "Todas"> = ["Todas", "Diária", "Semanal", "Mensal", "Anual"];

export default function TeamDashboard() {
  const { team, company, metricEntries } = useEndocenter();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<MetricPeriod | "Todas">("Todas");

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // rotate: drop oldest, add new
      return [...prev, id];
    });
  }, []);

  const totalRemuneration = useMemo(() => team.reduce((sum, m) => sum + m.remuneration, 0), [team]);
  const totalHours = useMemo(() => team.reduce((sum, m) => sum + m.hours, 0), [team]);

  const filteredMetrics = useMemo(
    () => metricEntries.filter((m) => periodFilter === "Todas" || m.period === periodFilter),
    [metricEntries, periodFilter]
  );

  const summaryCards = [
    { label: "Investimento mensal", value: `R$ ${totalRemuneration.toLocaleString("pt-BR")}`, sub: "Folha total", icon: DollarSign, color: "hsl(var(--ios-blue))" },
    { label: "Horas / mês", value: `${totalHours}h`, sub: "Capacidade", icon: Clock3, color: "hsl(var(--ios-purple))" },
    { label: "Valor médio / hora", value: `R$ ${totalHours > 0 ? (totalRemuneration / totalHours).toFixed(2).replace(".", ",") : "0,00"}`, sub: "Rem ÷ Horas", icon: TrendingUp, color: "hsl(var(--ios-green))" },
    { label: "Profissionais ativos", value: String(team.filter((m) => m.status === "Ativo").length), sub: "Operacionais", icon: BarChart3, color: "hsl(var(--ios-orange))" },
  ];

  const expandedMembers = team.filter((m) => expandedIds.includes(m.id));
  const collapsedMembers = team.filter((m) => !expandedIds.includes(m.id));

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Dashboard da equipe</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Resumo financeiro, cases e métricas</p>
        </div>
        <span className="ios-badge ios-status-info">{company.month}</span>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", damping: 22 }}
              className="ios-card p-5"
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

      {/* Metrics */}
      <div className="ios-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-foreground">Métricas registradas</h3>
          <div className="ios-segmented flex">
            {periodFilters.map((p) => (
              <button key={p} onClick={() => setPeriodFilter(p)} className="ios-segmented-item" data-active={periodFilter === p}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {filteredMetrics.map((metric) => {
            const pct = metric.target > 0 ? Math.min(100, Math.round((metric.value / metric.target) * 100)) : 0;
            return (
              <div key={metric.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/40">
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Team members */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">Composição da equipe</h3>

        <LayoutGroup>
          {/* Expanded cards — full width (1) or side-by-side (2) */}
          {expandedMembers.length > 0 && (
            <div className={`grid gap-4 mb-4 ${expandedMembers.length === 2 ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {expandedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isExpanded
                  onToggle={toggleExpand}
                />
              ))}
            </div>
          )}

          {/* Collapsed cards — inline row, scrollable or wrapped */}
          {collapsedMembers.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {collapsedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isExpanded={false}
                  onToggle={toggleExpand}
                />
              ))}
            </div>
          )}
        </LayoutGroup>
      </div>
    </div>
  );
}

/* ── Member Card Component ── */
interface MemberCardProps {
  member: ReturnType<typeof useEndocenter>["team"][number];
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

function MemberCard({ member, isExpanded, onToggle }: MemberCardProps) {
  const hourlyRate = member.hours > 0 ? member.remuneration / member.hours : 0;

  return (
    <motion.div
      layout
      layoutId={`member-${member.id}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className={`ios-card overflow-hidden ${isExpanded ? "w-full" : "w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"}`}
      style={{ minWidth: isExpanded ? undefined : 260 }}
    >
      {/* Header */}
      <div className="p-5" style={{ borderLeft: `4px solid ${member.color}` }}>
        <div className="flex items-center gap-3.5">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="h-12 w-12 object-cover"
              style={{ borderRadius: "var(--ios-radius)" }}
            />
          ) : (
            <div
              className="h-12 w-12 flex items-center justify-center"
              style={{
                borderRadius: "var(--ios-radius)",
                background: `${member.color}15`,
              }}
            >
              <User className="h-5 w-5" style={{ color: member.color }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-foreground truncate">{member.name}</div>
            <div className="text-sm font-medium" style={{ color: member.color }}>{member.role}</div>
          </div>
          <span
            className={`ios-badge ${
              member.status === "Ativo"
                ? "ios-status-active"
                : member.status === "Férias"
                ? "ios-status-warning"
                : "ios-status-danger"
            }`}
          >
            {member.status}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {[
            { label: "Remuneração", value: `R$ ${member.remuneration.toLocaleString("pt-BR")}`, sub: "/ mês" },
            { label: "Carga Horária", value: `${member.hours}h`, sub: "/ mês" },
            { label: "Valor / Hora", value: `R$ ${hourlyRate.toFixed(2).replace(".", ",")}`, sub: "calculado" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 text-center rounded-2xl bg-secondary/40"
            >
              <div className="text-[10px] font-medium text-muted-foreground">{stat.label}</div>
              <div className="text-sm font-bold text-foreground mt-0.5">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Toggle button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(member.id);
          }}
          className="w-full mt-4 py-2.5 px-4 text-xs font-semibold flex items-center justify-between rounded-2xl transition-colors"
          style={{
            color: member.color,
            border: `1.5px solid ${member.color}25`,
            background: `${member.color}08`,
          }}
        >
          {isExpanded ? "Ocultar detalhes" : "Ver responsabilidades e KPIs"}
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </motion.button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-3 space-y-4 border-t border-border/30">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Especialidade</div>
                <p className="text-sm text-foreground mt-1">{member.specialty || member.role}</p>
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Principais tarefas</div>
                <ul className="mt-1.5 space-y-1.5">
                  {member.tasks.map((task, ti) => (
                    <li key={`${member.id}-task-${ti}`} className="text-sm text-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-[6px] w-[6px] rounded-full shrink-0" style={{ backgroundColor: member.color }} />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">KPIs</div>
                <ul className="mt-1.5 space-y-1.5">
                  {member.kpis.map((kpi, ki) => (
                    <li key={`${member.id}-kpi-${ki}`} className="text-sm text-foreground flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 shrink-0" style={{ color: member.color }} />
                      {kpi}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Case do membro</div>
                <p className="text-sm text-foreground mt-1">
                  {member.caseNotes || "Sem case registrado. Edite no Lobby de Gestão (⚙)."}
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Cálculo: R$ {member.remuneration.toLocaleString("pt-BR")} ÷ {member.hours}h = R$ {hourlyRate.toFixed(2).replace(".", ",")}/hora
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
