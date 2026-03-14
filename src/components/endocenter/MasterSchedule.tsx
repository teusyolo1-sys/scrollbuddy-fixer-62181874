import { useMemo, useState } from "react";
import { Brain, Calendar, PenTool, Plus, Radio, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEndocenter } from "@/store/endocenterStore";

const roleIcons = {
  Estrategista: Brain,
  "Gestor de Tráfego": Radio,
  Copywriter: PenTool,
  Designer: Calendar,
} as const;

const typeOptions = ["entregável", "operação", "revisão", "análise", "planejamento", "reunião"];

export default function MasterSchedule() {
  const { scheduleWeeks, updateScheduleWeek, addScheduleTask, updateScheduleTask, removeScheduleTask } = useEndocenter();
  const [activeWeekId, setActiveWeekId] = useState<string>(scheduleWeeks[0]?.id ?? "");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const week = scheduleWeeks.find((item) => item.id === activeWeekId) ?? scheduleWeeks[0];

  const groupedByRole = useMemo(() => {
    if (!week) return [] as Array<{ role: string; color: string; tasks: typeof week.tasks }>;

    const roleMap = new Map<string, { role: string; color: string; tasks: typeof week.tasks }>();

    for (const task of week.tasks) {
      if (!roleMap.has(task.role)) {
        roleMap.set(task.role, { role: task.role, color: task.color, tasks: [] });
      }
      roleMap.get(task.role)?.tasks.push(task);
    }

    return Array.from(roleMap.values());
  }, [week]);

  if (!week) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Cronograma mestre</h2>
          <p className="text-sm text-muted-foreground">Agora com edição e inclusão de tarefas por função</p>
        </div>

        <button
          onClick={() => setEditMode((current) => !current)}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
            editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {editMode ? "Finalizar edição" : "Editar cronograma"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {scheduleWeeks.map((item) => {
          const selected = item.id === week.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveWeekId(item.id)}
              className={`ios-card p-4 text-left transition-all ${selected ? "ring-2 ring-primary" : "opacity-95"}`}
            >
              <div className="text-xs text-muted-foreground">{item.dates}</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">{item.week}</div>
              <div className="text-xs mt-1" style={{ color: item.themeColor }}>
                {item.theme}
              </div>
            </button>
          );
        })}
      </div>

      <div className="ios-card overflow-hidden">
        <div className="p-5 border-b border-border/60 space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              className="ios-input px-3 py-2 text-sm"
              value={week.week}
              onChange={(event) => updateScheduleWeek(week.id, { week: event.target.value })}
            />
            <input
              className="ios-input px-3 py-2 text-sm"
              value={week.theme}
              onChange={(event) => updateScheduleWeek(week.id, { theme: event.target.value })}
            />
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {groupedByRole.map((group, groupIndex) => {
            const key = `${week.id}-${group.role}`;
            const open = expandedRole === key;
            const Icon = roleIcons[group.role as keyof typeof roleIcons] ?? Brain;
            const totalHours = group.tasks.reduce((sum, task) => sum + task.hours, 0);

            return (
              <div key={key}>
                <button
                  onClick={() => setExpandedRole(open ? null : key)}
                  className="w-full px-5 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className="h-4 w-4" style={{ color: group.color }} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-foreground">{group.role}</div>
                      <div className="text-xs text-muted-foreground">{group.tasks.length} tarefas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: group.color }}>
                      {totalHours}h
                    </div>
                    <div className="text-[11px] text-muted-foreground">estimadas</div>
                  </div>
                </button>

                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-4"
                  >
                    <div className="space-y-2">
                      {group.tasks.map((task) => (
                        <div key={task.id} className="rounded-xl bg-secondary/40 p-2.5 space-y-2">
                          {editMode ? (
                            <>
                              <input
                                className="ios-input w-full px-3 py-2 text-xs"
                                value={task.task}
                                onChange={(event) => updateScheduleTask(week.id, task.id, { task: event.target.value })}
                              />
                              <div className="grid grid-cols-[1fr_90px_110px_28px] gap-1.5">
                                <input
                                  className="ios-input px-2 py-1.5 text-xs"
                                  value={task.role}
                                  onChange={(event) => updateScheduleTask(week.id, task.id, { role: event.target.value })}
                                />
                                <input
                                  type="number"
                                  className="ios-input px-2 py-1.5 text-xs"
                                  value={task.hours}
                                  onChange={(event) =>
                                    updateScheduleTask(week.id, task.id, {
                                      hours: Number(event.target.value),
                                    })
                                  }
                                />
                                <select
                                  className="ios-input px-2 py-1.5 text-xs"
                                  value={task.type}
                                  onChange={(event) => updateScheduleTask(week.id, task.id, { type: event.target.value })}
                                >
                                  {typeOptions.map((type) => (
                                    <option key={type}>{type}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => removeScheduleTask(week.id, task.id)}
                                  className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm text-foreground">{task.task}</p>
                              <span className="text-xs text-muted-foreground">
                                {task.type} · {task.hours}h
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      {editMode && (
                        <button
                          onClick={() => addScheduleTask(week.id, group.role)}
                          className="inline-flex items-center gap-1 text-xs text-primary"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar tarefa em {group.role}
                        </button>
                      )}
                    </div>

                    {groupIndex === groupedByRole.length - 1 && (
                      <p className="text-[11px] text-muted-foreground mt-3">
                        Se uma tarefa estiver abrindo junto com outra, agora o painel usa chave única por função.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
