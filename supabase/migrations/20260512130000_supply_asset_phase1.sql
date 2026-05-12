-- Supply and asset module phase 1.
-- Covers Thai government-style material stock control, fixed asset register,
-- annual inspection, disposal workflow, audit trail, and baseline RLS.

create table if not exists public.supply_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  label_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supply_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  label_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  label_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  label_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_conditions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  label_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_en text,
  org_unit_id uuid references public.org_units (id) on delete set null,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_en text,
  category_id uuid not null references public.supply_categories (id),
  unit_id uuid not null references public.supply_units (id),
  specification text,
  reorder_level numeric(14, 2) not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_requisitions (
  id uuid primary key default gen_random_uuid(),
  requisition_no text not null unique,
  requester_employee_id uuid not null references public.employees (id),
  org_unit_id uuid references public.org_units (id) on delete set null,
  purpose text not null,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'partially_issued', 'issued', 'rejected', 'cancelled')
  ),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  issued_at timestamptz,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_requisition_lines (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references public.material_requisitions (id) on delete cascade,
  item_id uuid not null references public.material_items (id),
  requested_quantity numeric(14, 2) not null check (requested_quantity > 0),
  approved_quantity numeric(14, 2) check (approved_quantity is null or approved_quantity >= 0),
  issued_quantity numeric(14, 2) not null default 0 check (issued_quantity >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requisition_id, item_id)
);

create table if not exists public.material_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  received_at date not null default current_date,
  location_id uuid not null references public.stock_locations (id),
  source_type text not null default 'manual' check (source_type in ('purchase', 'transfer', 'return', 'opening', 'manual')),
  document_ref text,
  note text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_stock_balances (
  item_id uuid not null references public.material_items (id) on delete cascade,
  location_id uuid not null references public.stock_locations (id) on delete cascade,
  quantity_on_hand numeric(14, 2) not null default 0 check (quantity_on_hand >= 0),
  updated_at timestamptz not null default now(),
  primary key (item_id, location_id)
);

