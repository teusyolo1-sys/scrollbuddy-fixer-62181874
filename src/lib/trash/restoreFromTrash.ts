import { supabase } from "@/integrations/supabase/client";
import type { TrashItem } from "./types";
import { RESTORE_TABLE_MAP } from "./types";
import { restoreMemberToLocalStorage } from "./restoreMember";

/**
 * Restores a trash item to its original location and removes it from the trash_bin.
 * Returns { success, error }.
 */
export async function restoreFromTrash(item: TrashItem): Promise<{ success: boolean; error?: string }> {
  try {
    if (item.item_type === "member") {
      restoreMemberToLocalStorage(item);
    } else {
      const table = RESTORE_TABLE_MAP[item.item_type];
      if (table && item.item_data && Object.keys(item.item_data).length > 0) {
        const { error: restoreError } = await supabase.from(table as any).insert(item.item_data as any);
        if (restoreError) {
          return { success: false, error: restoreError.message };
        }
      }
    }

    // Remove from trash_bin
    const { error: deleteError } = await supabase.from("trash_bin").delete().eq("id", item.id);
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Erro inesperado ao restaurar" };
  }
}
