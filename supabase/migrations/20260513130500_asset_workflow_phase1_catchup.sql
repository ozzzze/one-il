-- Catch-up for environments where `20260512130000_supply_asset_phase1`
-- was applied before the asset workflow tables/functions were added.

create or replace function public.has_asset_inspect()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'editor')
  );
$$;

create or replace function public.has_asset_dispose()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;

grant execute on function public.has_asset_inspect() to authenticated;
grant execute on function public.has_asset_dispose() to authenticated;

create table if not exists public.asset_transfers (
  id uuid primary key default gen_random_uuid(),
  transfer_no text not null unique,
  asset_id uuid not null references public.asset_registers (id) on delete cascade,
  from_employee_id uuid references public.employees (id) on delete set null,
  to_employee_id uuid references public.employees (id) on delete set null,
  from_org_unit_id uuid references public.org_units (id) on delete set null,
  to_org_unit_id uuid references public.org_units (id) on delete set null,
  from_location_id uuid references public.stock_locations (id) on delete set null,
  to_location_id uuid references public.stock_locations (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'completed', 'cancelled')),
  reason text,
  requested_by_employee_id uuid references public.employees (id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_maintenance (
  id uuid primary key default gen_random_uuid(),
  maintenance_no text not null unique,
  asset_id uuid not null references public.asset_registers (id) on delete cascade,
  reported_by_employee_id uuid references public.employees (id) on delete set null,
  reported_at timestamptz not null default now(),
  status text not null default 'reported' check (status in ('reported', 'in_progress', 'completed', 'cancelled')),
  issue text not null,
  action_taken text,
  cost numeric(14, 2) check (cost is null or cost >= 0),
  vendor text,
  completed_at timestamptz,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_annual_inspections (
  id uuid primary key default gen_random_uuid(),
  fiscal_year int not null,
  inspection_no text not null unique,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'completed', 'approved', 'cancelled')),
  starts_at date not null,
  ends_at date,
  note text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_asset_inspection_dates check (ends_at is null or ends_at >= starts_at)
);

create table if not exists public.asset_inspection_lines (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.asset_annual_inspections (id) on delete cascade,
  asset_id uuid not null references public.asset_registers (id) on delete cascade,
  found_status text not null default 'pending' check (found_status in ('pending', 'found', 'not_found')),
  condition_id uuid references public.asset_conditions (id) on delete set null,
  recommendation text check (
    recommendation is null or recommendation in ('keep_using', 'repair', 'dispose', 'investigate')
  ),
  remark text,
  inspected_by_employee_id uuid references public.employees (id) on delete set null,
  inspected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inspection_id, asset_id)
);

create table if not exists public.asset_disposal_requests (
  id uuid primary key default gen_random_uuid(),
  disposal_no text not null unique,
  method text not null check (method in ('sale', 'transfer', 'convert', 'destroy', 'write_off_lost')),
  reason text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'fact_finding', 'approved', 'completed', 'rejected', 'cancelled')),
  requested_by_employee_id uuid references public.employees (id) on delete set null,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  completed_at timestamptz,
  proceeds_amount numeric(14, 2) check (proceeds_amount is null or proceeds_amount >= 0),
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_disposal_lines (
  id uuid primary key default gen_random_uuid(),
  disposal_id uuid not null references public.asset_disposal_requests (id) on delete cascade,
  asset_id uuid not null references public.asset_registers (id) on delete restrict,
  estimated_value numeric(14, 2) check (estimated_value is null or estimated_value >= 0),
  final_value numeric(14, 2) check (final_value is null or final_value >= 0),
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (disposal_id, asset_id)
);

create table if not exists public.supply_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (
    document_type in ('material_requisition', 'material_receipt', 'asset_register', 'asset_transfer', 'asset_maintenance', 'asset_inspection', 'asset_disposal')
  ),
  document_id uuid not null,
  file_name text not null,
  object_key text,
  external_ref text,
  note text,
  uploaded_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.supply_approval_steps (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (
    document_type in ('material_requisition', 'asset_transfer', 'asset_inspection', 'asset_disposal')
  ),
  document_id uuid not null,
  step_order int not null check (step_order > 0),
  approver_employee_id uuid references public.employees (id) on delete set null,
  action_type text not null check (action_type in ('acknowledge', 'approve', 'inspect', 'dispose')),
  step_status text not null default 'pending' check (step_status in ('pending', 'approved', 'rejected', 'skipped')),
  acted_at timestamptz,
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, document_id, step_order)
);

