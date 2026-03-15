
-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Nova Empresa',
  subtitle text NOT NULL DEFAULT 'Gestão operacional',
  month text NOT NULL DEFAULT '',
  banner_url text,
  logo_url text,
  color text NOT NULL DEFAULT '#007AFF',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access to companies" ON public.companies
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can view companies they have permission for
CREATE POLICY "Users can view permitted companies" ON public.companies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_permissions
      WHERE company_permissions.company_id = companies.id::text
        AND company_permissions.user_id = auth.uid()
        AND company_permissions.granted = true
    )
  );

-- Add company_data JSONB column to store all dashboard data per company
ALTER TABLE public.companies ADD COLUMN company_data jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
