import { Brain, Radio, PenTool, Palette, CheckCircle, ArrowRight, Zap, ShieldCheck, Ban } from "lucide-react";

const roleIcons: Record<string, typeof Brain> = { "Estrategista": Brain, "Copywriter": PenTool, "Designer": Palette, "Gestor de Tráfego": Radio, "Estrategista + Gestor": Brain };

const steps = [
  { number: "01", title: "Planejamento Estratégico", owner: "Estrategista", color: "#059669", colorLight: "#ECFDF5", duration: "Dia 25 do mês anterior",
    inputs: ["Metas mensais da clínica", "Dados de performance do mês anterior", "Datas comemorativas e sazonalidade", "Feedback da diretoria"],
    outputs: ["Calendário editorial completo", "Briefings individuais por função", "Metas de KPIs do mês", "Prioridade de campanhas"],
    rules: ["Briefing deve chegar à equipe até a 2ª-feira da 1ª semana", "Toda mudança estratégica mid-month deve ser comunicada com 48h de antecedência", "Aprovação final de todo conteúdo é responsabilidade exclusiva da estrategista"],
  },
  { number: "02", title: "Produção de Copy", owner: "Copywriter", color: "#7C3AED", colorLight: "#F5F3FF", duration: "48h após receber briefing",
    inputs: ["Briefing detalhado da estrategista", "Histórico de copies de alta performance", "Tom de voz da Endocenter", "Objetivos da campanha"],
    outputs: ["Textos de anúncios (Meta + Google)", "Legendas de posts e stories", "Scripts de vídeo", "Mensagens de WhatsApp"],
    rules: ["Copy enviada para revisão da estrategista antes de ir para o designer", "Copys de anúncios entregues até 3ª-feira de cada semana", "Máximo 2 rodadas de revisão por copy"],
  },
  { number: "03", title: "Criação Visual", owner: "Designer", color: "#DC2626", colorLight: "#FFF1F2", duration: "48-72h após aprovação da copy",
    inputs: ["Copy aprovada pela estrategista", "Briefing de design", "Guia de marca Endocenter", "Referências visuais aprovadas"],
    outputs: ["Artes para feed e stories", "Criativos de anúncios", "Banners e materiais especiais", "Carrosséis e reels"],
    rules: ["Designer não inicia criação sem copy aprovada", "Arte enviada para o gestor de tráfego só após aprovação visual da estrategista", "Ajustes: prazo máximo de 24h para correção"],
  },
  { number: "04", title: "Aprovação Final", owner: "Estrategista", color: "#0D9488", colorLight: "#F0FDFA", duration: "24h após receber peças",
    inputs: ["Criativos finalizados pelo designer", "Copy revisada", "Contexto de campanha"],
    outputs: ["Aprovação documentada no grupo", "Peça liberada para publicação/tráfego", "Feedback construtivo (se houver)"],
    rules: ["Aprovação deve ser registrada por escrito no canal oficial", "Prazo de resposta: até 24h", "Se não houver resposta em 24h, follow-up obrigatório"],
  },
  { number: "05", title: "Publicação & Tráfego", owner: "Gestor de Tráfego", color: "#1E6FD9", colorLight: "#EFF6FF", duration: "Conforme calendário editorial",
    inputs: ["Criativos aprovados", "Configurações de campanha", "Orçamento definido", "Públicos-alvo configurados"],
    outputs: ["Campanhas ativas (Meta + Google)", "Posts publicados no feed", "Relatório semanal de performance", "Alertas de anomalias"],
    rules: ["Nenhum anúncio entra no ar sem aprovação prévia da estrategista", "Otimizações: diariamente (mínimo seg, qua e sex)", "Anomalia deve ser reportada em até 2h"],
  },
  { number: "06", title: "Análise & Feedback Loop", owner: "Estrategista + Gestor", color: "#EA580C", colorLight: "#FFF7ED", duration: "Sexta-feira de cada semana",
    inputs: ["Relatório semanal do gestor", "Métricas de engajamento", "Dados de conversão e leads", "Feedbacks da clínica"],
    outputs: ["Ajustes na estratégia da próxima semana", "Briefings atualizados", "Relatório mensal (na semana 4)", "Plano de ação para melhorias"],
    rules: ["Relatório semanal: toda sexta até 18h", "Reunião semanal: 30 min, sempre na segunda-feira", "Abaixo da meta por 2 semanas: acionar plano de crise"],
  },
];

