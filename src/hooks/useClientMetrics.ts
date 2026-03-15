import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type MetricType = 'seguidores' | 'vendas' | 'conversao' | 'faturamento' | 'leads' | 'alcance';

export interface ClientMetric {
  id: string;
  metric_type: MetricType;
  value: number;
  date: string;
  notes: string;
}

export const METRIC_CONFIG: Record<MetricType, { label: string; color: string; format: (v: number) => string }> = {
  seguidores: { label: "Seguidores", color: "#3b82f6", format: (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v) },
  vendas: { label: "Vendas", color: "#10b981", format: (v) => String(v) },
  conversao: { label: "Conversão", color: "#8b5cf6", format: (v) => `${v.toFixed(1)}%` },
  faturamento: { label: "Faturamento", color: "#f59e0b", format: (v) => `R$ ${v.toLocaleString("pt-BR")}` },
  leads: { label: "Leads", color: "#ec4899", format: (v) => String(v) },
  alcance: { label: "Alcance", color: "#06b6d4", format: (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v) },
};

export const METRIC_TYPES: MetricType[] = ['seguidores', 'vendas', 'conversao', 'faturamento', 'leads', 'alcance'];

export function useClientMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ClientMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) { setMetrics([]); setLoading(false); return; }
    const { data } = await supabase
      .from('client_metrics' as any)
      .select('*')
      .order('date', { ascending: true }) as { data: any[] | null };
    setMetrics((data || []).map((d: any) => ({
      id: d.id,
      metric_type: d.metric_type,
      value: Number(d.value),
      date: d.date,
      notes: d.notes || '',
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const addMetric = async (metric_type: MetricType, value: number, date: string, notes = '') => {
    if (!user) return;
    await supabase.from('client_metrics' as any).insert({
      user_id: user.id,
      metric_type,
      value,
      date,
      notes,
    } as any);
    await fetchMetrics();
  };

  const removeMetric = async (id: string) => {
    await supabase.from('client_metrics' as any).delete().eq('id', id);
    await fetchMetrics();
  };

  return { metrics, loading, addMetric, removeMetric, refetch: fetchMetrics };
}