create table if not exists public.material_stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.material_items (id),
  location_id uuid not null references public.stock_locations (id),
  movement_type text not null check (
    movement_type in ('opening', 'receipt', 'issue', 'return', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out')
  ),
  quantity numeric(14, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) check (unit_cost is null or unit_cost >= 0),
  receipt_id uuid references public.material_receipts (id) on delete set null,
  requisition_id uuid references public.material_requisitions (id) on delete set null,
  document_ref text,
  note text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

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

create table if not exists public.supply_audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  actor_user_id uuid references public.users (id) on delete set null,
  actor_employee_id uuid references public.employees (id) on delete set null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_locations_org_unit_id on public.stock_locations (org_unit_id);
create index if not exists idx_material_items_category_id on public.material_items (category_id);
create index if not exists idx_material_items_unit_id on public.material_items (unit_id);
create index if not exists idx_material_requisitions_requester on public.material_requisitions (requester_employee_id);
create index if not exists idx_material_requisition_lines_item_id on public.material_requisition_lines (item_id);
create index if not exists idx_material_stock_movements_item_location on public.material_stock_movements (item_id, location_id, created_at desc);
create index if not exists idx_asset_registers_responsible_employee_id on public.asset_registers (responsible_employee_id);
create index if not exists idx_asset_registers_org_unit_id on public.asset_registers (org_unit_id);
create index if not exists idx_asset_registers_status_id on public.asset_registers (status_id);
create index if not exists idx_asset_assignments_asset_id on public.asset_assignments (asset_id);
create index if not exists idx_asset_transfers_asset_id on public.asset_transfers (asset_id);
create index if not exists idx_asset_maintenance_asset_id on public.asset_maintenance (asset_id);
create index if not exists idx_asset_inspection_lines_asset_id on public.asset_inspection_lines (asset_id);
create index if not exists idx_asset_disposal_lines_asset_id on public.asset_disposal_lines (asset_id);
create index if not exists idx_supply_documents_document on public.supply_documents (document_type, document_id);
create index if not exists idx_supply_approval_steps_document on public.supply_approval_steps (document_type, document_id);
create index if not exists idx_supply_audit_events_entity on public.supply_audit_events (entity_type, entity_id, created_at desc);

insert into public.supply_units (code, label_th, label_en, sort_order) values
  ('piece', 'ชิ้น', 'Piece', 10),
  ('box', 'กล่อง', 'Box', 20),
  ('ream', 'รีม', 'Ream', 30),
  ('pack', 'แพ็ค', 'Pack', 40),
  ('bottle', 'ขวด', 'Bottle', 50),
  ('set', 'ชุด', 'Set', 60)
on conflict (code) do nothing;

insert into public.supply_categories (code, label_th, label_en, sort_order) values
  ('office', 'วัสดุสำนักงาน', 'Office supplies', 10),
  ('computer', 'วัสดุคอมพิวเตอร์', 'Computer supplies', 20),
  ('education', 'วัสดุการศึกษา', 'Educational supplies', 30),
  ('cleaning', 'วัสดุทำความสะอาด', 'Cleaning supplies', 40),
  ('lab', 'วัสดุห้องปฏิบัติการ', 'Laboratory supplies', 50)
on conflict (code) do nothing;

insert into public.asset_categories (code, label_th, label_en, sort_order) values
  ('computer', 'ครุภัณฑ์คอมพิวเตอร์', 'Computer equipment', 10),
  ('av', 'ครุภัณฑ์โสตทัศนูปกรณ์', 'Audio-visual equipment', 20),
  ('furniture', 'ครุภัณฑ์สำนักงานและเฟอร์นิเจอร์', 'Office furniture and equipment', 30),
  ('lab', 'ครุภัณฑ์ห้องปฏิบัติการ', 'Laboratory equipment', 40),
  ('vehicle', 'ยานพาหนะ', 'Vehicle', 50)
on conflict (code) do nothing;

insert into public.asset_statuses (code, label_th, label_en, sort_order) values
  ('active', 'ใช้งาน', 'Active', 10),
  ('spare', 'สำรอง', 'Spare', 20),
  ('repair', 'ซ่อม', 'Under repair', 30),
  ('damaged', 'ชำรุด', 'Damaged', 40),
  ('pending_disposal', 'รอจำหน่าย', 'Pending disposal', 50),
  ('disposed', 'จำหน่ายแล้ว', 'Disposed', 60),
  ('lost', 'สูญ', 'Lost', 70)
on conflict (code) do nothing;

insert into public.asset_conditions (code, label_th, label_en, sort_order) values
  ('good', 'ดี', 'Good', 10),
  ('fair', 'พอใช้', 'Fair', 20),
  ('damaged', 'ชำรุด', 'Damaged', 30),
  ('deteriorated', 'เสื่อมสภาพ', 'Deteriorated', 40)
on conflict (code) do nothing;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select e.id
  from public.employees e
  where e.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_supply_manage()
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

create or replace function public.has_asset_manage()
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

grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.has_supply_manage() to authenticated;
grant execute on function public.has_asset_manage() to authenticated;
grant execute on function public.has_asset_inspect() to authenticated;
grant execute on function public.has_asset_dispose() to authenticated;

create or replace function public.apply_material_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  delta numeric(14, 2);
  changed_rows int;
begin
  delta := case
    when new.movement_type in ('issue', 'adjustment_out', 'transfer_out') then -new.quantity
    else new.quantity
  end;

  if delta < 0 then
    update public.material_stock_balances
    set
      quantity_on_hand = quantity_on_hand + delta,
      updated_at = now()
    where item_id = new.item_id
      and location_id = new.location_id
      and quantity_on_hand >= abs(delta);

    get diagnostics changed_rows = row_count;
    if changed_rows = 0 then
      raise exception 'Insufficient material stock for item %, location %', new.item_id, new.location_id
        using errcode = '23514';
    end if;
  else
    insert into public.material_stock_balances (item_id, location_id, quantity_on_hand, updated_at)
    values (new.item_id, new.location_id, delta, now())
    on conflict (item_id, location_id) do update
    set
      quantity_on_hand = public.material_stock_balances.quantity_on_hand + excluded.quantity_on_hand,
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists material_stock_movements_apply_balance on public.material_stock_movements;
create trigger material_stock_movements_apply_balance
after insert on public.material_stock_movements
for each row execute procedure public.apply_material_stock_movement();

grant execute on function public.apply_material_stock_movement() to service_role;

alter table public.supply_units enable row level security;
alter table public.supply_categories enable row level security;
alter table public.asset_categories enable row level security;
alter table public.asset_statuses enable row level security;
alter table public.asset_conditions enable row level security;
alter table public.stock_locations enable row level security;
alter table public.material_items enable row level security;
alter table public.material_requisitions enable row level security;
alter table public.material_requisition_lines enable row level security;
alter table public.material_receipts enable row level security;
alter table public.material_stock_balances enable row level security;
alter table public.material_stock_movements enable row level security;
alter table public.asset_registers enable row level security;
alter table public.asset_assignments enable row level security;
alter table public.asset_transfers enable row level security;
alter table public.asset_maintenance enable row level security;
alter table public.asset_annual_inspections enable row level security;
alter table public.asset_inspection_lines enable row level security;
alter table public.asset_disposal_requests enable row level security;
alter table public.asset_disposal_lines enable row level security;
alter table public.supply_documents enable row level security;
alter table public.supply_approval_steps enable row level security;
alter table public.supply_audit_events enable row level security;

drop policy if exists supply_units_read on public.supply_units;
create policy supply_units_read on public.supply_units for select to authenticated using (true);
drop policy if exists supply_units_manage on public.supply_units;
create policy supply_units_manage on public.supply_units for all using (public.has_supply_manage()) with check (public.has_supply_manage());

drop policy if exists supply_categories_read on public.supply_categories;
create policy supply_categories_read on public.supply_categories for select to authenticated using (true);
drop policy if exists supply_categories_manage on public.supply_categories;
create policy supply_categories_manage on public.supply_categories for all using (public.has_supply_manage()) with check (public.has_supply_manage());

drop policy if exists asset_categories_read on public.asset_categories;
create policy asset_categories_read on public.asset_categories for select to authenticated using (true);
drop policy if exists asset_categories_manage on public.asset_categories;
create policy asset_categories_manage on public.asset_categories for all using (public.has_asset_manage()) with check (public.has_asset_manage());

drop policy if exists asset_statuses_read on public.asset_statuses;
create policy asset_statuses_read on public.asset_statuses for select to authenticated using (true);
drop policy if exists asset_statuses_manage on public.asset_statuses;
create policy asset_statuses_manage on public.asset_statuses for all using (public.has_asset_manage()) with check (public.has_asset_manage());

drop policy if exists asset_conditions_read on public.asset_conditions;
create policy asset_conditions_read on public.asset_conditions for select to authenticated using (true);
drop policy if exists asset_conditions_manage on public.asset_conditions;
create policy asset_conditions_manage on public.asset_conditions for all using (public.has_asset_manage()) with check (public.has_asset_manage());

drop policy if exists stock_locations_read on public.stock_locations;
create policy stock_locations_read on public.stock_locations for select to authenticated using (true);
drop policy if exists stock_locations_manage on public.stock_locations;
create policy stock_locations_manage on public.stock_locations for all using (public.has_supply_manage() or public.has_asset_manage()) with check (public.has_supply_manage() or public.has_asset_manage());

drop policy if exists material_items_read on public.material_items;
create policy material_items_read on public.material_items for select to authenticated using (true);
drop policy if exists material_items_manage on public.material_items;
create policy material_items_manage on public.material_items for all using (public.has_supply_manage()) with check (public.has_supply_manage());

drop policy if exists material_stock_balances_read on public.material_stock_balances;
create policy material_stock_balances_read on public.material_stock_balances for select to authenticated using (true);
drop policy if exists material_stock_balances_manage on public.material_stock_balances;
create policy material_stock_balances_manage on public.material_stock_balances for all using (public.has_supply_manage()) with check (public.has_supply_manage());

drop policy if exists material_stock_movements_read on public.material_stock_movements;
create policy material_stock_movements_read on public.material_stock_movements for select to authenticated using (true);
drop policy if exists material_stock_movements_insert on public.material_stock_movements;
create policy material_stock_movements_insert on public.material_stock_movements for insert with check (public.has_supply_manage());

drop policy if exists material_requisitions_read on public.material_requisitions;
create policy material_requisitions_read on public.material_requisitions
  for select to authenticated
  using (public.has_supply_manage() or requester_employee_id = public.current_employee_id());
drop policy if exists material_requisitions_insert on public.material_requisitions;
create policy material_requisitions_insert on public.material_requisitions
  for insert
  with check (public.has_supply_manage() or requester_employee_id = public.current_employee_id());
drop policy if exists material_requisitions_update on public.material_requisitions;
create policy material_requisitions_update on public.material_requisitions
  for update
  using (public.has_supply_manage() or requester_employee_id = public.current_employee_id())
  with check (public.has_supply_manage() or requester_employee_id = public.current_employee_id());

drop policy if exists material_requisition_lines_read on public.material_requisition_lines;
create policy material_requisition_lines_read on public.material_requisition_lines
  for select to authenticated
  using (
    public.has_supply_manage()
    or exists (
      select 1 from public.material_requisitions r
      where r.id = requisition_id and r.requester_employee_id = public.current_employee_id()
    )
  );
drop policy if exists material_requisition_lines_write on public.material_requisition_lines;
create policy material_requisition_lines_write on public.material_requisition_lines
  for all
  using (
    public.has_supply_manage()
    or exists (
      select 1 from public.material_requisitions r
      where r.id = requisition_id and r.requester_employee_id = public.current_employee_id()
    )
  )
  with check (
    public.has_supply_manage()
    or exists (
      select 1 from public.material_requisitions r
      where r.id = requisition_id and r.requester_employee_id = public.current_employee_id()
    )
  );

drop policy if exists material_receipts_manage on public.material_receipts;
create policy material_receipts_manage on public.material_receipts for all using (public.has_supply_manage()) with check (public.has_supply_manage());

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
create policy asset_annual_inspections_read on public.asset_annual_inspections for select to authenticated using (public.has_asset_manage() or public.has_asset_inspect());
drop policy if exists asset_annual_inspections_write on public.asset_annual_inspections;
create policy asset_annual_inspections_write on public.asset_annual_inspections for all using (public.has_asset_manage() or public.has_asset_inspect()) with check (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_inspection_lines_read on public.asset_inspection_lines;
create policy asset_inspection_lines_read on public.asset_inspection_lines for select to authenticated using (public.has_asset_manage() or public.has_asset_inspect());
drop policy if exists asset_inspection_lines_write on public.asset_inspection_lines;
create policy asset_inspection_lines_write on public.asset_inspection_lines for all using (public.has_asset_manage() or public.has_asset_inspect()) with check (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_disposal_requests_read on public.asset_disposal_requests;
create policy asset_disposal_requests_read on public.asset_disposal_requests for select to authenticated using (public.has_asset_manage() or public.has_asset_dispose());
drop policy if exists asset_disposal_requests_write on public.asset_disposal_requests;
create policy asset_disposal_requests_write on public.asset_disposal_requests for all using (public.has_asset_manage() or public.has_asset_dispose()) with check (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists asset_disposal_lines_read on public.asset_disposal_lines;
create policy asset_disposal_lines_read on public.asset_disposal_lines for select to authenticated using (public.has_asset_manage() or public.has_asset_dispose());
drop policy if exists asset_disposal_lines_write on public.asset_disposal_lines;
create policy asset_disposal_lines_write on public.asset_disposal_lines for all using (public.has_asset_manage() or public.has_asset_dispose()) with check (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists supply_documents_read on public.supply_documents;
create policy supply_documents_read on public.supply_documents for select to authenticated using (true);
drop policy if exists supply_documents_write on public.supply_documents;
create policy supply_documents_write on public.supply_documents for all using (public.has_supply_manage() or public.has_asset_manage()) with check (public.has_supply_manage() or public.has_asset_manage());

drop policy if exists supply_approval_steps_read on public.supply_approval_steps;
create policy supply_approval_steps_read on public.supply_approval_steps for select to authenticated using (true);
drop policy if exists supply_approval_steps_write on public.supply_approval_steps;
create policy supply_approval_steps_write on public.supply_approval_steps for all using (public.has_supply_manage() or public.has_asset_manage() or public.has_asset_inspect() or public.has_asset_dispose()) with check (public.has_supply_manage() or public.has_asset_manage() or public.has_asset_inspect() or public.has_asset_dispose());

drop policy if exists supply_audit_events_read on public.supply_audit_events;
create policy supply_audit_events_read on public.supply_audit_events for select to authenticated using (public.has_supply_manage() or public.has_asset_manage() or public.has_asset_inspect() or public.has_asset_dispose());
drop policy if exists supply_audit_events_insert on public.supply_audit_events;
create policy supply_audit_events_insert on public.supply_audit_events for insert with check (public.has_supply_manage() or public.has_asset_manage() or public.has_asset_inspect() or public.has_asset_dispose());
