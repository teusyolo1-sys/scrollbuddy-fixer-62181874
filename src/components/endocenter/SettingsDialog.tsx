import { useState } from "react";
import { Settings, X, Plus, Trash2, Upload, User } from "lucide-react";
import { useEndocenter, TeamMember } from "@/store/endocenterStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const { company, setCompany, team, setTeam, updateMember } = useEndocenter();
  const [tab, setTab] = useState<"company" | "team">("company");
  const [editingMember, setEditingMember] = useState<string | null>(null);

  // Local company form
  const [companyForm, setCompanyForm] = useState(company);

  // Sync when opening
  const handleClose = () => {
    setCompany(companyForm);
    onClose();
  };

  const handlePhotoUpload = (memberId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          updateMember(memberId, { photoUrl: ev.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addMember = () => {
    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      role: "Nova Função",
      name: "Novo Membro",
      photoUrl: "",
      color: "#64748B",
      colorLight: "#F1F5F9",
      colorBorder: "#CBD5E1",
      remuneration: 0,
      hours: 0,
      tasks: [],
      kpis: [],
      status: "Ativo",
    };
    setTeam([...team, newMember]);
    setEditingMember(newMember.id);
  };

  const removeMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id));
    if (editingMember === id) setEditingMember(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ backgroundColor: "#0A1628" }}>
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Configurações</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[
            { id: "company" as const, label: "Empresa" },
            { id: "team" as const, label: "Funcionários" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 px-4 py-3 text-sm font-semibold transition-all"
              style={{
                color: tab === t.id ? "#1E6FD9" : "#94A3B8",
                borderBottom: `2px solid ${tab === t.id ? "#1E6FD9" : "transparent"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "company" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome da Empresa</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Subtítulo</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={companyForm.subtitle}
                  onChange={(e) => setCompanyForm({ ...companyForm, subtitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Período / Mês</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={companyForm.month}
                  onChange={(e) => setCompanyForm({ ...companyForm, month: e.target.value })}
                />
              </div>
            </div>
          )}

          {tab === "team" && (
            <div className="space-y-4">
              {team.map((member) => {
                const isEditing = editingMember === member.id;
                return (
                  <div key={member.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Member header */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setEditingMember(isEditing ? null : member.id)}
                      style={{ borderLeft: `4px solid ${member.color}` }}
                    >
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: member.colorLight }}>
                          <User size={18} style={{ color: member.color }} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-sm text-slate-800">{member.name}</div>
                        <div className="text-xs" style={{ color: member.color }}>{member.role}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeMember(member.id); }}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Edit form */}
                    {isEditing && (
                      <div className="p-4 bg-slate-50 space-y-3 border-t border-slate-100">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-2">
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                            ) : (
                              <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-slate-200">
                                <User size={30} className="text-slate-400" />
                              </div>
                            )}
                            <button
                              onClick={() => handlePhotoUpload(member.id)}
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-600 flex items-center gap-1"
                            >
                              <Upload size={10} /> Foto
                            </button>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Nome</label>
                              <input className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm" value={member.name}
                                onChange={(e) => updateMember(member.id, { name: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Função</label>
                              <input className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm" value={member.role}
                                onChange={(e) => updateMember(member.id, { role: e.target.value })} />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Remuneração (R$)</label>
                            <input type="number" className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm" value={member.remuneration}
                              onChange={(e) => updateMember(member.id, { remuneration: Number(e.target.value) })} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Horas / mês</label>
                            <input type="number" className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm" value={member.hours}
                              onChange={(e) => updateMember(member.id, { hours: Number(e.target.value) })} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Cor (hex)</label>
                            <div className="flex gap-1">
                              <input type="color" className="w-8 h-8 rounded cursor-pointer border-0" value={member.color}
                                onChange={(e) => updateMember(member.id, { color: e.target.value })} />
                              <input className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs" value={member.color}
                                onChange={(e) => updateMember(member.id, { color: e.target.value })} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400">Status</label>
                          <select className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm" value={member.status}
                            onChange={(e) => updateMember(member.id, { status: e.target.value })}>
                            <option>Ativo</option>
                            <option>Inativo</option>
                            <option>Férias</option>
                          </select>
                        </div>

                        {/* Tasks */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 mb-1 block">Tarefas Principais</label>
                          {member.tasks.map((t, i) => (
                            <div key={i} className="flex gap-1 mb-1">
                              <input className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs" value={t}
                                onChange={(e) => {
                                  const newTasks = [...member.tasks];
                                  newTasks[i] = e.target.value;
                                  updateMember(member.id, { tasks: newTasks });
                                }} />
                              <button onClick={() => updateMember(member.id, { tasks: member.tasks.filter((_, ti) => ti !== i) })}
                                className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                            </div>
                          ))}
                          <button onClick={() => updateMember(member.id, { tasks: [...member.tasks, ""] })}
                            className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
                            <Plus size={10} /> Adicionar tarefa
                          </button>
                        </div>

                        {/* KPIs */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 mb-1 block">KPIs</label>
                          {member.kpis.map((k, i) => (
                            <div key={i} className="flex gap-1 mb-1">
                              <input className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs" value={k}
                                onChange={(e) => {
                                  const newKpis = [...member.kpis];
                                  newKpis[i] = e.target.value;
                                  updateMember(member.id, { kpis: newKpis });
                                }} />
                              <button onClick={() => updateMember(member.id, { kpis: member.kpis.filter((_, ki) => ki !== i) })}
                                className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                            </div>
                          ))}
                          <button onClick={() => updateMember(member.id, { kpis: [...member.kpis, ""] })}
                            className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
                            <Plus size={10} /> Adicionar KPI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button onClick={addMember}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> Adicionar Funcionário
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
