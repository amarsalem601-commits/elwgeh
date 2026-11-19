CREATE TABLE public.ai_assistant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assistant_type TEXT NOT NULL CHECK (assistant_type IN ('erp', 'design')),
  title TEXT NOT NULL DEFAULT 'محادثة جديدة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.ai_assistant_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE UPDATE, DELETE ON public.ai_assistant_threads FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.ai_assistant_threads TO authenticated;
GRANT ALL ON public.ai_assistant_threads TO service_role;
ALTER TABLE public.ai_assistant_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own assistant threads"
ON public.ai_assistant_threads
FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Users create their own assistant threads"
ON public.ai_assistant_threads
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete their own assistant threads"
ON public.ai_assistant_threads
FOR DELETE TO authenticated
USING (user_id = auth.uid());

REVOKE UPDATE, DELETE ON public.ai_assistant_messages FROM authenticated;
GRANT SELECT, INSERT ON public.ai_assistant_messages TO authenticated;
GRANT ALL ON public.ai_assistant_messages TO service_role;
ALTER TABLE public.ai_assistant_messages ENABLE ROW LEVEL SECURITY;
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
AND EXISTS (
  SELECT 1 FROM public.ai_assistant_threads t
  WHERE t.id = thread_id AND t.user_id = auth.uid()
)
);

CREATE INDEX ai_assistant_threads_owner_updated_idx
ON public.ai_assistant_threads(user_id, updated_at DESC);
CREATE INDEX ai_assistant_messages_thread_created_idx
ON public.ai_assistant_messages(thread_id, created_at);