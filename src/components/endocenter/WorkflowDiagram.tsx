import { Brain, Radio, PenTool, Palette, CheckCircle, ArrowRight, Zap, ShieldCheck, Ban } from "lucide-react";
import { motion } from "framer-motion";

const roleIcons: Record<string, typeof Brain> = { "Estrategista": Brain, "Copywriter": PenTool, "Designer": Palette, "Gestor de Tráfego": Radio, "Estrategista + Gestor": Brain };

const steps = [
  { number: "01", title: "Planejamento Estratégico", owner: "Estrategista", color: "#30D158", colorLight: "rgba(48,209,88,0.08)", duration: "Dia 25 do mês anterior",
    inputs: ["Metas mensais da clínica", "Dados de performance do mês anterior", "Datas comemorativas e sazonalidade", "Feedback da diretoria"],
    outputs: ["Calendário editorial completo", "Briefings individuais por função", "Metas de KPIs do mês", "Prioridade de campanhas"],
    rules: ["Briefing deve chegar à equipe até a 2ª-feira da 1ª semana", "Toda mudança estratégica mid-month deve ser comunicada com 48h de antecedência", "Aprovação final de todo conteúdo é responsabilidade exclusiva da estrategista"],
  },
  { number: "02", title: "Produção de Copy", owner: "Copywriter", color: "#AF52DE", colorLight: "rgba(175,82,222,0.08)", duration: "48h após briefing",
    inputs: ["Briefing detalhado da estrategista", "Histórico de copies de alta performance", "Tom de voz da Endocenter", "Objetivos da campanha"],
    outputs: ["Textos de anúncios (Meta + Google)", "Legendas de posts e stories", "Scripts de vídeo", "Mensagens de WhatsApp"],
    rules: ["Copy enviada para revisão da estrategista antes de ir para o designer", "Copys de anúncios entregues até 3ª-feira de cada semana", "Máximo 2 rodadas de revisão por copy"],
  },
  { number: "03", title: "Criação Visual", owner: "Designer", color: "#FF3B30", colorLight: "rgba(255,59,48,0.08)", duration: "48-72h após aprovação",
    inputs: ["Copy aprovada pela estrategista", "Briefing de design", "Guia de marca Endocenter", "Referências visuais aprovadas"],
    outputs: ["Artes para feed e stories", "Criativos de anúncios", "Banners e materiais especiais", "Carrosséis e reels"],
    rules: ["Designer não inicia criação sem copy aprovada", "Arte enviada ao tráfego só após aprovação visual da estrategista", "Ajustes: prazo máximo de 24h para correção"],
  },
  { number: "04", title: "Aprovação Final", owner: "Estrategista", color: "#00C7BE", colorLight: "rgba(0,199,190,0.08)", duration: "24h após receber",
    inputs: ["Criativos finalizados pelo designer", "Copy revisada", "Contexto de campanha"],
    outputs: ["Aprovação documentada no grupo", "Peça liberada para publicação/tráfego", "Feedback construtivo (se houver)"],
    rules: ["Aprovação deve ser registrada por escrito no canal oficial", "Prazo de resposta: até 24h", "Se não houver resposta em 24h, follow-up obrigatório"],
  },
  { number: "05", title: "Publicação & Tráfego", owner: "Gestor de Tráfego", color: "#007AFF", colorLight: "rgba(0,122,255,0.08)", duration: "Conforme calendário",
    inputs: ["Criativos aprovados", "Configurações de campanha", "Orçamento definido", "Públicos-alvo configurados"],
    outputs: ["Campanhas ativas (Meta + Google)", "Posts publicados no feed", "Relatório semanal de performance", "Alertas de anomalias"],
    rules: ["Nenhum anúncio entra no ar sem aprovação prévia da estrategista", "Otimizações: diariamente (mínimo seg, qua e sex)", "Anomalia reportada em até 2h"],
  },
  { number: "06", title: "Análise & Feedback Loop", owner: "Estrategista + Gestor", color: "#FF9500", colorLight: "rgba(255,149,0,0.08)", duration: "Sexta-feira semanal",
    inputs: ["Relatório semanal do gestor", "Métricas de engajamento", "Dados de conversão e leads", "Feedbacks da clínica"],
    outputs: ["Ajustes na estratégia da próxima semana", "Briefings atualizados", "Relatório mensal (na semana 4)", "Plano de ação para melhorias"],
    rules: ["Relatório semanal: toda sexta até 18h", "Reunião semanal: 30 min, sempre na segunda-feira", "Abaixo da meta por 2 semanas: acionar plano de crise"],
  },
];