export default function WorkflowDiagram() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#0A1628" }}>Fluxo de Trabalho Integrado</h2>
        <p className="text-sm text-slate-500">Processo de aprovação end-to-end para evitar retrabalho e garantir qualidade</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">LINHA DO FLUXO — PROCESSO PADRÃO ENDOCENTER</div>
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
          {steps.map((step, i) => {
            const Icon = roleIcons[step.owner] || Brain;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: step.colorLight }}>
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 text-center whitespace-nowrap">{step.owner.split(" ")[0]}</div>
                  <div className="text-[9px] text-slate-400 text-center whitespace-nowrap">{step.title.split(" ")[0]}</div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex items-center"><div className="w-4 h-0.5 bg-slate-200" /><ArrowRight size={12} className="text-slate-300" /></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-[10px] text-slate-400 justify-center">
          <span className="flex items-center gap-1"><Zap size={10} /> SLA máximo: 48-72h por etapa</span>
          <span className="flex items-center gap-1"><ShieldCheck size={10} /> Aprovação documentada obrigatória</span>
          <span className="flex items-center gap-1"><Ban size={10} /> Etapas não podem ser puladas</span>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = roleIcons[step.owner] || Brain;
          return (
            <div key={step.number} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ borderLeft: `4px solid ${step.color}` }}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: step.colorLight, color: step.color }}>{step.number}</span>
                  <Icon size={20} style={{ color: step.color }} />
                  <div>
                    <div className="font-bold text-slate-800">{step.title}</div>
                    <div className="text-xs text-slate-500">Responsável: {step.owner}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[10px] text-slate-400">Prazo</div>
                    <div className="text-xs font-semibold" style={{ color: step.color }}>{step.duration}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2"><span className="text-[10px] font-bold text-slate-400 tracking-wider">ENTRADAS</span></div>
                    {step.inputs.map((input, ii) => (
                      <div key={ii} className="flex items-start gap-1.5 py-1">
                        <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <span className="text-xs text-slate-600">{input}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: step.colorLight }}>
                    <div className="flex items-center gap-1.5 mb-2"><span className="text-[10px] font-bold tracking-wider" style={{ color: step.color }}>SAÍDAS / ENTREGÁVEIS</span></div>
                    {step.outputs.map((output, oi) => (
                      <div key={oi} className="flex items-start gap-1.5 py-1">
                        <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: step.color }} />
                        <span className="text-xs" style={{ color: step.color }}>{output}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-2"><span className="text-[10px] font-bold text-amber-600 tracking-wider">REGRAS DA ETAPA</span></div>
                    {step.rules.map((rule, ri) => (
                      <div key={ri} className="flex items-start gap-1.5 py-1">
                        <span className="text-amber-500 text-xs shrink-0">⚠</span>
                        <span className="text-xs text-amber-800">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: "#0A1628" }}>Regras de Ouro do Fluxo</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { rule: "Nunca pule etapas", detail: "Copy → Design → Aprovação → Publicação. Sempre nesta ordem." },
            { rule: "Aprovação = registro escrito", detail: "Toda aprovação deve ser documentada no canal oficial da equipe." },
            { rule: "Prazo de SLA respeitado", detail: "Cada etapa tem SLA máximo de 48-72h. Sem resposta = follow-up obrigatório." },
            { rule: "Retrabalho custa caro", detail: "Briefing claro evita retrabalho. Dúvidas sempre tiradas antes de começar." },
            { rule: "Comunicação assíncrona com horário", detail: "Mensagens urgentes com aviso prévio. Respostas em até 4h no horário comercial." },
            { rule: "Erros geram aprendizado", detail: "Todo erro documentado e corrigido no processo. Sem culpar pessoas, melhorar fluxos." },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-slate-800">{item.rule}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
