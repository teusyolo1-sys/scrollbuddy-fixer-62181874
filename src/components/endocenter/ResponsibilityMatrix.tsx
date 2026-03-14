import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEndocenter } from "@/store/endocenterStore";

type MatrixTab = "weekly" | "monthly" | "quality";

const tabLabels: Record<MatrixTab, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  quality: "Qualidade",
};

export default function ResponsibilityMatrix() {
  const {
    responsibilityRoles,
    updateResponsibilityRole,
    addResponsibilityRoleItem,
    updateResponsibilityRoleItem,
    removeResponsibilityRoleItem,
  } = useEndocenter();

  const [activeRoleId, setActiveRoleId] = useState<string>(responsibilityRoles[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<MatrixTab>("weekly");
  const [editMode, setEditMode] = useState(false);

  const role = responsibilityRoles.find((item) => item.id === activeRoleId) ?? responsibilityRoles[0];

  const completionByTab = useMemo(() => {
    if (!role) return { weekly: 0, monthly: 0, quality: 0 };

    const getRate = (items: typeof role.weekly) => {
      if (!items.length) return 0;
      return Math.round((items.filter((item) => item.done).length / items.length) * 100);
    };

    return {
      weekly: getRate(role.weekly),
      monthly: getRate(role.monthly),
      quality: getRate(role.quality),
    };
  }, [role]);

  if (!role) return null;

  const currentItems = role[activeTab];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Matriz de responsabilidades</h2>
          <p className="text-sm text-muted-foreground">Adicionar e editar checklists por área</p>
        </div>
        <button
          onClick={() => setEditMode((current) => !current)}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
            editMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {editMode ? "Finalizar edição" : "Editar matriz"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {responsibilityRoles.map((item) => {
          const average = Math.round(
            (item.weekly.filter((entry) => entry.done).length +
              item.monthly.filter((entry) => entry.done).length +
              item.quality.filter((entry) => entry.done).length) /
              Math.max(1, item.weekly.length + item.monthly.length + item.quality.length) *
              100
          );

          return (
            <button
              key={item.id}
              onClick={() => setActiveRoleId(item.id)}
              className={`ios-card p-4 text-left transition-all ${item.id === role.id ? "ring-2 ring-primary" : "opacity-95"}`}
            >
              <div className="text-sm font-semibold text-foreground">{item.role}</div>
              <div className="text-xs mt-1" style={{ color: item.color }}>
                {average}% concluído
              </div>
            </button>
          );
        })}
      </div>

      <motion.div className="ios-card overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5 border-b border-border/60 space-y-2">
          {editMode ? (
            <>
              <input
                className="ios-input w-full px-3 py-2 text-sm"
                value={role.role}
                onChange={(event) => updateResponsibilityRole(role.id, { role: event.target.value })}
              />
              <textarea
                className="ios-input w-full px-3 py-2 text-sm min-h-16"
                value={role.description}
                onChange={(event) => updateResponsibilityRole(role.id, { description: event.target.value })}
              />
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-foreground">{role.role}</h3>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </>
          )}

          <div className="p-1 rounded-xl bg-secondary/70 grid grid-cols-3 gap-1 mt-3">
            {(Object.keys(tabLabels) as MatrixTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 text-xs rounded-lg transition-colors ${
                  activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {tabLabels[tab]} ({completionByTab[tab]}%)
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-2">
          {currentItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/60 bg-background/30 p-3 space-y-2">
              {editMode ? (
                <input
                  className="ios-input w-full px-3 py-2 text-sm"
                  value={item.task}
                  onChange={(event) =>
                    updateResponsibilityRoleItem(role.id, activeTab, item.id, {
                      task: event.target.value,
                    })
                  }
                />
              ) : (
                <p className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.task}</p>
              )}

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(event) =>
                      updateResponsibilityRoleItem(role.id, activeTab, item.id, {
                        done: event.target.checked,
                      })
                    }
                  />
                  Concluído
                </label>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateResponsibilityRoleItem(role.id, activeTab, item.id, {
                        critical: !item.critical,
                      })
                    }
                    className={`text-[10px] px-2 py-1 rounded-full ${
                      item.critical ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {item.critical ? "Crítico" : "Normal"}
                  </button>

                  {editMode && (
                    <button
                      onClick={() => removeResponsibilityRoleItem(role.id, activeTab, item.id)}
                      className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => addResponsibilityRoleItem(role.id, activeTab)}
            className="inline-flex items-center gap-1 text-xs text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar item em {tabLabels[activeTab]}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
