import { useMemo, useState } from "react";
import { Brain, ChevronDown, PenTool, Plus, Radio, Palette, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter } from "@/store/endocenterStore";

const roleIcons = {
  Estrategista: Brain,
  "Gestor de Tráfego": Radio,
  Copywriter: PenTool,
  Designer: Palette,
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
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Cronograma Mestre Mensal</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Distribuição detalhada de tarefas por profissional</p>
        </div>

        <button
          onClick={() => setEditMode((current) => !current)}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {editMode ? "Finalizar edição" : "Editar cronograma"}
        </button>
      </div>

      {/* Week selector — colorful active cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {scheduleWeeks.map((item) => {
          const selected = item.id === week.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => {
                setActiveWeekId(item.id);
                setExpandedRole(null);
              }}
              whileTap={{ scale: 0.97 }}
              className="ios-card p-4 text-left transition-all overflow-hidden relative"
              style={{
                background: selected ? item.themeColor : undefined,
                borderColor: selected ? item.themeColor : undefined,
              }}
            >
              <div className={`text-xs font-medium ${selected ? "text-white/70" : "text-muted-foreground"}`}>
                Dias {item.dates}
              </div>
              <div className={`text-sm font-bold mt-0.5 ${selected ? "text-white" : "text-foreground"}`}>
                {item.week}
              </div>
              <div className={`text-xs mt-1 ${selected ? "text-white/80" : "text-muted-foreground"}`}>
                {item.theme}
              </div>
              {selected && (
                <motion.div
                  layoutId="weekHighlight"
                  className="absolute inset-0 rounded-[inherit]"
                  style={{ border: `2.5px solid ${item.themeColor}`, pointerEvents: "none" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Week detail card */}
      <motion.div
        key={week.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 340 }}
        className="ios-card overflow-hidden"
      >
        <div className="p-5 border-b border-border/60">
          {editMode ? (
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                className="ios-input px-3 py-2 text-sm"
                value={week.week}
                onChange={(e) => updateScheduleWeek(week.id, { week: e.target.value })}
              />
              <input
                className="ios-input px-3 py-2 text-sm"
                value={week.theme}
                onChange={(e) => updateScheduleWeek(week.id, { theme: e.target.value })}
              />
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {week.week} · {week.theme}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Período: dias {week.dates} do mês
              </p>
            </div>
          )}
        </div>

        {/* Role rows */}
        <div className="divide-y divide-border/40">
          {groupedByRole.map((group) => {
            const key = `${week.id}-${group.role}`;
            const open = expandedRole === key;
            const Icon = roleIcons[group.role as keyof typeof roleIcons] ?? Brain;
            const totalHours = group.tasks.reduce((sum, task) => sum + task.hours, 0);

            return (
              <div key={key}>
                <button
                  onClick={() => setExpandedRole(open ? null : key)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: `${group.color}15` }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color: group.color }} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-foreground">{group.role}</div>
                      <div className="text-xs text-muted-foreground">{group.tasks.length} tarefas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold" style={{ color: group.color }}>
                      {totalHours}h
                    </span>
                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.span>
                  </div>
                </button>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", damping: 26, stiffness: 300 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-2">
                        {group.tasks.map((task) => (
                          <div key={task.id} className="rounded-xl bg-secondary/40 p-3 space-y-2">
                            {editMode ? (
                              <>
                                <input
                                  className="ios-input w-full px-3 py-2 text-xs"
                                  value={task.task}
                                  onChange={(e) => updateScheduleTask(week.id, task.id, { task: e.target.value })}
                                />
                                <div className="grid grid-cols-[1fr_90px_110px_28px] gap-1.5">
                                  <input
                                    className="ios-input px-2 py-1.5 text-xs"
                                    value={task.role}
                                    onChange={(e) => updateScheduleTask(week.id, task.id, { role: e.target.value })}
                                  />
                                  <input
                                    type="number"
                                    className="ios-input px-2 py-1.5 text-xs"
                                    value={task.hours}
                                    onChange={(e) => updateScheduleTask(week.id, task.id, { hours: Number(e.target.value) })}
                                  />
                                  <select
                                    className="ios-input px-2 py-1.5 text-xs"
                                    value={task.type}
                                    onChange={(e) => updateScheduleTask(week.id, task.id, { type: e.target.value })}
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
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {task.type} · {task.hours}h
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                        {editMode && (
                          <button
                            onClick={() => addScheduleTask(week.id, group.role)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Adicionar tarefa em {group.role}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Hours Summary */}
      <motion.div
        key={`summary-${week.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 340, delay: 0.05 }}
        className="ios-card p-5"
      >
        <h4 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-4">
          Resumo de horas — {week.week}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {groupedByRole.map((group) => {
            const Icon = roleIcons[group.role as keyof typeof roleIcons] ?? Brain;
            const totalHours = group.tasks.reduce((sum, t) => sum + t.hours, 0);
            // Short label for display
            const shortName = group.role === "Gestor de Tráfego" ? "Gestor" : group.role;

            return (
              <div
                key={group.role}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/30"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${group.color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: group.color }} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{shortName}</span>
                <motion.span
                  key={`${week.id}-${group.role}-hours`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="text-xl font-extrabold"
                  style={{ color: group.color }}
                >
                  {totalHours}h
                </motion.span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
