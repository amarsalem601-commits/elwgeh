-- Delete admin@gmail.com and all linked application records.
-- This is safer than deleting only auth.users because related tables would otherwise remain orphaned.

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
    RAISE NOTICE 'admin@gmail.com was not found';
    RETURN;
  END IF;

  DELETE FROM public.attendance WHERE user_id = v_user_id;
  DELETE FROM public.location_tracking WHERE user_id = v_user_id;
  DELETE FROM public.expenses WHERE user_id = v_user_id;
  DELETE FROM public.salaries WHERE user_id = v_user_id;
  DELETE FROM public.tasks WHERE assigned_to = v_user_id OR assigned_by = v_user_id;
  DELETE FROM public.notifications WHERE user_id = v_user_id;
  DELETE FROM public.salary_advances WHERE user_id = v_user_id;
  DELETE FROM public.employee_permissions WHERE user_id = v_user_id;
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE user_id = v_user_id;
  DELETE FROM public.ai_assistant_threads WHERE user_id = v_user_id;

  DELETE FROM auth.identities
  WHERE user_id = v_user_id;

  DELETE FROM auth.users
  WHERE id = v_user_id;

  RAISE NOTICE 'Deleted admin@gmail.com';
END $$;
