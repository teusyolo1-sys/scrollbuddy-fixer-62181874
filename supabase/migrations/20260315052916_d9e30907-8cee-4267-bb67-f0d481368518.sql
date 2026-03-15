
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
