-- Run this only after the admin account is created from Supabase Dashboard.
-- It repairs profile and administrator role for admin@gmail.com.

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE lower(email) = 'admin@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Create admin@gmail.com first from Authentication > Users in Supabase Dashboard.';
  END IF;

  INSERT INTO public.profiles (user_id, name, phone)
  VALUES (v_user_id, 'Admin', '')
  ON CONFLICT (user_id)
  DO UPDATE SET name = 'Admin', phone = '';

  DELETE FROM public.user_roles
  WHERE user_id = v_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');
END $$;

SELECT u.id, u.email, u.email_confirmed_at, r.role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE lower(u.email) = 'admin@gmail.com';
