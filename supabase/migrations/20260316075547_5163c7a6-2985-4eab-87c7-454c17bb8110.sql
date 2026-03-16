
CREATE TABLE public.company_drive_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  drive_folder_id TEXT NOT NULL DEFAULT '',
  folder_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_drive_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.company_drive_folders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own company folders" ON public.company_drive_folders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_permissions
      WHERE company_permissions.company_id = company_drive_folders.company_id::text
        AND company_permissions.user_id = auth.uid()
        AND company_permissions.granted = true
    )
  );
