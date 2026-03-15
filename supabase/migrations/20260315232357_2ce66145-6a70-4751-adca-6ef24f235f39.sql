
CREATE TABLE public.trash_bin (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type text NOT NULL DEFAULT '',
  item_id text NOT NULL DEFAULT '',
  item_name text NOT NULL DEFAULT '',
  item_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_by uuid NOT NULL,
  deleted_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trash_bin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access trash_bin" ON public.trash_bin
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
