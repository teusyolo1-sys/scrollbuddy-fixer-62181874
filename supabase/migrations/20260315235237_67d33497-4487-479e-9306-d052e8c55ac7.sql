
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users or admin can insert profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
);
