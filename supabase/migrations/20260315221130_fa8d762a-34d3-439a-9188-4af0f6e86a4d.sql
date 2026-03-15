
-- 1. Add agency_fee columns to budget_entries
ALTER TABLE public.budget_entries 
  ADD COLUMN agency_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN agency_fee_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- 2. Agency expenses table (independent, admin-only)
CREATE TABLE public.agency_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'geral',
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access agency_expenses" ON public.agency_expenses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_agency_expenses_updated_at
  BEFORE UPDATE ON public.agency_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Agency revenue categories (customizable by admin)
CREATE TABLE public.agency_revenue_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  icon text NOT NULL DEFAULT 'circle',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_revenue_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access agency_revenue_categories" ON public.agency_revenue_categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Agency manual revenues (consultorias, bônus, etc.)
CREATE TABLE public.agency_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.agency_revenue_categories(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access agency_revenues" ON public.agency_revenues
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_agency_revenues_updated_at
  BEFORE UPDATE ON public.agency_revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
