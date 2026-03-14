import { useState } from "react";

const weeks = [
  {
    week: "Semana 1", dates: "01 – 07", theme: "Planejamento & Lançamento", themeColor: "#1E6FD9",
    tasks: [
      { role: "Estrategista", icon: "🧠", color: "#059669", items: [
        { task: "Reunião de kickoff mensal", type: "reunião", hours: 2 },
        { task: "Entrega de briefings completos para a equipe", type: "entregável", hours: 3 },
        { task: "Definição do calendário editorial do mês", type: "planejamento", hours: 2 },
        { task: "Revisão e aprovação de peças da semana", type: "revisão", hours: 2 },
      ]},
      { role: "Gestor de Tráfego", icon: "📡", color: "#1E6FD9", items: [
        { task: "Análise do desempenho do mês anterior (relatório)", type: "entregável", hours: 4 },
        { task: "Reconfiguração de campanhas e orçamentos mensais", type: "operação", hours: 4 },
        { task: "Criação de 2 novos conjuntos de anúncios", type: "entregável", hours: 5 },
        { task: "Otimização de públicos-alvo", type: "operação", hours: 3 },
      ]},
      { role: "Copywriter", icon: "✍️", color: "#7C3AED", items: [
        { task: "Produção de 4 copies para anúncios (Meta + Google)", type: "entregável", hours: 6 },
        { task: "Legendas para 8 posts da semana", type: "entregável", hours: 4 },
        { task: "1 roteiro de vídeo institucional", type: "entregável", hours: 3 },
        { task: "Revisão de textos existentes nas campanhas", type: "revisão", hours: 2 },
      ]},
      { role: "Designer", icon: "🎨", color: "#DC2626", items: [
        { task: "12 artes para feed e stories (semana 1)", type: "entregável", hours: 10 },
        { task: "4 peças criativas para anúncios", type: "entregável", hours: 6 },
        { task: "1 banner para campanha especial", type: "entregável", hours: 3 },
        { task: "Atualização de templates da marca", type: "operação", hours: 3 },
      ]},
    ],
  },
  {
    week: "Semana 2", dates: "08 – 14", theme: "Execução & Otimização", themeColor: "#7C3AED",
    tasks: [
      { role: "Estrategista", icon: "🧠", color: "#059669", items: [
        { task: "Acompanhamento de métricas mid-week", type: "análise", hours: 2 },
        { task: "Ajustes de rota no planejamento de conteúdo", type: "planejamento", hours: 1.5 },
        { task: "Aprovação do conteúdo da semana 3", type: "revisão", hours: 3 },
        { task: "Reunião de alinhamento com equipe (30min)", type: "reunião", hours: 0.5 },
      ]},
      { role: "Gestor de Tráfego", icon: "📡", color: "#1E6FD9", items: [
        { task: "Otimização diária de campanhas ativas (5x/semana)", type: "operação", hours: 5 },
        { task: "Teste A/B de criativos (2 variações)", type: "entregável", hours: 3 },
        { task: "Análise de funil de conversão", type: "análise", hours: 3 },
        { task: "Relatório de desempenho semanal", type: "entregável", hours: 2 },
      ]},
      { role: "Copywriter", icon: "✍️", color: "#7C3AED", items: [
        { task: "4 copies para novos anúncios da semana", type: "entregável", hours: 6 },
        { task: "Legendas para 8 posts da semana 2", type: "entregável", hours: 4 },
        { task: "2 e-mails para base de leads (nutrição)", type: "entregável", hours: 4 },
        { task: "Revisão de textos de landing pages ativas", type: "revisão", hours: 2 },
      ]},
      { role: "Designer", icon: "🎨", color: "#DC2626", items: [
        { task: "12 artes para feed e stories (semana 2)", type: "entregável", hours: 10 },
        { task: "Ajuste de criativos conforme testes A/B", type: "revisão", hours: 3 },
        { task: "2 peças para e-mail marketing", type: "entregável", hours: 4 },
        { task: "1 carrossel educativo para feed", type: "entregável", hours: 5 },
      ]},
    ],
  },
  {
    week: "Semana 3", dates: "15 – 21", theme: "Revisão & Ajustes Estratégicos", themeColor: "#DC2626",
    tasks: [
      { role: "Estrategista", icon: "🧠", color: "#059669", items: [
        { task: "Análise de resultados da 1ª quinzena", type: "análise", hours: 3 },
        { task: "Ajuste na estratégia com base nos dados", type: "planejamento", hours: 2 },
        { task: "Briefing para conteúdos especiais (datas comemorativas)", type: "entregável", hours: 2 },
        { task: "Aprovação de peças da semana 3", type: "revisão", hours: 3 },
      ]},
      { role: "Gestor de Tráfego", icon: "📡", color: "#1E6FD9", items: [
        { task: "Otimização de campanhas + escalada de verba em anúncios top", type: "operação", hours: 5 },
        { task: "Análise de palavras-chave Google Ads", type: "análise", hours: 3 },
        { task: "Novo conjunto de anúncios para público frio", type: "entregável", hours: 4 },
        { task: "Relatório semanal de desempenho", type: "entregável", hours: 2 },
      ]},
      { role: "Copywriter", icon: "✍️", color: "#7C3AED", items: [
        { task: "4 copies para anúncios da semana 3", type: "entregável", hours: 6 },
        { task: "Legendas para 8 posts + datas especiais", type: "entregável", hours: 4 },
        { task: "1 sequência de mensagens WhatsApp (3 msgs)", type: "entregável", hours: 3 },
        { task: "Revisão geral de textos e ajustes de CTA", type: "revisão", hours: 2 },
      ]},
      { role: "Designer", icon: "🎨", color: "#DC2626", items: [
        { task: "12 artes para feed e stories (semana 3)", type: "entregável", hours: 10 },
        { task: "2 peças para datas comemorativas do mês", type: "entregável", hours: 5 },
        { task: "Atualização de artes de campanhas ativas", type: "revisão", hours: 3 },
        { task: "1 infográfico educativo para conteúdo médico", type: "entregável", hours: 4 },
      ]},
    ],
  },
  {
    week: "Semana 4", dates: "22 – 31", theme: "Fechamento & Planejamento Próximo Mês", themeColor: "#059669",
    tasks: [
      { role: "Estrategista", icon: "🧠", color: "#059669", items: [
        { task: "Relatório estratégico mensal completo", type: "entregável", hours: 4 },
        { task: "Reunião de resultados com diretoria da clínica", type: "reunião", hours: 2 },
        { task: "Planejamento de campanha do próximo mês (briefing)", type: "entregável", hours: 3 },
        { task: "Definição de metas e KPIs para o próximo período", type: "planejamento", hours: 2 },
      ]},
      { role: "Gestor de Tráfego", icon: "📡", color: "#1E6FD9", items: [
        { task: "Relatório mensal consolidado (Meta + Google)", type: "entregável", hours: 5 },
        { task: "Desativação de anúncios de baixo desempenho", type: "operação", hours: 2 },
        { task: "Configuração prévia de campanhas do mês seguinte", type: "operação", hours: 5 },
        { task: "Análise de benchmark do setor médico", type: "análise", hours: 3 },
      ]},
      { role: "Copywriter", icon: "✍️", color: "#7C3AED", items: [
        { task: "4 copies finais do mês + 4 copies antecipadas para o próximo", type: "entregável", hours: 8 },
        { task: "Legendas para posts finais do mês", type: "entregável", hours: 3 },
        { task: "Revisão de toda a copy ativa nas campanhas", type: "revisão", hours: 3 },
        { task: "Documento de aprendizados e melhores copies do mês", type: "entregável", hours: 1 },
      ]},
      { role: "Designer", icon: "🎨", color: "#DC2626", items: [
        { task: "12 artes para feed e stories (semana 4)", type: "entregável", hours: 10 },
        { task: "4 peças antecipadas para a semana 1 do próximo mês", type: "entregável", hours: 5 },
        { task: "Relatório visual de melhores criativos do mês", type: "entregável", hours: 2 },
        { task: "Organização e arquivamento de todos os arquivos do mês", type: "operação", hours: 2 },
      ]},
    ],
  },
];

