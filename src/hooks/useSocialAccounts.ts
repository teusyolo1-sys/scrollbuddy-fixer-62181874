import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';

export interface SocialAccount {
  id: string;
  company_id: string;
  platform: SocialPlatform;
  profile_name: string;
  profile_url: string;
  followers: number;
  engagement_rate: number;
  reach: number;
  posts_count: number;
  notes: string;
  last_updated: string;
}

export interface SocialMetric {
  id: string;
  account_id: string;
  date: string;
  followers: number;
  engagement_rate: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
}

export const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📸' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: '📘' },
  tiktok: { label: 'TikTok', color: '#000000', icon: '🎵' },
  youtube: { label: 'YouTube', color: '#FF0000', icon: '▶️' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  twitter: { label: 'X / Twitter', color: '#1DA1F2', icon: '𝕏' },
};

export function useSocialAccounts(companyId?: string) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [metrics, setMetrics] = useState<Record<string, SocialMetric[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user || !companyId) { setAccounts([]); setLoading(false); return; }

    const { data } = await supabase
      .from('social_accounts' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('platform', { ascending: true }) as { data: any[] | null };

    const accs = (data || []).map((d: any) => ({
      id: d.id,
      company_id: d.company_id,
      platform: d.platform as SocialPlatform,
      profile_name: d.profile_name,
      profile_url: d.profile_url,
      followers: Number(d.followers),
      engagement_rate: Number(d.engagement_rate),
      reach: Number(d.reach),
      posts_count: Number(d.posts_count),
      notes: d.notes || '',
      last_updated: d.last_updated,
    }));
    setAccounts(accs);

    // Fetch metrics for all accounts
    if (accs.length > 0) {
      const ids = accs.map(a => a.id);
      const { data: metricsData } = await supabase
        .from('social_metrics' as any)
        .select('*')
        .in('account_id', ids)
        .order('date', { ascending: true }) as { data: any[] | null };

      const grouped: Record<string, SocialMetric[]> = {};
      (metricsData || []).forEach((m: any) => {
        if (!grouped[m.account_id]) grouped[m.account_id] = [];
        grouped[m.account_id].push({
          id: m.id,
          account_id: m.account_id,
          date: m.date,
          followers: Number(m.followers),
          engagement_rate: Number(m.engagement_rate),
          reach: Number(m.reach),
          impressions: Number(m.impressions),
          likes: Number(m.likes),
          comments: Number(m.comments),
          shares: Number(m.shares),
        });
      });
      setMetrics(grouped);
    }

    setLoading(false);
  }, [user, companyId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const addAccount = async (platform: SocialPlatform, profileName: string, profileUrl: string) => {
    if (!user || !companyId) return;
    await supabase.from('social_accounts' as any).insert({
      company_id: companyId,
      platform,
      profile_name: profileName,
      profile_url: profileUrl,
      created_by: user.id,
    } as any);
    await fetchAccounts();
  };

  const updateAccount = async (id: string, updates: Partial<SocialAccount>) => {
    const dbUpdates: any = {};
    if (updates.profile_name !== undefined) dbUpdates.profile_name = updates.profile_name;
    if (updates.profile_url !== undefined) dbUpdates.profile_url = updates.profile_url;
    if (updates.followers !== undefined) dbUpdates.followers = updates.followers;
    if (updates.engagement_rate !== undefined) dbUpdates.engagement_rate = updates.engagement_rate;
    if (updates.reach !== undefined) dbUpdates.reach = updates.reach;
    if (updates.posts_count !== undefined) dbUpdates.posts_count = updates.posts_count;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    dbUpdates.last_updated = new Date().toISOString().split('T')[0];
    dbUpdates.updated_at = new Date().toISOString();

    await supabase.from('social_accounts' as any).update(dbUpdates).eq('id', id);
    await fetchAccounts();
  };

  const deleteAccount = async (id: string) => {
    await supabase.from('social_accounts' as any).delete().eq('id', id);
    await fetchAccounts();
  };

  const fetchFromInstagramApi = async (accountId: string, username: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('instagram-fetch', {
        body: { username },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const updates: Partial<SocialAccount> = {
        followers: Number(data.followers) || 0,
        posts_count: Number(data.posts_count) || 0,
      };

      await updateAccount(accountId, updates);

      // Also add metric entry
      await addMetricEntry(accountId, {
        date: new Date().toISOString().split('T')[0],
        followers: updates.followers!,
        engagement_rate: 0,
        reach: 0,
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      });

      toast({ title: "Dados atualizados via API", description: `${data.followers} seguidores, ${data.posts_count} posts` });
      return data;
    } catch (err: any) {
      console.error('Instagram API fetch error:', err);
      toast({ title: "Erro ao buscar dados", description: err.message || 'Falha na API', variant: "destructive" });
      return null;
    }
  };

  return { accounts, metrics, loading, addAccount, updateAccount, deleteAccount, addMetricEntry, fetchFromInstagramApi, refetch: fetchAccounts };
}
