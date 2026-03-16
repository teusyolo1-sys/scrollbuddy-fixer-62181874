ALTER TABLE public.team_activities ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'default';
ALTER TABLE public.task_complaints ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'default';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS company_id TEXT;