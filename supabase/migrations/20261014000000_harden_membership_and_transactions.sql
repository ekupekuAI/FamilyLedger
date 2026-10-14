/*
  Data-isolation fixes (safe on an existing database; nothing is dropped).

  1. Joining a family goes through join_family_by_code(), which checks the code
     server-side. Before, any signed-in user could insert themselves into any family_id,
     and could UPDATE their own membership row to move into another family.
  2. Transactions may only reference members of the caller's family, "money_sent" must be
     sent by the caller, and only the creator of a row can edit or delete it.
*/

-- family_members ------------------------------------------------------------
DROP POLICY IF EXISTS "family_members_update_self" ON family_members;
DROP POLICY IF EXISTS "family_members_insert_self" ON family_members;
DROP POLICY IF EXISTS "family_members_insert_creator" ON family_members;

-- Direct inserts only for a family's creator adding themselves (the "create family" flow).
CREATE POLICY "family_members_insert_creator"
  ON family_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND family_id IN (SELECT f.id FROM families f WHERE f.created_by = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.join_family_by_code(
  p_code text,
  p_role text DEFAULT 'member',
  p_display_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_family uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
  END IF;

  SELECT f.id INTO v_family
  FROM public.families f
  WHERE upper(trim(f.family_code)) = upper(trim(p_code))
  LIMIT 1;

  IF v_family IS NULL THEN
    -- PT404 makes PostgREST answer 404 instead of 500.
    RAISE EXCEPTION 'Family not found' USING ERRCODE = 'PT404';
  END IF;

  IF EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.user_id = v_uid) THEN
    RAISE EXCEPTION 'You already belong to a family' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family, v_uid, CASE WHEN p_role IN ('parent', 'child') THEN p_role ELSE 'member' END);

  IF p_display_name IS NOT NULL AND length(trim(p_display_name)) > 0 THEN
    INSERT INTO public.profiles (id, display_name)
    VALUES (v_uid, left(trim(p_display_name), 80))
    ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now();
  END IF;

  RETURN v_family;
END;
$$;

REVOKE ALL ON FUNCTION public.join_family_by_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_family_by_code(text, text, text) TO authenticated;

-- The old lookup returned family id/name for any guessed code; joining no longer needs it.
REVOKE EXECUTE ON FUNCTION public.lookup_family_by_code(text) FROM authenticated;

-- transactions --------------------------------------------------------------
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users DEFAULT auth.uid();

DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

CREATE POLICY "transactions_insert"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (
    family_id IN (SELECT public.fl_user_family_ids())
    AND created_by = auth.uid()
    AND (from_user_id IS NULL OR from_user_id IN (SELECT public.fl_coworker_user_ids()))
    AND (to_user_id IS NULL OR to_user_id IN (SELECT public.fl_coworker_user_ids()))
    AND (type <> 'money_sent' OR from_user_id = auth.uid())
  );

CREATE POLICY "transactions_update"
  ON transactions FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND family_id IN (SELECT public.fl_user_family_ids()))
  WITH CHECK (
    created_by = auth.uid()
    AND family_id IN (SELECT public.fl_user_family_ids())
    AND (from_user_id IS NULL OR from_user_id IN (SELECT public.fl_coworker_user_ids()))
    AND (to_user_id IS NULL OR to_user_id IN (SELECT public.fl_coworker_user_ids()))
    AND (type <> 'money_sent' OR from_user_id = auth.uid())
  );

CREATE POLICY "transactions_delete"
  ON transactions FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND family_id IN (SELECT public.fl_user_family_ids()));
