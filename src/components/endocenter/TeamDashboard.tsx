import { useState } from "react";
import { DollarSign, Clock, TrendingUp, Users, ChevronUp, ChevronDown, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter } from "@/store/endocenterStore";

export default function TeamDashboard() {
  const { team, company } = useEndocenter();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const totalRemuneration = team.reduce((sum, m) => sum + m.remuneration, 0);
  const totalHours = team.reduce((sum, m) => sum + m.hours, 0);

  const metrics = [
    { label: "Investimento Mensal", value: `R$ ${totalRemuneration.toLocaleString("pt-BR")}`, sub: "Folha + Freelancers", Icon: DollarSign, color: "#007AFF" },
    { label: "Horas Totais / Mês", value: `${totalHours}h`, sub: "Capacidade operacional", Icon: Clock, color: "#AF52DE" },
    { label: "Custo Médio / Hora", value: `R$ ${totalHours > 0 ? (totalRemuneration / totalHours).toFixed(2).replace(".", ",") : "0"}`, sub: "Eficiência da equipe", Icon: TrendingUp, color: "#30D158" },
    { label: "Profissionais Ativos", value: String(team.filter(m => m.status === "Ativo").length), sub: "Operacionais", Icon: Users, color: "#FF3B30" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "hsl(220,30%,10%)" }}>Dashboard da Equipe</h2>
          <p className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>Visão geral dos profissionais e capacidade operacional</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "hsl(215 90% 55% / 0.1)", color: "hsl(215,90%,55%)" }}>
          {company.month}
        </span>
      </div>

      {/* Metrics grid with iOS card style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const MIcon = m.Icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", damping: 20 }}
              className="ios-card p-5"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${m.color}12` }}>
                <MIcon size={18} style={{ color: m.color }} />
              </div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: m.color }}>{m.value}</div>
              <div className="text-sm font-medium mt-1" style={{ color: "hsl(220,20%,25%)" }}>{m.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(220,10%,55%)" }}>{m.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Team members */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "hsl(220,30%,10%)" }}>Composição da Equipe</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {team.map((member, i) => {
            const hourlyRate = member.hours > 0 ? (member.remuneration / member.hours).toFixed(2).replace(".", ",") : "0";
            const isExpanded = expandedCard === i;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", damping: 20 }}
                className="ios-card overflow-hidden"
              >
                <div className="p-5 flex items-center gap-4" style={{ borderLeft: `3px solid ${member.color}` }}>
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="w-11 h-11 rounded-2xl object-cover" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${member.color}10` }}>
                      <User size={20} style={{ color: member.color }} />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: "hsl(220,30%,10%)" }}>{member.name}</div>
                    <div className="text-sm" style={{ color: member.color }}>{member.role}</div>
                  </div>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{
                    background: member.status === "Ativo" ? "rgba(48,209,88,0.1)" : "rgba(255,59,48,0.1)",
                    color: member.status === "Ativo" ? "#30D158" : "#FF3B30"
                  }}>
                    {member.status}
                  </span>
                </div>

                <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Remuneração", value: `R$ ${member.remuneration.toLocaleString("pt-BR")}`, sub: "/ mês" },
                    { label: "Carga Horária", value: `${member.hours}h`, sub: "/ mês" },
                    { label: "Valor / Hora", value: `R$ ${hourlyRate}`, sub: "calculado" },
                  ].map((stat, si) => (
                    <div key={si} className="rounded-xl p-3 text-center" style={{ background: "rgba(120,120,128,0.06)" }}>
                      <div className="text-[10px] font-medium" style={{ color: "hsl(220,10%,55%)" }}>{stat.label}</div>
                      <div className="text-sm font-bold" style={{ color: "hsl(220,30%,15%)" }}>{stat.value}</div>
                      <div className="text-[9px]" style={{ color: "hsl(220,10%,60%)" }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setExpandedCard(isExpanded ? null : i)}
                    className="w-full text-left text-xs font-semibold flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-200"
                    style={{ color: member.color, background: `${member.color}08`, border: `1px solid ${member.color}15` }}
                  >
                    Ver responsabilidades e KPIs
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3">
                          <div>
                            <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: "hsl(220,10%,55%)" }}>PRINCIPAIS TAREFAS</div>
                            {member.tasks.map((t, ti) => (
                              <div key={ti} className="flex items-center gap-2 py-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.color }} />
                                <span className="text-xs" style={{ color: "hsl(220,15%,35%)" }}>{t}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: "hsl(220,10%,55%)" }}>KPIs DE ACOMPANHAMENTO</div>
                            {member.kpis.map((k, ki) => (
                              <div key={ki} className="flex items-center gap-2 py-1">
                                <TrendingUp size={10} style={{ color: member.color }} />
                                <span className="text-xs" style={{ color: "hsl(220,15%,35%)" }}>{k}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Financial summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ios-card p-6"
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: "hsl(220,30%,10%)" }}>Resumo de Investimento Mensal</h3>
        <div className="text-xs font-semibold mb-3" style={{ color: "hsl(220,10%,55%)" }}>Orçamento Aprovado</div>
        <div className="space-y-2">
          {team.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl" style={{ background: "rgba(120,120,128,0.05)" }}>
              <div className="flex items-center gap-2.5">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User size={14} style={{ color: m.color }} />
                )}
                <span className="text-sm font-medium" style={{ color: "hsl(220,20%,25%)" }}>{m.role}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" style={{ color: m.color }}>R$ {m.remuneration.toLocaleString("pt-BR")}</span>
                <span className="text-xs ml-2" style={{ color: "hsl(220,10%,55%)" }}>{m.hours}h · R$ {m.hours > 0 ? (m.remuneration / m.hours).toFixed(2) : "0"}/h</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(120,120,128,0.1)" }}>
          <span className="font-bold" style={{ color: "hsl(220,20%,25%)" }}>Total Mensal (Equipe Fixa)</span>
          <span className="text-xl font-bold" style={{ color: "#007AFF" }}>R$ {totalRemuneration.toLocaleString("pt-BR")}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>+ Projetos Pontuais</span>
          <span className="text-sm font-semibold" style={{ color: "hsl(220,10%,50%)" }}>R$ 8.600 est.</span>
        </div>
      </motion.div>
    </div>
  );
}
