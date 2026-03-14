import { useMemo, useState } from "react";
import { BarChart3, Clock3, DollarSign, Target, TrendingUp, User } from "lucide-react";
import { motion } from "framer-motion";
import { useEndocenter, type MetricPeriod } from "@/store/endocenterStore";

const periodFilters: Array<MetricPeriod | "Todas"> = ["Todas", "Diária", "Semanal", "Mensal", "Anual"];

export default function TeamDashboard() {
  const { team, company, metricEntries } = useEndocenter();
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<MetricPeriod | "Todas">("Todas");

  const totalRemuneration = useMemo(() => team.reduce((sum, member) => sum + member.remuneration, 0), [team]);
  const totalHours = useMemo(() => team.reduce((sum, member) => sum + member.hours, 0), [team]);

  const filteredMetrics = useMemo(
    () => metricEntries.filter((metric) => periodFilter === "Todas" || metric.period === periodFilter),
    [metricEntries, periodFilter]
  );

  const summaryCards = [
    {
      label: "Investimento mensal",
      value: `R$ ${totalRemuneration.toLocaleString("pt-BR")}`,
      helper: "Folha total da equipe",
      icon: DollarSign,
      className: "text-primary",
      badgeClass: "bg-primary/10",
    },
    {
      label: "Horas / mês",
      value: `${totalHours}h`,
      helper: "Capacidade operacional",
      icon: Clock3,
      className: "text-foreground",
      badgeClass: "bg-secondary",
    },
    {
      label: "Valor médio / hora",
      value: `R$ ${totalHours > 0 ? (totalRemuneration / totalHours).toFixed(2).replace(".", ",") : "0,00"}`,
      helper: "Remuneração ÷ horas",
      icon: TrendingUp,
      className: "text-emerald-600",
      badgeClass: "bg-emerald-100",
    },
    {
      label: "Profissionais ativos",
      value: String(team.filter((member) => member.status === "Ativo").length),
      helper: "Status atual",
      icon: BarChart3,
      className: "text-orange-600",
      badgeClass: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Dashboard da equipe</h2>
          <p className="text-sm text-muted-foreground">Resumo financeiro, cases e métricas por período</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary">{company.month}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="ios-card p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.badgeClass}`}>
                <Icon className={`h-4 w-4 ${card.className}`} />
              </div>
              <div className={`text-xl font-bold ${card.className}`}>{card.value}</div>
              <div className="text-xs font-medium mt-1 text-foreground">{card.label}</div>
              <div className="text-[11px] text-muted-foreground">{card.helper}</div>
            </div>
          );
        })}
      </div>

      <div className="ios-card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground">Métricas registradas (diária/semanal/mensal/anual)</h3>
          <div className="p-1 rounded-xl bg-secondary/70 flex gap-1">
            {periodFilters.map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
                  periodFilter === period ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          {filteredMetrics.map((metric) => {
            const progress = metric.target > 0 ? Math.min(100, Math.round((metric.value / metric.target) * 100)) : 0;
            return (
              <div key={metric.id} className="rounded-2xl border border-border/60 p-3 bg-background/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">{metric.name}</div>
                  <span className="text-[10px] rounded-full px-2 py-0.5 bg-primary/10 text-primary">{metric.period}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Atual: {metric.value.toLocaleString("pt-BR")} · Meta: {metric.target.toLocaleString("pt-BR")}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </div>
                {metric.notes && <p className="text-[11px] text-muted-foreground mt-2">{metric.notes}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3 text-foreground">Composição da equipe</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {team.map((member, index) => {
            const hourlyRate = member.hours > 0 ? member.remuneration / member.hours : 0;
            const isExpanded = expandedMemberId === member.id;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, type: "spring", damping: 24, stiffness: 280 }}
                className="ios-card overflow-hidden"
              >
                <div className="p-4" style={{ borderLeft: `3px solid ${member.color}` }}>
                  <div className="flex items-center gap-3">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-foreground truncate">{member.name}</div>
                      <div className="text-sm truncate" style={{ color: member.color }}>
                        {member.role}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                        member.status === "Ativo"
                          ? "bg-emerald-100 text-emerald-600"
                          : member.status === "Férias"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-xl bg-secondary/60 p-2.5 text-center">
                      <div className="text-[10px] text-muted-foreground">Remuneração</div>
                      <div className="text-sm font-bold text-foreground">R$ {member.remuneration.toLocaleString("pt-BR")}</div>
                      <div className="text-[10px] text-muted-foreground">/ mês</div>
                    </div>
                    <div className="rounded-xl bg-secondary/60 p-2.5 text-center">
                      <div className="text-[10px] text-muted-foreground">Carga Horária</div>
                      <div className="text-sm font-bold text-foreground">{member.hours}h</div>
                      <div className="text-[10px] text-muted-foreground">/ mês</div>
                    </div>
                    <div className="rounded-xl bg-secondary/60 p-2.5 text-center">
                      <div className="text-[10px] text-muted-foreground">Valor / hora</div>
                      <div className="text-sm font-bold text-foreground">R$ {hourlyRate.toFixed(2).replace(".", ",")}</div>
                      <div className="text-[10px] text-muted-foreground">calculado</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                    className="w-full mt-3 rounded-xl border px-3 py-2 text-xs font-medium text-left"
                    style={{ borderColor: member.color, color: member.color }}
                  >
                    {isExpanded ? "Ocultar detalhes do case" : "Ver responsabilidades e case"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/60 space-y-3 animate-fade-in">
                    <div>
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Especialidade</div>
                      <p className="text-sm text-foreground mt-1">{member.specialty || "Sem especialidade cadastrada"}</p>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Principais tarefas</div>
                      <ul className="mt-1 space-y-1">
                        {member.tasks.map((task, taskIndex) => (
                          <li key={`${member.id}-task-${taskIndex}`} className="text-sm text-foreground flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: member.color }} />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">KPIs</div>
                      <ul className="mt-1 space-y-1">
                        {member.kpis.map((kpi, kpiIndex) => (
                          <li key={`${member.id}-kpi-${kpiIndex}`} className="text-sm text-foreground flex items-center gap-2">
                            <Target className="h-3.5 w-3.5" style={{ color: member.color }} />
                            {kpi}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-border/60 p-3 bg-background/40">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Case do membro</div>
                      <p className="text-sm text-foreground mt-1">
                        {member.caseNotes || "Sem case registrado ainda. Você pode editar no Lobby de Gestão."}
                      </p>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Cálculo: remuneração mensal (R$ {member.remuneration.toLocaleString("pt-BR")}) ÷ horas/mês ({member.hours}h) =
                      R$ {hourlyRate.toFixed(2).replace(".", ",")}/hora.
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
