import { useEffect, useMemo, useRef, useState } from "react";
import { Columns3, LayoutList, Plus, Search, ChevronLeft, ChevronRight, Trash2, Pencil, MoreVertical, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNotificationStore } from "@/store/notificationStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEndocenter, type ResponsibilityItem } from "@/store/endocenterStore";
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./matrix/TaskCard";
import TaskDetailModal from "./matrix/TaskDetailModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useTeamRole } from "@/hooks/useTeamRole";
import { useAuth } from "@/hooks/useAuth";

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
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { isAdmin } = useUserRole();
  const { teamRole, loading: teamRoleLoading } = useTeamRole();
  const { user } = useAuth();

  // Filter roles: admin sees all, others see only their assigned role
  const visibleRoles = useMemo(() => {
    if (isAdmin || !teamRole) return responsibilityRoles;
    return responsibilityRoles.filter((r) => r.role === teamRole);
  }, [responsibilityRoles, isAdmin, teamRole]);

  // Collect tasks from OTHER roles where this user is mentioned/assigned
  const mentionedTasksFromOtherRoles = useMemo(() => {
    if (isAdmin || !teamRole || !user) return [];
    const userDisplayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
    const otherRoles = responsibilityRoles.filter((r) => r.role !== teamRole);
    const results: { roleId: string; roleName: string; roleColor: string; tab: "weekly" | "monthly" | "quality"; item: ResponsibilityItem }[] = [];
    for (const r of otherRoles) {
      for (const tab of ["weekly", "monthly", "quality"] as const) {
        for (const item of r[tab]) {
          const isAssigned = item.assignees.some(
            (a) => a.toLowerCase() === userDisplayName.toLowerCase()
          );
          if (isAssigned) {
            results.push({ roleId: r.id, roleName: r.role, roleColor: r.color, tab, item });
          }
        }
      }
    }
    return results;
  }, [responsibilityRoles, isAdmin, teamRole, user]);

  const [activeRoleId, setActiveRoleId] = useState(visibleRoles[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<MatrixTab>("weekly");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<{ roleId: string; tab: MatrixTab; item: ResponsibilityItem } | null>(null);

  // Keep activeRoleId valid
  useEffect(() => {
    if (visibleRoles.length > 0 && !visibleRoles.find((r) => r.id === activeRoleId)) {
      setActiveRoleId(visibleRoles[0].id);
    }
  }, [visibleRoles, activeRoleId]);

  const role = visibleRoles.find((r) => r.id === activeRoleId) ?? visibleRoles[0];
  const teamMembers = team.map((t) => t.name);

  const completionByTab = useMemo(() => {
    if (!role) return { weekly: 0, monthly: 0, quality: 0 };
    const rate = (items: ResponsibilityItem[]) => items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0;
    return { weekly: rate(role.weekly), monthly: rate(role.monthly), quality: rate(role.quality) };
  }, [role]);

  if (teamRoleLoading) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>;
  }

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
      const taskName = item?.task || "Tarefa";
      toast({ title: "✅ Tarefa concluída", description: taskName });
      addNotification({ title: `${role.role} concluiu tarefa`, description: taskName, icon: "check", meta: { roleId: role.id, tab: activeTab, itemId } });
    } else if (updates.done === false) {
      const item = currentItems.find((i) => i.id === itemId);
      toast({ title: "🔄 Tarefa reaberta", description: "Movida para pendente" });
      addNotification({ title: `${role.role} reabriu tarefa`, description: item?.task || "Tarefa", icon: "move", meta: { roleId: role.id, tab: activeTab, itemId } });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const item = currentItems.find((i) => i.id === itemId);
    removeResponsibilityRoleItem(role.id, activeTab, itemId);
    addNotification({ title: `${role.role} deletou tarefa`, description: item?.task || "Tarefa removida", icon: "delete", meta: { roleId: role.id, tab: activeTab, itemId } });
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
      <div className={`grid gap-3 ${visibleRoles.length === 1 ? "grid-cols-1 max-w-sm" : "grid-cols-2 lg:grid-cols-4"}`}>
        {visibleRoles.map((item) => {
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

      {/* Mentioned tasks from other roles (cross-role visibility) */}
      {mentionedTasksFromOtherRoles.length > 0 && (
        <div className="ios-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">📌 Tarefas compartilhadas com você</h3>
          <p className="text-xs text-muted-foreground">Tarefas de outras áreas onde você foi atribuído</p>
          <div className="grid gap-2">
            {mentionedTasksFromOtherRoles.map((mt) => (
              <button
                key={`${mt.roleId}-${mt.tab}-${mt.item.id}`}
                onClick={() => setSelectedItem({ roleId: mt.roleId, tab: mt.tab, item: mt.item })}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mt.roleColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{mt.item.task}</p>
                  <p className="text-[10px] text-muted-foreground">{mt.roleName} · {tabLabels[mt.tab]}</p>
                </div>
                {mt.item.done && <span className="text-[10px] text-emerald-500 font-medium">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

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
                  onMoveItem={(itemId, target) => {
                    if (target === "done") {
                      handleUpdateItem(itemId, { done: true });
                    } else if (target === "urgent") {
                      handleUpdateItem(itemId, { done: false, priority: "urgent", critical: true });
                    } else {
                      const item = currentItems.find((i) => i.id === itemId);
                      handleUpdateItem(itemId, { done: false, priority: item?.priority === "urgent" ? "medium" : item?.priority || "medium", critical: false });
                    }
                  }}
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

/* ── Column config type ── */
interface KanbanColumn {
  key: string;
  label: string;
  color: string;
  filter: (i: ResponsibilityItem) => boolean;
  /** What happens when a card is dropped here */
  applyTo: "todo" | "urgent" | "done" | "custom";
}

const defaultColumns: KanbanColumn[] = [
  { key: "todo", label: "A fazer", color: "hsl(var(--primary))", filter: (i) => !i.done && i.priority !== "urgent" && !i.critical, applyTo: "todo" },
  { key: "urgent", label: "Urgente", color: "#DC2626", filter: (i) => !i.done && (i.priority === "urgent" || i.critical), applyTo: "urgent" },
  { key: "done", label: "Concluído", color: "#059669", filter: (i) => i.done, applyTo: "done" },
];

/* ── Kanban View with Drag & Drop + Column Management ── */
function KanbanView({ items, roleColor, onSelect, onToggleDone, onAdd, onMoveItem }: {
  items: ResponsibilityItem[];
  roleColor: string;
  onSelect: (item: ResponsibilityItem) => void;
  onToggleDone: (id: string) => void;
  onAdd: () => void;
  onMoveItem: (itemId: string, target: "todo" | "urgent" | "done") => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns);
  const [draggingColIdx, setDraggingColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [menuCol, setMenuCol] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!menuCol) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuCol(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuCol]);

  // Distribute items into columns (with dedup for urgent)
  const columnData = useMemo(() => {
    const urgentItems = items.filter((i) => !i.done && (i.priority === "urgent" || i.critical));
    const urgentIds = new Set(urgentItems.map((i) => i.id));

    return columns.map((col) => {
      let colItems: ResponsibilityItem[];
      if (col.key === "todo") {
        colItems = items.filter((i) => col.filter(i) && !urgentIds.has(i.id));
      } else {
        colItems = items.filter(col.filter);
      }
      return { ...col, items: colItems };
    });
  }, [columns, items]);

  const moveColumn = (index: number, direction: -1 | 1) => {
    const newCols = [...columns];
    const target = index + direction;
    if (target < 0 || target >= newCols.length) return;
    [newCols[index], newCols[target]] = [newCols[target], newCols[index]];
    setColumns(newCols);
  };

  const addColumn = () => {
    const id = `custom_${Math.random().toString(36).slice(2, 6)}`;
    setColumns([...columns, {
      key: id,
      label: "Nova coluna",
      color: "hsl(var(--muted-foreground))",
      filter: () => false,
      applyTo: "todo",
    }]);
  };

  const removeColumn = (key: string) => {
    if (["todo", "urgent", "done"].includes(key)) return;
    setColumns(columns.filter((c) => c.key !== key));
  };

  const startRename = (key: string) => {
    const col = columns.find((c) => c.key === key);
    setEditingCol(key);
    setEditLabel(col?.label || "");
    setMenuCol(null);
  };

  const finishRename = () => {
    if (editingCol && editLabel.trim()) {
      setColumns(columns.map((c) => c.key === editingCol ? { ...c, label: editLabel.trim() } : c));
    }
    setEditingCol(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const setGlobalDraggingCursor = () => {
    document.body.classList.add("is-dragging-cursor");
  };

  const clearGlobalDraggingCursor = () => {
    document.body.classList.remove("is-dragging-cursor");
  };

  useEffect(() => {
    return () => clearGlobalDraggingCursor();
  }, []);

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    clearGlobalDraggingCursor();
    if (!over) return;
    const overId = String(over.id);
    const itemId = String(active.id);

    let targetCol: "todo" | "urgent" | "done" | null = null;
    if (["todo", "urgent", "done"].includes(overId)) {
      targetCol = overId as "todo" | "urgent" | "done";
    } else {
      for (const col of columnData) {
        if (col.key === overId) { targetCol = col.applyTo === "custom" ? "todo" : col.applyTo; break; }
        if (col.items.some((i) => i.id === overId)) { targetCol = col.applyTo === "custom" ? "todo" : col.applyTo; break; }
      }
    }

    if (targetCol) {
      const sourceCol = columnData.find((c) => c.items.some((i) => i.id === itemId));
      if (sourceCol && sourceCol.applyTo !== targetCol) {
        onMoveItem(itemId, targetCol);
      }
    }
  };

  const gridCols = columns.length <= 3 ? "md:grid-cols-3" : columns.length === 4 ? "md:grid-cols-4" : "md:grid-cols-5";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        setActiveId(String(e.active.id));
        setGlobalDraggingCursor();
      }}
      onDragCancel={() => {
        setActiveId(null);
        clearGlobalDraggingCursor();
      }}
      onDragEnd={handleDragEnd}
    >
      <div className={`grid grid-cols-1 ${gridCols} gap-4 min-h-[200px]`}>
        {columnData.map((col, index) => (
          <div
            key={col.key}
            ref={(el) => { colRefs.current[index] = el; }}
            className={`space-y-2 group/col transition-all duration-200 ${
              draggingColIdx === index ? "opacity-40 scale-95" : ""
            } ${dragOverColIdx === index && draggingColIdx !== index ? "ring-2 ring-primary/40 rounded-2xl" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggingColIdx !== null && draggingColIdx !== index) {
                setDragOverColIdx(index);
              }
            }}
            onDragLeave={() => setDragOverColIdx(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingColIdx !== null && draggingColIdx !== index) {
                const newCols = [...columns];
                const [moved] = newCols.splice(draggingColIdx, 1);
                newCols.splice(index, 0, moved);
                setColumns(newCols);
              }
              setDraggingColIdx(null);
              setDragOverColIdx(null);
              clearGlobalDraggingCursor();
            }}
          >
            {/* ── Column Header ── */}
            <div className="flex items-center gap-1.5">
              {/* Column label */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                {editingCol === col.key ? (
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={finishRename}
                    onKeyDown={(e) => e.key === "Enter" && finishRename()}
                    className="ios-input px-2 py-0.5 text-xs font-semibold w-full"
                  />
                ) : (
                  <span className="text-xs font-semibold text-foreground truncate">{col.label}</span>
                )}
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md shrink-0">{col.items.length}</span>
              </div>

              {/* Drag grip - only on hover */}
              <div
                draggable
                onDragStart={(e) => {
                  setDraggingColIdx(index);
                  setGlobalDraggingCursor();
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDraggingColIdx(null);
                  setDragOverColIdx(null);
                  clearGlobalDraggingCursor();
                }}
                className="p-1 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover/col:opacity-100 transition-opacity text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Arrastar para reordenar"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              {/* 3-dot menu with all actions */}
              <div className="relative" ref={menuCol === col.key ? menuRef : undefined}>
                <button
                  onClick={() => setMenuCol(menuCol === col.key ? null : col.key)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <MoreVertical className="h-3 w-3 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {menuCol === col.key && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-border/60 bg-card p-1 space-y-0.5"
                      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
                    >
                      <button onClick={() => { onAdd(); setMenuCol(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary transition-colors text-foreground">
                        <Plus className="h-3 w-3" /> Nova tarefa
                      </button>
                      <button onClick={() => startRename(col.key)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary transition-colors text-foreground">
                        <Pencil className="h-3 w-3" /> Renomear
                      </button>
                      {index > 0 && (
                        <button onClick={() => { moveColumn(index, -1); setMenuCol(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary transition-colors text-foreground">
                          <ChevronLeft className="h-3 w-3" /> Mover ← esquerda
                        </button>
                      )}
                      {index < columns.length - 1 && (
                        <button onClick={() => { moveColumn(index, 1); setMenuCol(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary transition-colors text-foreground">
                          <ChevronRight className="h-3 w-3" /> Mover → direita
                        </button>
                      )}
                      {!["todo", "urgent", "done"].includes(col.key) && (
                        <button onClick={() => { removeColumn(col.key); setMenuCol(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-destructive/10 transition-colors text-destructive">
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Column drop area */}
            <DroppableColumn id={col.key} isOver={false}>
              <SortableContext items={col.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {col.items.map((item) => (
                  <SortableTaskCard key={item.id} item={item} roleColor={roleColor} onClick={() => onSelect(item)} onToggleDone={() => onToggleDone(item.id)} />
                ))}
              </SortableContext>
              {col.items.length === 0 && !activeId && (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">Sem itens</div>
              )}
            </DroppableColumn>
          </div>
        ))}

        {/* Add column button */}
        <div className="flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addColumn}
            className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">Nova coluna</span>
          </motion.button>
        </div>
      </div>
      <DragOverlay>
        {activeItem && <TaskCard item={activeItem} roleColor={roleColor} onClick={() => {}} onToggleDone={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}

/* ── Droppable Column (simplified) ── */
function DroppableColumn({ id, children, isOver: _ }: { id: string; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[100px] rounded-2xl p-2 border transition-colors ${
        isOver ? "bg-primary/10 border-primary/40" : "bg-secondary/30 border-border/30"
      }`}
    >
      {children}
    </div>
  );
}

/* ── Sortable Task Card ── */
function SortableTaskCard({ item, roleColor, onClick, onToggleDone }: {
  item: ResponsibilityItem; roleColor: string; onClick: () => void; onToggleDone: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard item={item} roleColor={roleColor} onClick={onClick} onToggleDone={onToggleDone} />
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
