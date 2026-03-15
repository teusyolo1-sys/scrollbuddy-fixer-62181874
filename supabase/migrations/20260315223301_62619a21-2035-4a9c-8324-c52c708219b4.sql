
-- Agency Invoices: controle ERP completo de cobranças
CREATE TABLE public.agency_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_date DATE,
  payment_method TEXT DEFAULT '', -- pix, boleto, cartao, transferencia
  invoice_number TEXT DEFAULT '',
  recurrence TEXT DEFAULT 'monthly', -- once, monthly, quarterly, yearly
  notes TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'fee', -- fee, consultoria, bonus, projeto, outro
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER update_agency_invoices_updated_at
  BEFORE UPDATE ON public.agency_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.agency_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access agency_invoices"
  ON public.agency_invoices FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Agency Monthly Goals
CREATE TABLE public.agency_monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL, -- '2026-03'
  revenue_goal NUMERIC NOT NULL DEFAULT 0,
  profit_goal NUMERIC NOT NULL DEFAULT 0,
  clients_goal INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(month)
);

CREATE TRIGGER update_agency_monthly_goals_updated_at
  BEFORE UPDATE ON public.agency_monthly_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.agency_monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access agency_monthly_goals"
  ON public.agency_monthly_goals FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
