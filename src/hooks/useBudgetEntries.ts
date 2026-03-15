import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type BudgetCategory = 'investimento' | 'gasto' | 'faturamento' | 'receita' | 'despesa';

export interface BudgetEntry {
  id: string;
  description: string;
  category: BudgetCategory;
  amount: number;
  date: string;
  notes: string;
  created_by: string;
  participants: string[]; // user_ids
  agency_fee: number;
  agency_fee_type: 'fixed' | 'percent';
  company_id: string | null;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export const useBudgetEntries = (companyId?: string) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) { setEntries([]); setLoading(false); return; }

    let query = supabase
      .from('budget_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: entriesData } = await query;

    if (!entriesData) { setLoading(false); return; }

    // Fetch participants for all entries
    const entryIds = entriesData.map(e => e.id);
    const { data: participantsData } = await supabase
      .from('budget_entry_participants')
      .select('entry_id, user_id')
      .in('entry_id', entryIds.length > 0 ? entryIds : ['none']);

    const participantMap: Record<string, string[]> = {};
    (participantsData || []).forEach(p => {
      if (!participantMap[p.entry_id]) participantMap[p.entry_id] = [];
      participantMap[p.entry_id].push(p.user_id);
    });

    setEntries(entriesData.map(e => ({
      id: e.id,
      description: e.description,
      category: e.category as BudgetCategory,
      amount: Number(e.amount),
      date: e.date,
      notes: e.notes,
      created_by: e.created_by,
      participants: participantMap[e.id] || [],
      agency_fee: Number((e as any).agency_fee || 0),
      agency_fee_type: ((e as any).agency_fee_type || 'fixed') as 'fixed' | 'percent',
      company_id: (e as any).company_id || null,
    })));

    setLoading(false);
  }, [user]);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('id, display_name, email, avatar_url');
    setProfiles((data || []) as UserProfile[]);
  }, [user]);

  useEffect(() => { fetchEntries(); fetchProfiles(); }, [fetchEntries, fetchProfiles]);

  const addEntry = async (category: BudgetCategory) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('budget_entries')
      .insert({ category, created_by: user.id, description: '', amount: 0, notes: '', ...(companyId ? { company_id: companyId } : {}) })
      .select()
      .single();
    if (!error && data) {
      setEntries(prev => [{
        id: data.id, description: data.description, category: data.category as BudgetCategory,
        amount: Number(data.amount), date: data.date, notes: data.notes,
        created_by: data.created_by, participants: [],
        agency_fee: 0, agency_fee_type: 'fixed', company_id: null,
      }, ...prev]);
    }
  };

  const updateEntry = async (id: string, updates: Partial<Pick<BudgetEntry, 'description' | 'amount' | 'date' | 'notes' | 'agency_fee' | 'agency_fee_type' | 'company_id'>>) => {
    await supabase.from('budget_entries').update(updates).eq('id', id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeEntry = async (id: string) => {
    await supabase.from('budget_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const toggleParticipant = async (entryId: string, userId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    const isParticipant = entry.participants.includes(userId);
    if (isParticipant) {
      await supabase.from('budget_entry_participants').delete().eq('entry_id', entryId).eq('user_id', userId);
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, participants: e.participants.filter(p => p !== userId) } : e));
    } else {
      await supabase.from('budget_entry_participants').insert({ entry_id: entryId, user_id: userId });
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, participants: [...e.participants, userId] } : e));
    }
  };

  return { entries, profiles, loading, addEntry, updateEntry, removeEntry, toggleParticipant, refetch: fetchEntries };
};
