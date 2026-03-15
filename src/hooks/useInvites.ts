import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Invite {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  max_uses: number;
  use_count: number;
  note: string;
  created_at: string;
}

export function useInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!user) { setInvites([]); setLoading(false); return; }
    const { data } = await supabase
      .from('invites' as any)
      .select('*')
      .order('created_at', { ascending: false }) as { data: any[] | null };
    setInvites((data || []) as Invite[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const createInvite = async (opts?: { max_uses?: number; expires_at?: string; note?: string }) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('invites' as any)
      .insert({
        created_by: user.id,
        max_uses: opts?.max_uses || 1,
        expires_at: opts?.expires_at || null,
        note: opts?.note || '',
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await fetchInvites();
    return data as any as Invite;
  };

  const deleteInvite = async (id: string) => {
    await supabase.from('invites' as any).delete().eq('id', id);
    await fetchInvites();
  };

  return { invites, loading, createInvite, deleteInvite, refetch: fetchInvites };
}
