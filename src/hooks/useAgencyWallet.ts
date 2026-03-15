import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AgencyExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
  created_by: string;
}

export interface AgencyRevenueCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface AgencyRevenue {
  id: string;
  description: string;
  category_id: string | null;
  amount: number;
  date: string;
  notes: string;
  company_id: string | null;
  created_by: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  color: string;
  totalFee: number;
}

export const useAgencyWallet = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<AgencyExpense[]>([]);
  const [revenues, setRevenues] = useState<AgencyRevenue[]>([]);
  const [categories, setCategories] = useState<AgencyRevenueCategory[]>([]);
  const [companySummaries, setCompanySummaries] = useState<CompanySummary[]>([]);
  const [totalFeeRevenue, setTotalFeeRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Fetch all in parallel
    const [expRes, revRes, catRes, feeRes, compRes] = await Promise.all([
      supabase.from('agency_expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('agency_revenues').select('*').order('created_at', { ascending: false }),
      supabase.from('agency_revenue_categories').select('*').order('created_at', { ascending: true }),
      supabase.from('budget_entries').select('id, agency_fee, agency_fee_type, amount, company_id, date, category'),
      supabase.from('companies').select('id, name, color'),
    ]);

    // Expenses
    setExpenses((expRes.data || []).map(e => ({
      id: e.id, description: e.description, category: e.category,
      amount: Number(e.amount), date: e.date, notes: e.notes, created_by: e.created_by,
    })));

    // Revenues
    setRevenues((revRes.data || []).map(r => ({
      id: r.id, description: r.description, category_id: r.category_id,
      amount: Number(r.amount), date: r.date, notes: r.notes,
      company_id: r.company_id, created_by: r.created_by,
    })));

    // Categories
    setCategories((catRes.data || []) as AgencyRevenueCategory[]);

    // Compute fee revenue per company
    const feeEntries = (feeRes.data || []) as any[];
    const companiesData = (compRes.data || []) as any[];
    
    let totalFee = 0;
    const companyFees: Record<string, number> = {};
    
    feeEntries.forEach((e: any) => {
      const fee = e.agency_fee_type === 'percent' 
        ? (Number(e.amount) * Number(e.agency_fee)) / 100 
        : Number(e.agency_fee);
      if (fee > 0) {
        totalFee += fee;
        const cid = e.company_id || 'sem-projeto';
        companyFees[cid] = (companyFees[cid] || 0) + fee;
      }
    });

    setTotalFeeRevenue(totalFee);
    setCompanySummaries(companiesData.map((c: any) => ({
      id: c.id, name: c.name, color: c.color,
      totalFee: companyFees[c.id] || 0,
    })).filter(c => c.totalFee > 0));

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // CRUD for expenses
  const addExpense = async (category = 'geral') => {
    if (!user) return;
    const { data } = await supabase
      .from('agency_expenses')
      .insert({ category, created_by: user.id, description: '', amount: 0, notes: '' } as any)
      .select().single();
    if (data) {
      setExpenses(prev => [{ id: data.id, description: '', category, amount: 0, date: data.date, notes: '', created_by: user.id }, ...prev]);
    }
  };

  const updateExpense = async (id: string, updates: Partial<AgencyExpense>) => {
    await supabase.from('agency_expenses').update(updates as any).eq('id', id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeExpense = async (id: string) => {
    await supabase.from('agency_expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // CRUD for manual revenues
  const addRevenue = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agency_revenues')
      .insert({ created_by: user.id, description: '', amount: 0, notes: '' } as any)
      .select().single();
    if (data) {
      setRevenues(prev => [{ id: data.id, description: '', category_id: null, amount: 0, date: data.date, notes: '', company_id: null, created_by: user.id }, ...prev]);
    }
  };

  const updateRevenue = async (id: string, updates: Partial<AgencyRevenue>) => {
    await supabase.from('agency_revenues').update(updates as any).eq('id', id);
    setRevenues(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRevenue = async (id: string) => {
    await supabase.from('agency_revenues').delete().eq('id', id);
    setRevenues(prev => prev.filter(r => r.id !== id));
  };

  // CRUD for categories
  const addCategory = async (name: string, color = '#3B82F6') => {
    if (!user) return;
    const { data } = await supabase
      .from('agency_revenue_categories')
      .insert({ name, color, created_by: user.id } as any)
      .select().single();
    if (data) setCategories(prev => [...prev, data as AgencyRevenueCategory]);
  };

  const removeCategory = async (id: string) => {
    await supabase.from('agency_revenue_categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Computed values
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalManualRevenue = revenues.reduce((s, r) => s + r.amount, 0);
  const totalRevenue = totalFeeRevenue + totalManualRevenue;
  const profit = totalRevenue - totalExpenses;

  // Current month filter
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthKey)).reduce((s, e) => s + e.amount, 0);
  const monthlyManualRevenue = revenues.filter(r => r.date.startsWith(currentMonthKey)).reduce((s, r) => s + r.amount, 0);
  const monthlyFeeRevenue = totalFeeRevenue; // TODO: filter by month when budget_entries have dates
  const monthlyRevenue = monthlyFeeRevenue + monthlyManualRevenue;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  return {
    expenses, revenues, categories, companySummaries,
    totalFeeRevenue, totalManualRevenue, totalRevenue, totalExpenses, profit,
    monthlyRevenue, monthlyExpenses, monthlyProfit,
    loading,
    addExpense, updateExpense, removeExpense,
    addRevenue, updateRevenue, removeRevenue,
    addCategory, removeCategory,
    refetch: fetchAll,
  };
};
