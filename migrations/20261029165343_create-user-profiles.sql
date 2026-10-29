-- App profile: the UUID is the same identity managed by InsForge Auth.
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Replace any platform-generated default policies with the exact owner rules.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.users', p.policyname);
  END LOOP;
END;
$$;

REVOKE ALL ON public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE (name) ON public.users TO authenticated;

CREATE POLICY users_owner_select ON public.users
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY users_owner_update ON public.users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- Copy existing email-based identities; passwords remain in auth.users.
INSERT INTO public.users (id, name, email, created_at)
SELECT id, profile ->> 'name', email, created_at
FROM auth.users WHERE email IS NOT NULL;

-- Call after sign-in to create the profile or refresh its auth identity email.
-- No caller-supplied ID/email can override the authenticated identity.
CREATE FUNCTION public.ensure_user_profile()
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  profile_row public.users;
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.users (id, name, email, created_at)
  SELECT id, profile ->> 'name', email, created_at FROM auth.users
  WHERE id = current_user_id AND email IS NOT NULL
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  RETURNING * INTO profile_row;

  IF profile_row.id IS NULL THEN
    RAISE EXCEPTION 'An email-based authenticated account is required' USING ERRCODE = '42501';
  END IF;
  RETURN profile_row;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
