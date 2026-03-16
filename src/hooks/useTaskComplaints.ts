import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TaskComplaint {
  id: string;
  reporter_id: string;
  task_id: string;
  task_name: string;
  assigned_to: string;
  role_name: string;
  category: string;
  description: string;
  created_at: string;
}

export function useTaskComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<TaskComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = useCallback(async () => {
    if (!user) { setComplaints([]); setLoading(false); return; }
    const { data } = await supabase
      .from('task_complaints' as any)
      .select('*')
      .order('created_at', { ascending: false }) as { data: any[] | null };
    setComplaints((data || []).map((d: any) => ({
      id: d.id,
      reporter_id: d.reporter_id,
      task_id: d.task_id,
      task_name: d.task_name,
      assigned_to: d.assigned_to,
      role_name: d.role_name || '',
      category: d.category,
      description: d.description || '',
      created_at: d.created_at,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const addComplaint = async (
    taskId: string,
    taskName: string,
    assignedTo: string,
    roleName: string,
    category: string,
    description: string
  ) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('task_complaints' as any).insert({
      reporter_id: user.id,
      task_id: taskId,
      task_name: taskName,
      assigned_to: assignedTo,
      role_name: roleName,
      category,
      description,
    } as any);
    if (error) {
      console.error("[addComplaint] Supabase error:", error);
      throw new Error(error.message);
    }
    await fetchComplaints();
  };

  const removeComplaint = async (id: string) => {
    await supabase.from('task_complaints' as any).delete().eq('id', id);
    await fetchComplaints();
  };

  return { complaints, loading, addComplaint, removeComplaint, refetch: fetchComplaints };
}
