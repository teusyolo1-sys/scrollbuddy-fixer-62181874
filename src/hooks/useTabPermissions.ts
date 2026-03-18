import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export const TAB_KEYS = ['dashboard', 'schedule', 'pipeline', 'matrix', 'workflow', 'deadlines', 'budget', 'team', 'files'] as const;
export type TabKey = typeof TAB_KEYS[number];

export const TAB_LABELS: Record<TabKey, string> = {
  dashboard: 'Dashboard',
  schedule: 'Cronograma',
  pipeline: 'Pipeline',
  matrix: 'Responsabilidades',
  workflow: 'Fluxo',
  deadlines: 'Prazos & Crises',
  budget: 'Orçamento',
  team: 'Time',
  files: 'Arquivos',
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

    const perms = (data || []) as TabPermission[];
    setPermissions(perms);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  // Realtime: re-fetch when any permission changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('tab_permissions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tab_permissions' }, () => {
        fetchPermissions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchPermissions]);

  const hasAccess = (tabKey: TabKey): boolean => {
    if (isAdmin) return true;
    if (!user) return false;
    const perm = permissions.find(p => p.user_id === user.id && p.tab_key === tabKey);
    return perm?.granted ?? false;
  };

  const allowedTabs = TAB_KEYS.filter(k => hasAccess(k));

  const setPermission = async (userId: string, tabKey: string, granted: boolean) => {
    // Atualização otimista imediata
    setPermissions(prev => {
      const filtered = prev.filter(p => !(p.user_id === userId && p.tab_key === tabKey));
      if (granted) {
        return [...filtered, { user_id: userId, tab_key: tabKey, granted: true }];
      }
      return filtered;
    });

    if (granted) {
      const { error } = await supabase.from('tab_permissions').upsert(
        { user_id: userId, tab_key: tabKey, granted: true, granted_by: user?.id },
        { onConflict: 'user_id,tab_key' }
      );
      if (error) console.error('Erro ao conceder permissão:', error);
    } else {
      const { error } = await supabase.from('tab_permissions').delete()
        .eq('user_id', userId).eq('tab_key', tabKey);
      if (error) console.error('Erro ao revogar permissão:', error);
    }
    await fetchPermissions();
  };

  const setAllPermissions = async (userId: string, granted: boolean) => {
    // Atualização otimista imediata
    setPermissions(prev => {
      const filtered = prev.filter(p => p.user_id !== userId);
      if (granted) {
        const newPerms = TAB_KEYS.map(tab_key => ({ user_id: userId, tab_key, granted: true }));
        return [...filtered, ...newPerms];
      }
      return filtered;
    });

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
