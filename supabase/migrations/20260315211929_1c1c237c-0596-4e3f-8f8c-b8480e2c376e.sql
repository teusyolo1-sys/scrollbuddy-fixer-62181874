
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID NOT NULL,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can validate an invite code
CREATE POLICY "Anyone can validate invite codes"
  ON public.invites
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can create invites
CREATE POLICY "Admins can create invites"
  ON public.invites
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update invites
CREATE POLICY "Admins can update invites"
  ON public.invites
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete invites
CREATE POLICY "Admins can delete invites"
  ON public.invites
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to validate and consume an invite (security definer so anon can call it)
CREATE OR REPLACE FUNCTION public.use_invite(_code TEXT, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
BEGIN
  SELECT * INTO _invite FROM public.invites WHERE code = _code;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF _invite.use_count >= _invite.max_uses THEN
    RETURN FALSE;
  END IF;
  
  IF _invite.expires_at IS NOT NULL AND _invite.expires_at < now() THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.invites 
  SET use_count = use_count + 1, used_by = _user_id, used_at = now()
  WHERE id = _invite.id;
  
  RETURN TRUE;
END;
$$;

-- Function to validate an invite without consuming it
CREATE OR REPLACE FUNCTION public.validate_invite(_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
BEGIN
  SELECT * INTO _invite FROM public.invites WHERE code = _code;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF _invite.use_count >= _invite.max_uses THEN RETURN FALSE; END IF;
  IF _invite.expires_at IS NOT NULL AND _invite.expires_at < now() THEN RETURN FALSE; END IF;
  
  RETURN TRUE;
END;
$$;