export default function WorkflowDiagram() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "hsl(220,30%,10%)" }}>Fluxo de Trabalho Integrado</h2>
        <p className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>Processo de aprovação end-to-end</p>
      </div>

      {/* Flow timeline */}
      <div className="ios-card p-6">
        <div className="text-[10px] font-bold tracking-wider mb-4" style={{ color: "hsl(220,10%,55%)" }}>LINHA DO FLUXO — PROCESSO PADRÃO</div>
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
          {steps.map((step, i) => {
            const Icon = roleIcons[step.owner] || Brain;
            return (
              <div key={i} className="flex items-center gap-2">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: step.colorLight }}>
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  <div className="text-[10px] font-medium text-center whitespace-nowrap" style={{ color: "hsl(220,10%,45%)" }}>{step.owner.split(" ")[0]}</div>
                </motion.div>
                {i < steps.length - 1 && (
                  <div className="flex items-center"><div className="w-4 h-0.5" style={{ background: "rgba(120,120,128,0.15)" }} /><ArrowRight size={12} style={{ color: "rgba(120,120,128,0.3)" }} /></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-[10px] justify-center" style={{ color: "hsl(220,10%,50%)" }}>
          <span className="flex items-center gap-1"><Zap size={10} /> SLA: 48-72h/etapa</span>
          <span className="flex items-center gap-1"><ShieldCheck size={10} /> Aprovação obrigatória</span>
          <span className="flex items-center gap-1"><Ban size={10} /> Sem pular etapas</span>
        </div>
      </div>

      {/* Step details */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = roleIcons[step.owner] || Brain;
          return (
            <motion.div key={step.number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", damping: 20 }}
              className="ios-card overflow-hidden" style={{ borderLeft: `3px solid ${step.color}` }}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: step.colorLight, color: step.color }}>{step.number}</span>
                  <Icon size={18} style={{ color: step.color }} />
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: "hsl(220,30%,10%)" }}>{step.title}</div>
                    <div className="text-xs" style={{ color: "hsl(220,10%,50%)" }}>Responsável: {step.owner}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold" style={{ color: step.color }}>{step.duration}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4" style={{ background: "rgba(120,120,128,0.04)" }}>
                    <div className="text-[10px] font-bold tracking-wider mb-2" style={{ color: "hsl(220,10%,55%)" }}>ENTRADAS</div>
                    {step.inputs.map((input, ii) => (
                      <div key={ii} className="flex items-start gap-1.5 py-1">
                        <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: "rgba(120,120,128,0.25)" }} />
                        <span className="text-xs" style={{ color: "hsl(220,15%,35%)" }}>{input}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: step.colorLight }}>
                    <div className="text-[10px] font-bold tracking-wider mb-2" style={{ color: step.color }}>SAÍDAS / ENTREGÁVEIS</div>
                    {step.outputs.map((output, oi) => (
                      <div key={oi} className="flex items-start gap-1.5 py-1">
                        <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: step.color }} />
                        <span className="text-xs" style={{ color: step.color }}>{output}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.12)" }}>
                    <div className="text-[10px] font-bold tracking-wider mb-2" style={{ color: "#FF9500" }}>REGRAS</div>
                    {step.rules.map((rule, ri) => (
                      <div key={ri} className="flex items-start gap-1.5 py-1">
                        <span className="text-xs shrink-0" style={{ color: "#FF9500" }}>⚠</span>
                        <span className="text-xs" style={{ color: "hsl(30,60%,30%)" }}>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Golden rules */}
      <div className="ios-card p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: "hsl(220,30%,10%)" }}>Regras de Ouro do Fluxo</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { rule: "Nunca pule etapas", detail: "Copy → Design → Aprovação → Publicação. Sempre nesta ordem." },
            { rule: "Aprovação = registro escrito", detail: "Toda aprovação deve ser documentada no canal oficial da equipe." },
            { rule: "Prazo de SLA respeitado", detail: "Cada etapa tem SLA máximo de 48-72h." },
            { rule: "Retrabalho custa caro", detail: "Briefing claro evita retrabalho." },
            { rule: "Comunicação com horário", detail: "Mensagens urgentes com aviso prévio. Respostas em até 4h." },
            { rule: "Erros geram aprendizado", detail: "Todo erro documentado e corrigido no processo." },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex gap-3 p-4 rounded-2xl" style={{ background: "rgba(120,120,128,0.04)" }}>
              <CheckCircle size={14} style={{ color: "#FF9500" }} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,10%)" }}>{item.rule}</div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(220,10%,50%)" }}>{item.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
