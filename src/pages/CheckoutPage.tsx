import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Lock, QrCode, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlanCard from '@/components/checkout/PlanCard';
import CustomPlanCard from '@/components/checkout/CustomPlanCard';
import {
  BASE_PLANS,
  calculateCustomDisplayPrice,
  formatDurationLabel,
  type DurationInput,
} from '@/lib/checkout';

const CheckoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState<DurationInput>({ days: 0, hours: 1, minutes: 0 });

  const customPrice = useMemo(() => calculateCustomDisplayPrice(customDuration), [customDuration]);

  // Enable scrolling on this page (body has overflow:hidden globally)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCheckout = async (planId: 'monthly' | 'yearly' | 'lifetime' | 'custom') => {
    if (!user) {
      toast.error('Faça login primeiro');
      navigate('/auth');
      return;
    }

    setLoadingPlanId(planId);

    try {
      const body =
        planId === 'custom'
          ? { plan: 'custom', custom_duration: customDuration }
          : { plan: planId };

      const { data, error } = await supabase.functions.invoke('mercadopago-pix', { body });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.details || data.error);

      if (data?.pix_qr_code) {
        navigate('/checkout/pix', { state: data });
      } else {
        toast.error('Erro ao gerar PIX');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao processar pagamento');
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-200px] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-100px] right-[-200px] h-[500px] w-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-border/20 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-8 py-4">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-base font-bold text-foreground">Escolha seu Plano</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-8 py-20 lg:py-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-20 lg:mb-28 text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-5 py-2 text-xs font-semibold text-primary">
            <Lock size={12} />
            Pagamento 100% seguro
          </div>

          <h2 className="mb-5 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
            Desbloqueie todo o
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              poder do editor
            </span>
          </h2>

          <p className="mx-auto max-w-lg text-base text-muted-foreground lg:text-lg leading-relaxed">
            Escolha o plano ideal para você. Opção personalizada por dias, horas e minutos.
          </p>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <QrCode size={14} className="text-primary" /> PIX
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard size={14} className="text-primary" /> Cartão
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" /> Boleto
            </div>
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {BASE_PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              loadingPlanId={loadingPlanId}
              onCheckout={(id) => handleCheckout(id)}
              index={i}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="mx-auto my-16 lg:my-20 flex max-w-xs items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/50" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">ou personalize</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/50" />
        </div>

        {/* Custom plan */}
        <div className="mx-auto max-w-2xl">
          <CustomPlanCard
            duration={customDuration}
            onDurationChange={(patch) => setCustomDuration((prev) => ({ ...prev, ...patch }))}
            customPrice={customPrice}
            loadingPlanId={loadingPlanId}
            onCheckout={() => handleCheckout('custom')}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Duração: <span className="font-bold text-primary">{formatDurationLabel(customDuration)}</span>
          </p>
        </div>

        {/* Footer trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-20 lg:mt-28 text-center pb-8"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-primary" /> Pagamento seguro
            </div>
            <div className="flex items-center gap-1.5">
              <Lock size={14} className="text-primary" /> Dados protegidos
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard size={14} className="text-primary" /> Mercado Pago
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/60">
            Cancele quando quiser • Suporte humanizado • Taxas já embutidas
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;
