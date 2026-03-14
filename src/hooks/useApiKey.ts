import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useApiKey = () => {
  const { user } = useAuth();
  const [isValidated, setIsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has a validated session (localStorage)
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`apikey_validated_${user.id}`);
      const storedKey = localStorage.getItem(`apikey_key_${user.id}`);
      const storedExpires = localStorage.getItem(`apikey_expires_${user.id}`);
      const storedPlan = localStorage.getItem(`apikey_plan_${user.id}`);
      if (stored === 'true' && storedKey) {
        setIsValidated(true);
        setCurrentKey(storedKey);
        setExpiresAt(storedExpires);
        setPlan(storedPlan);
      }
    }
  }, [user]);

  const applySession = useCallback((userId: string, apiKey: string, expires?: string | null, planName?: string | null) => {
    setIsValidated(true);
    setCurrentKey(apiKey);
    setExpiresAt(expires || null);
    setPlan(planName || null);
    localStorage.setItem(`apikey_validated_${userId}`, 'true');
    localStorage.setItem(`apikey_key_${userId}`, apiKey);
    if (expires) localStorage.setItem(`apikey_expires_${userId}`, expires);
    if (planName) localStorage.setItem(`apikey_plan_${userId}`, planName);
  }, []);

  const validateKey = useCallback(async (apiKey: string) => {
    if (!user) return false;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('validate-api-key', {
        body: { apiKey, action: 'validate' },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data.valid) {
        applySession(user.id, apiKey, data.expiresAt, data.plan);
        return true;
      } else {
        setError(data.error || 'Chave inválida');
        return false;
      }
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, applySession]);

  // Auto-apply: find the best paid key for this user and activate it
  const autoApply = useCallback(async () => {
    if (!user) return false;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('validate-api-key', {
        body: { apiKey: '', action: 'auto_apply' },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data.valid && data.api_key) {
        applySession(user.id, data.api_key, data.expiresAt, data.plan);
        return true;
      } else {
        setError(data.error || 'Nenhuma chave disponível');
        return false;
      }
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, applySession]);

  const generateKey = useCallback(async () => {
    if (!user) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('validate-api-key', {
        body: { apiKey: '', action: 'generate' },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data.error) throw new Error(data.error);
      return data.key as string;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const releaseKey = useCallback(async () => {
    if (!user || !currentKey) return;
    try {
      await supabase.functions.invoke('validate-api-key', {
        body: { apiKey: currentKey, action: 'release' },
      });
    } catch {}
    setIsValidated(false);
    setCurrentKey(null);
    setExpiresAt(null);
    setPlan(null);
    localStorage.removeItem(`apikey_validated_${user.id}`);
    localStorage.removeItem(`apikey_key_${user.id}`);
    localStorage.removeItem(`apikey_expires_${user.id}`);
    localStorage.removeItem(`apikey_plan_${user.id}`);
  }, [user, currentKey]);

  // Calculate remaining ms for license expiration
  const getRemainingMs = useCallback(() => {
    if (!expiresAt) return null; // null = no expiration (lifetime)
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, diff);
  }, [expiresAt]);

  return { isValidated, isLoading, error, currentKey, expiresAt, plan, validateKey, autoApply, generateKey, releaseKey, getRemainingMs };
};
