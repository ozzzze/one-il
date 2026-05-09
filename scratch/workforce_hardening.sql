-- Workforce hardening patch for Supabase Postgres
-- Apply this after org_personnel_schema.sql

-- ------------------------------------------------------
-- 1) Cover foreign keys used by workforce queries
-- ------------------------------------------------------
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

-- ------------------------------------------------------
-- 2) Function hardening (stable search_path)
-- ------------------------------------------------------
alter function public.get_active_role_code(uuid)
  set search_path = public, pg_temp;

alter function public.validate_singleton_active_roles()
  set search_path = public, pg_temp;

alter function public.validate_line_supervisor_chain()
  set search_path = public, pg_temp;

-- ------------------------------------------------------
-- 3) RLS policies for workforce tables
-- ------------------------------------------------------
alter table public.org_units enable row level security;
alter table public.positions enable row level security;
alter table public.employees enable row level security;
alter table public.employee_assignments enable row level security;
alter table public.employee_supervisors enable row level security;
alter table public.programs enable row level security;
alter table public.program_chairs enable row level security;

create or replace function public.has_workforce_manage()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'org_units'
      and policyname = 'org_units_workforce_read'
  ) then
    create policy org_units_workforce_read
      on public.org_units
      for select
      using (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'org_units'
      and policyname = 'org_units_workforce_write'
  ) then
    create policy org_units_workforce_write
      on public.org_units
      for all
      using (public.has_workforce_manage())
      with check (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'positions'
      and policyname = 'positions_workforce_read'
  ) then
    create policy positions_workforce_read
      on public.positions
      for select
      using (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'positions'
      and policyname = 'positions_workforce_write'
  ) then
    create policy positions_workforce_write
      on public.positions
      for all
      using (public.has_workforce_manage())
      with check (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'employees_workforce_read'
  ) then
    create policy employees_workforce_read
      on public.employees
      for select
      using (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'employees_workforce_write'
  ) then
    create policy employees_workforce_write
      on public.employees
      for all
      using (public.has_workforce_manage())
      with check (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employee_assignments'
      and policyname = 'employee_assignments_workforce_read'
  ) then
    create policy employee_assignments_workforce_read
      on public.employee_assignments
      for select
      using (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employee_assignments'
      and policyname = 'employee_assignments_workforce_write'
  ) then
    create policy employee_assignments_workforce_write
      on public.employee_assignments
      for all
      using (public.has_workforce_manage())
      with check (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employee_supervisors'
      and policyname = 'employee_supervisors_workforce_read'
  ) then
    create policy employee_supervisors_workforce_read
      on public.employee_supervisors
      for select
      using (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employee_supervisors'
      and policyname = 'employee_supervisors_workforce_write'
  ) then
    create policy employee_supervisors_workforce_write
      on public.employee_supervisors
      for all
      using (public.has_workforce_manage())
      with check (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'programs'
      and policyname = 'programs_workforce_read'
  ) then
    create policy programs_workforce_read
      on public.programs
      for select
      using (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'programs'
      and policyname = 'programs_workforce_write'
  ) then
    create policy programs_workforce_write
      on public.programs
      for all
      using (public.has_workforce_manage())
      with check (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'program_chairs'
      and policyname = 'program_chairs_workforce_read'
  ) then
    create policy program_chairs_workforce_read
      on public.program_chairs
      for select
      using (public.has_workforce_manage());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'program_chairs'
      and policyname = 'program_chairs_workforce_write'
  ) then
    create policy program_chairs_workforce_write
      on public.program_chairs
      for all
      using (public.has_workforce_manage())
      with check (public.has_workforce_manage());
  end if;
end $$;

