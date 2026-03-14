export interface DurationInput {
  days: number;
  hours: number;
  minutes: number;
}

export interface PlanDefinition {
  id: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  basePrice: number;
  displayPrice: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

export const MERCADO_PAGO_FEE_PERCENT = 0.0499;
export const MERCADO_PAGO_FEE_FIXED = 0.99;

const roundCurrency = (value: number) => Math.ceil(value * 100) / 100;

export const applyMercadoPagoFee = (basePrice: number) => {
  const gross = (basePrice + MERCADO_PAGO_FEE_FIXED) / (1 - MERCADO_PAGO_FEE_PERCENT);
  return roundCurrency(gross);
};

export const BASE_PLANS: PlanDefinition[] = [
  {
    id: 'monthly',
    name: 'Mensal',
    basePrice: 29,
    displayPrice: applyMercadoPagoFee(29),
    period: '/mês',
    description: 'Ideal para testar o editor com calma',
    features: [
      'Acesso completo ao editor visual',
      '1 dispositivo simultâneo',
      'Suporte por email',
      'Atualizações mensais',
      'Exportação ZIP ilimitada',
    ],
  },
  {
    id: 'yearly',
    name: 'Anual',
    basePrice: 249,
    displayPrice: applyMercadoPagoFee(249),
    period: '/ano',
    description: 'Melhor custo-benefício para profissionais',
    features: [
      'Tudo do plano Mensal',
      'Economia de R$99 no ano',
      'Suporte prioritário',
      'Acesso antecipado a novidades',
      'Templates exclusivos',
      'Projetos ilimitados',
    ],
    popular: true,
    savings: 'Economize R$99',
  },
  {
    id: 'lifetime',
    name: 'Vitalício',
    basePrice: 499,
    displayPrice: applyMercadoPagoFee(499),
    period: 'pagamento único',
    description: 'Pague uma vez, use para sempre',
    features: [
      'Tudo do plano Anual',
      'Acesso vitalício garantido',
      'Sem renovações ou cobranças',
      'Suporte VIP permanente',
      'Todas as atualizações futuras',
      'Prioridade em novos recursos',
    ],
  },
];

export const getDurationMs = ({ days, hours, minutes }: DurationInput) => {
  const safeDays = Math.max(0, Math.floor(days || 0));
  const safeHours = Math.max(0, Math.floor(hours || 0));
  const safeMinutes = Math.max(0, Math.floor(minutes || 0));

  return (
    safeDays * 24 * 60 * 60 * 1000 +
    safeHours * 60 * 60 * 1000 +
    safeMinutes * 60 * 1000
  );
};

export const getDurationHours = (duration: DurationInput) => {
  const ms = getDurationMs(duration);
  return ms / (60 * 60 * 1000);
};

export const formatDurationLabel = ({ days, hours, minutes }: DurationInput) => {
  const chunks: string[] = [];
  if (days > 0) chunks.push(`${days}d`);
  if (hours > 0) chunks.push(`${hours}h`);
  if (minutes > 0) chunks.push(`${minutes}min`);
  return chunks.length ? chunks.join(' ') : 'defina um tempo';
};

/**
 * Progressive pricing with volume discount.
 * - 1 hour base = R$5.00 (displays ~R$6.31 with fees)
 * - As hours increase, price per hour decreases logarithmically
 * - At 720h (30 days), total ≈ R$29 (monthly plan price)
 * 
 * Formula: basePrice = hourlyRate(totalHours) * totalHours
 * hourlyRate starts at R$5/h for 1h and decreases to ~R$0.04/h at 720h
 * Using: rate = 5 * (1 / totalHours)^0.38 which gives ~R$29 at 720h
 */
export const calculateCustomBasePrice = (duration: DurationInput) => {
  const totalHours = getDurationHours(duration);
  if (totalHours <= 0) return 0;

  // Base rate per hour at 1h = R$5.00
  const baseHourlyRate = 5;
  // Discount exponent - calibrated so 720h ≈ R$29
  // 5 * 720 * (1/720)^0.38 = 5 * 720^(1-0.38) = 5 * 720^0.62
  // 720^0.62 ≈ 58 → 5 * 58 ≈ 290... too high
  // Let's use: total = baseHourlyRate * totalHours^0.62
  // At 1h: 5 * 1 = 5 ✓
  // At 720h: 5 * 720^0.62 = 5 * ~57.8 = ~289... 
  // Need: 5 * 720^x = 29 → 720^x = 5.8 → x = ln(5.8)/ln(720) = 1.758/6.579 = 0.267
  // At 1h: 5 * 1^0.267 = 5 ✓
  // At 24h: 5 * 24^0.267 = 5 * 2.56 = 12.8
  // At 720h: 5 * 720^0.267 = 5 * 5.8 = 29 ✓
  const exponent = 0.267;
  const total = baseHourlyRate * Math.pow(totalHours, exponent);

  return roundCurrency(Math.max(3, total));
};

export const calculateCustomDisplayPrice = (duration: DurationInput) => {
  const base = calculateCustomBasePrice(duration);
  return base > 0 ? applyMercadoPagoFee(base) : 0;
};

/** Get effective hourly rate for display */
export const getEffectiveHourlyRate = (duration: DurationInput) => {
  const totalHours = getDurationHours(duration);
  if (totalHours <= 0) return 0;
  const base = calculateCustomBasePrice(duration);
  return roundCurrency(base / totalHours);
};

/** Get discount percentage compared to 1h rate */
export const getDiscountPercent = (duration: DurationInput) => {
  const totalHours = getDurationHours(duration);
  if (totalHours <= 1) return 0;
  const oneHourRate = 5; // base rate for 1h
  const effectiveRate = calculateCustomBasePrice(duration) / totalHours;
  return Math.round((1 - effectiveRate / oneHourRate) * 100);
};