const typeColors: Record<string, { bg: string; color: string; label: string }> = {
  "entregável": { bg: "#EFF6FF", color: "#1E6FD9", label: "Entregável" },
  "operação": { bg: "#F0FDF4", color: "#059669", label: "Operação" },
  "revisão": { bg: "#FFF7ED", color: "#EA580C", label: "Revisão" },
  "análise": { bg: "#F5F3FF", color: "#7C3AED", label: "Análise" },
  "planejamento": { bg: "#ECFDF5", color: "#0D9488", label: "Planejamento" },
  "reunião": { bg: "#FFF1F2", color: "#DC2626", label: "Reunião" },
};

export default function MasterSchedule() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const week = weeks[activeWeek];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#0A1628" }}>Cronograma Mestre Mensal</h2>
        <p className="text-sm text-slate-500">Distribuição detalhada de tarefas por profissional em cada semana do mês</p>
      </div>

      {/* Week Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => setActiveWeek(i)}
            className="p-4 rounded-2xl text-left transition-all duration-200"
            style={{
              backgroundColor: activeWeek === i ? w.themeColor : "#FFFFFF",
              border: `2px solid ${activeWeek === i ? w.themeColor : "#E2E8F0"}`,
              boxShadow: activeWeek === i ? `0 4px 12px ${w.themeColor}33` : "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div className="text-xs font-medium" style={{ color: activeWeek === i ? "rgba(255,255,255,0.7)" : "#94A3B8" }}>
              Dias {w.dates}
            </div>
            <div className="text-sm font-bold mt-0.5" style={{ color: activeWeek === i ? "#FFFFFF" : "#0A1628" }}>
              {w.week}
            </div>
            <div className="text-xs mt-0.5" style={{ color: activeWeek === i ? "rgba(255,255,255,0.8)" : "#64748B" }}>
              {w.theme}
            </div>
          </button>
        ))}
      </div>

      {/* Week Detail */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold" style={{ color: "#0A1628" }}>{week.week} · {week.theme}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Período: dias {week.dates} do mês</p>
        </div>

        {week.tasks.map((roleTask, ri) => {
          const totalHours = roleTask.items.reduce((s, t) => s + t.hours, 0);
          const isExpanded = expandedRole === `${activeWeek}-${ri}`;
          return (
            <div key={ri} className="border-b border-slate-50 last:border-none">
              <button
                onClick={() => setExpandedRole(isExpanded ? null : `${activeWeek}-${ri}`)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{roleTask.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-800">{roleTask.role}</div>
                    <div className="text-xs text-slate-400">{roleTask.items.length} tarefas esta semana</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: roleTask.color }}>{totalHours}h</div>
                    <div className="text-[10px] text-slate-400">carga estimada</div>
                  </div>
                  <span className="text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-4">
                  <div className="space-y-2">
                    {roleTask.items.map((item, ii) => {
                      const typeStyle = typeColors[item.type] || { bg: "#F1F5F9", color: "#64748B", label: item.type };
                      return (
                        <div key={ii} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                          <span className="text-xs text-slate-700 flex-1">{item.task}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                              {typeStyle.label}
                            </span>
                            <span className="text-xs font-bold text-slate-500">{item.hours}h</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex justify-between items-center px-3 py-2 rounded-lg" style={{ backgroundColor: `${roleTask.color}10` }}>
                    <span className="text-xs text-slate-500">Total estimado para a semana</span>
                    <span className="text-xs font-bold" style={{ color: roleTask.color }}>{totalHours}h comprometidas</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-3">RESUMO DE HORAS — {week.week.toUpperCase()}</h4>
        <div className="flex gap-4">
          {week.tasks.map((rt, i) => {
            const hrs = rt.items.reduce((s, t) => s + t.hours, 0);
            return (
              <div key={i} className="flex-1 text-center bg-slate-50 rounded-xl p-3">
                <div className="text-xl mb-1">{rt.icon}</div>
                <div className="text-xs text-slate-500">{rt.role.split(" ")[0]}</div>
                <div className="text-lg font-bold" style={{ color: rt.color }}>{hrs}h</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
