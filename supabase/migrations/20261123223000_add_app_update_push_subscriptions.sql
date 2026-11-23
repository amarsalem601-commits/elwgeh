CREATE TABLE public.app_update_push_subscriptions (
  endpoint TEXT PRIMARY KEY CHECK (endpoint LIKE 'https://%'),
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_update_push_subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_update_push_subscriptions FROM anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.app_update_push_subscriptions TO anon, authenticated;
GRANT ALL ON TABLE public.app_update_push_subscriptions TO service_role;

CREATE POLICY "Devices can register app update push subscriptions"
ON public.app_update_push_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  endpoint LIKE 'https://%'
  AND char_length(p256dh) BETWEEN 40 AND 200
  AND char_length(auth) BETWEEN 10 AND 100
);

CREATE POLICY "Devices can refresh app update push subscriptions"
ON public.app_update_push_subscriptions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  endpoint LIKE 'https://%'
  AND char_length(p256dh) BETWEEN 40 AND 200
  AND char_length(auth) BETWEEN 10 AND 100
);

CREATE INDEX app_update_push_subscriptions_updated_at_idx
ON public.app_update_push_subscriptions(updated_at DESC);
