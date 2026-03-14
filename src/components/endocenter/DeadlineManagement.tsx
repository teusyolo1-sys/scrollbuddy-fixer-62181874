import { useState } from "react";

type Priority = "critical" | "high" | "medium" | "low";
type DeadlineStatus = "on_track" | "at_risk" | "overdue" | "done";

interface Deadline {
  id: string; task: string; responsible: string; icon: string;
  dueDay: string; frequency: string; priority: Priority; status: DeadlineStatus; consequence: string;
}

const deadlines: Deadline[] = [
  { id: "d1", task: "Briefing mensal entregue para a equipe", responsible: "Estrategista", icon: "🧠", dueDay: "Dia 25 (mês anterior)", frequency: "Mensal", priority: "critical", status: "on_track", consequence: "Equipe sem direção para o mês" },
  { id: "d2", task: "Calendário editorial publicado no Drive", responsible: "Estrategista", icon: "🧠", dueDay: "Dia 27 (mês anterior)", frequency: "Mensal", priority: "critical", status: "on_track", consequence: "Produção sem organização" },
  { id: "d3", task: "Copies de anúncios da semana", responsible: "Copywriter", icon: "✍️", dueDay: "3ª-feira de cada semana", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Atraso na criação das artes" },
  { id: "d4", task: "Legendas de posts da semana", responsible: "Copywriter", icon: "✍️", dueDay: "2ª-feira de cada semana", frequency: "Semanal", priority: "high", status: "at_risk", consequence: "Posts sem texto para publicação" },
  { id: "d5", task: "Artes e criativos da semana", responsible: "Designer", icon: "🎨", dueDay: "4ª-feira de cada semana", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Tráfego sem criativos para anúncios" },
  { id: "d6", task: "Criativos de anúncios para aprovação", responsible: "Designer", icon: "🎨", dueDay: "3ª-feira de cada semana", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Campanhas sem atualização de criativos" },
  { id: "d7", task: "Relatório semanal de performance", responsible: "Gestor de Tráfego", icon: "📡", dueDay: "6ª-feira de cada semana (até 18h)", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Estrategista sem dados para decisões" },
  { id: "d8", task: "Aprovação de peças pela estrategista", responsible: "Estrategista", icon: "🧠", dueDay: "Dentro de 24h após receber", frequency: "Contínuo", priority: "critical", status: "on_track", consequence: "Bloqueio total do fluxo de produção" },
  { id: "d9", task: "Relatório mensal consolidado", responsible: "Gestor de Tráfego", icon: "📡", dueDay: "Até dia 5 do mês seguinte", frequency: "Mensal", priority: "high", status: "on_track", consequence: "Reunião de resultados sem dados" },
  { id: "d10", task: "Peças antecipadas para semana 1 do próximo mês", responsible: "Designer + Copywriter", icon: "🎨✍️", dueDay: "Dia 28 de cada mês", frequency: "Mensal", priority: "medium", status: "on_track", consequence: "1ª semana do mês sem conteúdo pronto" },
  { id: "d11", task: "Reunião semanal de alinhamento", responsible: "Toda a equipe", icon: "👥", dueDay: "2ª-feira (30min, 09h)", frequency: "Semanal", priority: "medium", status: "on_track", consequence: "Equipe desalinhada e falta de sincronia" },
  { id: "d12", task: "Configuração campanhas próximo mês", responsible: "Gestor de Tráfego", icon: "📡", dueDay: "Até dia 28 de cada mês", frequency: "Mensal", priority: "high", status: "on_track", consequence: "1ª semana sem campanhas ativas" },
];

const crisisScenarios = [
  { scenario: "Membro da equipe adoece ou fica indisponível", icon: "🏥", color: "#DC2626", impact: "Alto", steps: ["Comunicar imediatamente à estrategista via WhatsApp", "Estrategista avalia redistribuição de tarefas urgentes", "Priorizar entregáveis críticos (anúncios ativos têm prioridade)", "Se necessário, contratar freelancer emergencial em até 24h", "Documentar impacto e ajustar prazos do mês"] },
  { scenario: "Campanha com performance abaixo do esperado", icon: "📉", color: "#EA580C", impact: "Médio", steps: ["Gestor de tráfego alerta a estrategista em até 2h de detecção", "Análise de causa raiz: criativo, público, landing page ou oferta", "Teste imediato de 2 criativos alternativos em 24h", "Se CPL > 2x a meta por 3 dias: pausa e revisão completa", "Reunião emergencial equipe + estrategista para replanejar"] },
  { scenario: "Cliente / diretoria solicita mudança urgente", icon: "🔔", color: "#1E6FD9", impact: "Variável", steps: ["Estrategista recebe a solicitação e avalia urgência (1h para responder)", "Briefing simplificado enviado em até 4h para equipe", "Definir o que pode ser adiado para acomodar o urgente", "Entregável urgente priorizado com prazo máximo de 48h", "Comunicar ao cliente ETA realista (não prometer o impossível)"] },
  { scenario: "Conta de anúncios suspensa ou banida", icon: "🚫", color: "#7C3AED", impact: "Crítico", steps: ["Gestor alerta estrategista imediatamente (ligação, não mensagem)", "Abertura de recurso nas plataformas em até 2h", "Migração temporária para conta backup (sempre manter 1 conta reserva)", "Comunicar à diretoria sobre possível queda de leads", "Resolver recurso + implementar medidas preventivas"] },
  { scenario: "Erro de comunicação ou publicação equivocada", icon: "⚡", color: "#059669", impact: "Alto", steps: ["Apagar/pausar o conteúdo imediatamente", "Notificar estrategista e diretoria em até 15 minutos", "Avaliar necessidade de nota de correção ou errata", "Identificar falha no processo de aprovação que permitiu o erro", "Corrigir o processo para que não se repita"] },
  { scenario: "Prazo crítico em risco de não ser cumprido", icon: "⏰", color: "#F59E0B", impact: "Médio", steps: ["Comunicar atraso à estrategista com 24h de antecedência (mínimo)", "Apresentar nova previsão realista de entrega", "Identificar causa do atraso e resolver o bloqueio", "Priorizar itens mais impactantes para entregar primeiro", "Documentar atraso e criar plano para não repetir"] },
];

const priorityConfig = {
  critical: { label: "Crítico", bg: "#FFF1F2", color: "#DC2626", border: "#FECDD3" },
  high: { label: "Alto", bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  medium: { label: "Médio", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  low: { label: "Baixo", bg: "#F0FDF4", color: "#059669", border: "#A7F3D0" },
};

const statusConfig = {
  on_track: { label: "No prazo", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", icon: "✅" },
  at_risk: { label: "Em risco", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", icon: "⚠️" },
  overdue: { label: "Atrasado", bg: "#FFF1F2", color: "#DC2626", border: "#FECDD3", icon: "🔴" },
  done: { label: "Concluído", bg: "#EFF6FF", color: "#1E6FD9", border: "#BFDBFE", icon: "☑️" },
};

export default function DeadlineManagement() {
  const [deadlineList, setDeadlineList] = useState<Deadline[]>(deadlines);
  const [filterFreq, setFilterFreq] = useState("Todos");

  const cycleStatus = (id: string) => {
    const cycle: DeadlineStatus[] = ["on_track", "at_risk", "overdue", "done"];
    setDeadlineList((prev) =>
      prev.map((d) => d.id === id ? { ...d, status: cycle[(cycle.indexOf(d.status) + 1) % cycle.length] } : d)
    );
  };

  const filtered = filterFreq === "Todos" ? deadlineList : deadlineList.filter((d) => d.frequency === filterFreq);

  const countByStatus = {
    on_track: deadlineList.filter((d) => d.status === "on_track").length,
    at_risk: deadlineList.filter((d) => d.status === "at_risk").length,
    overdue: deadlineList.filter((d) => d.status === "overdue").length,
    done: deadlineList.filter((d) => d.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#0A1628" }}>Gestão de Prazos & Crises</h2>
        <p className="text-sm text-slate-500">Controle de deadlines críticos e playbook de resposta a situações de emergência</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(countByStatus) as [DeadlineStatus, number][]).map(([status, count]) => {
          const st = statusConfig[status];
          return (
            <div key={status} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
              <div className="text-xl mb-1">{st.icon}</div>
              <div className="text-2xl font-bold" style={{ color: st.color }}>{count}</div>
              <div className="text-xs text-slate-500">{st.label}</div>
            </div>
          );
        })}
      </div>

      {/* Deadline Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold mb-3" style={{ color: "#0A1628" }}>Tabela de Prazos Críticos</h3>
          <div className="flex gap-2">
            {["Todos", "Semanal", "Mensal", "Contínuo"].map((f) => (
              <button key={f} onClick={() => setFilterFreq(f)} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: filterFreq === f ? "#0A1628" : "#F1F5F9", color: filterFreq === f ? "#FFFFFF" : "#64748B" }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-6 gap-2 px-6 py-3 bg-slate-50 text-[10px] font-bold text-slate-400 tracking-wider">
          <div className="col-span-2">TAREFA / DEADLINE</div>
          <div>RESPONSÁVEL</div>
          <div>PRAZO</div>
          <div>PRIORIDADE</div>
          <div>STATUS</div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.map((d) => {
            const pr = priorityConfig[d.priority];
            const st = statusConfig[d.status];
            return (
              <div key={d.id} className="grid md:grid-cols-6 gap-2 px-6 py-3 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-2 flex items-start gap-2">
                  <span className="text-sm">{d.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{d.task}</div>
                    <div className="text-[10px] text-slate-400">⚡ {d.consequence}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-600">{d.responsible}</div>
                <div className="text-xs text-slate-600">{d.dueDay}</div>
                <div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: pr.bg, color: pr.color, border: `1px solid ${pr.border}` }}>
                    {pr.label}
                  </span>
                </div>
                <div>
                  <button onClick={() => cycleStatus(d.id)}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer"
                    style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                    title="Clique para alterar status"
                  >
                    {st.icon} {st.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 text-[10px] text-slate-400 text-center border-t border-slate-50">
          Clique no status para alterá-lo
        </div>
      </div>

      {/* Crisis Playbook */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#0A1628" }}>Playbook de Crises · Guia Rápido de Conduta</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {crisisScenarios.map((crisis, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5" style={{ borderLeft: `4px solid ${crisis.color}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{crisis.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800">{crisis.scenario}</div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${crisis.color}15`, color: crisis.color }}>
                    Impacto: {crisis.impact}
                  </span>
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">PASSOS DE RESPOSTA:</div>
              <div className="space-y-1.5">
                {crisis.steps.map((step, si) => (
                  <div key={si} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${crisis.color}15`, color: crisis.color }}>
                      {si + 1}
                    </span>
                    <span className="text-xs text-slate-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Protocol */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: "#0A1628" }}>📞 Protocolo de Comunicação Interna</h3>
        <div className="space-y-3">
          {[
            { channel: "WhatsApp Equipe", use: "Comunicações do dia a dia, alinhamentos rápidos, aprovações urgentes", sla: "Resposta em até 4h (horário comercial)", color: "#25D366" },
            { channel: "Google Drive / Notion", use: "Briefings, calendário editorial, arquivos de aprovação, relatórios", sla: "Atualização em tempo real, sem prazo fixo", color: "#4285F4" },
            { channel: "Reunião Semanal (Meet)", use: "Alinhamento semanal, feedback de performance, ajustes de rota", sla: "Segunda-feira 09h, 30 minutos, obrigatória", color: "#FF3E00" },
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50">
              <div className="w-1 h-full rounded-full shrink-0" style={{ backgroundColor: c.color, minHeight: "3rem" }} />
              <div>
                <div className="text-sm font-bold text-slate-800">{c.channel}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.use}</div>
                <div className="text-[10px] font-semibold mt-1" style={{ color: c.color }}>⏱ {c.sla}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
