-- Catch-up for environments where supply/asset lookup tables exist but core
-- asset register tables were never created (partial migration or manual DDL).

create table if not exists public.asset_registers (
  id uuid primary key default gen_random_uuid(),
  asset_no text not null unique,
  name text not null,
  name_en text,
  category_id uuid not null references public.asset_categories (id),
  status_id uuid not null references public.asset_statuses (id),
  condition_id uuid references public.asset_conditions (id) on delete set null,
  responsible_employee_id uuid references public.employees (id) on delete set null,
  org_unit_id uuid references public.org_units (id) on delete set null,
  location_id uuid references public.stock_locations (id) on delete set null,
  acquired_at date,
  acquisition_cost numeric(14, 2) check (acquisition_cost is null or acquisition_cost >= 0),
  budget_source text,
  brand text,
  model text,
  serial_no text,
  document_ref text,
  note text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_asset_registers_serial_no
  on public.asset_registers (serial_no)
  where serial_no is not null and length(trim(serial_no)) > 0;

create table if not exists public.asset_assignments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset_registers (id) on delete cascade,
  responsible_employee_id uuid references public.employees (id) on delete set null,
  org_unit_id uuid references public.org_units (id) on delete set null,
  location_id uuid references public.stock_locations (id) on delete set null,
  starts_at date not null default current_date,
  ends_at date,
  note text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ck_asset_assignment_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index if not exists uq_asset_one_active_assignment
  on public.asset_assignments (asset_id)
  where ends_at is null;

create index if not exists idx_asset_registers_responsible_employee_id on public.asset_registers (responsible_employee_id);
create index if not exists idx_asset_registers_org_unit_id on public.asset_registers (org_unit_id);
create index if not exists idx_asset_registers_status_id on public.asset_registers (status_id);
create index if not exists idx_asset_assignments_asset_id on public.asset_assignments (asset_id);

alter table public.asset_registers enable row level security;
alter table public.asset_assignments enable row level security;

drop policy if exists asset_registers_read on public.asset_registers;
create policy asset_registers_read on public.asset_registers
  for select to authenticated
  using (public.has_asset_manage() or responsible_employee_id = public.current_employee_id());

drop policy if exists asset_registers_manage on public.asset_registers;
create policy asset_registers_manage on public.asset_registers for all using (public.has_asset_manage()) with check (public.has_asset_manage());

drop policy if exists asset_assignments_read on public.asset_assignments;
create policy asset_assignments_read on public.asset_assignments
  for select to authenticated
  using (
    public.has_asset_manage()
    or responsible_employee_id = public.current_employee_id()
    or exists (
      select 1 from public.asset_registers a
      where a.id = asset_id and a.responsible_employee_id = public.current_employee_id()
    )
  );

drop policy if exists asset_assignments_manage on public.asset_assignments;
create policy asset_assignments_manage on public.asset_assignments for all using (public.has_asset_manage()) with check (public.has_asset_manage());
