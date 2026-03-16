
-- Social media accounts linked to companies
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'instagram',
  profile_name TEXT NOT NULL DEFAULT '',
  profile_url TEXT NOT NULL DEFAULT '',
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  posts_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, platform, profile_name)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access social_accounts" ON public.social_accounts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view social_accounts for permitted companies" ON public.social_accounts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_permissions
    WHERE company_permissions.company_id = social_accounts.company_id::text
    AND company_permissions.user_id = auth.uid()
    AND company_permissions.granted = true
  ));

-- Social media metrics history
CREATE TABLE IF NOT EXISTS public.social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, date)
);

ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access social_metrics" ON public.social_metrics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view social_metrics" ON public.social_metrics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM social_accounts sa
    JOIN company_permissions cp ON cp.company_id = sa.company_id::text
    WHERE sa.id = social_metrics.account_id
    AND cp.user_id = auth.uid()
    AND cp.granted = true
  ));
