-- Bootstrap base schema for local development.
-- Combines scratch/supabase_schema.sql + scratch/org_personnel_schema.sql + scratch/employees_hardening.sql
-- so that subsequent migrations can reference these tables.

-- ============================================================
-- Core app tables (from scratch/supabase_schema.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT 'default' CHECK (template IN ('default', 'landing', 'blog')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github')),
  provider_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(provider, provider_user_id)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Organization / personnel tables (from scratch/org_personnel_schema.sql)
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.org_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_en text,
  unit_type text not null check (
    unit_type in (
      'DIRECTOR_OFFICE',
      'SCI_TECH_GROUP',
      'SUPPORT_SECTION',
      'ACADEMIC_SECTION'
    )
  ),
  parent_unit_id uuid references public.org_units(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_org_units_not_self_parent check (id is distinct from parent_unit_id)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_en text,
  role_level int not null check (role_level between 1 and 4),
  can_command_staff boolean not null default false,
  deputy_category text null check (
    deputy_category in ('ADMIN', 'RESEARCH', 'EDU_NETWORK')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_deputy_category_usage check (
    (code like 'DEPUTY_DIRECTOR%' and deputy_category is not null)
    or (code not like 'DEPUTY_DIRECTOR%' and deputy_category is null)
  )
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_no text unique,
  first_name text not null,
  last_name text not null,
  email text unique,
  user_id uuid references public.users (id) on delete set null,
  app_role text check (
    app_role is null or app_role in ('admin', 'editor', 'viewer', 'user')
  ),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_employees_user_id on public.employees (user_id)
  where user_id is not null;

create table if not exists public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  position_id uuid not null references public.positions(id),
  org_unit_id uuid not null references public.org_units(id),
  starts_at date not null,
  ends_at date null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_assignment_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index if not exists uq_employee_one_primary_active
  on public.employee_assignments (employee_id)
  where is_primary = true and ends_at is null;

create table if not exists public.employee_supervisors (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  supervisor_employee_id uuid not null references public.employees(id) on delete cascade,
  relation_type text not null default 'LINE' check (relation_type in ('LINE')),
  starts_at date not null,
  ends_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_not_self_supervisor check (employee_id <> supervisor_employee_id),
  constraint ck_supervisor_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index if not exists uq_employee_single_active_supervisor
  on public.employee_supervisors (employee_id)
  where ends_at is null;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_chairs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  starts_at date not null,
  ends_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_program_chair_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index if not exists uq_one_active_chair_per_program
  on public.program_chairs (program_id)
  where ends_at is null;

create unique index if not exists uq_program_chair_unique_span
  on public.program_chairs (program_id, employee_id, starts_at);

-- Functions for role chain validation
create or replace function public.get_active_role_code(p_employee_id uuid)
returns text
language sql
stable
as $$
  select p.code
  from public.employee_assignments ea
  join public.positions p on p.id = ea.position_id
  where ea.employee_id = p_employee_id
    and ea.is_primary = true
    and ea.ends_at is null
  limit 1
$$;

create or replace function public.validate_singleton_active_roles()
returns trigger
language plpgsql
as $$
declare
  v_role_code text;
  v_conflict_exists boolean;
begin
  if new.ends_at is not null or not new.is_primary then
    return new;
  end if;

  select p.code
  into v_role_code
  from public.positions p
  where p.id = new.position_id;

  if v_role_code = 'DIRECTOR' then
    select exists (
      select 1
      from public.employee_assignments ea
      join public.positions p on p.id = ea.position_id
      where ea.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and ea.ends_at is null
        and ea.is_primary = true
        and p.code = 'DIRECTOR'
    ) into v_conflict_exists;

    if v_conflict_exists then
      raise exception 'Only one active DIRECTOR is allowed';
    end if;
  elsif v_role_code like 'DEPUTY_DIRECTOR%' then
    select exists (
      select 1
      from public.employee_assignments ea
      where ea.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and ea.ends_at is null
        and ea.is_primary = true
        and ea.position_id = new.position_id
    ) into v_conflict_exists;

    if v_conflict_exists then
      raise exception 'Only one active employee is allowed for this deputy position';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_line_supervisor_chain()
returns trigger
language plpgsql
as $$
declare
  v_employee_role text;
  v_supervisor_role text;
  v_supervisor_can_command boolean;
begin
  if new.relation_type <> 'LINE' then
    return new;
  end if;

  v_employee_role := public.get_active_role_code(new.employee_id);
  v_supervisor_role := public.get_active_role_code(new.supervisor_employee_id);

  if v_employee_role is null then
    raise exception 'Employee % has no active primary assignment', new.employee_id;
  end if;

  if v_supervisor_role is null then
    raise exception 'Supervisor % has no active primary assignment', new.supervisor_employee_id;
  end if;

  select p.can_command_staff
  into v_supervisor_can_command
  from public.employee_assignments ea
  join public.positions p on p.id = ea.position_id
  where ea.employee_id = new.supervisor_employee_id
    and ea.is_primary = true
    and ea.ends_at is null
  limit 1;

  if not coalesce(v_supervisor_can_command, false) then
    raise exception 'Supervisor % cannot command staff', new.supervisor_employee_id;
  end if;

  if v_supervisor_role = 'PROGRAM_CHAIR' then
    raise exception 'PROGRAM_CHAIR cannot be used as line supervisor';
  end if;

  if v_employee_role like 'DEPUTY_DIRECTOR%' and v_supervisor_role <> 'DIRECTOR' then
    raise exception 'DEPUTY_DIRECTOR must report to DIRECTOR';
  elsif v_employee_role = 'HEAD' and v_supervisor_role not like 'DEPUTY_DIRECTOR%' then
    raise exception 'HEAD must report to DEPUTY_DIRECTOR';
  elsif v_employee_role = 'STAFF' and v_supervisor_role <> 'HEAD' then
    raise exception 'STAFF must report to HEAD';
  elsif v_employee_role = 'LECTURER' and v_supervisor_role not in ('HEAD', 'DIRECTOR') then
    raise exception 'LECTURER must report to HEAD or DIRECTOR';
  end if;

  return new;
end;
$$;

drop trigger if exists tr_validate_line_supervisor_chain on public.employee_supervisors;
create trigger tr_validate_line_supervisor_chain
before insert or update on public.employee_supervisors
for each row
execute function public.validate_line_supervisor_chain();

drop trigger if exists tr_validate_singleton_active_roles on public.employee_assignments;
create trigger tr_validate_singleton_active_roles
before insert or update on public.employee_assignments
for each row
execute function public.validate_singleton_active_roles();

-- Seed baseline positions
insert into public.positions (code, name, name_en, role_level, can_command_staff, deputy_category)
values
  ('DIRECTOR', 'ผู้อำนวยการ', 'Director', 1, true, null),
  ('DEPUTY_DIRECTOR', 'รองผู้อำนวยการฝ่ายบริหาร', 'Deputy Director (Administration)', 2, true, 'ADMIN'),
  ('DEPUTY_DIRECTOR_RESEARCH', 'รองผู้อำนวยการฝ่ายวิจัยและนวัตกรรม', 'Deputy Director (Research and Innovation)', 2, true, 'RESEARCH'),
  ('DEPUTY_DIRECTOR_EDU_NETWORK', 'รองผู้อำนวยการฝ่ายการศึกษาและเครือข่าย', 'Deputy Director (Education and Networks)', 2, true, 'EDU_NETWORK'),
  ('HEAD', 'หัวหน้างาน', 'Section Head', 3, true, null),
  ('STAFF', 'เจ้าหน้าที่', 'Staff', 4, false, null),
  ('LECTURER', 'อาจารย์', 'Lecturer', 4, false, null),
  ('PROGRAM_CHAIR', 'ประธานหลักสูตร', 'Program Chair', 2, false, null)
on conflict (code) do update
set
  name = excluded.name,
  name_en = excluded.name_en,
  role_level = excluded.role_level,
  can_command_staff = excluded.can_command_staff,
  deputy_category = excluded.deputy_category,
  updated_at = now();

-- Seed org units
insert into public.org_units (code, name, name_en, unit_type, parent_unit_id, sort_order)
values
  ('DIRECTOR_OFFICE', 'สำนักงานผู้อำนวยการ', 'Director''s Office', 'DIRECTOR_OFFICE', null, 1),
  ('SCI_TECH_GROUP', 'กลุ่มวิชาวิทยาศาสตร์และเทคโนโลยีศึกษา', 'Science and Educational Technology Group', 'SCI_TECH_GROUP', null, 2)
on conflict (code) do update
set
  name = excluded.name,
  name_en = excluded.name_en,
  unit_type = excluded.unit_type,
  sort_order = excluded.sort_order,
  updated_at = now();

with base as (
  select id, code
  from public.org_units
  where code in ('DIRECTOR_OFFICE', 'SCI_TECH_GROUP')
)
insert into public.org_units (code, name, name_en, unit_type, parent_unit_id, sort_order)
select 'SUPPORT_GENERAL_ADMIN', 'งานบริหารทั่วไป', 'General Administration', 'SUPPORT_SECTION', b.id, 1
from base b where b.code = 'DIRECTOR_OFFICE'
union all
select 'SUPPORT_FINANCE_SUPPLY', 'งานคลังและพัสดุ', 'Finance and Supplies', 'SUPPORT_SECTION', b.id, 2
from base b where b.code = 'DIRECTOR_OFFICE'
union all
select 'SUPPORT_EDUCATION', 'งานการศึกษา', 'Academic Affairs', 'SUPPORT_SECTION', b.id, 3
from base b where b.code = 'DIRECTOR_OFFICE'
union all
select 'SUPPORT_IT', 'งานเทคโนโลยีสารสนเทศ', 'Information Technology', 'SUPPORT_SECTION', b.id, 4
from base b where b.code = 'DIRECTOR_OFFICE'
union all
select 'ACADEMIC_LECTURERS', 'คณาจารย์สถาบันฯ', 'Institute Faculty', 'ACADEMIC_SECTION', b.id, 1
from base b where b.code = 'SCI_TECH_GROUP'
on conflict (code) do update
set
  name = excluded.name,
  name_en = excluded.name_en,
  unit_type = excluded.unit_type,
  parent_unit_id = excluded.parent_unit_id,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Leave request workflow tables
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  requester_employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type text not null check (
    leave_type in ('PERSONAL', 'SICK', 'VACATION', 'OTHER')
  ),
  reason text,
  starts_on date not null,
  ends_on date not null,
  total_days numeric(5,2) not null check (total_days > 0),
  status text not null default 'PENDING' check (
    status in ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_leave_date_span check (ends_on >= starts_on)
);

create table if not exists public.leave_request_steps (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null references public.leave_requests(id) on delete cascade,
  step_order int not null check (step_order > 0),
  approver_employee_id uuid not null references public.employees(id) on delete cascade,
  action_type text not null check (action_type in ('REVIEW', 'ACKNOWLEDGE', 'APPROVE')),
  step_status text not null default 'PENDING' check (
    step_status in ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED')
  ),
  acted_at timestamptz null,
  remark text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_leave_step_order unique (leave_request_id, step_order)
);

create index if not exists idx_leave_steps_approver_pending
  on public.leave_request_steps (approver_employee_id, step_status);

create or replace function public.get_direct_supervisor(p_employee_id uuid)
returns uuid
language sql
stable
as $$
  select es.supervisor_employee_id
  from public.employee_supervisors es
  where es.employee_id = p_employee_id
    and es.ends_at is null
  limit 1
$$;

create or replace function public.get_active_employee_by_role(p_role_code text)
returns uuid
language sql
stable
as $$
  select ea.employee_id
  from public.employee_assignments ea
  join public.positions p on p.id = ea.position_id
  where ea.ends_at is null
    and ea.is_primary = true
    and p.code = p_role_code
  limit 1
$$;

create or replace function public.build_leave_workflow()
returns trigger
language plpgsql
as $$
declare
  v_requester_role text;
  v_head_id uuid;
  v_deputy_id uuid;
  v_director_id uuid;
begin
  v_requester_role := public.get_active_role_code(new.requester_employee_id);
  if v_requester_role is null then
    raise exception 'Requester % has no active primary role', new.requester_employee_id;
  end if;

  v_director_id := public.get_active_employee_by_role('DIRECTOR');
  if v_director_id is null then
    raise exception 'No active DIRECTOR found for leave workflow';
  end if;

  if v_requester_role = 'HEAD' then
    v_deputy_id := public.get_direct_supervisor(new.requester_employee_id);
    if v_deputy_id is null then
      raise exception 'HEAD % must have DEPUTY_DIRECTOR as supervisor', new.requester_employee_id;
    end if;

    insert into public.leave_request_steps (leave_request_id, step_order, approver_employee_id, action_type)
    values
      (new.id, 1, v_deputy_id, 'ACKNOWLEDGE'),
      (new.id, 2, v_director_id, 'APPROVE');

  elsif v_requester_role = 'STAFF' then
    v_head_id := public.get_direct_supervisor(new.requester_employee_id);
    if v_head_id is null then
      raise exception 'STAFF % must have HEAD as supervisor', new.requester_employee_id;
    end if;

    v_deputy_id := public.get_direct_supervisor(v_head_id);
    if v_deputy_id is null then
      raise exception 'HEAD % must have DEPUTY_DIRECTOR as supervisor', v_head_id;
    end if;

    insert into public.leave_request_steps (leave_request_id, step_order, approver_employee_id, action_type)
    values
      (new.id, 1, v_head_id, 'REVIEW'),
      (new.id, 2, v_deputy_id, 'ACKNOWLEDGE'),
      (new.id, 3, v_director_id, 'APPROVE');

  elsif v_requester_role = 'LECTURER' then
    insert into public.leave_request_steps (leave_request_id, step_order, approver_employee_id, action_type)
    values
      (new.id, 1, v_director_id, 'APPROVE');

  elsif v_requester_role like 'DEPUTY_DIRECTOR%' then
    insert into public.leave_request_steps (leave_request_id, step_order, approver_employee_id, action_type)
    values
      (new.id, 1, v_director_id, 'APPROVE');

  else
    raise exception 'Role % is not configured for leave workflow', v_requester_role;
  end if;

  return new;
end;
$$;

drop trigger if exists tr_build_leave_workflow on public.leave_requests;
create trigger tr_build_leave_workflow
after insert on public.leave_requests
for each row
execute function public.build_leave_workflow();

-- Stub for rls_auto_enable (referenced by later security hardening migration)
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  null;
end;
$$;

-- ============================================================
-- Hardening (from scratch/employees_hardening.sql)
-- ============================================================

create index if not exists idx_employee_assignments_position_id
  on public.employee_assignments (position_id);
create index if not exists idx_employee_assignments_org_unit_id
  on public.employee_assignments (org_unit_id);
create index if not exists idx_employee_supervisors_supervisor_employee_id
  on public.employee_supervisors (supervisor_employee_id);
create index if not exists idx_program_chairs_employee_id
  on public.program_chairs (employee_id);
create index if not exists idx_org_units_parent_unit_id
  on public.org_units (parent_unit_id);

alter function public.get_active_role_code(uuid) set search_path = public, pg_temp;
alter function public.validate_singleton_active_roles() set search_path = public, pg_temp;
alter function public.validate_line_supervisor_chain() set search_path = public, pg_temp;

alter table public.org_units enable row level security;
alter table public.positions enable row level security;
alter table public.employees enable row level security;
alter table public.employee_assignments enable row level security;
alter table public.employee_supervisors enable row level security;
alter table public.programs enable row level security;
alter table public.program_chairs enable row level security;

create or replace function public.has_employees_manage()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

drop policy if exists org_units_employees_read on public.org_units;
create policy org_units_employees_read on public.org_units for select using (public.has_employees_manage());
drop policy if exists org_units_employees_write on public.org_units;
create policy org_units_employees_write on public.org_units for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

drop policy if exists positions_employees_read on public.positions;
create policy positions_employees_read on public.positions for select using (public.has_employees_manage());
drop policy if exists positions_employees_write on public.positions;
create policy positions_employees_write on public.positions for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

drop policy if exists employees_employees_read on public.employees;
create policy employees_employees_read on public.employees for select using (public.has_employees_manage());
drop policy if exists employees_self_read on public.employees;
create policy employees_self_read on public.employees for select using (user_id = (select auth.uid()));
drop policy if exists employees_employees_write on public.employees;
create policy employees_employees_write on public.employees for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

drop policy if exists employee_assignments_employees_read on public.employee_assignments;
create policy employee_assignments_employees_read on public.employee_assignments for select using (public.has_employees_manage());
drop policy if exists employee_assignments_employees_write on public.employee_assignments;
create policy employee_assignments_employees_write on public.employee_assignments for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

drop policy if exists employee_supervisors_employees_read on public.employee_supervisors;
create policy employee_supervisors_employees_read on public.employee_supervisors for select using (public.has_employees_manage());
drop policy if exists employee_supervisors_employees_write on public.employee_supervisors;
create policy employee_supervisors_employees_write on public.employee_supervisors for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

drop policy if exists programs_employees_read on public.programs;
create policy programs_employees_read on public.programs for select using (public.has_employees_manage());
drop policy if exists programs_employees_write on public.programs;
create policy programs_employees_write on public.programs for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

drop policy if exists program_chairs_employees_read on public.program_chairs;
create policy program_chairs_employees_read on public.program_chairs for select using (public.has_employees_manage());
drop policy if exists program_chairs_employees_write on public.program_chairs;
create policy program_chairs_employees_write on public.program_chairs for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());
