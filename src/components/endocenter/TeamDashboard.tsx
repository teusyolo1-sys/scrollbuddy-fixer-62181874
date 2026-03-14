import { useState } from "react";
import { Radio, PenTool, Palette, Brain, DollarSign, Clock, TrendingUp, Users, ChevronUp, ChevronDown } from "lucide-react";

const team = [
  {
    role: "Gestor de Tráfego", name: "Rafael Almeida", Icon: Radio,
    color: "#1E6FD9", colorLight: "#EFF6FF", colorBorder: "#BFDBFE",
    remuneration: 3800, hours: 160,
    tasks: ["Gestão Meta Ads & Google Ads", "Otimização de campanhas", "Relatórios de performance", "Análise de público-alvo"],
    kpis: ["CPL < R$25", "ROAS > 3.5x", "CTR > 2%"], status: "Ativo",
  },
  {
    role: "Copywriter", name: "Fernanda Costa", Icon: PenTool,
    color: "#7C3AED", colorLight: "#F5F3FF", colorBorder: "#DDD6FE",
    remuneration: 3200, hours: 120,
    tasks: ["Textos para anúncios", "Legendas de posts", "Scripts de vídeo", "E-mails e WhatsApp"],
    kpis: ["4 copies/semana", "Aprovação em 1ª rodada > 80%", "Taxa abertura email > 30%"], status: "Ativo",
  },
  {
    role: "Designer", name: "Lucas Mendes", Icon: Palette,
    color: "#DC2626", colorLight: "#FFF1F2", colorBorder: "#FECDD3",
    remuneration: 3000, hours: 120,
    tasks: ["Criação de posts e stories", "Artes para anúncios", "Materiais visuais institucionais", "Diagramação de LPs"],
    kpis: ["12 peças/semana", "Aprovação em 1ª rodada > 75%", "Entrega no prazo > 95%"], status: "Ativo",
  },
  {
    role: "Estrategista", name: "Mariana Oliveira", Icon: Brain,
    color: "#059669", colorLight: "#ECFDF5", colorBorder: "#A7F3D0",
    remuneration: 4500, hours: 80,
    tasks: ["Planejamento de conteúdo mensal", "Briefings para equipe", "Revisão e aprovação final", "Relatório estratégico mensal"],
    kpis: ["Briefing entregue até dia 25/mês", "Aprovação em < 24h", "Meta mensal de leads"], status: "Ativo",
  },
];

const totalRemuneration = team.reduce((sum, m) => sum + m.remuneration, 0);
const totalHours = team.reduce((sum, m) => sum + m.hours, 0);

const metrics = [
  { label: "Investimento Mensal Equipe", value: `R$ ${totalRemuneration.toLocaleString("pt-BR")}`, sub: "Folha + Freelancers", Icon: DollarSign, color: "#1E6FD9" },
  { label: "Horas Totais / Mês", value: `${totalHours}h`, sub: "Capacidade operacional", Icon: Clock, color: "#7C3AED" },
  { label: "Custo Médio / Hora", value: `R$ ${(totalRemuneration / totalHours).toFixed(2).replace(".", ",")}`, sub: "Eficiência da equipe", Icon: TrendingUp, color: "#059669" },
  { label: "Profissionais Ativos", value: "4", sub: "Todos operacionais", Icon: Users, color: "#DC2626" },
];

export default function TeamDashboard() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#0A1628" }}>Dashboard da Equipe</h2>
          <p className="text-sm text-slate-500">Visão geral dos profissionais, remunerações e capacidade operacional</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#1E6FD9" }}>
          Março 2025
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const MIcon = m.Icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <MIcon size={24} style={{ color: m.color }} className="mb-2" />
              <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
              <div className="text-sm font-semibold text-slate-700 mt-1">{m.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#0A1628" }}>Composição da Equipe</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {team.map((member, i) => {
            const MemberIcon = member.Icon;
            const hourlyRate = (member.remuneration / member.hours).toFixed(2).replace(".", ",");
            const isExpanded = expandedCard === i;
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 flex items-center gap-4" style={{ borderLeft: `4px solid ${member.color}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: member.colorLight }}>
                    <MemberIcon size={20} style={{ color: member.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{member.name}</div>
                    <div className="text-sm" style={{ color: member.color }}>{member.role}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
                    {member.status}
                  </span>
                </div>

                <div className="px-5 pb-4 grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-400">Remuneração</div>
                    <div className="text-sm font-bold text-slate-800">R$ {member.remuneration.toLocaleString("pt-BR")}</div>
                    <div className="text-[10px] text-slate-400">/ mês</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-400">Carga Horária</div>
                    <div className="text-sm font-bold text-slate-800">{member.hours}h</div>
                    <div className="text-[10px] text-slate-400">/ mês</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-400">Valor / Hora</div>
                    <div className="text-sm font-bold text-slate-800">R$ {hourlyRate}</div>
                    <div className="text-[10px] text-slate-400">calculado</div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : i)}
                    className="w-full text-left text-xs font-semibold flex items-center justify-between py-2 px-3 rounded-lg transition-colors"
                    style={{ color: member.color, backgroundColor: member.colorLight, border: `1px solid ${member.colorBorder}` }}
                  >
                    Ver responsabilidades e KPIs
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1.5">PRINCIPAIS TAREFAS</div>
                        {member.tasks.map((t, ti) => (
                          <div key={ti} className="flex items-center gap-2 py-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.color }} />
                            <span className="text-xs text-slate-600">{t}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1.5">KPIs DE ACOMPANHAMENTO</div>
                        {member.kpis.map((k, ki) => (
                          <div key={ki} className="flex items-center gap-2 py-1">
                            <TrendingUp size={10} style={{ color: member.color }} />
                            <span className="text-xs text-slate-600">{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: "#0A1628" }}>Resumo de Investimento Mensal</h3>
        <div className="text-xs font-semibold text-slate-400 mb-3">Orçamento Aprovado</div>
        <div className="space-y-2">
          {team.map((m, i) => {
            const MI = m.Icon;
            return (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <MI size={14} style={{ color: m.color }} />
                  <span className="text-sm font-medium text-slate-700">{m.role}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: m.color }}>R$ {m.remuneration.toLocaleString("pt-BR")}</span>
                  <span className="text-xs text-slate-400 ml-2">{m.hours}h · R$ {(m.remuneration / m.hours).toFixed(2)}/h</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-700">Total Mensal (Equipe Fixa)</span>
          <span className="text-xl font-bold" style={{ color: "#1E6FD9" }}>R$ {totalRemuneration.toLocaleString("pt-BR")}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-slate-500">+ Projetos Pontuais</span>
          <span className="text-sm font-semibold text-slate-500">R$ 8.600 est.</span>
        </div>
      </div>
    </div>
  );
}
