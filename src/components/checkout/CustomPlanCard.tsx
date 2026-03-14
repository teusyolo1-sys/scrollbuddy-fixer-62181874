import { Clock, Loader2, Timer, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { DurationInput } from '@/lib/checkout';
import { getDiscountPercent, getDurationHours } from '@/lib/checkout';

interface CustomPlanCardProps {
  duration: DurationInput;
  onDurationChange: (patch: Partial<DurationInput>) => void;
  customPrice: number;
  loadingPlanId: string | null;
  onCheckout: () => void;
}

const CustomPlanCard = ({ duration, onDurationChange, customPrice, loadingPlanId, onCheckout }: CustomPlanCardProps) => {
  const fields = [
    { label: 'Dias', value: duration.days, key: 'days' as const, max: 30 },
    { label: 'Horas', value: duration.hours, key: 'hours' as const, max: 23 },
    { label: 'Minutos', value: duration.minutes, key: 'minutes' as const, max: 59 },
  ];

  const discount = getDiscountPercent(duration);
  const totalHours = getDurationHours(duration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35 }}
      className="overflow-hidden rounded-2xl border border-primary/15 bg-card backdrop-blur-xl shadow-[0_2px_30px_hsl(220_40%_2%/0.5)]"
    >
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Timer size={18} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Acesso Personalizado</h3>
          <p className="max-w-sm text-center text-[13px] text-muted-foreground">
            Monte seu próprio tempo — quanto mais tempo, maior o desconto
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {fields.map((field) => (
            <div key={field.key} className="text-center">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {field.label}
              </label>
              <input
                type="number"
                min={0}
                max={field.max}
                value={field.value}
                onChange={(e) =>
                  onDurationChange({ [field.key]: Math.min(field.max, Math.max(0, Number(e.target.value) || 0)) })
                }
                className="w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-3.5 text-center text-xl font-bold text-foreground outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          ))}
        </div>

        {/* Discount badge */}
        {discount > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <TrendingDown size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">
              {discount}% de desconto por volume
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({totalHours.toFixed(1)}h total)
            </span>
          </div>
        )}

        <div className="my-7 rounded-xl border border-border/20 bg-muted/20 p-5 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valor total</span>
          <div className="mt-1.5 flex items-baseline justify-center">
            <span className="text-base font-medium text-muted-foreground mr-0.5">R$</span>
            <span className="text-4xl font-black tracking-tight text-foreground">
              {customPrice.toFixed(2).split('.')[0]}
            </span>
            <span className="text-lg font-bold text-foreground/50">
              .{customPrice.toFixed(2).split('.')[1]}
            </span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full rounded-xl py-5 text-[13px] font-bold tracking-wide shadow-[0_4px_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_6px_28px_hsl(var(--primary)/0.5)] transition-all duration-300"
          disabled={loadingPlanId !== null || customPrice <= 0}
          onClick={onCheckout}
        >
          {loadingPlanId === 'custom' ? <Loader2 size={16} className="animate-spin" /> : (
            <span className="flex items-center gap-2">
              <Clock size={15} />
              Gerar pagamento personalizado
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default CustomPlanCard;
