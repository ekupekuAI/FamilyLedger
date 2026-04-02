/*
  FamilyLedger — user-based schema (Supabase)
*/

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS families CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles (must exist before auth trigger)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  family_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('parent', 'child', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (family_id, user_id)
);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES auth.users,
  to_user_id uuid REFERENCES auth.users,
  amount decimal(12, 2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('money_sent', 'expense', 'settlement')),
  category text,
  description text,
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT tx_money_sent CHECK (
    type <> 'money_sent' OR (
      from_user_id IS NOT NULL AND to_user_id IS NOT NULL AND from_user_id <> to_user_id
    )
  ),
  CONSTRAINT tx_expense CHECK (
    type <> 'expense' OR (from_user_id IS NOT NULL)
  ),
  CONSTRAINT tx_settlement CHECK (
    type <> 'settlement' OR (
      from_user_id IS NOT NULL AND to_user_id IS NOT NULL AND from_user_id <> to_user_id
    )
  )
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_family_members_family_id ON family_members (family_id);
CREATE INDEX idx_family_members_user_id ON family_members (user_id);
CREATE INDEX idx_transactions_family_id ON transactions (family_id);
CREATE INDEX idx_transactions_created ON transactions (family_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_family ON notifications (family_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS helpers (SECURITY DEFINER avoids infinite recursion when policies subquery family_members)
CREATE OR REPLACE FUNCTION public.fl_user_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid();
$$;

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

-- Join flow: user is not a member yet, so cannot read families via RLS — lookup by code only (SECURITY DEFINER)
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

CREATE POLICY "profiles_select_family"
  ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR id IN (SELECT public.fl_coworker_user_ids())
  );

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- families
CREATE POLICY "families_select_member"
  ON families FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (SELECT public.fl_user_family_ids())
  );

CREATE POLICY "families_insert"
  ON families FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "families_update_creator"
  ON families FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "families_delete_creator"
  ON families FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- family_members
CREATE POLICY "family_members_select"
  ON family_members FOR SELECT TO authenticated
  USING (family_id IN (SELECT public.fl_user_family_ids()));

CREATE POLICY "family_members_insert_self"
  ON family_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "family_members_update_self"
  ON family_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "family_members_delete"
  ON family_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
  );

-- transactions
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

-- notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_family"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    family_id IN (SELECT public.fl_user_family_ids())
    AND user_id IN (SELECT public.fl_coworker_user_ids())
  );

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
