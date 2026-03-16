
-- Add columns to companies for archive and reorder
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Table for admin TOTP secrets (2FA)
CREATE TABLE IF NOT EXISTS public.admin_totp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_secret TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.admin_totp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own TOTP" ON public.admin_totp
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
