-- Room booking hub: parent + calendar + my requests children (mirrors office-leave pattern).

update public.menu_items
set
  href = null,
  implementation_status = 'live',
  sort_order = 20
where id = 'shared-booking-room';

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  (
    'room-booking-calendar', 'office_academic', 'shared-booking-room',
    'จองห้อง', 'Room booking', '/room-booking', 'room',
    array['room', 'booking', 'calendar', 'availability', 'จองห้อง', 'ปฏิทิน'],
    array['requests:create']::text[], 'standard', 'live', 0
  ),
  (
    'room-booking-my-requests', 'office_academic', 'shared-booking-room',
    'คำขอของฉัน', 'My requests', '/room-booking/requests', 'requests',
    array['my requests', 'room booking', 'คำขอ', 'request'],
    array['requests:view_own']::text[], 'standard', 'live', 10
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
