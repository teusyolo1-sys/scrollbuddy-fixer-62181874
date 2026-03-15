import { useMemo, useState } from "react";
import { Columns3, LayoutList, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNotificationStore } from "@/store/notificationStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, type ResponsibilityItem } from "@/store/endocenterStore";
import TaskCard from "./matrix/TaskCard";
import TaskDetailModal from "./matrix/TaskDetailModal";

type MatrixTab = "weekly" | "monthly" | "quality";
type ViewMode = "kanban" | "list";

const tabLabels: Record<MatrixTab, string> = { weekly: "Semanal", monthly: "Mensal", quality: "Qualidade" };

const statusColumns = [
  { key: "pending", label: "A fazer", filter: (i: ResponsibilityItem) => !i.done && i.priority !== "urgent" },
  { key: "urgent", label: "Urgente", filter: (i: ResponsibilityItem) => !i.done && i.priority === "urgent" },
  { key: "done", label: "Concluído", filter: (i: ResponsibilityItem) => i.done },
];

export default function ResponsibilityMatrix() {
  const {
    responsibilityRoles, team,
    updateResponsibilityRole, addResponsibilityRoleItem,
    updateResponsibilityRoleItem, removeResponsibilityRoleItem,
  } = useEndocenter();

  const [activeRoleId, setActiveRoleId] = useState(responsibilityRoles[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<MatrixTab>("weekly");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<{ roleId: string; tab: MatrixTab; item: ResponsibilityItem } | null>(null);

  const role = responsibilityRoles.find((r) => r.id === activeRoleId) ?? responsibilityRoles[0];
  const teamMembers = team.map((t) => t.name);

  const completionByTab = useMemo(() => {
    if (!role) return { weekly: 0, monthly: 0, quality: 0 };
    const rate = (items: ResponsibilityItem[]) => items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0;
    return { weekly: rate(role.weekly), monthly: rate(role.monthly), quality: rate(role.quality) };
  }, [role]);

  if (!role) return null;

  const currentItems = role[activeTab].filter((item) =>
    !searchQuery || item.task.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateItem = (itemId: string, updates: Partial<ResponsibilityItem>) => {
    updateResponsibilityRoleItem(role.id, activeTab, itemId, updates);
    if (selectedItem && selectedItem.item.id === itemId) {
      setSelectedItem({ ...selectedItem, item: { ...selectedItem.item, ...updates } });
    }
    if (updates.done === true) {
      const item = currentItems.find((i) => i.id === itemId);
      toast({ title: "✅ Tarefa concluída", description: item?.task || "Tarefa marcada como feita" });
    } else if (updates.done === false) {
      toast({ title: "🔄 Tarefa reaberta", description: "Tarefa movida de volta para pendente" });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    removeResponsibilityRoleItem(role.id, activeTab, itemId);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Matriz de responsabilidades</h2>
          <p className="text-sm text-muted-foreground">Board de tarefas por área — estilo Kanban ou Lista</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-secondary/60 rounded-xl p-0.5">
            <button onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <Columns3 className="h-3.5 w-3.5" /> Kanban
            </button>
            <button onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <LayoutList className="h-3.5 w-3.5" /> Lista
            </button>
          </div>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {responsibilityRoles.map((item) => {
          const total = item.weekly.length + item.monthly.length + item.quality.length;
          const done = item.weekly.filter((e) => e.done).length + item.monthly.filter((e) => e.done).length + item.quality.filter((e) => e.done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const active = item.id === role.id;

          return (
            <motion.button
              key={item.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveRoleId(item.id)}
              className={`ios-card p-4 text-left transition-all ${active ? "ring-2" : "opacity-90 hover:opacity-100"}`}
              style={active ? { borderColor: item.color, boxShadow: `0 0 0 2px ${item.color}30` } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-semibold text-foreground">{item.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{done}/{total} tarefas</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="ios-card overflow-visible">
        {/* Tabs + search */}
        <div className="p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground">{role.role}</h3>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </div>
            <button onClick={() => addResponsibilityRoleItem(role.id, activeTab)}
              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl text-primary hover:bg-primary/10 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Nova tarefa
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-0.5 rounded-xl bg-secondary/60 grid grid-cols-3 gap-0.5 flex-1 min-w-[240px]">
              {(Object.keys(tabLabels) as MatrixTab[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {tabLabels[tab]} ({completionByTab[tab]}%)
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..."
                className="ios-input pl-8 pr-3 py-1.5 text-xs w-40" />
            </div>
          </div>
        </div>

        {/* Board area */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div key={`${activeRoleId}-${activeTab}-${viewMode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {viewMode === "kanban" ? (
                <KanbanView
                  items={currentItems}
                  roleColor={role.color}
                  onSelect={(item) => setSelectedItem({ roleId: role.id, tab: activeTab, item })}
                  onToggleDone={(id) => handleUpdateItem(id, { done: !currentItems.find((i) => i.id === id)?.done })}
                  onAdd={() => addResponsibilityRoleItem(role.id, activeTab)}
                />
              ) : (
                <ListView
                  items={currentItems}
                  roleColor={role.color}
                  onSelect={(item) => setSelectedItem({ roleId: role.id, tab: activeTab, item })}
                  onToggleDone={(id) => handleUpdateItem(id, { done: !currentItems.find((i) => i.id === id)?.done })}
                  onAdd={() => addResponsibilityRoleItem(role.id, activeTab)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <TaskDetailModal
          item={selectedItem.item}
          roleColor={role.color}
          roleName={role.role}
          teamMembers={teamMembers}
          onUpdate={(updates) => handleUpdateItem(selectedItem.item.id, updates)}
          onDelete={() => handleDeleteItem(selectedItem.item.id)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

/* ── Kanban View ── */
function KanbanView({ items, roleColor, onSelect, onToggleDone, onAdd }: {
  items: ResponsibilityItem[];
  roleColor: string;
  onSelect: (item: ResponsibilityItem) => void;
  onToggleDone: (id: string) => void;
  onAdd: () => void;
}) {
  const columns = [
    { key: "todo", label: "A fazer", items: items.filter((i) => !i.done && i.priority !== "urgent"), color: "hsl(var(--primary))" },
    { key: "urgent", label: "Urgente", items: items.filter((i) => !i.done && (i.priority === "urgent" || i.critical)), color: "#DC2626" },
    { key: "done", label: "Concluído", items: items.filter((i) => i.done), color: "#059669" },
  ];

  // Dedupe urgent from todo
  const urgentIds = new Set(columns[1].items.map((i) => i.id));
  columns[0].items = columns[0].items.filter((i) => !urgentIds.has(i.id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[200px]">
      {columns.map((col) => (
        <div key={col.key} className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold text-foreground">{col.label}</span>
              <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">{col.items.length}</span>
            </div>
            {col.key === "todo" && (
              <button onClick={onAdd} className="text-primary hover:bg-primary/10 rounded-lg p-1 transition-colors">
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-2 min-h-[100px] rounded-2xl p-2 bg-secondary/30 border border-border/30">
            <AnimatePresence>
              {col.items.map((item) => (
                <TaskCard key={item.id} item={item} roleColor={roleColor} onClick={() => onSelect(item)} onToggleDone={() => onToggleDone(item.id)} />
              ))}
            </AnimatePresence>
            {col.items.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">Sem itens</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── List View ── */
function ListView({ items, roleColor, onSelect, onToggleDone, onAdd }: {
  items: ResponsibilityItem[];
  roleColor: string;
  onSelect: (item: ResponsibilityItem) => void;
  onToggleDone: (id: string) => void;
  onAdd: () => void;
}) {
  const sorted = [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const prioOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return prioOrder[a.priority] - prioOrder[b.priority];
  });

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {sorted.map((item) => (
          <TaskCard key={item.id} item={item} roleColor={roleColor} onClick={() => onSelect(item)} onToggleDone={() => onToggleDone(item.id)} />
        ))}
      </AnimatePresence>
      <button onClick={onAdd} className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-colors">
        <Plus className="h-3.5 w-3.5" /> Nova tarefa
      </button>
    </div>
  );
}
