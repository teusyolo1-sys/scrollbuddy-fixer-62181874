import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const TRIAL_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const useTrial = () => {
  const { user } = useAuth();
  const [trialStarted, setTrialStarted] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [remainingMs, setRemainingMs] = useState(TRIAL_DURATION_MS);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load trial session from DB
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from('trial_sessions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const elapsed = Date.now() - new Date(data.started_at).getTime();
        if (elapsed >= TRIAL_DURATION_MS || data.expired) {
          setTrialStarted(true);
          setTrialExpired(true);
          setRemainingMs(0);
          if (!data.expired) {
            await supabase.from('trial_sessions').update({ expired: true }).eq('user_id', user.id);
          }
        } else {
          setTrialStarted(true);
          setRemainingMs(TRIAL_DURATION_MS - elapsed);
        }
      } else {
        // No trial yet — show modal
        setShowTrialModal(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (!trialStarted || trialExpired) return;

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          setTrialExpired(true);
          clearInterval(interval);
          if (user) {
            supabase.from('trial_sessions').update({ expired: true }).eq('user_id', user.id);
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trialStarted, trialExpired, user]);

  const startTrial = useCallback(async () => {
    if (!user) return;
    await supabase.from('trial_sessions').insert({ user_id: user.id });
    setTrialStarted(true);
    setRemainingMs(TRIAL_DURATION_MS);
    setShowTrialModal(false);
  }, [user]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return {
    trialStarted,
    trialExpired,
    remainingMs,
    timeString,
    showTrialModal,
    startTrial,
    loading,
    setShowTrialModal,
  };
};
