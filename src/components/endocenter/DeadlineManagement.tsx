import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Clock, Phone, Zap, AlertOctagon, Timer } from "lucide-react";
import { motion } from "framer-motion";

type Priority = "critical" | "high" | "medium" | "low";
type DeadlineStatus = "on_track" | "at_risk" | "overdue" | "done";

interface Deadline {
  id: string; task: string; responsible: string; dueDay: string; frequency: string; priority: Priority; status: DeadlineStatus; consequence: string;
}

const deadlines: Deadline[] = [
  { id: "d1", task: "Briefing mensal entregue", responsible: "Estrategista", dueDay: "Dia 25 (mês anterior)", frequency: "Mensal", priority: "critical", status: "on_track", consequence: "Equipe sem direção" },
  { id: "d2", task: "Calendário editorial publicado", responsible: "Estrategista", dueDay: "Dia 27 (mês anterior)", frequency: "Mensal", priority: "critical", status: "on_track", consequence: "Produção desorganizada" },
  { id: "d3", task: "Copies de anúncios da semana", responsible: "Copywriter", dueDay: "3ª-feira", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Atraso nas artes" },
  { id: "d4", task: "Legendas de posts da semana", responsible: "Copywriter", dueDay: "2ª-feira", frequency: "Semanal", priority: "high", status: "at_risk", consequence: "Posts sem texto" },
  { id: "d5", task: "Artes e criativos da semana", responsible: "Designer", dueDay: "4ª-feira", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Tráfego sem criativos" },
  { id: "d6", task: "Criativos de anúncios para aprovação", responsible: "Designer", dueDay: "3ª-feira", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Campanhas sem atualização" },
  { id: "d7", task: "Relatório semanal de performance", responsible: "Gestor de Tráfego", dueDay: "6ª-feira (18h)", frequency: "Semanal", priority: "high", status: "on_track", consequence: "Sem dados para decisões" },
  { id: "d8", task: "Aprovação de peças", responsible: "Estrategista", dueDay: "Dentro de 24h", frequency: "Contínuo", priority: "critical", status: "on_track", consequence: "Bloqueio do fluxo" },
  { id: "d9", task: "Relatório mensal consolidado", responsible: "Gestor de Tráfego", dueDay: "Até dia 5", frequency: "Mensal", priority: "high", status: "on_track", consequence: "Reunião sem dados" },
  { id: "d10", task: "Peças antecipadas semana 1", responsible: "Designer + Copy", dueDay: "Dia 28", frequency: "Mensal", priority: "medium", status: "on_track", consequence: "1ª semana sem conteúdo" },
  { id: "d11", task: "Reunião semanal de alinhamento", responsible: "Toda equipe", dueDay: "2ª-feira (09h)", frequency: "Semanal", priority: "medium", status: "on_track", consequence: "Equipe desalinhada" },
  { id: "d12", task: "Configuração campanhas próximo mês", responsible: "Gestor de Tráfego", dueDay: "Até dia 28", frequency: "Mensal", priority: "high", status: "on_track", consequence: "Sem campanhas ativas" },
];

const crisisScenarios = [
  { scenario: "Membro da equipe indisponível", Icon: AlertOctagon, color: "#FF3B30", impact: "Alto", steps: ["Comunicar à estrategista via WhatsApp", "Avaliar redistribuição de tarefas", "Priorizar entregáveis críticos", "Freelancer emergencial em até 24h", "Documentar impacto"] },
  { scenario: "Campanha com baixa performance", Icon: AlertTriangle, color: "#FF9500", impact: "Médio", steps: ["Alerta à estrategista em até 2h", "Análise de causa raiz", "2 criativos alternativos em 24h", "CPL > 2x por 3 dias: pausa e revisão", "Reunião emergencial"] },
  { scenario: "Mudança urgente do cliente", Icon: Phone, color: "#007AFF", impact: "Variável", steps: ["Avaliar urgência (1h)", "Briefing simplificado em 4h", "Definir o que adiar", "Entregável urgente em até 48h", "ETA realista ao cliente"] },
  { scenario: "Conta de anúncios suspensa", Icon: XCircle, color: "#AF52DE", impact: "Crítico", steps: ["Alerta imediato (ligação)", "Recurso em até 2h", "Migração para conta backup", "Comunicar sobre queda de leads", "Medidas preventivas"] },
  { scenario: "Publicação equivocada", Icon: Zap, color: "#30D158", impact: "Alto", steps: ["Apagar/pausar imediatamente", "Notificar em até 15 minutos", "Avaliar nota de correção", "Identificar falha no processo", "Corrigir para não repetir"] },
  { scenario: "Prazo crítico em risco", Icon: Timer, color: "#FF9500", impact: "Médio", steps: ["Comunicar com 24h de antecedência", "Nova previsão realista", "Resolver bloqueio", "Priorizar itens impactantes", "Documentar e prevenir"] },
];

const priorityConfig = {
  critical: { label: "Crítico", color: "#FF3B30", bg: "rgba(255,59,48,0.08)" },
  high: { label: "Alto", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
  medium: { label: "Médio", color: "#FF9500", bg: "rgba(255,149,0,0.06)" },
  low: { label: "Baixo", color: "#30D158", bg: "rgba(48,209,88,0.08)" },
};

const statusConfig = {
  on_track: { label: "No prazo", color: "#30D158", bg: "rgba(48,209,88,0.08)", Icon: CheckCircle },
  at_risk: { label: "Em risco", color: "#FF9500", bg: "rgba(255,149,0,0.08)", Icon: AlertTriangle },
  overdue: { label: "Atrasado", color: "#FF3B30", bg: "rgba(255,59,48,0.08)", Icon: XCircle },
  done: { label: "Concluído", color: "#007AFF", bg: "rgba(0,122,255,0.08)", Icon: CheckCircle },
};

export default function DeadlineManagement() {
  const [deadlineList, setDeadlineList] = useState<Deadline[]>(deadlines);
  const [filterFreq, setFilterFreq] = useState("Todos");

  const cycleStatus = (id: string) => {
    const cycle: DeadlineStatus[] = ["on_track", "at_risk", "overdue", "done"];
    setDeadlineList((prev) => prev.map((d) => d.id === id ? { ...d, status: cycle[(cycle.indexOf(d.status) + 1) % cycle.length] } : d));
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
        <h2 className="text-xl font-bold" style={{ color: "hsl(220,30%,10%)" }}>Gestão de Prazos & Crises</h2>
        <p className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>Controle de deadlines e playbook de emergências</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(countByStatus) as [DeadlineStatus, number][]).map(([status, count], i) => {
          const st = statusConfig[status];
          const SIcon = st.Icon;
          return (
            <motion.div key={status} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="ios-card p-4 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: st.bg }}>
                <SIcon size={18} style={{ color: st.color }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: st.color }}>{count}</div>
              <div className="text-xs" style={{ color: "hsl(220,10%,50%)" }}>{st.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Deadlines table */}
      <div className="ios-card overflow-hidden">
        <div className="p-6" style={{ borderBottom: "1px solid rgba(120,120,128,0.1)" }}>
          <h3 className="text-lg font-bold mb-3" style={{ color: "hsl(220,30%,10%)" }}>Tabela de Prazos Críticos</h3>
          {/* iOS segmented filter */}
          <div className="p-1 rounded-xl inline-flex" style={{ background: "rgba(120,120,128,0.08)" }}>
            {["Todos", "Semanal", "Mensal", "Contínuo"].map((f) => (
              <button key={f} onClick={() => setFilterFreq(f)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
                style={{
                  background: filterFreq === f ? "white" : "transparent",
                  color: filterFreq === f ? "hsl(220,30%,10%)" : "hsl(220,10%,45%)",
                  boxShadow: filterFreq === f ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: "rgba(120,120,128,0.06)" }}>
          {filtered.map((d, i) => {
            const pr = priorityConfig[d.priority];
            const st = statusConfig[d.status];
            const SIcon = st.Icon;
            return (
              <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="px-6 py-3.5 flex flex-wrap md:flex-nowrap items-center gap-3 transition-colors"
                style={{ background: "transparent" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: "hsl(220,30%,10%)" }}>{d.task}</div>
                  <div className="text-[10px]" style={{ color: "hsl(220,10%,55%)" }}>{d.responsible} · {d.dueDay}</div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: pr.bg, color: pr.color }}>{pr.label}</span>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => cycleStatus(d.id)}
                  className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 transition-all"
                  style={{ background: st.bg, color: st.color }}>
                  <SIcon size={10} /> {st.label}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
        <div className="px-6 py-3 text-[10px] text-center" style={{ color: "hsl(220,10%,55%)", borderTop: "1px solid rgba(120,120,128,0.06)" }}>
          Clique no status para alterá-lo
        </div>
      </div>

      {/* Crisis playbook */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "hsl(220,30%,10%)" }}>Playbook de Crises</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {crisisScenarios.map((crisis, i) => {
            const CIcon = crisis.Icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="ios-card p-5" style={{ borderLeft: `3px solid ${crisis.color}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${crisis.color}12` }}>
                    <CIcon size={16} style={{ color: crisis.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,10%)" }}>{crisis.scenario}</div>
                    <span className="text-[10px] font-medium" style={{ color: crisis.color }}>Impacto: {crisis.impact}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {crisis.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-2">
                      <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: `${crisis.color}10`, color: crisis.color }}>{si + 1}</span>
                      <span className="text-xs" style={{ color: "hsl(220,15%,35%)" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Communication protocol */}
      <div className="ios-card p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: "hsl(220,30%,10%)" }}>Protocolo de Comunicação</h3>
        <div className="space-y-3">
          {[
            { channel: "WhatsApp Equipe", use: "Alinhamentos rápidos, aprovações urgentes", sla: "Resposta em até 4h", color: "#25D366" },
            { channel: "Google Drive / Notion", use: "Briefings, calendário, arquivos, relatórios", sla: "Atualização em tempo real", color: "#4285F4" },
            { channel: "Reunião Semanal", use: "Alinhamento semanal, feedback, ajustes", sla: "Segunda-feira 09h, 30min", color: "#FF3B30" },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: "rgba(120,120,128,0.04)" }}>
              <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: c.color, minHeight: "3rem" }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,10%)" }}>{c.channel}</div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(220,10%,50%)" }}>{c.use}</div>
                <div className="text-[10px] font-medium mt-1 flex items-center gap-1" style={{ color: c.color }}><Clock size={10} /> {c.sla}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
