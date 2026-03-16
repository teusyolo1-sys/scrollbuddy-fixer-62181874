import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useTOTP() {
  const { user } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsConfigured(false); setLoading(false); return; }
    supabase.functions.invoke('totp-manage', { body: { action: 'status' } })
      .then(({ data }) => {
        setIsConfigured(data?.configured || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const setup = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('totp-manage', { body: { action: 'setup' } });
    if (error) throw error;
    return data as { secret: string; otpauth_url: string; qr_data: string };
  }, []);

  const verifySetup = useCallback(async (code: string): Promise<boolean> => {
    const { data } = await supabase.functions.invoke('totp-manage', { body: { action: 'verify_setup', code } });
    if (data?.valid) setIsConfigured(true);
    return data?.valid || false;
  }, []);

  const verify = useCallback(async (code: string): Promise<boolean> => {
    const { data } = await supabase.functions.invoke('totp-manage', { body: { action: 'verify', code } });
    return data?.valid || false;
  }, []);

  return { isConfigured, loading, setup, verifySetup, verify };
}
