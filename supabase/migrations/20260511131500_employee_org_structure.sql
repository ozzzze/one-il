-- Org assignments, line supervisors, programs — required by employees directory embed
-- (`employees-load.ts`) and `employee-org-mutations.ts`. Safe when scratch DDL already ran.

create table if not exists public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  position_id uuid not null references public.positions (id),
  org_unit_id uuid not null references public.org_units (id),
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

create index if not exists idx_employee_assignments_employee_id
  on public.employee_assignments (employee_id);

create table if not exists public.employee_supervisors (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  supervisor_employee_id uuid not null references public.employees (id) on delete cascade,
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

create index if not exists idx_employee_supervisors_supervisor_employee_id
  on public.employee_supervisors (supervisor_employee_id);

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
  program_id uuid not null references public.programs (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  starts_at date not null,
  ends_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_program_chair_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index if not exists uq_one_active_chair_per_program
  on public.program_chairs (program_id)
  where ends_at is null;

alter table public.employee_assignments enable row level security;
alter table public.employee_supervisors enable row level security;
alter table public.programs enable row level security;
alter table public.program_chairs enable row level security;

drop policy if exists employee_assignments_manage_all on public.employee_assignments;
create policy employee_assignments_manage_all on public.employee_assignments
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists employee_supervisors_manage_all on public.employee_supervisors;
create policy employee_supervisors_manage_all on public.employee_supervisors
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists programs_manage_all on public.programs;
create policy programs_manage_all on public.programs
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists program_chairs_manage_all on public.program_chairs;
create policy program_chairs_manage_all on public.program_chairs
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());
