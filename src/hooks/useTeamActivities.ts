import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TeamActivity {
  id: string;
  member_name: string;
  activity_type: string;
  value: number;
  unit: string;
  date: string;
  notes: string;
}

export function useTeamActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setActivities([]); setLoading(false); return; }
    const { data } = await supabase
      .from('team_activities' as any)
      .select('*')
      .order('date', { ascending: true }) as { data: any[] | null };
    setActivities((data || []).map((d: any) => ({
      id: d.id,
      member_name: d.member_name,
      activity_type: d.activity_type,
      value: Number(d.value),
      unit: d.unit || '',
      date: d.date,
      notes: d.notes || '',
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addActivity = async (member_name: string, activity_type: string, value: number, unit: string, date: string, notes = '') => {
    if (!user) return;
    const { error } = await supabase.from('team_activities' as any).insert({
      user_id: user.id, member_name, activity_type, value, unit, date, notes,
    } as any);
    if (error) throw new Error(error.message);
    await fetch();
  };

  const removeActivity = async (id: string) => {
    await supabase.from('team_activities' as any).delete().eq('id', id);
    await fetch();
  };

  return { activities, loading, addActivity, removeActivity, refetch: fetch };
}