create index if not exists idx_asset_transfers_asset_id on public.asset_transfers (asset_id);
create index if not exists idx_asset_maintenance_asset_id on public.asset_maintenance (asset_id);
create index if not exists idx_asset_inspection_lines_asset_id on public.asset_inspection_lines (asset_id);
create index if not exists idx_asset_disposal_lines_asset_id on public.asset_disposal_lines (asset_id);
create index if not exists idx_supply_documents_document on public.supply_documents (document_type, document_id);
create index if not exists idx_supply_approval_steps_document on public.supply_approval_steps (document_type, document_id);

alter table public.asset_transfers enable row level security;
alter table public.asset_maintenance enable row level security;
alter table public.asset_annual_inspections enable row level security;
alter table public.asset_inspection_lines enable row level security;
alter table public.asset_disposal_requests enable row level security;
alter table public.asset_disposal_lines enable row level security;
alter table public.supply_documents enable row level security;
alter table public.supply_approval_steps enable row level security;

drop policy if exists asset_transfers_read on public.asset_transfers;
create policy asset_transfers_read on public.asset_transfers
  for select to authenticated
  using (
    public.has_asset_manage()
    or requested_by_employee_id = public.current_employee_id()
    or from_employee_id = public.current_employee_id()
    or to_employee_id = public.current_employee_id()
  );

drop policy if exists asset_transfers_write on public.asset_transfers;
create policy asset_transfers_write on public.asset_transfers
  for all
  using (public.has_asset_manage() or requested_by_employee_id = public.current_employee_id())
  with check (public.has_asset_manage() or requested_by_employee_id = public.current_employee_id());

drop policy if exists asset_maintenance_read on public.asset_maintenance;
create policy asset_maintenance_read on public.asset_maintenance
  for select to authenticated
  using (
    public.has_asset_manage()
    or reported_by_employee_id = public.current_employee_id()
    or exists (
      select 1 from public.asset_registers a
      where a.id = asset_id and a.responsible_employee_id = public.current_employee_id()
    )
  );

drop policy if exists asset_maintenance_write on public.asset_maintenance;
create policy asset_maintenance_write on public.asset_maintenance
  for all
  using (public.has_asset_manage() or reported_by_employee_id = public.current_employee_id())
  with check (public.has_asset_manage() or reported_by_employee_id = public.current_employee_id());

drop policy if exists asset_annual_inspections_read on public.asset_annual_inspections;
create policy asset_annual_inspections_read on public.asset_annual_inspections
  for select to authenticated
  using (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_annual_inspections_write on public.asset_annual_inspections;
create policy asset_annual_inspections_write on public.asset_annual_inspections
  for all
  using (public.has_asset_manage() or public.has_asset_inspect())
  with check (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_inspection_lines_read on public.asset_inspection_lines;
create policy asset_inspection_lines_read on public.asset_inspection_lines
  for select to authenticated
  using (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_inspection_lines_write on public.asset_inspection_lines;
create policy asset_inspection_lines_write on public.asset_inspection_lines
  for all
  using (public.has_asset_manage() or public.has_asset_inspect())
  with check (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_disposal_requests_read on public.asset_disposal_requests;
create policy asset_disposal_requests_read on public.asset_disposal_requests
  for select to authenticated
  using (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists asset_disposal_requests_write on public.asset_disposal_requests;
create policy asset_disposal_requests_write on public.asset_disposal_requests
  for all
  using (public.has_asset_manage() or public.has_asset_dispose())
  with check (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists asset_disposal_lines_read on public.asset_disposal_lines;
create policy asset_disposal_lines_read on public.asset_disposal_lines
  for select to authenticated
  using (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists asset_disposal_lines_write on public.asset_disposal_lines;
create policy asset_disposal_lines_write on public.asset_disposal_lines
  for all
  using (public.has_asset_manage() or public.has_asset_dispose())
  with check (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists supply_documents_read on public.supply_documents;
create policy supply_documents_read on public.supply_documents
  for select to authenticated
  using (true);

drop policy if exists supply_documents_write on public.supply_documents;
create policy supply_documents_write on public.supply_documents
  for all
  using (public.has_supply_manage() or public.has_asset_manage())
  with check (public.has_supply_manage() or public.has_asset_manage());

drop policy if exists supply_approval_steps_read on public.supply_approval_steps;
create policy supply_approval_steps_read on public.supply_approval_steps
  for select to authenticated
  using (public.has_supply_manage() or public.has_asset_manage() or public.has_asset_inspect() or public.has_asset_dispose());

drop policy if exists supply_approval_steps_write on public.supply_approval_steps;
create policy supply_approval_steps_write on public.supply_approval_steps
  for all
  using (public.has_supply_manage() or public.has_asset_manage() or public.has_asset_inspect() or public.has_asset_dispose())
  with check (public.has_supply_manage() or public.has_asset_manage() or public.has_asset_inspect() or public.has_asset_dispose());

notify pgrst, 'reload schema';
