CREATE TABLE IF NOT EXISTS public.ai_assistant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assistant_type TEXT NOT NULL CHECK (assistant_type IN ('erp', 'design')),
  title TEXT NOT NULL DEFAULT 'محادثة جديدة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.ai_assistant_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  action JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE UPDATE, DELETE ON public.ai_assistant_threads FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.ai_assistant_threads TO authenticated;
GRANT ALL ON public.ai_assistant_threads TO service_role;
REVOKE UPDATE, DELETE ON public.ai_assistant_messages FROM authenticated;
GRANT SELECT, INSERT ON public.ai_assistant_messages TO authenticated;
GRANT ALL ON public.ai_assistant_messages TO service_role;

ALTER TABLE public.ai_assistant_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own assistant threads" ON public.ai_assistant_threads;
DROP POLICY IF EXISTS "Users view their own assistant threads" ON public.ai_assistant_threads;
DROP POLICY IF EXISTS "Users create their own assistant threads" ON public.ai_assistant_threads;
CREATE POLICY "Users view their own assistant threads"
ON public.ai_assistant_threads
FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Users create their own assistant threads"
ON public.ai_assistant_threads
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete their own assistant threads" ON public.ai_assistant_threads;
CREATE POLICY "Users delete their own assistant threads"
ON public.ai_assistant_threads
FOR DELETE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage messages in their own assistant threads" ON public.ai_assistant_messages;
DROP POLICY IF EXISTS "Users view messages in their own assistant threads" ON public.ai_assistant_messages;
DROP POLICY IF EXISTS "Users insert messages in their own assistant threads" ON public.ai_assistant_messages;
CREATE POLICY "Users view messages in their own assistant threads"
ON public.ai_assistant_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_assistant_threads t
    WHERE t.id = thread_id AND t.user_id = auth.uid()
  )
);
CREATE POLICY "Users insert messages in their own assistant threads"
ON public.ai_assistant_messages
FOR INSERT TO authenticated
WITH CHECK (
  role = 'user'
  AND
  EXISTS (
    SELECT 1 FROM public.ai_assistant_threads t
    WHERE t.id = thread_id AND t.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS ai_assistant_threads_owner_updated_idx
ON public.ai_assistant_threads(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ai_assistant_messages_thread_created_idx
ON public.ai_assistant_messages(thread_id, created_at);

INSERT INTO public.repair_page_settings (setting_key, setting_value)
VALUES (
  'global_theme',
  '{"primary":"0 72% 51%","primaryForeground":"0 0% 100%","background":"220 25% 97%","foreground":"222 47% 11%","card":"0 0% 100%","border":"220 16% 88%","darkBackground":"222 47% 7%","darkForeground":"220 20% 96%","darkCard":"222 38% 10%","darkBorder":"222 24% 18%","radius":"0.875rem","font":"Cairo"}'
)
ON CONFLICT (setting_key) DO NOTHING;
