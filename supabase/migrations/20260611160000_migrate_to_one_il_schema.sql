-- Migration: Create schema one_il and move tables from public to one_il

CREATE SCHEMA IF NOT EXISTS one_il;

-- Move enums safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'menu_item_visibility') THEN
    ALTER TYPE public.menu_item_visibility SET SCHEMA one_il;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'menu_item_implementation_status') THEN
    ALTER TYPE public.menu_item_implementation_status SET SCHEMA one_il;
  END IF;
END $$;

-- Move tables
ALTER TABLE IF EXISTS public.menu_groups SET SCHEMA one_il;
ALTER TABLE IF EXISTS public.menu_items SET SCHEMA one_il;
ALTER TABLE IF EXISTS public.user_change_requests SET SCHEMA one_il;
ALTER TABLE IF EXISTS public.user_menu_shortcuts SET SCHEMA one_il;

-- Recreate has_admin_role in one_il
CREATE OR REPLACE FUNCTION one_il.has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = one_il, one_leave, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM one_leave.user_roles ur
    WHERE ur.user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint
      AND ur.role_code = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION one_il.has_admin_role() TO authenticated;

-- Recreate RLS policies on one_il.menu_groups
ALTER TABLE one_il.menu_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS menu_groups_select_authenticated ON one_il.menu_groups;
CREATE POLICY menu_groups_select_authenticated
  ON one_il.menu_groups
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Recreate RLS policies on one_il.menu_items
ALTER TABLE one_il.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS menu_items_select_authenticated ON one_il.menu_items;
CREATE POLICY menu_items_select_authenticated
  ON one_il.menu_items
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'standard'
    OR (visibility = 'admin_only' AND one_il.has_admin_role())
  );

-- Recreate RLS policies on one_il.user_change_requests
ALTER TABLE one_il.user_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_change_requests_select_own ON one_il.user_change_requests;
CREATE POLICY user_change_requests_select_own
	ON one_il.user_change_requests
	FOR SELECT
	TO authenticated
	USING (
		user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint
		OR one_il.has_admin_role()
	);

DROP POLICY IF EXISTS user_change_requests_insert_own ON one_il.user_change_requests;
CREATE POLICY user_change_requests_insert_own
	ON one_il.user_change_requests
	FOR INSERT
	TO authenticated
	WITH CHECK (
		user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint
		AND status = 'pending'
	);

DROP POLICY IF EXISTS user_change_requests_delete_own ON one_il.user_change_requests;
CREATE POLICY user_change_requests_delete_own
	ON one_il.user_change_requests
	FOR DELETE
	TO authenticated
	USING (user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint AND status = 'pending');

DROP POLICY IF EXISTS user_change_requests_update_admin ON one_il.user_change_requests;
CREATE POLICY user_change_requests_update_admin
	ON one_il.user_change_requests
	FOR UPDATE
	TO authenticated
	USING (one_il.has_admin_role())
	WITH CHECK (one_il.has_admin_role());

-- Recreate RLS policies on one_il.user_menu_shortcuts (if created later)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'one_il' AND table_name = 'user_menu_shortcuts') THEN
    ALTER TABLE one_il.user_menu_shortcuts ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'DROP POLICY IF EXISTS user_menu_shortcuts_select_own ON one_il.user_menu_shortcuts';
    EXECUTE 'CREATE POLICY user_menu_shortcuts_select_own ON one_il.user_menu_shortcuts FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()))';
    
    EXECUTE 'DROP POLICY IF EXISTS user_menu_shortcuts_insert_own ON one_il.user_menu_shortcuts';
    EXECUTE 'CREATE POLICY user_menu_shortcuts_insert_own ON one_il.user_menu_shortcuts FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()))';
    
    EXECUTE 'DROP POLICY IF EXISTS user_menu_shortcuts_update_own ON one_il.user_menu_shortcuts';
    EXECUTE 'CREATE POLICY user_menu_shortcuts_update_own ON one_il.user_menu_shortcuts FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))';
    
    EXECUTE 'DROP POLICY IF EXISTS user_menu_shortcuts_delete_own ON one_il.user_menu_shortcuts';
    EXECUTE 'CREATE POLICY user_menu_shortcuts_delete_own ON one_il.user_menu_shortcuts FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()))';
  END IF;
END $$;

-- Grants
GRANT SELECT ON one_il.menu_groups TO authenticated, service_role;
GRANT SELECT ON one_il.menu_items TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON one_il.user_change_requests TO authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'one_il' AND table_name = 'user_menu_shortcuts') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON one_il.user_menu_shortcuts TO authenticated, service_role';
  END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
