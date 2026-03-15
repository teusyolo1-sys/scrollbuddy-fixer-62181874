
CREATE TABLE public.task_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  role_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Qualidade',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_complaints ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert complaints
CREATE POLICY "Authenticated users can insert complaints"
  ON public.task_complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Only admins can read complaints
CREATE POLICY "Only admins can view complaints"
  ON public.task_complaints
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete complaints
CREATE POLICY "Only admins can delete complaints"
  ON public.task_complaints
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
