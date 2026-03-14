import { useState } from "react";
import { Brain, Radio, PenTool, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckItem { id: string; task: string; done: boolean; critical: boolean; }

interface RoleMatrix {
  role: string; Icon: typeof Brain; color: string; colorLight: string; colorBorder: string;
  description: string; weekly: CheckItem[]; monthly: CheckItem[]; quality: CheckItem[];
}

const initialMatrix: RoleMatrix[] = [
  {
    role: "Estrategista", Icon: Brain, color: "#30D158", colorLight: "rgba(48,209,88,0.08)", colorBorder: "rgba(48,209,88,0.2)",
    description: "Guardião da estratégia, calendário editorial e aprovação final",
    weekly: [
      { id: "es1", task: "Briefing semanal entregue para toda a equipe (até 2ª-feira)", done: false, critical: true },
      { id: "es2", task: "Revisão e aprovação de todos os criativos da semana", done: false, critical: true },
      { id: "es3", task: "Validação do calendário de publicações", done: false, critical: false },
      { id: "es4", task: "Alinhamento com a equipe (reunião semanal de 30min)", done: false, critical: false },
      { id: "es5", task: "Monitoramento de KPIs estratégicos", done: false, critical: true },
    ],
    monthly: [
      { id: "em1", task: "Planejamento do mês entregue até dia 25", done: false, critical: true },
      { id: "em2", task: "Relatório estratégico mensal", done: false, critical: true },
      { id: "em3", task: "Reunião de resultados com diretoria", done: false, critical: true },
      { id: "em4", task: "Revisão de metas e KPIs para o próximo mês", done: false, critical: false },
    ],
    quality: [
      { id: "eq1", task: "Toda copy passou por revisão antes de publicar", done: false, critical: true },
      { id: "eq2", task: "Todo criativo segue o guia de marca", done: false, critical: true },
      { id: "eq3", task: "Aprovação documentada no canal oficial", done: false, critical: false },
      { id: "eq4", task: "Nenhuma publicação avança sem aprovação final", done: false, critical: true },
    ],
  },
  {
    role: "Gestor de Tráfego", Icon: Radio, color: "#007AFF", colorLight: "rgba(0,122,255,0.08)", colorBorder: "rgba(0,122,255,0.2)",
    description: "Performance das campanhas pagas e geração de leads",
    weekly: [
      { id: "ts1", task: "Otimização de campanhas ativas (5x por semana)", done: false, critical: true },
      { id: "ts2", task: "Relatório semanal enviado até 6ª-feira", done: false, critical: true },
      { id: "ts3", task: "Monitoramento do CPL diariamente", done: false, critical: true },
      { id: "ts4", task: "Teste de 1 nova variação de anúncio por semana", done: false, critical: false },
      { id: "ts5", task: "Verificação de orçamento diário", done: false, critical: false },
    ],
    monthly: [
      { id: "tm1", task: "Relatório mensal consolidado", done: false, critical: true },
      { id: "tm2", task: "Análise comparativa mês a mês", done: false, critical: false },
      { id: "tm3", task: "Revisão de públicos-alvo", done: false, critical: false },
      { id: "tm4", task: "Configuração de campanhas do próximo mês", done: false, critical: true },
    ],
    quality: [
      { id: "tq1", task: "CPL abaixo de R$ 25", done: false, critical: true },
      { id: "tq2", task: "Nenhuma campanha sem criativo aprovado", done: false, critical: true },
      { id: "tq3", task: "Pixels de rastreamento verificados", done: false, critical: true },
      { id: "tq4", task: "ROAS mínimo de 3.5x", done: false, critical: false },
    ],
  },
  {
    role: "Copywriter", Icon: PenTool, color: "#AF52DE", colorLight: "rgba(175,82,222,0.08)", colorBorder: "rgba(175,82,222,0.2)",
    description: "Comunicação escrita da clínica",
    weekly: [
      { id: "cs1", task: "4 copies de anúncios entregues até 3ª-feira", done: false, critical: true },
      { id: "cs2", task: "Legendas de posts prontas até 2ª-feira", done: false, critical: true },
      { id: "cs3", task: "Revisão de copies ativas", done: false, critical: false },
      { id: "cs4", task: "Arquivo de copies atualizado", done: false, critical: false },
    ],
    monthly: [
      { id: "cm1", task: "Banco de copies organizado", done: false, critical: false },
      { id: "cm2", task: "Análise das copies com melhor performance", done: false, critical: false },
      { id: "cm3", task: "4 copies antecipadas para o mês seguinte", done: false, critical: true },
      { id: "cm4", task: "Revisão do tom de voz", done: false, critical: false },
    ],
    quality: [
      { id: "cq1", task: "Toda copy revisada gramaticalmente", done: false, critical: true },
      { id: "cq2", task: "CTA claro em todos os anúncios", done: false, critical: true },
      { id: "cq3", task: "Tom de voz alinhado", done: false, critical: true },
      { id: "cq4", task: "Aprovação de 80%+ na 1ª revisão", done: false, critical: false },
    ],
  },
  {
    role: "Designer", Icon: Palette, color: "#FF3B30", colorLight: "rgba(255,59,48,0.08)", colorBorder: "rgba(255,59,48,0.2)",
    description: "Identidade visual e criativos de anúncios",
    weekly: [
      { id: "ds1", task: "12 peças entregues até 4ª-feira", done: false, critical: true },
      { id: "ds2", task: "Criativos de anúncios até 3ª-feira", done: false, critical: true },
      { id: "ds3", task: "Adaptações de peças em menos de 24h", done: false, critical: false },
      { id: "ds4", task: "Arquivos exportados nos formatos corretos", done: false, critical: false },
      { id: "ds5", task: "Organização em pastas por campanha", done: false, critical: false },
    ],
    monthly: [
      { id: "dm1", task: "Arquivos do mês organizados", done: false, critical: false },
      { id: "dm2", task: "Relatório visual dos melhores criativos", done: false, critical: false },
      { id: "dm3", task: "Templates atualizados", done: false, critical: false },
      { id: "dm4", task: "4 peças antecipadas para o mês seguinte", done: false, critical: true },
    ],
    quality: [
      { id: "dq1", task: "Peças seguem o Guia de Marca", done: false, critical: true },
      { id: "dq2", task: "300 DPI para impressos; 72 DPI para digital", done: false, critical: true },
      { id: "dq3", task: "Textos revisados com copywriter", done: false, critical: true },
      { id: "dq4", task: "Nenhuma arte enviada sem aprovação", done: false, critical: true },
    ],
  },
];

export default function ResponsibilityMatrix() {
  const [matrix, setMatrix] = useState<RoleMatrix[]>(initialMatrix);
  const [activeRole, setActiveRole] = useState(0);
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "quality">("weekly");

  const toggleItem = (roleIdx: number, list: "weekly" | "monthly" | "quality", itemId: string) => {
    setMatrix((prev) => prev.map((r, ri) => ri === roleIdx ? { ...r, [list]: r[list].map((item) => item.id === itemId ? { ...item, done: !item.done } : item) } : r));
  };

  const getCompletion = (role: RoleMatrix, list: "weekly" | "monthly" | "quality") => {
    const items = role[list];
    return Math.round((items.filter((i) => i.done).length / items.length) * 100);
  };

  const role = matrix[activeRole];
  const currentList = role[activeTab];
  const tabLabels = { weekly: "Semanal", monthly: "Mensal", quality: "Qualidade" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "hsl(220,30%,10%)" }}>Matriz de Responsabilidades</h2>
        <p className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>Definition of Done — checklist interativo</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {matrix.map((r, i) => {
          const avgPct = Math.round((getCompletion(r, "weekly") + getCompletion(r, "monthly") + getCompletion(r, "quality")) / 3);
          const isActive = activeRole === i;
          const RI = r.Icon;
          return (
            <motion.button key={i} onClick={() => setActiveRole(i)} whileTap={{ scale: 0.97 }}
              className="p-4 text-left transition-all duration-300"
              style={{
                borderRadius: "var(--ios-radius-lg)",
                backgroundColor: isActive ? r.color : "var(--ios-glass-heavy)",
                backdropFilter: !isActive ? "blur(40px)" : undefined,
                border: `1px solid ${isActive ? r.color : "rgba(255,255,255,0.5)"}`,
                boxShadow: isActive ? `0 4px 20px ${r.color}30` : "var(--ios-shadow)",
              }}
            >
              <div className="flex items-center justify-between">
                <RI size={20} style={{ color: isActive ? "#FFF" : r.color }} />
                <span className="text-xs font-bold" style={{ color: isActive ? "rgba(255,255,255,0.9)" : r.color }}>{avgPct}%</span>
              </div>
              <div className="text-sm font-bold mt-1.5" style={{ color: isActive ? "#FFF" : "hsl(220,30%,10%)" }}>{r.role}</div>
            </motion.button>
          );
        })}
      </div>

      <motion.div key={activeRole} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }} className="ios-card overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(120,120,128,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: role.colorLight }}>
              <role.Icon size={20} style={{ color: role.color }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "hsl(220,30%,10%)" }}>{role.role}</h3>
              <p className="text-xs" style={{ color: "hsl(220,10%,50%)" }}>{role.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: role.color }}>{getCompletion(role, activeTab)}%</div>
          </div>
        </div>

        {/* iOS segmented control */}
        <div className="mx-6 mt-4 p-1 rounded-xl flex" style={{ background: "rgba(120,120,128,0.08)" }}>
          {(["weekly", "monthly", "quality"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? role.color : "hsl(220,10%,45%)",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tabLabels[tab]} <span className="text-[10px] opacity-60">{getCompletion(role, tab)}%</span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-2">
          {currentList.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => toggleItem(activeRole, activeTab, item.id)}
              className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200"
              style={{ background: item.done ? role.colorLight : "rgba(120,120,128,0.04)", border: `1px solid ${item.done ? role.colorBorder : "rgba(120,120,128,0.08)"}` }}
            >
              <motion.div
                animate={{ scale: item.done ? [1, 1.2, 1] : 1 }}
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                style={{ borderColor: item.done ? role.color : "rgba(120,120,128,0.25)", backgroundColor: item.done ? role.color : "transparent" }}
              >
                {item.done && <span className="text-white text-[10px] font-bold">✓</span>}
              </motion.div>
              <span className="text-sm flex-1" style={{ color: "hsl(220,15%,30%)", textDecoration: item.done ? "line-through" : "none", opacity: item.done ? 0.6 : 1 }}>{item.task}</span>
              {item.critical && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}>Crítico</span>}
            </motion.div>
          ))}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <span className="text-xs" style={{ color: "hsl(220,10%,55%)" }}>{currentList.filter((i) => i.done).length} de {currentList.length} marcados</span>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setMatrix((prev) => prev.map((r, ri) => ri === activeRole ? { ...r, [activeTab]: r[activeTab].map((i) => ({ ...i, done: false })) } : r))}
            className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "rgba(120,120,128,0.08)", color: "hsl(220,10%,45%)" }}
          >
            Resetar
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
