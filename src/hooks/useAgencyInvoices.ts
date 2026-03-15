import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceCategory = 'fee' | 'consultoria' | 'bonus' | 'projeto' | 'outro';
export type Recurrence = 'once' | 'monthly' | 'quarterly' | 'yearly';

export interface AgencyInvoice {
  id: string;
  company_id: string | null;
  description: string;
  amount: number;
  due_date: string;
  payment_status: PaymentStatus;
  payment_date: string | null;
  payment_method: string;
  invoice_number: string;
  recurrence: Recurrence;
  notes: string;
  category: InvoiceCategory;
  created_by: string;
  created_at: string;
}

export function useAgencyInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<AgencyInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    if (!user) { setInvoices([]); setLoading(false); return; }
    const { data } = await supabase
      .from('agency_invoices' as any)
      .select('*')
      .order('due_date', { ascending: true }) as { data: any[] | null };

    const now = new Date().toISOString().slice(0, 10);
    setInvoices((data || []).map((d: any) => ({
      ...d,
      amount: Number(d.amount),
      // Auto-mark overdue
      payment_status: d.payment_status === 'pending' && d.due_date < now ? 'overdue' : d.payment_status,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const addInvoice = async (partial: Partial<AgencyInvoice> = {}) => {
    if (!user) return;
    const { data } = await supabase
      .from('agency_invoices' as any)
      .insert({ created_by: user.id, ...partial } as any)
      .select().single();
    if (data) await fetchInvoices();
  };

  const updateInvoice = async (id: string, updates: Partial<AgencyInvoice>) => {
    await supabase.from('agency_invoices' as any).update(updates as any).eq('id', id);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const removeInvoice = async (id: string) => {
    await supabase.from('agency_invoices' as any).delete().eq('id', id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  // Computed
  const pendingInvoices = invoices.filter(i => i.payment_status === 'pending' || i.payment_status === 'overdue');
  const overdueInvoices = invoices.filter(i => i.payment_status === 'overdue');
  const totalReceivable = pendingInvoices.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.amount, 0);
  const paidThisMonth = (() => {
    const key = new Date().toISOString().slice(0, 7);
    return invoices.filter(i => i.payment_status === 'paid' && i.payment_date?.startsWith(key)).reduce((s, i) => s + i.amount, 0);
  })();

  return {
    invoices, loading, pendingInvoices, overdueInvoices,
    totalReceivable, totalOverdue, paidThisMonth,
    addInvoice, updateInvoice, removeInvoice, refetch: fetchInvoices,
  };
}
