import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface SocialMetricRow {
  date: string;
  followers: number;
  engagement_rate: number;
  reach: number;
  account_id: string;
}

export function useClientMetrics(companyId?: string) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ClientMetric[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) { setMetrics([]); setSocialMetrics([]); setLoading(false); return; }

    // Fetch manual client_metrics
    let query = supabase
      .from('client_metrics' as any)
      .select('*')
      .order('date', { ascending: true });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    // Fetch social_metrics (auto followers/reach/engagement)
    let socialPromise: Promise<{ data: any[] | null }> = Promise.resolve({ data: null });

    if (companyId) {
      socialPromise = (async () => {
        // First get account IDs for this company
        const { data: accounts } = await supabase
          .from('social_accounts')
          .select('id')
          .eq('company_id', companyId);

        if (!accounts || accounts.length === 0) return { data: null };

        const accountIds = accounts.map((a: any) => a.id);

        const { data } = await supabase
          .from('social_metrics')
          .select('date, followers, engagement_rate, reach, account_id')
          .in('account_id', accountIds)
          .order('date', { ascending: true });

        return { data };
      })();
    }

    const [manualResult, socialResult] = await Promise.all([query, socialPromise]);

    const manualData = (manualResult as any).data || [];
    setMetrics(manualData.map((d: any) => ({
      id: d.id,
      metric_type: d.metric_type,
      value: Number(d.value),
      date: d.date,
      notes: d.notes || '',
    })));

    setSocialMetrics((socialResult.data || []) as SocialMetricRow[]);
    setLoading(false);
  }, [user, companyId]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  // Merge manual metrics with auto-collected social metrics
  const mergedMetrics = useMemo(() => {
    const result = [...metrics];

    if (socialMetrics.length === 0) return result;

    // Aggregate social metrics by date (sum across accounts for followers, avg for engagement)
    const byDate: Record<string, { followers: number; reach: number; engagement: number; count: number }> = {};

    socialMetrics.forEach((sm) => {
      if (!byDate[sm.date]) {
        byDate[sm.date] = { followers: 0, reach: 0, engagement: 0, count: 0 };
      }
      byDate[sm.date].followers += sm.followers;
      byDate[sm.date].reach += sm.reach;
      byDate[sm.date].engagement += sm.engagement_rate;
      byDate[sm.date].count += 1;
    });

    // Check which dates already have manual entries for each type
    const manualDates: Record<MetricType, Set<string>> = {
      seguidores: new Set(),
      vendas: new Set(),
      conversao: new Set(),
      faturamento: new Set(),
      leads: new Set(),
      alcance: new Set(),
    };

    metrics.forEach((m) => {
      manualDates[m.metric_type]?.add(m.date);
    });

    // Add auto-collected data (only for dates without manual entries)
    Object.entries(byDate).forEach(([date, data]) => {
      if (data.followers > 0 && !manualDates.seguidores.has(date)) {
        result.push({
          id: `auto-seg-${date}`,
          metric_type: 'seguidores',
          value: data.followers,
          date,
          notes: '⚡ Auto (redes sociais)',
        });
      }

      if (data.reach > 0 && !manualDates.alcance.has(date)) {
        result.push({
          id: `auto-alc-${date}`,
          metric_type: 'alcance',
          value: data.reach,
          date,
          notes: '⚡ Auto (redes sociais)',
        });
      }
    });

    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }, [metrics, socialMetrics]);

  const addMetric = async (metric_type: MetricType, value: number, date: string, notes = '') => {
    if (!user) return;
    await supabase.from('client_metrics' as any).insert({
      user_id: user.id,
      company_id: companyId || 'default',
      metric_type,
      value,
      date,
      notes,
    } as any);
    await fetchMetrics();
  };

  const removeMetric = async (id: string) => {
    // Don't try to delete auto-generated entries
    if (id.startsWith('auto-')) return;
    await supabase.from('client_metrics' as any).delete().eq('id', id);
    await fetchMetrics();
  };

  const removeAllByType = async (metricType: MetricType) => {
    if (!user) return;
    let query = supabase.from('client_metrics' as any).delete().eq('metric_type', metricType);
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    await query;
    await fetchMetrics();
  };

  return { metrics: mergedMetrics, loading, addMetric, removeMetric, removeAllByType, refetch: fetchMetrics };
}
