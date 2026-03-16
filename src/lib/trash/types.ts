export interface TrashItem {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  item_data: Record<string, unknown>;
  deleted_by: string;
  deleted_at: string;
}

export const TYPE_LABELS: Record<string, string> = {
  member: "Membro",
  company: "Empresa",
  project: "Projeto",
  task: "Tarefa",
  budget: "Entrada de Orçamento",
};

/** Maps item_type to the Supabase table used for DB-backed restore */
export const RESTORE_TABLE_MAP: Record<string, string> = {
  company: "companies",
  project: "projects",
  task: "budget_entries",
  budget: "budget_entries",
};
