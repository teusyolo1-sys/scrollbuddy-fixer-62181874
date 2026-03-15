import { supabase } from "@/integrations/supabase/client";

export async function sendToTrash(
  itemType: string,
  itemId: string,
  itemName: string,
  itemData: Record<string, unknown>,
  deletedBy: string
) {
  const { error } = await supabase.from("trash_bin").insert({
    item_type: itemType,
    item_id: itemId,
    item_name: itemName,
    item_data: itemData,
    deleted_by: deletedBy,
  });
  return { error };
}
