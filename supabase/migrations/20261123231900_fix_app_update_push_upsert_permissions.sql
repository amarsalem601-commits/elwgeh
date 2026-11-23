CREATE OR REPLACE FUNCTION public.register_app_update_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_endpoint IS NULL
    OR p_p256dh IS NULL
    OR p_auth IS NULL
    OR p_endpoint !~ '^https://([a-z0-9-]+\.)*(fcm\.googleapis\.com|push\.services\.mozilla\.com|web\.push\.apple\.com|notify\.windows\.com)(/|$)'
    OR char_length(p_p256dh) NOT BETWEEN 40 AND 200
    OR char_length(p_auth) NOT BETWEEN 10 AND 100
  THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid app update push subscription';
  END IF;

  INSERT INTO public.app_update_push_subscriptions (endpoint, p256dh, auth, updated_at)
  VALUES (p_endpoint, p_p256dh, p_auth, now())
  ON CONFLICT (endpoint) DO UPDATE
  SET p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      updated_at = EXCLUDED.updated_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.register_app_update_push_subscription(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_app_update_push_subscription(TEXT, TEXT, TEXT) TO anon, authenticated;
REVOKE ALL ON TABLE public.app_update_push_subscriptions FROM anon, authenticated;
