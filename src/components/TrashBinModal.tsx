import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface TrashItem {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  item_data: Record<string, unknown>;
  deleted_by: string;
  deleted_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  member: "Membro",
  company: "Empresa",
  project: "Projeto",
  task: "Tarefa",
  budget: "Entrada de Orçamento",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TrashBinModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("trash_bin" as any)
      .select("*")
      .order("deleted_at", { ascending: false }) as { data: TrashItem[] | null };
    setItems((data as TrashItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open]);

  const handlePermanentDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("trash_bin" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Item deletado permanentemente" });
    }
    setDeletingId(null);
    setConfirmId(null);
  };

  const handleRestore = async (item: TrashItem) => {
    setDeletingId(item.id);
    try {
      const table = getRestoreTable(item.item_type);
      if (table && item.item_data && Object.keys(item.item_data).length > 0) {
        const { error: restoreError } = await supabase.from(table as any).insert(item.item_data as any);
        if (restoreError) {
          toast({ title: "Erro ao restaurar", description: restoreError.message, variant: "destructive" });
          setDeletingId(null);
          return;
        }
      }
      await supabase.from("trash_bin" as any).delete().eq("id", item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast({ title: "Item restaurado com sucesso" });
    } catch {
      toast({ title: "Erro ao restaurar", variant: "destructive" });
    }
    setDeletingId(null);
  };

  const getRestoreTable = (type: string): string | null => {
    const map: Record<string, string> = {
      member: "profiles",
      company: "companies",
      project: "projects",
      task: "budget_entries",
      budget: "budget_entries",
    };
    return map[type] || null;
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    const { error } = await supabase.from("trash_bin" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setItems([]);
      toast({ title: "Lixeira esvaziada" });
    }
    setLoading(false);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Lixeira</h2>
                  <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "item" : "itens"}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Trash2 className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Lixeira vazia</p>
                  <p className="text-xs mt-1">Itens deletados aparecerão aqui</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.item_name || "Sem nome"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {TYPE_LABELS[item.item_type] || item.item_type} · {new Date(item.deleted_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    {confirmId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                        >
                          {deletingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Deletar"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(item.id)}
                        className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                        title="Deletar permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-3 border-t border-border flex justify-end">
                <button
                  onClick={handleDeleteAll}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Esvaziar lixeira
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
