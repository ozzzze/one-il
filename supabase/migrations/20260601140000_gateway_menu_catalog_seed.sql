-- Gateway menu catalog: schema (if missing) + seed from one-leave APP_MODULES (/leave/*) + hub tiles.

do $$ begin
  create type public.menu_item_visibility as enum ('standard', 'admin_only');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.menu_item_implementation_status as enum ('live', 'planned');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.menu_groups (
  code text primary key,
  label_th text not null,
  label_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.menu_items (
  id text primary key,
  group_id text not null references public.menu_groups (code) on delete restrict,
  parent_id text references public.menu_items (id) on delete cascade,
  label_th text not null,
  label_en text not null,
  href text,
  icon_key text,
  keywords text[],
  required_permission_keys text[] not null default '{}'::text[],
  visibility public.menu_item_visibility not null default 'standard',
  implementation_status public.menu_item_implementation_status not null default 'planned',
  sort_order int not null default 0
);

create index if not exists menu_items_group_parent_sort_idx
  on public.menu_items (group_id, parent_id, sort_order);

-- ---------------------------------------------------------------------------
-- Groups: gateway hub + one-leave NAV_GROUP_LABELS
-- ---------------------------------------------------------------------------

insert into public.menu_groups (code, label_th, label_en, sort_order, is_active) values
  ('gw_hub', 'ศูนย์กลาง ONE-IL', 'ONE-IL Hub', 0, true),
  ('ol_main', 'ภาพรวม', 'Overview', 10, true),
  ('ol_leave', 'ใบลา', 'Leave', 20, true),
  ('ol_work', 'บันทึกการปฏิบัติงาน', 'Work activity', 30, true),
  ('ol_change', 'คำขอเปลี่ยนแปลงระบบ', 'System change requests', 40, true),
  ('ol_org', 'องค์กรและผู้ใช้', 'Organization & users', 50, true),
  ('ol_reports', 'รายงาน', 'Reports', 60, true),
  ('ol_system', 'ตั้งค่าระบบ', 'System settings', 70, true)
on conflict (code) do update set
  label_th = excluded.label_th,
  label_en = excluded.label_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Gateway hub (paths on one-il)
-- ---------------------------------------------------------------------------

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  ('gw-home', 'gw_hub', null, 'หน้าหลัก Gateway', 'Gateway home', '/', 'dashboard',
    array['gateway', 'home', 'launcher', 'ศูนย์กลาง'],
    array['gateway:access']::text[], 'standard', 'live', 0),
  ('gw-settings', 'gw_hub', null, 'การตั้งค่า', 'Settings', '/settings', 'settings',
    array['settings', 'profile', 'บัญชี'],
    array['profile:manage']::text[], 'standard', 'live', 10),
  ('gw-change-request', 'gw_hub', null, 'ขอเปลี่ยนข้อมูลบัญชี', 'Account change request', '/account/change-request', 'requests',
    array['change', 'account', 'profile'],
    array['profile:manage']::text[], 'standard', 'live', 20),
  ('gw-roles', 'gw_hub', null, 'บทบาทและเมนู', 'Roles & menu', '/roles', 'roles',
    array['roles', 'rbac', 'permissions'],
    array['roles:manage']::text[], 'admin_only', 'live', 30),
  ('gw-menu-catalog', 'gw_hub', null, 'จัดการเมนู', 'Menu catalog', '/menu-catalog', 'gateway',
    array['menu', 'catalog', 'navigation'],
    array['roles:manage']::text[], 'admin_only', 'live', 40),
  ('gw-leave-app', 'gw_hub', null, 'เปิดระบบลา (one-leave)', 'Open one-leave', '/leave', 'calendar_fold',
    array['leave', 'one-leave', 'app'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 50)
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

-- ---------------------------------------------------------------------------
-- one-leave APP_MODULES → /leave/* (ids prefixed ol-)
-- ---------------------------------------------------------------------------

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  ('ol-home', 'ol_main', null, 'หน้าหลัก one-leave', 'one-leave home', '/leave', 'dashboard',
    array['home', 'overview'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 0),

  ('ol-leave-list', 'ol_leave', null, 'รายการใบลา', 'Leave requests', '/leave/leave', 'calendar_fold',
    array['leave', 'list', 'ใบลา'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 0),
  ('ol-leave-new', 'ol_leave', null, 'ยื่นใบลา', 'New leave request', '/leave/leave/new', 'calendar_fold',
    array['leave', 'new', 'submit'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 10),
  ('ol-leave-quota', 'ol_leave', null, 'สิทธิคงเหลือ', 'Leave quota', '/leave/leave/quota', 'calendar_fold',
    array['quota', 'balance'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 20),
  ('ol-leave-approvals', 'ol_leave', null, 'คิวตรวจสอบ / อนุญาต', 'Approvals queue', '/leave/approvals', 'calendar_fold',
    array['approval', 'hr', 'grantor'],
    array['leave:manage']::text[], 'standard', 'live', 30),
  ('ol-leave-revoke', 'ol_leave', null, 'ยกเลิกวันลา', 'Revoke leave', '/leave/leave/revoke', 'calendar_fold',
    array['revoke', 'cancel'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 40),

  ('ol-work-list', 'ol_work', null, 'บันทึกปฏิบัติงาน', 'Work activity log', '/leave/work-activity', 'requests',
    array['work', 'wfh', 'activity'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 0),
  ('ol-work-new', 'ol_work', null, 'แจ้งบันทึกปฏิบัติงาน', 'New work activity', '/leave/work-activity/new', 'requests',
    array['work', 'new'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 10),

  ('ol-change-list', 'ol_change', null, 'คำขอเปลี่ยนแปลงระบบ', 'System change requests', '/leave/change-requests', 'requests',
    array['change', 'cis'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 0),
  ('ol-change-new', 'ol_change', null, 'ยื่นคำขอเปลี่ยนแปลงระบบ', 'New change request', '/leave/change-requests/new', 'requests',
    array['change', 'new'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 10),
  ('ol-change-approvals', 'ol_change', null, 'คิวอนุมัติคำขอเปลี่ยนแปลง', 'Change approvals', '/leave/change-requests/approvals', 'requests',
    array['change', 'approval'],
    array['leave:manage']::text[], 'standard', 'live', 20),

  ('ol-org-employees', 'ol_org', null, 'พนักงานและสายงาน', 'Employees', '/leave/org', 'employees',
    array['employee', 'hr', 'org'],
    array['users:manage']::text[], 'admin_only', 'live', 0),
  ('ol-org-units', 'ol_org', null, 'โครงสร้างหน่วยงาน', 'Org units', '/leave/org/units', 'organization',
    array['org', 'units'],
    array['users:manage']::text[], 'admin_only', 'live', 10),
  ('ol-org-users', 'ol_org', null, 'ผู้ใช้และบทบาท', 'Users & roles', '/leave/org/users', 'users',
    array['users', 'rbac'],
    array['users:manage']::text[], 'admin_only', 'live', 20),
  ('ol-org-deputy-assignments', 'ol_org', null, 'มอบหมายรองผู้อำนวยการ', 'Deputy assignments', '/leave/org/deputy-assignments', 'users',
    array['deputy', 'grantor'],
    array['users:manage']::text[], 'admin_only', 'live', 30),

  ('ol-reports-hr', 'ol_reports', null, 'รายงาน HR', 'HR reports', '/leave/reports', 'analytics',
    array['reports', 'hr'],
    array['leave:manage']::text[], 'standard', 'live', 0),
  ('ol-reports-office', 'ol_reports', null, 'รายงาน Office', 'Office reports', '/leave/reports/office', 'analytics',
    array['reports', 'office', 'l2'],
    array['leave:view']::text[], 'standard', 'live', 10),

  ('ol-admin-settings', 'ol_system', null, 'ตั้งค่าระบบ', 'System settings', '/leave/admin', 'settings',
    array['admin', 'settings'],
    array['settings:manage']::text[], 'admin_only', 'live', 0),
  ('ol-admin-settings-general', 'ol_system', null, 'การตั้งค่าทั่วไป', 'General settings', '/leave/admin/settings', 'settings',
    array['settings', 'general'],
    array['settings:manage']::text[], 'admin_only', 'live', 10),
  ('ol-admin-settings-email', 'ol_system', null, 'อีเมลแจ้งเตือน', 'Email notifications', '/leave/admin/settings/email', 'settings',
    array['email', 'smtp'],
    array['settings:manage']::text[], 'admin_only', 'live', 20),
  ('ol-admin-fiscal-years', 'ol_system', null, 'ปีงบประมาณ', 'Fiscal years', '/leave/admin/fiscal-years', 'settings',
    array['fiscal', 'year'],
    array['settings:manage']::text[], 'admin_only', 'live', 30),
  ('ol-admin-calendar', 'ol_system', null, 'ปฏิทินวันทำการ', 'Working calendar', '/leave/admin/calendar', 'calendar_fold',
    array['calendar', 'holiday'],
    array['settings:manage']::text[], 'admin_only', 'live', 40),
  ('ol-admin-audit-logs', 'ol_system', null, 'ประวัติการทำรายการ', 'Audit logs', '/leave/admin/audit-logs', 'database',
    array['audit', 'log'],
    array['leave:manage']::text[], 'admin_only', 'live', 50)
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

-- ---------------------------------------------------------------------------
-- RLS (service role in gateway bypasses; authenticated read for future)
-- ---------------------------------------------------------------------------

alter table public.menu_groups enable row level security;
alter table public.menu_items enable row level security;

drop policy if exists menu_groups_select_authenticated on public.menu_groups;
create policy menu_groups_select_authenticated
  on public.menu_groups
  for select
  to authenticated
  using (is_active = true);

drop policy if exists menu_items_select_authenticated on public.menu_items;
create policy menu_items_select_authenticated
  on public.menu_items
  for select
  to authenticated
  using (
    visibility = 'standard'
    or (visibility = 'admin_only' and public.has_admin_role())
  );

grant select on public.menu_groups to authenticated;
grant select on public.menu_items to authenticated;

notify pgrst, 'reload schema';
