import { useState } from "react";

interface CheckItem { id: string; task: string; done: boolean; critical: boolean; }

interface RoleMatrix {
  role: string; icon: string; color: string; colorLight: string; colorBorder: string;
  description: string; weekly: CheckItem[]; monthly: CheckItem[]; quality: CheckItem[];
}

const initialMatrix: RoleMatrix[] = [
  {
    role: "Estrategista", icon: "🧠", color: "#059669", colorLight: "#ECFDF5", colorBorder: "#A7F3D0",
    description: "Guardião da estratégia, calendário editorial e aprovação final de todos os entregáveis",
    weekly: [
      { id: "es1", task: "Briefing semanal entregue para toda a equipe (até 2ª-feira)", done: false, critical: true },
      { id: "es2", task: "Revisão e aprovação de todos os criativos da semana", done: false, critical: true },
      { id: "es3", task: "Validação do calendário de publicações", done: false, critical: false },
      { id: "es4", task: "Alinhamento com a equipe (reunião semanal de 30min)", done: false, critical: false },
      { id: "es5", task: "Monitoramento de KPIs estratégicos (leads, agendamentos)", done: false, critical: true },
    ],
    monthly: [
      { id: "em1", task: "Planejamento do mês entregue até o dia 25 do mês anterior", done: false, critical: true },
      { id: "em2", task: "Relatório estratégico mensal (resultados + próximos passos)", done: false, critical: true },
      { id: "em3", task: "Reunião de resultados com diretoria da Endocenter", done: false, critical: true },
      { id: "em4", task: "Revisão de metas e KPIs para o próximo mês", done: false, critical: false },
    ],
    quality: [
      { id: "eq1", task: "Toda copy passou por revisão antes de publicar", done: false, critical: true },
      { id: "eq2", task: "Todo criativo segue o guia de marca Endocenter", done: false, critical: true },
      { id: "eq3", task: "Aprovação documentada no canal oficial da equipe", done: false, critical: false },
      { id: "eq4", task: "Nenhuma publicação avança sem aprovação final da estrategista", done: false, critical: true },
    ],
  },
  {
    role: "Gestor de Tráfego", icon: "📡", color: "#1E6FD9", colorLight: "#EFF6FF", colorBorder: "#BFDBFE",
    description: "Responsável pela performance das campanhas pagas, otimização diária e geração de leads qualificados",
    weekly: [
      { id: "ts1", task: "Otimização de campanhas ativas (5x por semana, mínimo)", done: false, critical: true },
      { id: "ts2", task: "Relatório semanal de performance enviado até 6ª-feira", done: false, critical: true },
      { id: "ts3", task: "Monitoramento do custo por lead (CPL) diariamente", done: false, critical: true },
      { id: "ts4", task: "Teste de pelo menos 1 nova variação de anúncio por semana", done: false, critical: false },
      { id: "ts5", task: "Verificação de orçamento diário e alertas de anomalias", done: false, critical: false },
    ],
    monthly: [
      { id: "tm1", task: "Relatório mensal consolidado (Meta Ads + Google Ads)", done: false, critical: true },
      { id: "tm2", task: "Análise comparativa de performance mês a mês", done: false, critical: false },
      { id: "tm3", task: "Revisão e atualização de públicos-alvo", done: false, critical: false },
      { id: "tm4", task: "Planejamento e configuração de campanhas do próximo mês", done: false, critical: true },
    ],
    quality: [
      { id: "tq1", task: "CPL abaixo de R$ 25 (meta da Endocenter)", done: false, critical: true },
      { id: "tq2", task: "Nenhuma campanha no ar sem criativo aprovado pela estrategista", done: false, critical: true },
      { id: "tq3", task: "Pixels de rastreamento verificados e funcionando", done: false, critical: true },
      { id: "tq4", task: "ROAS mínimo de 3.5x nas campanhas de conversão", done: false, critical: false },
    ],
  },
  {
    role: "Copywriter", icon: "✍️", color: "#7C3AED", colorLight: "#F5F3FF", colorBorder: "#DDD6FE",
    description: "Responsável por toda a comunicação escrita da clínica, desde anúncios até automações de relacionamento",
    weekly: [
      { id: "cs1", task: "4 copies de anúncios entregues até 3ª-feira (para review)", done: false, critical: true },
      { id: "cs2", task: "Legendas de todos os posts da semana prontas até 2ª-feira", done: false, critical: true },
      { id: "cs3", task: "Revisão de copies ativas (ajuste de CTAs conforme dados)", done: false, critical: false },
      { id: "cs4", task: "Arquivo de copies e melhores resultados atualizado", done: false, critical: false },
    ],
    monthly: [
      { id: "cm1", task: "Banco de copies do mês organizado e arquivado", done: false, critical: false },
      { id: "cm2", task: "Análise das copies com melhor performance (relatório)", done: false, critical: false },
      { id: "cm3", task: "4 copies antecipadas para a 1ª semana do mês seguinte", done: false, critical: true },
      { id: "cm4", task: "Revisão do tom de voz e consistência da comunicação", done: false, critical: false },
    ],
    quality: [
      { id: "cq1", task: "Toda copy revisada gramaticalmente antes da entrega", done: false, critical: true },
      { id: "cq2", task: "CTA claro e específico em todos os textos de anúncios", done: false, critical: true },
      { id: "cq3", task: "Tom de voz alinhado com as diretrizes da Endocenter", done: false, critical: true },
      { id: "cq4", task: "Aprovação de 80%+ das copies na 1ª revisão (meta)", done: false, critical: false },
    ],
  },
  {
    role: "Designer", icon: "🎨", color: "#DC2626", colorLight: "#FFF1F2", colorBorder: "#FECDD3",
    description: "Responsável por toda a identidade visual, criativos de anúncios e materiais gráficos da clínica",
    weekly: [
      { id: "ds1", task: "12 peças (feed + stories) entregues até 4ª-feira", done: false, critical: true },
      { id: "ds2", task: "Criativos de anúncios entregues para aprovação até 3ª-feira", done: false, critical: true },
      { id: "ds3", task: "Adaptações de peças conforme feedback em menos de 24h", done: false, critical: false },
      { id: "ds4", task: "Arquivos exportados nos formatos corretos (JPG, PNG, MP4)", done: false, critical: false },
      { id: "ds5", task: "Organização dos arquivos em pastas por campanha/semana", done: false, critical: false },
    ],
    monthly: [
      { id: "dm1", task: "Todos os arquivos do mês organizados e nomeados corretamente", done: false, critical: false },
      { id: "dm2", task: "Relatório visual dos melhores criativos do mês", done: false, critical: false },
      { id: "dm3", task: "Templates atualizados conforme novidades ou feedback", done: false, critical: false },
      { id: "dm4", task: "4 peças antecipadas para a 1ª semana do mês seguinte", done: false, critical: true },
    ],
    quality: [
      { id: "dq1", task: "Todas as peças seguem o Guia de Marca Endocenter (cores, fontes, logo)", done: false, critical: true },
      { id: "dq2", task: "Mínimo de 300 DPI para materiais impressos; 72 DPI para digital", done: false, critical: true },
      { id: "dq3", task: "Textos nas artes revisados com o copywriter antes da entrega", done: false, critical: true },
      { id: "dq4", task: "Nenhuma arte enviada ao tráfego sem aprovação da estrategista", done: false, critical: true },
    ],
  },
];

