-- Create or update the requested admin account in Supabase Auth
-- Run with: SET app.admin_password = 'replace-with-a-strong-password';
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@gmail.com',
      crypt(current_setting('app.admin_password', true), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Admin","phone":""}'::jsonb,
      now(),
      now()
    )
    RETURNING id INTO v_user_id;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt(current_setting('app.admin_password', true), gen_salt('bf')),
      email_confirmed_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"name":"Admin","phone":""}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  UPDATE auth.identities
  SET
    identity_data = jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'admin@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    last_sign_in_at = now(),
    updated_at = now()
  WHERE user_id = v_user_id
    AND provider = 'email';

  IF NOT FOUND THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@gmail.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  INSERT INTO public.profiles (user_id, name, phone)
  VALUES (v_user_id, 'Admin', '')
  ON CONFLICT (user_id)
  DO UPDATE SET
    name = 'Admin',
    phone = '';

  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');
END $$;
