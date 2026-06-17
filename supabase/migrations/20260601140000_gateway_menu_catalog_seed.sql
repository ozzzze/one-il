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
  ('ol_change', 'คำขอเปลี่ยนแปลงระบบ', 'System change requests', 4, true)
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
  ('gw-roles', 'gw_hub', null, 'กำหนดบทบาทผู้ใช้', 'User role assignment', '/roles', 'roles',
    array['roles', 'rbac', 'permissions'],
    array['roles:manage']::text[], 'admin_only', 'live', 30),
  ('gw-menu-catalog', 'gw_hub', null, 'แคตตาล็อกเมนู', 'Menu catalog', '/menu-catalog', 'gateway',
    array['menu', 'catalog', 'navigation'],
    array['roles:manage']::text[], 'admin_only', 'live', 40)
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
-- System change requests (ids prefixed ol-)
-- ---------------------------------------------------------------------------

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  ('ol-change-list', 'ol_change', null, 'คำขอเปลี่ยนแปลงระบบ', 'System change requests', '/change-requests', 'requests',
    array['change', 'cis'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 0),
  ('ol-change-new', 'ol_change', null, 'ยื่นคำขอเปลี่ยนแปลงระบบ', 'New change request', '/change-requests/new', 'requests',
    array['change', 'new'],
    array['gateway:access', 'leave:view']::text[], 'standard', 'live', 10),
  ('ol-change-approvals', 'ol_change', null, 'คิวอนุมัติคำขอเปลี่ยนแปลง', 'Change approvals', '/change-requests/approvals', 'requests',
    array['change', 'approval'],
    array['leave:manage']::text[], 'standard', 'live', 20)
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

grant select on public.menu_groups to authenticated, service_role;
grant select on public.menu_items to authenticated, service_role;

notify pgrst, 'reload schema';
