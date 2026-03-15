import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export const TAB_KEYS = ['dashboard', 'schedule', 'pipeline', 'matrix', 'workflow', 'deadlines', 'budget'] as const;
export type TabKey = typeof TAB_KEYS[number];

export const TAB_LABELS: Record<TabKey, string> = {
  dashboard: 'Dashboard',
  schedule: 'Cronograma',
  pipeline: 'Pipeline',
  matrix: 'Responsabilidades',
  workflow: 'Fluxo',
  deadlines: 'Prazos & Crises',
  budget: 'Orçamento',
};

interface TabPermission {
  user_id: string;
  tab_key: string;
  granted: boolean;
}

export const useTabPermissions = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [permissions, setPermissions] = useState<TabPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) { setPermissions([]); setLoading(false); return; }
    
    const { data } = await supabase
      .from('tab_permissions')
      .select('user_id, tab_key, granted');
    
    setPermissions((data || []) as TabPermission[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const hasAccess = (tabKey: TabKey): boolean => {
    if (isAdmin) return true;
    if (!user) return false;
    const perm = permissions.find(p => p.user_id === user.id && p.tab_key === tabKey);
    return perm?.granted ?? false;
  };

  const allowedTabs = TAB_KEYS.filter(k => hasAccess(k));

  const setPermission = async (userId: string, tabKey: string, granted: boolean) => {
    if (granted) {
      await supabase.from('tab_permissions').upsert(
        { user_id: userId, tab_key: tabKey, granted: true, granted_by: user?.id },
        { onConflict: 'user_id,tab_key' }
      );
    } else {
      await supabase.from('tab_permissions').delete()
        .eq('user_id', userId).eq('tab_key', tabKey);
    }
    await fetchPermissions();
  };

  const setAllPermissions = async (userId: string, granted: boolean) => {
    if (granted) {
      const rows = TAB_KEYS.map(tab_key => ({
        user_id: userId, tab_key, granted: true, granted_by: user?.id,
      }));
      await supabase.from('tab_permissions').upsert(rows, { onConflict: 'user_id,tab_key' });
    } else {
      await supabase.from('tab_permissions').delete().eq('user_id', userId);
    }
    await fetchPermissions();
  };

  return { permissions, loading, hasAccess, allowedTabs, setPermission, setAllPermissions, refetch: fetchPermissions };
};
