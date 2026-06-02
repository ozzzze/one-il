-- Gateway admin section menu catalog: admin-only tiles for one_leave identity management.
-- Mirrors the launcher modules added in src/lib/server/gateway-launcher.ts so the
-- sidebar/home/command palette expose /admin/* when a DB menu catalog is active.
-- These are admin_only + permission-gated; the route guards remain authoritative.

insert into public.menu_groups (code, label_th, label_en, sort_order, is_active) values
  ('gw_admin', 'ผู้ดูแลระบบ', 'Administration', 5, true)
on conflict (code) do update set
  label_th = excluded.label_th,
  label_en = excluded.label_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  ('gw-admin-users', 'gw_admin', null, 'จัดการผู้ใช้', 'User administration', '/admin/users', 'users',
    array['admin', 'users', 'ผู้ใช้', 'reset password'],
    array['users:manage']::text[], 'admin_only', 'live', 0),
  ('gw-admin-employees', 'gw_admin', null, 'จัดการพนักงาน', 'Employee administration', '/admin/employees', 'employees',
    array['admin', 'employees', 'พนักงาน', 'org unit'],
    array['employees:manage']::text[], 'admin_only', 'live', 10),
  ('gw-admin-roles', 'gw_admin', null, 'กำหนดบทบาทผู้ใช้', 'User role assignment', '/admin/roles', 'roles',
    array['admin', 'roles', 'บทบาท', 'rbac'],
    array['roles:manage']::text[], 'admin_only', 'live', 20)
on conflict (id) do update set
  group_id = excluded.group_id,
  label_th = excluded.label_th,
  label_en = excluded.label_en,
  href = excluded.href,
  icon_key = excluded.icon_key,
  keywords = excluded.keywords,
  required_permission_keys = excluded.required_permission_keys,
  visibility = excluded.visibility,
  implementation_status = excluded.implementation_status,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
