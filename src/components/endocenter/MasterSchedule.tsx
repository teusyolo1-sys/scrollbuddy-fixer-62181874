import { useState } from "react";
import { Brain, Radio, PenTool, Palette, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const roleIcons: Record<string, typeof Brain> = {
  "Estrategista": Brain, "Gestor de Tráfego": Radio, "Copywriter": PenTool, "Designer": Palette,
};

const weeks = [
  {
    week: "Semana 1", dates: "01 – 07", theme: "Planejamento & Lançamento", themeColor: "#007AFF",
    tasks: [
      { role: "Estrategista", color: "#30D158", items: [
        { task: "Reunião de kickoff mensal", type: "reunião", hours: 2 },
        { task: "Entrega de briefings completos para a equipe", type: "entregável", hours: 3 },
        { task: "Definição do calendário editorial do mês", type: "planejamento", hours: 2 },
        { task: "Revisão e aprovação de peças da semana", type: "revisão", hours: 2 },
      ]},
      { role: "Gestor de Tráfego", color: "#007AFF", items: [
        { task: "Análise do desempenho do mês anterior (relatório)", type: "entregável", hours: 4 },
        { task: "Reconfiguração de campanhas e orçamentos mensais", type: "operação", hours: 4 },
        { task: "Criação de 2 novos conjuntos de anúncios", type: "entregável", hours: 5 },
        { task: "Otimização de públicos-alvo", type: "operação", hours: 3 },
      ]},
      { role: "Copywriter", color: "#AF52DE", items: [
        { task: "Produção de 4 copies para anúncios (Meta + Google)", type: "entregável", hours: 6 },
        { task: "Legendas para 8 posts da semana", type: "entregável", hours: 4 },
        { task: "1 roteiro de vídeo institucional", type: "entregável", hours: 3 },
        { task: "Revisão de textos existentes nas campanhas", type: "revisão", hours: 2 },
      ]},
      { role: "Designer", color: "#FF3B30", items: [
        { task: "12 artes para feed e stories (semana 1)", type: "entregável", hours: 10 },
        { task: "4 peças criativas para anúncios", type: "entregável", hours: 6 },
        { task: "1 banner para campanha especial", type: "entregável", hours: 3 },
        { task: "Atualização de templates da marca", type: "operação", hours: 3 },
      ]},
    ],
  },
  {
    week: "Semana 2", dates: "08 – 14", theme: "Execução & Otimização", themeColor: "#AF52DE",
    tasks: [
      { role: "Estrategista", color: "#30D158", items: [
        { task: "Acompanhamento de métricas mid-week", type: "análise", hours: 2 },
        { task: "Ajustes de rota no planejamento de conteúdo", type: "planejamento", hours: 1.5 },
        { task: "Aprovação do conteúdo da semana 3", type: "revisão", hours: 3 },
        { task: "Reunião de alinhamento com equipe (30min)", type: "reunião", hours: 0.5 },
      ]},
      { role: "Gestor de Tráfego", color: "#007AFF", items: [
        { task: "Otimização diária de campanhas ativas (5x/semana)", type: "operação", hours: 5 },
        { task: "Teste A/B de criativos (2 variações)", type: "entregável", hours: 3 },
        { task: "Análise de funil de conversão", type: "análise", hours: 3 },
        { task: "Relatório de desempenho semanal", type: "entregável", hours: 2 },
      ]},
      { role: "Copywriter", color: "#AF52DE", items: [
        { task: "4 copies para novos anúncios da semana", type: "entregável", hours: 6 },
        { task: "Legendas para 8 posts da semana 2", type: "entregável", hours: 4 },
        { task: "2 e-mails para base de leads (nutrição)", type: "entregável", hours: 4 },
        { task: "Revisão de textos de landing pages ativas", type: "revisão", hours: 2 },
      ]},
      { role: "Designer", color: "#FF3B30", items: [
        { task: "12 artes para feed e stories (semana 2)", type: "entregável", hours: 10 },
        { task: "Ajuste de criativos conforme testes A/B", type: "revisão", hours: 3 },
        { task: "2 peças para e-mail marketing", type: "entregável", hours: 4 },
        { task: "1 carrossel educativo para feed", type: "entregável", hours: 5 },
      ]},
    ],
  },
  {
    week: "Semana 3", dates: "15 – 21", theme: "Revisão & Ajustes", themeColor: "#FF3B30",
    tasks: [
      { role: "Estrategista", color: "#30D158", items: [
        { task: "Análise de resultados da 1ª quinzena", type: "análise", hours: 3 },
        { task: "Ajuste na estratégia com base nos dados", type: "planejamento", hours: 2 },
        { task: "Briefing para conteúdos especiais", type: "entregável", hours: 2 },
        { task: "Aprovação de peças da semana 3", type: "revisão", hours: 3 },
      ]},
      { role: "Gestor de Tráfego", color: "#007AFF", items: [
        { task: "Otimização + escalada de verba em anúncios top", type: "operação", hours: 5 },
        { task: "Análise de palavras-chave Google Ads", type: "análise", hours: 3 },
        { task: "Novo conjunto de anúncios para público frio", type: "entregável", hours: 4 },
        { task: "Relatório semanal de desempenho", type: "entregável", hours: 2 },
      ]},
      { role: "Copywriter", color: "#AF52DE", items: [
        { task: "4 copies para anúncios da semana 3", type: "entregável", hours: 6 },
        { task: "Legendas para 8 posts + datas especiais", type: "entregável", hours: 4 },
        { task: "1 sequência de mensagens WhatsApp (3 msgs)", type: "entregável", hours: 3 },
        { task: "Revisão geral de textos e ajustes de CTA", type: "revisão", hours: 2 },
      ]},
      { role: "Designer", color: "#FF3B30", items: [
        { task: "12 artes para feed e stories (semana 3)", type: "entregável", hours: 10 },
        { task: "2 peças para datas comemorativas", type: "entregável", hours: 5 },
        { task: "Atualização de artes de campanhas ativas", type: "revisão", hours: 3 },
        { task: "1 infográfico educativo", type: "entregável", hours: 4 },
      ]},
    ],
  },
  {
    week: "Semana 4", dates: "22 – 31", theme: "Fechamento & Próximo Mês", themeColor: "#30D158",
    tasks: [
      { role: "Estrategista", color: "#30D158", items: [
        { task: "Relatório estratégico mensal completo", type: "entregável", hours: 4 },
        { task: "Reunião de resultados com diretoria", type: "reunião", hours: 2 },
        { task: "Planejamento de campanha do próximo mês", type: "entregável", hours: 3 },
        { task: "Definição de metas e KPIs", type: "planejamento", hours: 2 },
      ]},
      { role: "Gestor de Tráfego", color: "#007AFF", items: [
        { task: "Relatório mensal consolidado (Meta + Google)", type: "entregável", hours: 5 },
        { task: "Desativação de anúncios de baixo desempenho", type: "operação", hours: 2 },
        { task: "Configuração prévia de campanhas", type: "operação", hours: 5 },
        { task: "Análise de benchmark do setor médico", type: "análise", hours: 3 },
      ]},
      { role: "Copywriter", color: "#AF52DE", items: [
        { task: "4 copies finais + 4 antecipadas", type: "entregável", hours: 8 },
        { task: "Legendas para posts finais do mês", type: "entregável", hours: 3 },
        { task: "Revisão de toda a copy ativa", type: "revisão", hours: 3 },
        { task: "Documento de aprendizados e melhores copies", type: "entregável", hours: 1 },
      ]},
      { role: "Designer", color: "#FF3B30", items: [
        { task: "12 artes para feed e stories (semana 4)", type: "entregável", hours: 10 },
        { task: "4 peças antecipadas para semana 1", type: "entregável", hours: 5 },
        { task: "Relatório visual de melhores criativos", type: "entregável", hours: 2 },
        { task: "Organização e arquivamento de arquivos", type: "operação", hours: 2 },
      ]},
    ],
  },
];

const typeColors: Record<string, { bg: string; color: string; label: string }> = {
  "entregável": { bg: "rgba(0,122,255,0.08)", color: "#007AFF", label: "Entregável" },
  "operação": { bg: "rgba(48,209,88,0.08)", color: "#30D158", label: "Operação" },
  "revisão": { bg: "rgba(255,149,0,0.08)", color: "#FF9500", label: "Revisão" },
  "análise": { bg: "rgba(175,82,222,0.08)", color: "#AF52DE", label: "Análise" },
  "planejamento": { bg: "rgba(0,199,190,0.08)", color: "#00C7BE", label: "Planejamento" },
  "reunião": { bg: "rgba(255,59,48,0.08)", color: "#FF3B30", label: "Reunião" },
};

export default function MasterSchedule() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const week = weeks[activeWeek];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "hsl(220,30%,10%)" }}>Cronograma Mestre Mensal</h2>
        <p className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>Distribuição detalhada de tarefas por profissional</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {weeks.map((w, i) => (
          <motion.button key={i} onClick={() => setActiveWeek(i)} whileTap={{ scale: 0.97 }}
            className="p-4 text-left transition-all duration-300"
            style={{
              borderRadius: "var(--ios-radius-lg)",
              backgroundColor: activeWeek === i ? w.themeColor : "var(--ios-glass-heavy)",
              backdropFilter: activeWeek !== i ? "blur(40px)" : undefined,
              border: `1px solid ${activeWeek === i ? w.themeColor : "rgba(255,255,255,0.5)"}`,
              boxShadow: activeWeek === i ? `0 4px 20px ${w.themeColor}30` : "var(--ios-shadow)",
            }}
          >
            <div className="text-xs font-medium" style={{ color: activeWeek === i ? "rgba(255,255,255,0.7)" : "hsl(220,10%,55%)" }}>Dias {w.dates}</div>
            <div className="text-sm font-bold mt-0.5" style={{ color: activeWeek === i ? "#FFF" : "hsl(220,30%,10%)" }}>{w.week}</div>
            <div className="text-xs mt-0.5" style={{ color: activeWeek === i ? "rgba(255,255,255,0.8)" : "hsl(220,10%,50%)" }}>{w.theme}</div>
          </motion.button>
        ))}
      </div>

      <motion.div key={activeWeek} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="ios-card overflow-hidden"
      >
        <div className="p-6" style={{ borderBottom: "1px solid rgba(120,120,128,0.1)" }}>
          <h3 className="text-lg font-bold" style={{ color: "hsl(220,30%,10%)" }}>{week.week} · {week.theme}</h3>
          <p className="text-xs mt-0.5" style={{ color: "hsl(220,10%,55%)" }}>Período: dias {week.dates} do mês</p>
        </div>

        {week.tasks.map((roleTask, ri) => {
          const totalHours = roleTask.items.reduce((s, t) => s + t.hours, 0);
          const isExpanded = expandedRole === `${activeWeek}-${ri}`;
          const RoleIcon = roleIcons[roleTask.role] || Brain;
          return (
            <div key={ri} style={{ borderBottom: "1px solid rgba(120,120,128,0.06)" }}>
              <button onClick={() => setExpandedRole(isExpanded ? null : `${activeWeek}-${ri}`)}
                className="w-full px-6 py-4 flex items-center justify-between transition-colors"
                style={{ background: isExpanded ? "rgba(120,120,128,0.04)" : "transparent" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${roleTask.color}10` }}>
                    <RoleIcon size={16} style={{ color: roleTask.color }} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,10%)" }}>{roleTask.role}</div>
                    <div className="text-xs" style={{ color: "hsl(220,10%,55%)" }}>{roleTask.items.length} tarefas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: roleTask.color }}>{totalHours}h</div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} style={{ color: "hsl(220,10%,55%)" }} />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 space-y-1.5">
                      {roleTask.items.map((item, ii) => {
                        const typeStyle = typeColors[item.type] || { bg: "rgba(120,120,128,0.06)", color: "hsl(220,10%,45%)", label: item.type };
                        return (
                          <div key={ii} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl" style={{ background: "rgba(120,120,128,0.04)" }}>
                            <span className="text-xs flex-1" style={{ color: "hsl(220,15%,30%)" }}>{item.task}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: typeStyle.bg, color: typeStyle.color }}>{typeStyle.label}</span>
                              <span className="text-xs font-bold" style={{ color: "hsl(220,10%,45%)" }}>{item.hours}h</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-2 flex justify-between items-center px-3.5 py-2.5 rounded-xl" style={{ background: `${roleTask.color}06` }}>
                        <span className="text-xs" style={{ color: "hsl(220,10%,50%)" }}>Total estimado</span>
                        <span className="text-xs font-bold" style={{ color: roleTask.color }}>{totalHours}h</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

      {/* Hours summary */}
      <div className="ios-card p-6">
        <h4 className="text-xs font-bold tracking-wider mb-4" style={{ color: "hsl(220,10%,55%)" }}>RESUMO DE HORAS — {week.week.toUpperCase()}</h4>
        <div className="flex gap-3">
          {week.tasks.map((rt, i) => {
            const hrs = rt.items.reduce((s, t) => s + t.hours, 0);
            const RI = roleIcons[rt.role] || Brain;
            return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }} className="flex-1 text-center rounded-2xl p-4" style={{ background: "rgba(120,120,128,0.04)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${rt.color}10` }}>
                  <RI size={18} style={{ color: rt.color }} />
                </div>
                <div className="text-xs" style={{ color: "hsl(220,10%,50%)" }}>{rt.role.split(" ")[0]}</div>
                <div className="text-xl font-bold" style={{ color: rt.color }}>{hrs}h</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
