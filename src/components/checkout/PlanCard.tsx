import { Check, Loader2, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { PlanDefinition } from '@/lib/checkout';

interface PlanCardProps {
  plan: PlanDefinition;
  loadingPlanId: string | null;
  onCheckout: (planId: PlanDefinition['id']) => void;
  index?: number;
}

const planIcons = {
  monthly: Zap,
  yearly: Sparkles,
  lifetime: Crown,
};

const PlanCard = ({ plan, loadingPlanId, onCheckout, index = 0 }: PlanCardProps) => {
  const Icon = planIcons[plan.id] || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`
        group relative flex flex-col overflow-hidden rounded-2xl border
        backdrop-blur-xl transition-all duration-500
        ${plan.popular
          ? 'border-primary/40 bg-gradient-to-b from-[hsl(152_60%_8%)] via-card to-card shadow-[0_0_50px_hsl(var(--primary)/0.1)] hover:shadow-[0_0_70px_hsl(var(--primary)/0.18)]'
          : 'border-border/30 bg-card hover:border-primary/20 shadow-[0_2px_20px_hsl(220_40%_2%/0.5)]'
        }
        hover:-translate-y-1
      `}
    >
      {/* Top accent line */}
      {plan.popular && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      )}

      {/* Tags */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <span className="rounded-full bg-primary px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.45)]">
            ⭐ Mais Popular
          </span>
        </div>
      )}
      {plan.savings && (
        <div className="absolute -top-3.5 right-4 z-10">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
            {plan.savings}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-8 pt-10">
        {/* Icon + Name */}
        <div className="text-center">
          <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-muted/80 text-muted-foreground'}`}>
            <Icon size={18} />
          </div>
          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
          <p className="mt-1.5 text-[13px] text-muted-foreground">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="my-8 text-center">
          <div className="flex items-baseline justify-center">
            <span className="text-base font-medium text-muted-foreground mr-0.5">R$</span>
            <span className="text-5xl font-black tracking-tight text-foreground">
              {plan.displayPrice.toFixed(2).split('.')[0]}
            </span>
            <span className="text-lg font-bold text-foreground/50">
              .{plan.displayPrice.toFixed(2).split('.')[1]}
            </span>
          </div>
          <span className="mt-1.5 block text-xs font-medium text-muted-foreground">{plan.period}</span>
        </div>

        {/* Separator */}
        <div className={`mb-6 h-px ${plan.popular ? 'bg-gradient-to-r from-transparent via-primary/25 to-transparent' : 'bg-border/30'}`} />

        {/* Features */}
        <ul className="mb-8 flex-1 space-y-3.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
              <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary/80'}`}>
                <Check size={10} strokeWidth={3} />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          onClick={() => onCheckout(plan.id)}
          disabled={loadingPlanId !== null}
          size="lg"
          className={`
            w-full rounded-xl py-5 text-[13px] font-bold tracking-wide transition-all duration-300
            ${plan.popular
              ? 'bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_28px_hsl(var(--primary)/0.5)]'
              : 'border border-border/50 bg-muted/40 text-foreground hover:border-primary/30 hover:text-primary'
            }
          `}
          variant={plan.popular ? 'default' : 'outline'}
        >
          {loadingPlanId === plan.id ? <Loader2 size={16} className="animate-spin" /> : `Assinar ${plan.name}`}
        </Button>
      </div>
    </motion.div>
  );
};

export default PlanCard;
