
CREATE TABLE public.team_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view team activities"
  ON public.team_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert team activities"
  ON public.team_activities FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update team activities"
  ON public.team_activities FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete team activities"
  ON public.team_activities FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
