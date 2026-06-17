-- Gateway admin: audit log viewer (canonical on one-il; one-leave redirects /admin/audit-logs).

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  ('gw-admin-audit-logs', 'gw_admin', null, 'ประวัติการทำรายการ', 'Audit logs', '/admin/audit-logs', 'history',
    array['admin', 'audit', 'scr', 'system_change_request', 'ประวัติ'],
    array[]::text[], 'admin_only', 'live', 30)
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
