-- Menu catalog (groups + items + user shortcuts) and RLS.
-- PRD §6 modules + existing ONE-IL navigation entries.

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

create table if not exists public.user_menu_shortcuts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  menu_item_id text not null references public.menu_items (id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, menu_item_id)
);

create index if not exists user_menu_shortcuts_user_sort_idx
  on public.user_menu_shortcuts (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- Seed: groups
-- ---------------------------------------------------------------------------

insert into public.menu_groups (code, label_th, label_en, sort_order) values
  ('overview', 'ภาพรวม', 'Overview', 0),
  ('office', 'สำนักงาน', 'Office', 10),
  ('academic', 'วิชาการ', 'Academic', 20),
  ('office_academic', 'สำนักงานและวิชาการ', 'Office & Academic', 30),
  ('governance', 'การกำกับดูแล', 'Governance', 40),
  ('system', 'ระบบ', 'System', 50),
  ('my_account', 'บัญชีของฉัน', 'My Account', 60)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: items (parent_id null; PRD deduped + existing routes)
-- required_permission_keys: AND semantics in app (empty = any signed-in user who can see the row)
-- ---------------------------------------------------------------------------

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  -- Overview
  ('overview-dashboard', 'overview', null, 'แดชบอร์ด', 'Dashboard', '/', 'dashboard',
    array['home', 'overview', 'kpi', 'แดชบอร์ด'],
    array['dashboard:view']::text[], 'standard', 'live', 0),
  ('overview-gateway', 'overview', null, 'โมดูล', 'Modules', '/gateway', 'gateway',
    array['portal', 'modules', 'gateway', 'workspace', 'โมดูล'],
    array['gateway:access']::text[], 'standard', 'live', 10),
  ('overview-analytics', 'overview', null, 'วิเคราะห์ข้อมูล', 'Analytics', '/analytics', 'analytics',
    array['charts', 'stats', 'reports', 'วิเคราะห์'],
    array['analytics:view']::text[], 'standard', 'live', 20),

  -- Office (PRD + implemented)
  ('office-hr', 'office', null, 'ทรัพยากรบุคคล', 'Human Resources', '/employees', 'employees',
    array['hr', 'employee', 'personnel', 'บุคคล'],
    array['employees:manage']::text[], 'standard', 'live', 0),
  ('office-leave', 'office', null, 'การลา', 'Leave', null, 'requests',
    array['leave', 'ลา', 'วันลา'],
    array['requests:view_own']::text[], 'standard', 'planned', 10),
  ('office-welfare', 'office', null, 'สวัสดิการ', 'Welfare', null, 'requests',
    array['welfare', 'สวัสดิการ'],
    array['requests:view_own']::text[], 'standard', 'planned', 20),
  ('office-executive-dashboard', 'office', null, 'แดชบอร์ดผู้บริหาร', 'Executive dashboard', null, 'analytics',
    array['executive', 'kpi', 'leadership', 'ผู้บริหาร'],
    array['analytics:view']::text[], 'standard', 'planned', 30),
  ('office-requests', 'office', null, 'คำขอ', 'Requests', '/requests', 'requests',
    array['requests', 'ticket', 'forms', 'คำขอ', 'borrow', 'return', 'equipment', 'ยืม', 'คืน'],
    array['requests:view_own']::text[], 'standard', 'live', 40),
  ('office-organization', 'office', null, 'โครงสร้างองค์กร', 'Organization', '/organization/positions', 'organization',
    array['organization', 'position', 'org unit', 'องค์กร'],
    array['organization:manage']::text[], 'standard', 'live', 50),
  ('office-supply', 'office', null, 'พัสดุ', 'Supply', '/supply', 'supply',
    array['supply', 'materials', 'stock', 'พัสดุ'],
    array['supply:view']::text[], 'standard', 'live', 60),
  ('office-asset', 'office', null, 'ครุภัณฑ์', 'Assets', '/assets', 'assets',
    array['asset', 'equipment', 'ครุภัณฑ์'],
    array['asset:view']::text[], 'standard', 'live', 70),
  ('office-worksheet', 'office', null, 'ใบงาน', 'Worksheet', null, 'requests',
    array['worksheet', 'work', 'ใบงาน'],
    array['requests:view_own']::text[], 'standard', 'planned', 80),
  ('office-product-research', 'office', null, 'ผลผลิตจากงานวิจัย', 'Research products', null, 'content',
    array['research', 'product', 'งานวิจัย'],
    array['content:view']::text[], 'standard', 'planned', 90),

  -- Academic (PRD + content module)
  ('academic-student-advisor', 'academic', null, 'นักศึกษา / ที่ปรึกษา', 'Student / Advisor', null, 'users',
    array['student', 'advisor', 'thesis', 'นักศึกษา'],
    array['content:view']::text[], 'standard', 'planned', 0),
  ('academic-research', 'academic', null, 'งานวิจัย', 'Research', null, 'academic',
    array['research', 'publication', 'งานวิจัย'],
    array['content:view']::text[], 'standard', 'planned', 10),
  ('academic-lab-stock', 'academic', null, 'คลังวัสดุห้องปฏิบัติการ', 'Laboratory stock', null, 'supply',
    array['lab', 'laboratory', 'stock', 'ห้องปฏิบัติการ'],
    array['supply:view']::text[], 'standard', 'planned', 20),
  ('academic-content', 'academic', null, 'เนื้อหา', 'Content', '/content', 'content',
    array['pages', 'articles', 'เนื้อหา'],
    array['content:view']::text[], 'standard', 'live', 30),

  -- Office & Academic (PRD)
  ('shared-academic-service', 'office_academic', null, 'บริการวิชาการ', 'Academic services', null, 'services',
    array['academic service', 'บริการวิชาการ'],
    array['requests:view_own']::text[], 'standard', 'planned', 0),
  ('shared-booking-room', 'office_academic', null, 'จองห้อง', 'Room booking', '/room-booking', 'room',
    array['room', 'booking', 'meeting', 'จองห้อง'],
    array['requests:create']::text[], 'standard', 'live', 20),

  -- Governance (admin only)
  ('gov-users', 'governance', null, 'ผู้ใช้', 'Users', '/users', 'users',
    array['accounts', 'members', 'ผู้ใช้'],
    array['users:manage']::text[], 'admin_only', 'live', 0),
  ('gov-roles', 'governance', null, 'บทบาท', 'Roles', '/roles', 'roles',
    array['permissions', 'roles', 'บทบาท'],
    array['roles:manage']::text[], 'admin_only', 'live', 10),

  -- System
  ('sys-notifications', 'system', null, 'การแจ้งเตือน', 'Notifications', '/notifications', 'notifications',
    array['alerts', 'messages', 'แจ้งเตือน'],
    array['notifications:view']::text[], 'standard', 'live', 0),
  ('sys-database', 'system', null, 'ฐานข้อมูล', 'Database', '/database', 'database',
    array['tables', 'sql', 'database', 'ฐานข้อมูล'],
    array['database:view']::text[], 'admin_only', 'live', 10),
  ('sys-docs', 'system', null, 'เอกสารประกอบ', 'Documentation', '/docs', 'docs',
    array['help', 'guide', 'documentation', 'คู่มือ'],
    array['profile:manage']::text[], 'standard', 'live', 30),

  -- My Account (PRD)
  ('my-account', 'my_account', null, 'บัญชีของฉัน', 'My account', '/settings', 'settings',
    array['account', 'profile', 'บัญชี'],
    array['profile:manage']::text[], 'standard', 'live', 0)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.menu_groups enable row level security;
alter table public.menu_items enable row level security;
alter table public.user_menu_shortcuts enable row level security;

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

drop policy if exists user_menu_shortcuts_select_own on public.user_menu_shortcuts;
create policy user_menu_shortcuts_select_own
  on public.user_menu_shortcuts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists user_menu_shortcuts_insert_own on public.user_menu_shortcuts;
create policy user_menu_shortcuts_insert_own
  on public.user_menu_shortcuts
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists user_menu_shortcuts_update_own on public.user_menu_shortcuts;
create policy user_menu_shortcuts_update_own
  on public.user_menu_shortcuts
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists user_menu_shortcuts_delete_own on public.user_menu_shortcuts;
create policy user_menu_shortcuts_delete_own
  on public.user_menu_shortcuts
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.menu_groups to authenticated;
grant select on public.menu_items to authenticated;
grant select, insert, update, delete on public.user_menu_shortcuts to authenticated;
