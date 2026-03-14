import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Upload, User } from "lucide-react";
import { useEndocenter } from "@/store/endocenterStore";

export default function TeamSettingsTab() {
  const { team, updateMember, addMember, removeMember } = useEndocenter();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const handlePhotoUpload = (memberId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        updateMember(memberId, { photoUrl: (readerEvent.target?.result as string) ?? "" });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Funcionários e cases</h3>
        <button
          onClick={addMember}
          className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>

      {team.map((member) => {
        const isOpen = editingMemberId === member.id;

        return (
          <div key={member.id} className="ios-card overflow-hidden">
            <button
              onClick={() => setEditingMemberId(isOpen ? null : member.id)}
              className="w-full px-4 py-3 flex items-center gap-3"
            >
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-foreground">{member.name}</div>
                <div className="text-xs" style={{ color: member.color }}>{member.role}</div>
              </div>

              <span className="text-[11px] rounded-full px-2 py-1 bg-secondary text-secondary-foreground">{member.status}</span>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    className="ios-input px-3 py-2 text-sm"
                    value={member.name}
                    onChange={(event) => updateMember(member.id, { name: event.target.value })}
                    placeholder="Nome"
                  />
                  <input
                    className="ios-input px-3 py-2 text-sm"
                    value={member.role}
                    onChange={(event) => updateMember(member.id, { role: event.target.value })}
                    placeholder="Função"
                  />
                </div>

                <input
                  className="ios-input w-full px-3 py-2 text-sm"
                  value={member.specialty}
                  onChange={(event) => updateMember(member.id, { specialty: event.target.value })}
                  placeholder="Especialidade"
                />

                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    className="ios-input px-3 py-2 text-sm"
                    value={member.remuneration}
                    onChange={(event) => updateMember(member.id, { remuneration: Number(event.target.value) })}
                    placeholder="Remuneração"
                  />
                  <input
                    type="number"
                    className="ios-input px-3 py-2 text-sm"
                    value={member.hours}
                    onChange={(event) => updateMember(member.id, { hours: Number(event.target.value) })}
                    placeholder="Horas / mês"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={member.color}
                      onChange={(event) => updateMember(member.id, { color: event.target.value })}
                      className="h-9 w-10 rounded-lg border border-border bg-transparent"
                    />
                    <input
                      className="ios-input flex-1 px-3 py-2 text-sm"
                      value={member.color}
                      onChange={(event) => updateMember(member.id, { color: event.target.value })}
                      placeholder="#000000"
                    />
                  </div>

                  <select
                    className="ios-input px-3 py-2 text-sm"
                    value={member.status}
                    onChange={(event) => updateMember(member.id, { status: event.target.value })}
                  >
                    <option>Ativo</option>
                    <option>Inativo</option>
                    <option>Férias</option>
                  </select>
                </div>

                <textarea
                  className="ios-input w-full px-3 py-2 text-sm min-h-20"
                  value={member.caseNotes}
                  onChange={(event) => updateMember(member.id, { caseNotes: event.target.value })}
                  placeholder="Case do membro: escopo, entregas e histórico"
                />

                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground">Tarefas</label>
                    {member.tasks.map((task, index) => (
                      <div key={`${member.id}-task-${index}`} className="flex items-center gap-1.5">
                        <input
                          className="ios-input flex-1 px-3 py-1.5 text-xs"
                          value={task}
                          onChange={(event) => {
                            const next = [...member.tasks];
                            next[index] = event.target.value;
                            updateMember(member.id, { tasks: next });
                          }}
                        />
                        <button
                          onClick={() => updateMember(member.id, { tasks: member.tasks.filter((_, current) => current !== index) })}
                          className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateMember(member.id, { tasks: [...member.tasks, ""] })}
                      className="text-[11px] text-primary"
                    >
                      + adicionar tarefa
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground">KPIs</label>
                    {member.kpis.map((kpi, index) => (
                      <div key={`${member.id}-kpi-${index}`} className="flex items-center gap-1.5">
                        <input
                          className="ios-input flex-1 px-3 py-1.5 text-xs"
                          value={kpi}
                          onChange={(event) => {
                            const next = [...member.kpis];
                            next[index] = event.target.value;
                            updateMember(member.id, { kpis: next });
                          }}
                        />
                        <button
                          onClick={() => updateMember(member.id, { kpis: member.kpis.filter((_, current) => current !== index) })}
                          className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateMember(member.id, { kpis: [...member.kpis, ""] })}
                      className="text-[11px] text-primary"
                    >
                      + adicionar KPI
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handlePhotoUpload(member.id)}
                    className="inline-flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 bg-primary/10 text-primary"
                  >
                    <Upload className="h-3 w-3" />
                    Trocar foto
                  </button>

                  <button
                    onClick={() => {
                      removeMember(member.id);
                      setEditingMemberId((current) => (current === member.id ? null : current));
                    }}
                    className="inline-flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
