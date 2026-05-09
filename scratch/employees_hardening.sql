-- Employees hardening patch for Supabase Postgres
-- Apply this after org_personnel_schema.sql

-- Foreign key indexes
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

-- Function hardening
alter function public.get_active_role_code(uuid) set search_path = public, pg_temp;
alter function public.validate_singleton_active_roles() set search_path = public, pg_temp;
alter function public.validate_line_supervisor_chain() set search_path = public, pg_temp;

-- RLS enablement
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

-- org_units
drop policy if exists org_units_employees_read on public.org_units;
create policy org_units_employees_read on public.org_units for select using (public.has_employees_manage());
drop policy if exists org_units_employees_write on public.org_units;
create policy org_units_employees_write on public.org_units for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

-- positions
drop policy if exists positions_employees_read on public.positions;
create policy positions_employees_read on public.positions for select using (public.has_employees_manage());
drop policy if exists positions_employees_write on public.positions;
create policy positions_employees_write on public.positions for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

-- employees
drop policy if exists employees_employees_read on public.employees;
create policy employees_employees_read on public.employees for select using (public.has_employees_manage());
drop policy if exists employees_self_read on public.employees;
create policy employees_self_read on public.employees for select using (user_id = (select auth.uid()));
drop policy if exists employees_employees_write on public.employees;
create policy employees_employees_write on public.employees for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

-- employee_assignments
drop policy if exists employee_assignments_employees_read on public.employee_assignments;
create policy employee_assignments_employees_read on public.employee_assignments for select using (public.has_employees_manage());
drop policy if exists employee_assignments_employees_write on public.employee_assignments;
create policy employee_assignments_employees_write on public.employee_assignments for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

-- employee_supervisors
drop policy if exists employee_supervisors_employees_read on public.employee_supervisors;
create policy employee_supervisors_employees_read on public.employee_supervisors for select using (public.has_employees_manage());
drop policy if exists employee_supervisors_employees_write on public.employee_supervisors;
create policy employee_supervisors_employees_write on public.employee_supervisors for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

-- programs
drop policy if exists programs_employees_read on public.programs;
create policy programs_employees_read on public.programs for select using (public.has_employees_manage());
drop policy if exists programs_employees_write on public.programs;
create policy programs_employees_write on public.programs for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

-- program_chairs
drop policy if exists program_chairs_employees_read on public.program_chairs;
create policy program_chairs_employees_read on public.program_chairs for select using (public.has_employees_manage());
drop policy if exists program_chairs_employees_write on public.program_chairs;
create policy program_chairs_employees_write on public.program_chairs for all
  using (public.has_employees_manage())
  with check (public.has_employees_manage());

