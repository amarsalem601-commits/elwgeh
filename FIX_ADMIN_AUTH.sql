-- Diagnose and repair admin login after manual SQL creation
SELECT id, email, role, email_confirmed_at, encrypted_password IS NOT NULL AS has_password
FROM auth.users
WHERE lower(email) = 'admin@gmail.com';

SELECT id, user_id, provider, provider_id
FROM auth.identities
WHERE lower(identity_data->>'email') = 'admin@gmail.com';

SELECT id, user_id, role
FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com'
);

-- Delete malformed auth row so it can be recreated safely from Authentication > Users
DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com'
);

DELETE FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com'
);

DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com'
);

DELETE FROM auth.users
WHERE lower(email) = 'admin@gmail.com';
