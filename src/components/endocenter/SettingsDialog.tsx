import { useState, useEffect } from "react";
import { Settings, X, Plus, Trash2, Upload, User, Building2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, TeamMember } from "@/store/endocenterStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const { company, setCompany, team, setTeam, updateMember } = useEndocenter();
  const [tab, setTab] = useState<"company" | "team">("company");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState(company);

  // Re-sync when dialog opens
  useEffect(() => {
    if (open) setCompanyForm(company);
  }, [open, company]);

  // Save company in real-time
  useEffect(() => {
    if (open) setCompany(companyForm);
  }, [companyForm]);

  const handlePhotoUpload = (memberId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => updateMember(memberId, { photoUrl: ev.target?.result as string });
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addMember = () => {
    const newMember: TeamMember = {
      id: `member_${Date.now()}`, role: "Nova Função", name: "Novo Membro", photoUrl: "",
      color: "#64748B", colorLight: "#F1F5F9", colorBorder: "#CBD5E1",
      remuneration: 0, hours: 0, tasks: [], kpis: [], status: "Ativo",
    };
    setTeam([...team, newMember]);
    setEditingMember(newMember.id);
  };

  const removeMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id));
    if (editingMember === id) setEditingMember(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="w-full sm:max-w-xl max-h-[92vh] overflow-hidden flex flex-col"
            style={{
              borderRadius: "var(--ios-radius-xl) var(--ios-radius-xl) 0 0",
              background: "var(--ios-glass-ultra)",
              backdropFilter: "blur(60px)",
              boxShadow: "var(--ios-shadow-xl)",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (iOS sheet style) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: "hsl(220, 30%, 10%)" }}>Configurações</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(120,120,128,0.12)" }}>
                <X size={16} style={{ color: "hsl(220,10%,40%)" }} />
              </button>
            </div>

            {/* Segmented Control (iOS style) */}
            <div className="mx-6 mb-4 p-1 rounded-xl flex" style={{ background: "rgba(120,120,128,0.1)" }}>
              {[
                { id: "company" as const, label: "Empresa", icon: Building2 },
                { id: "team" as const, label: "Funcionários", icon: Users },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: tab === t.id ? "white" : "transparent",
                    color: tab === t.id ? "hsl(220,30%,10%)" : "hsl(220,10%,45%)",
                    boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <AnimatePresence mode="wait">
                {tab === "company" && (
                  <motion.div key="company" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
                    {[
                      { label: "Nome da Empresa", value: companyForm.name, key: "name" },
                      { label: "Subtítulo", value: companyForm.subtitle, key: "subtitle" },
                      { label: "Período / Mês", value: companyForm.month, key: "month" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: "hsl(220,10%,45%)" }}>{field.label}</label>
                        <input
                          className="w-full px-4 py-3 rounded-xl text-sm ios-input outline-none"
                          value={field.value}
                          onChange={(e) => setCompanyForm({ ...companyForm, [field.key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                {tab === "team" && (
                  <motion.div key="team" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-3">
                    {team.map((member) => {
                      const isEditing = editingMember === member.id;
                      return (
                        <motion.div key={member.id} layout className="overflow-hidden" style={{ borderRadius: "var(--ios-radius)", background: "rgba(120,120,128,0.06)", border: "1px solid rgba(120,120,128,0.08)" }}>
                          <div
                            className="flex items-center gap-3 p-3.5 cursor-pointer transition-colors"
                            onClick={() => setEditingMember(isEditing ? null : member.id)}
                          >
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${member.color}15` }}>
                                <User size={18} style={{ color: member.color }} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate" style={{ color: "hsl(220,30%,10%)" }}>{member.name}</div>
                              <div className="text-xs" style={{ color: member.color }}>{member.role}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${member.color}12`, color: member.color }}>
                                R$ {member.remuneration.toLocaleString("pt-BR")}
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); removeMember(member.id); }} className="p-1 rounded-full transition-colors hover:bg-red-50">
                                <Trash2 size={13} className="text-slate-300 hover:text-red-500" />
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isEditing && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-4 border-t" style={{ borderColor: "rgba(120,120,128,0.1)" }}>
                                  {/* Photo + Name */}
                                  <div className="flex gap-4">
                                    <div className="flex flex-col items-center gap-2">
                                      {member.photoUrl ? (
                                        <img src={member.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                                      ) : (
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(120,120,128,0.1)" }}>
                                          <User size={24} className="text-slate-400" />
                                        </div>
                                      )}
                                      <button onClick={() => handlePhotoUpload(member.id)}
                                        className="text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                                        style={{ background: "hsl(215 90% 55% / 0.1)", color: "hsl(215,90%,55%)" }}>
                                        <Upload size={10} /> Foto
                                      </button>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <div>
                                        <label className="text-[10px] font-medium" style={{ color: "hsl(220,10%,45%)" }}>Nome</label>
                                        <input className="w-full px-3 py-2 rounded-xl text-sm ios-input outline-none" value={member.name}
                                          onChange={(e) => updateMember(member.id, { name: e.target.value })} />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-medium" style={{ color: "hsl(220,10%,45%)" }}>Função</label>
                                        <input className="w-full px-3 py-2 rounded-xl text-sm ios-input outline-none" value={member.role}
                                          onChange={(e) => updateMember(member.id, { role: e.target.value })} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Numbers */}
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[10px] font-medium" style={{ color: "hsl(220,10%,45%)" }}>Remuneração (R$)</label>
                                      <input type="number" className="w-full px-3 py-2 rounded-xl text-sm ios-input outline-none" value={member.remuneration}
                                        onChange={(e) => updateMember(member.id, { remuneration: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium" style={{ color: "hsl(220,10%,45%)" }}>Horas / mês</label>
                                      <input type="number" className="w-full px-3 py-2 rounded-xl text-sm ios-input outline-none" value={member.hours}
                                        onChange={(e) => updateMember(member.id, { hours: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium" style={{ color: "hsl(220,10%,45%)" }}>Cor</label>
                                      <div className="flex gap-1.5 items-center">
                                        <input type="color" className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" value={member.color}
                                          onChange={(e) => updateMember(member.id, { color: e.target.value })} />
                                        <input className="flex-1 px-2 py-2 rounded-xl text-xs ios-input outline-none" value={member.color}
                                          onChange={(e) => updateMember(member.id, { color: e.target.value })} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Calculated value display */}
                                  <div className="p-3 rounded-xl" style={{ background: `${member.color}08`, border: `1px solid ${member.color}15` }}>
                                    <div className="text-[10px] font-medium mb-1" style={{ color: "hsl(220,10%,45%)" }}>Valor calculado</div>
                                    <div className="text-sm font-semibold" style={{ color: member.color }}>
                                      R$ {member.hours > 0 ? (member.remuneration / member.hours).toFixed(2).replace(".", ",") : "0,00"} / hora
                                    </div>
                                    <div className="text-[10px] mt-0.5" style={{ color: "hsl(220,10%,55%)" }}>
                                      Remuneração (R$ {member.remuneration.toLocaleString("pt-BR")}) ÷ Horas ({member.hours}h) = Valor/hora
                                    </div>
                                  </div>

                                  {/* Status */}
                                  <div>
                                    <label className="text-[10px] font-medium" style={{ color: "hsl(220,10%,45%)" }}>Status</label>
                                    <select className="w-full px-3 py-2 rounded-xl text-sm ios-input outline-none appearance-none" value={member.status}
                                      onChange={(e) => updateMember(member.id, { status: e.target.value })}>
                                      <option>Ativo</option><option>Inativo</option><option>Férias</option>
                                    </select>
                                  </div>

                                  {/* Tasks */}
                                  <div>
                                    <label className="text-[10px] font-medium block mb-1.5" style={{ color: "hsl(220,10%,45%)" }}>Tarefas Principais</label>
                                    {member.tasks.map((t, i) => (
                                      <div key={i} className="flex gap-1.5 mb-1.5">
                                        <input className="flex-1 px-3 py-1.5 rounded-lg text-xs ios-input outline-none" value={t}
                                          onChange={(e) => { const n = [...member.tasks]; n[i] = e.target.value; updateMember(member.id, { tasks: n }); }} />
                                        <button onClick={() => updateMember(member.id, { tasks: member.tasks.filter((_, ti) => ti !== i) })} className="p-1 text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                                      </div>
                                    ))}
                                    <button onClick={() => updateMember(member.id, { tasks: [...member.tasks, ""] })}
                                      className="text-[11px] font-medium flex items-center gap-1 mt-1" style={{ color: "hsl(215,90%,55%)" }}>
                                      <Plus size={11} /> Adicionar tarefa
                                    </button>
                                  </div>

                                  {/* KPIs */}
                                  <div>
                                    <label className="text-[10px] font-medium block mb-1.5" style={{ color: "hsl(220,10%,45%)" }}>KPIs</label>
                                    {member.kpis.map((k, i) => (
                                      <div key={i} className="flex gap-1.5 mb-1.5">
                                        <input className="flex-1 px-3 py-1.5 rounded-lg text-xs ios-input outline-none" value={k}
                                          onChange={(e) => { const n = [...member.kpis]; n[i] = e.target.value; updateMember(member.id, { kpis: n }); }} />
                                        <button onClick={() => updateMember(member.id, { kpis: member.kpis.filter((_, ki) => ki !== i) })} className="p-1 text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                                      </div>
                                    ))}
                                    <button onClick={() => updateMember(member.id, { kpis: [...member.kpis, ""] })}
                                      className="text-[11px] font-medium flex items-center gap-1 mt-1" style={{ color: "hsl(215,90%,55%)" }}>
                                      <Plus size={11} /> Adicionar KPI
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}

                    <motion.button onClick={addMember} whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      style={{ border: "2px dashed rgba(120,120,128,0.2)", color: "hsl(220,10%,50%)" }}>
                      <Plus size={16} /> Adicionar Funcionário
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
