-- Recreate missing tables that the app depends on

-- api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  api_key TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT false,
  max_devices INT NOT NULL DEFAULT 1,
  active_ip TEXT,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  hostinger_synced BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own keys" ON public.api_keys FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own keys" ON public.api_keys FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own keys" ON public.api_keys FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Novo Projeto',
  html_content TEXT,
  zip_file_path TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (user_id = auth.uid());

-- project_versions table
CREATE TABLE IF NOT EXISTS public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  html_content TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own versions" ON public.project_versions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create versions" ON public.project_versions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own versions" ON public.project_versions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- section_templates table
CREATE TABLE IF NOT EXISTS public.section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  description TEXT,
  html_content TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.section_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view templates" ON public.section_templates FOR SELECT TO authenticated USING (true);

-- trial_sessions table
CREATE TABLE IF NOT EXISTS public.trial_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expired BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.trial_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trials" ON public.trial_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create trials" ON public.trial_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own trials" ON public.trial_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());