import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'staff' | 'cliente' | 'visitante';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      // Tentar cache primeiro
      const cacheKey = `cache_roles_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < 5 * 60 * 1000) {
            setRoles(parsed.roles);
            setLoading(false);
            return;
          }
        } catch {}
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const fetchedRoles = (data || []).map((r: any) => r.role as AppRole);
      setRoles(fetchedRoles);
      setLoading(false);

      sessionStorage.setItem(cacheKey, JSON.stringify({ roles: fetchedRoles, ts: Date.now() }));
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isStaff = hasRole('staff');

  return { roles, loading, hasRole, isAdmin, isStaff };
};
