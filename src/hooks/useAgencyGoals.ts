import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AgencyMonthlyGoal {
  id: string;
  month: string;
  revenue_goal: number;
  profit_goal: number;
  clients_goal: number;
  notes: string;
}

export function useAgencyGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<AgencyMonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7); // '2026-03'

  const fetchGoals = useCallback(async () => {
    if (!user) { setGoals([]); setLoading(false); return; }
    const { data } = await supabase
      .from('agency_monthly_goals' as any)
      .select('*')
      .order('month', { ascending: false }) as { data: any[] | null };
    setGoals((data || []).map((d: any) => ({
      ...d,
      revenue_goal: Number(d.revenue_goal),
      profit_goal: Number(d.profit_goal),
      clients_goal: Number(d.clients_goal),
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const currentGoal = goals.find(g => g.month === currentMonth) || null;

  const upsertGoal = async (month: string, updates: Partial<Omit<AgencyMonthlyGoal, 'id' | 'month'>>) => {
    if (!user) return;
    const existing = goals.find(g => g.month === month);
    if (existing) {
      await supabase.from('agency_monthly_goals' as any).update(updates as any).eq('id', existing.id);
      setGoals(prev => prev.map(g => g.id === existing.id ? { ...g, ...updates } : g));
    } else {
      await supabase.from('agency_monthly_goals' as any).insert({ month, created_by: user.id, ...updates } as any);
      await fetchGoals();
    }
  };

  const removeGoal = async (id: string) => {
    await supabase.from('agency_monthly_goals' as any).delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return { goals, currentGoal, loading, upsertGoal, removeGoal, refetch: fetchGoals, currentMonth };
}
