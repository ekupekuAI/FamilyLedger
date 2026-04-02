/*
  Fix PostgreSQL error 42P17: infinite recursion detected in policy for relation "family_members".

  Policies must not subquery the same table they protect. Use SECURITY DEFINER helpers that
  read family_members without RLS re-entry.
*/

-- Helper: family IDs the current user belongs to (bypasses RLS)
CREATE OR REPLACE FUNCTION public.fl_user_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid();
$$;

-- Helper: user IDs in any family the current user belongs to (bypasses RLS)
CREATE OR REPLACE FUNCTION public.fl_coworker_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fm.user_id
  FROM public.family_members fm
  WHERE fm.family_id IN (
    SELECT x.family_id FROM public.family_members x WHERE x.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.fl_user_family_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fl_coworker_user_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fl_user_family_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fl_coworker_user_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.lookup_family_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  name text,
  family_code text,
  created_by uuid,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id, f.name, f.family_code, f.created_by, f.created_at
  FROM public.families f
  WHERE upper(trim(f.family_code)) = upper(trim(p_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_family_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_family_by_code(text) TO authenticated;

-- Drop policies that reference family_members directly
DROP POLICY IF EXISTS "profiles_select_family" ON profiles;
DROP POLICY IF EXISTS "families_select_member" ON families;
DROP POLICY IF EXISTS "family_members_select" ON family_members;
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;
DROP POLICY IF EXISTS "notifications_insert_family" ON notifications;

CREATE POLICY "profiles_select_family"
  ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR id IN (SELECT public.fl_coworker_user_ids())
  );

CREATE POLICY "families_select_member"
  ON families FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (SELECT public.fl_user_family_ids())
  );

CREATE POLICY "family_members_select"
  ON family_members FOR SELECT TO authenticated
  USING (family_id IN (SELECT public.fl_user_family_ids()));

CREATE POLICY "transactions_select"
  ON transactions FOR SELECT TO authenticated
  USING (family_id IN (SELECT public.fl_user_family_ids()));

CREATE POLICY "transactions_insert"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (family_id IN (SELECT public.fl_user_family_ids()));

CREATE POLICY "transactions_update"
  ON transactions FOR UPDATE TO authenticated
  USING (family_id IN (SELECT public.fl_user_family_ids()))
  WITH CHECK (family_id IN (SELECT public.fl_user_family_ids()));

CREATE POLICY "transactions_delete"
  ON transactions FOR DELETE TO authenticated
  USING (family_id IN (SELECT public.fl_user_family_ids()));

CREATE POLICY "notifications_insert_family"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    family_id IN (SELECT public.fl_user_family_ids())
    AND user_id IN (SELECT public.fl_coworker_user_ids())
  );