export default function ResponsibilityMatrix() {
  const [matrix, setMatrix] = useState<RoleMatrix[]>(initialMatrix);
  const [activeRole, setActiveRole] = useState(0);
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "quality">("weekly");

  const toggleItem = (roleIdx: number, list: "weekly" | "monthly" | "quality", itemId: string) => {
    setMatrix((prev) =>
      prev.map((r, ri) =>
        ri === roleIdx
          ? { ...r, [list]: r[list].map((item) => item.id === itemId ? { ...item, done: !item.done } : item) }
          : r
      )
    );
  };

  const getCompletion = (role: RoleMatrix, list: "weekly" | "monthly" | "quality") => {
    const items = role[list];
    return Math.round((items.filter((i) => i.done).length / items.length) * 100);
  };

  const role = matrix[activeRole];
  const currentList = role[activeTab];
  const tabLabels = { weekly: "Rotina Semanal", monthly: "Rotina Mensal", quality: "Padrão de Qualidade" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#0A1628" }}>Matriz de Responsabilidades</h2>
        <p className="text-sm text-slate-500">Definition of Done — checklist interativo para garantir padrão de qualidade por função</p>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {matrix.map((r, i) => {
          const avgPct = Math.round((getCompletion(r, "weekly") + getCompletion(r, "monthly") + getCompletion(r, "quality")) / 3);
          const isActive = activeRole === i;
          return (
            <button key={i} onClick={() => setActiveRole(i)} className="p-4 rounded-2xl text-left transition-all duration-200"
              style={{
                backgroundColor: isActive ? r.color : "#FFFFFF",
                border: `2px solid ${isActive ? r.color : "#E2E8F0"}`,
                boxShadow: isActive ? `0 4px 14px ${r.color}35` : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{r.icon}</span>
                <span className="text-xs font-bold" style={{ color: isActive ? "rgba(255,255,255,0.9)" : r.color }}>{avgPct}%</span>
              </div>
              <div className="text-sm font-bold mt-1" style={{ color: isActive ? "#FFFFFF" : "#0A1628" }}>{r.role}</div>
            </button>
          );
        })}
      </div>

      {/* Checklist Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{role.icon}</span>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "#0A1628" }}>{role.role}</h3>
              <p className="text-xs text-slate-500">{role.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: role.color }}>{getCompletion(role, activeTab)}%</div>
            <div className="text-[10px] text-slate-400">completo</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100">
          {(["weekly", "monthly", "quality"] as const).map((tab) => {
            const pct = getCompletion(role, tab);
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 px-4 py-3 text-sm font-semibold transition-all"
                style={{
                  color: activeTab === tab ? role.color : "#94A3B8",
                  borderBottom: `2px solid ${activeTab === tab ? role.color : "transparent"}`,
                }}
              >
                {tabLabels[tab]}
                <span className="ml-1 text-xs opacity-60">{pct}%</span>
              </button>
            );
          })}
        </div>

        {/* Checklist Items */}
        <div className="p-6 space-y-2">
          {currentList.map((item) => (
            <div key={item.id} onClick={() => toggleItem(activeRole, activeTab, item.id)}
              className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
              style={{ backgroundColor: item.done ? role.colorLight : "#F8FAFC", border: `1px solid ${item.done ? role.colorBorder : "#E2E8F0"}` }}
            >
              <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 shrink-0"
                style={{ borderColor: item.done ? role.color : "#CBD5E1", backgroundColor: item.done ? role.color : "transparent" }}
              >
                {item.done && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1">
                <span className="text-sm text-slate-700" style={{ textDecoration: item.done ? "line-through" : "none" }}>{item.task}</span>
              </div>
              {item.critical && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 shrink-0">
                  Crítico
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">{currentList.filter((i) => i.done).length} de {currentList.length} itens marcados</span>
            {currentList.filter((i) => i.critical && !i.done).length > 0 && (
              <span className="text-xs text-red-500 ml-2">
                ⚠️ {currentList.filter((i) => i.critical && !i.done).length} item(s) crítico(s) pendente(s)
              </span>
            )}
          </div>
          <button
            onClick={() => setMatrix((prev) => prev.map((r, ri) => ri === activeRole ? { ...r, [activeTab]: r[activeTab].map((i) => ({ ...i, done: false })) } : r))}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#94A3B8", border: "1px solid #E2E8F0" }}
          >
            Resetar checklist
          </button>
        </div>
      </div>
    </div>
  );
}
