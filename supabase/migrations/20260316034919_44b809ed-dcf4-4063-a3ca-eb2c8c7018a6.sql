
-- SEC-1: Create app_config table for admin email (remove hardcoded email)
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON public.app_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_config (key, value) VALUES ('admin_email', 'mateusyolo@agenciaskills.com.br')
ON CONFLICT (key) DO NOTHING;

-- Update handle_new_user to use app_config
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _admin_email TEXT;
BEGIN
  SELECT value INTO _admin_email FROM public.app_config WHERE key = 'admin_email';

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  IF NEW.email = _admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- SEC-4: Fix use_invite to prevent multiple uses per user
CREATE OR REPLACE FUNCTION public.use_invite(_code TEXT, _user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM invites WHERE used_by = _user_id) THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO _invite FROM public.invites WHERE code = _code;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF _invite.use_count >= _invite.max_uses THEN RETURN FALSE; END IF;
  IF _invite.expires_at IS NOT NULL AND _invite.expires_at < now() THEN RETURN FALSE; END IF;

  UPDATE public.invites
  SET use_count = use_count + 1, used_by = _user_id, used_at = now()
  WHERE id = _invite.id;

  RETURN TRUE;
END;
$$;

-- Drop unused tables from Site Editor Pro
DROP TABLE IF EXISTS public.trial_sessions CASCADE;
DROP TABLE IF EXISTS public.project_versions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.section_templates CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
