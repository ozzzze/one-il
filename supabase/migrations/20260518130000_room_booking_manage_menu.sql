-- Room booking: admin-only "Manage bookings" submenu item.

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  (
    'room-booking-manage', 'office_academic', 'shared-booking-room',
    'จัดการการจองห้อง', 'Manage bookings', '/room-booking/manage', 'settings',
    array['manage', 'booking', 'room', 'admin', 'schedule', 'block', 'จัดการ', 'จองห้อง'],
    array['requests:manage']::text[], 'admin_only', 'live', 20
  )
on conflict (id) do update set
  group_id = excluded.group_id,
  parent_id = excluded.parent_id,
  label_th = excluded.label_th,
  label_en = excluded.label_en,
  href = excluded.href,
  icon_key = excluded.icon_key,
  keywords = excluded.keywords,
  required_permission_keys = excluded.required_permission_keys,
  visibility = excluded.visibility,
  implementation_status = excluded.implementation_status,
  sort_order = excluded.sort_order;
