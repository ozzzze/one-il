-- Core performance / policy tuning for existing schema.
-- Adds missing FK indexes and splits ALL policies to avoid overlapping SELECT policies.

create index if not exists idx_notifications_user_id
  on public.notifications (user_id)
  where user_id is not null;

create index if not exists idx_oauth_accounts_user_id
  on public.oauth_accounts (user_id);

create index if not exists idx_password_reset_tokens_user_id
  on public.password_reset_tokens (user_id);

create index if not exists idx_pages_author_id
  on public.pages (author_id);

create index if not exists idx_sessions_user_id
  on public.sessions (user_id);

create index if not exists idx_org_units_parent_unit_id
  on public.org_units (parent_unit_id)
  where parent_unit_id is not null;

create index if not exists idx_employee_assignments_position_id
  on public.employee_assignments (position_id);

create index if not exists idx_employee_assignments_org_unit_id
  on public.employee_assignments (org_unit_id);

create index if not exists idx_employees_employment_contract_type_id
  on public.employees (employment_contract_type_id)
  where employment_contract_type_id is not null;

create index if not exists idx_employees_personnel_category_id
  on public.employees (personnel_category_id)
  where personnel_category_id is not null;

create index if not exists idx_employees_hr_employment_status_id
  on public.employees (hr_employment_status_id)
  where hr_employment_status_id is not null;

create index if not exists idx_asset_annual_inspections_created_by_user_id
  on public.asset_annual_inspections (created_by_user_id)
  where created_by_user_id is not null;

create index if not exists idx_asset_assignments_responsible_employee_id
  on public.asset_assignments (responsible_employee_id)
  where responsible_employee_id is not null;

create index if not exists idx_asset_assignments_org_unit_id
  on public.asset_assignments (org_unit_id)
  where org_unit_id is not null;

create index if not exists idx_asset_assignments_location_id
  on public.asset_assignments (location_id)
  where location_id is not null;

create index if not exists idx_asset_assignments_created_by_user_id
  on public.asset_assignments (created_by_user_id)
  where created_by_user_id is not null;

create index if not exists idx_asset_disposal_requests_requested_by_employee_id
  on public.asset_disposal_requests (requested_by_employee_id)
  where requested_by_employee_id is not null;

create index if not exists idx_asset_disposal_requests_created_by_user_id
  on public.asset_disposal_requests (created_by_user_id)
  where created_by_user_id is not null;

create index if not exists idx_asset_inspection_lines_condition_id
  on public.asset_inspection_lines (condition_id)
  where condition_id is not null;

create index if not exists idx_asset_inspection_lines_inspected_by_employee_id
  on public.asset_inspection_lines (inspected_by_employee_id)
  where inspected_by_employee_id is not null;

create index if not exists idx_asset_maintenance_reported_by_employee_id
  on public.asset_maintenance (reported_by_employee_id)
  where reported_by_employee_id is not null;

create index if not exists idx_asset_maintenance_created_by_user_id
  on public.asset_maintenance (created_by_user_id)
  where created_by_user_id is not null;

create index if not exists idx_asset_registers_category_id
  on public.asset_registers (category_id);

create index if not exists idx_asset_registers_condition_id
  on public.asset_registers (condition_id)
  where condition_id is not null;

create index if not exists idx_asset_registers_created_by_user_id
  on public.asset_registers (created_by_user_id)
  where created_by_user_id is not null;

create index if not exists idx_asset_registers_location_id
  on public.asset_registers (location_id)
  where location_id is not null;

create index if not exists idx_asset_transfers_created_by_user_id
  on public.asset_transfers (created_by_user_id)
  where created_by_user_id is not null;

create index if not exists idx_asset_transfers_from_employee_id
  on public.asset_transfers (from_employee_id)
  where from_employee_id is not null;

create index if not exists idx_asset_transfers_from_location_id
  on public.asset_transfers (from_location_id)
  where from_location_id is not null;

create index if not exists idx_asset_transfers_from_org_unit_id
  on public.asset_transfers (from_org_unit_id)
  where from_org_unit_id is not null;

create index if not exists idx_asset_transfers_requested_by_employee_id
  on public.asset_transfers (requested_by_employee_id)
  where requested_by_employee_id is not null;

create index if not exists idx_asset_transfers_to_employee_id
  on public.asset_transfers (to_employee_id)
  where to_employee_id is not null;

create index if not exists idx_asset_transfers_to_location_id
  on public.asset_transfers (to_location_id)
  where to_location_id is not null;

create index if not exists idx_asset_transfers_to_org_unit_id
  on public.asset_transfers (to_org_unit_id)
  where to_org_unit_id is not null;

create index if not exists idx_supply_documents_uploaded_by_user_id
  on public.supply_documents (uploaded_by_user_id)
  where uploaded_by_user_id is not null;

create index if not exists idx_supply_approval_steps_approver_employee_id
  on public.supply_approval_steps (approver_employee_id)
  where approver_employee_id is not null;

drop policy if exists asset_annual_inspections_write on public.asset_annual_inspections;
create policy asset_annual_inspections_insert on public.asset_annual_inspections
  for insert to authenticated
  with check (public.has_asset_manage() or public.has_asset_inspect());
create policy asset_annual_inspections_update on public.asset_annual_inspections
  for update to authenticated
  using (public.has_asset_manage() or public.has_asset_inspect())
  with check (public.has_asset_manage() or public.has_asset_inspect());
create policy asset_annual_inspections_delete on public.asset_annual_inspections
  for delete to authenticated
  using (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_assignments_manage on public.asset_assignments;
create policy asset_assignments_insert on public.asset_assignments
  for insert to authenticated
  with check (public.has_asset_manage());
create policy asset_assignments_update on public.asset_assignments
  for update to authenticated
  using (public.has_asset_manage())
  with check (public.has_asset_manage());
create policy asset_assignments_delete on public.asset_assignments
  for delete to authenticated
  using (public.has_asset_manage());

drop policy if exists asset_disposal_lines_write on public.asset_disposal_lines;
create policy asset_disposal_lines_insert on public.asset_disposal_lines
  for insert to authenticated
  with check (public.has_asset_manage() or public.has_asset_dispose());
create policy asset_disposal_lines_update on public.asset_disposal_lines
  for update to authenticated
  using (public.has_asset_manage() or public.has_asset_dispose())
  with check (public.has_asset_manage() or public.has_asset_dispose());
create policy asset_disposal_lines_delete on public.asset_disposal_lines
  for delete to authenticated
  using (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists asset_disposal_requests_write on public.asset_disposal_requests;
create policy asset_disposal_requests_insert on public.asset_disposal_requests
  for insert to authenticated
  with check (public.has_asset_manage() or public.has_asset_dispose());
create policy asset_disposal_requests_update on public.asset_disposal_requests
  for update to authenticated
  using (public.has_asset_manage() or public.has_asset_dispose())
  with check (public.has_asset_manage() or public.has_asset_dispose());
create policy asset_disposal_requests_delete on public.asset_disposal_requests
  for delete to authenticated
  using (public.has_asset_manage() or public.has_asset_dispose());

drop policy if exists asset_inspection_lines_write on public.asset_inspection_lines;
create policy asset_inspection_lines_insert on public.asset_inspection_lines
  for insert to authenticated
  with check (public.has_asset_manage() or public.has_asset_inspect());
create policy asset_inspection_lines_update on public.asset_inspection_lines
  for update to authenticated
  using (public.has_asset_manage() or public.has_asset_inspect())
  with check (public.has_asset_manage() or public.has_asset_inspect());
create policy asset_inspection_lines_delete on public.asset_inspection_lines
  for delete to authenticated
  using (public.has_asset_manage() or public.has_asset_inspect());

drop policy if exists asset_maintenance_write on public.asset_maintenance;
create policy asset_maintenance_insert on public.asset_maintenance
  for insert to authenticated
  with check (public.has_asset_manage() or reported_by_employee_id = public.current_employee_id());
create policy asset_maintenance_update on public.asset_maintenance
  for update to authenticated
  using (public.has_asset_manage() or reported_by_employee_id = public.current_employee_id())
  with check (public.has_asset_manage() or reported_by_employee_id = public.current_employee_id());
create policy asset_maintenance_delete on public.asset_maintenance
  for delete to authenticated
  using (public.has_asset_manage() or reported_by_employee_id = public.current_employee_id());

drop policy if exists asset_registers_manage on public.asset_registers;
create policy asset_registers_insert on public.asset_registers
  for insert to authenticated
  with check (public.has_asset_manage());
create policy asset_registers_update on public.asset_registers
  for update to authenticated
  using (public.has_asset_manage())
  with check (public.has_asset_manage());
create policy asset_registers_delete on public.asset_registers
  for delete to authenticated
  using (public.has_asset_manage());

drop policy if exists asset_transfers_write on public.asset_transfers;
create policy asset_transfers_insert on public.asset_transfers
  for insert to authenticated
  with check (public.has_asset_manage() or requested_by_employee_id = public.current_employee_id());
create policy asset_transfers_update on public.asset_transfers
  for update to authenticated
  using (public.has_asset_manage() or requested_by_employee_id = public.current_employee_id())
  with check (public.has_asset_manage() or requested_by_employee_id = public.current_employee_id());
create policy asset_transfers_delete on public.asset_transfers
  for delete to authenticated
  using (public.has_asset_manage() or requested_by_employee_id = public.current_employee_id());

drop policy if exists employee_emergency_contacts_admin_all on public.employee_emergency_contacts;
create policy employee_emergency_contacts_admin_insert on public.employee_emergency_contacts
  for insert to authenticated
  with check (public.has_employees_manage());
create policy employee_emergency_contacts_admin_update on public.employee_emergency_contacts
  for update to authenticated
  using (public.has_employees_manage())
  with check (public.has_employees_manage());
create policy employee_emergency_contacts_admin_delete on public.employee_emergency_contacts
  for delete to authenticated
  using (public.has_employees_manage());

drop policy if exists supply_documents_write on public.supply_documents;
create policy supply_documents_insert on public.supply_documents
  for insert to authenticated
  with check (public.has_supply_manage() or public.has_asset_manage());
create policy supply_documents_update on public.supply_documents
  for update to authenticated
  using (public.has_supply_manage() or public.has_asset_manage())
  with check (public.has_supply_manage() or public.has_asset_manage());
create policy supply_documents_delete on public.supply_documents
  for delete to authenticated
  using (public.has_supply_manage() or public.has_asset_manage());

drop policy if exists supply_approval_steps_write on public.supply_approval_steps;
create policy supply_approval_steps_insert on public.supply_approval_steps
  for insert to authenticated
  with check (
    public.has_supply_manage()
    or public.has_asset_manage()
    or public.has_asset_inspect()
    or public.has_asset_dispose()
  );
create policy supply_approval_steps_update on public.supply_approval_steps
  for update to authenticated
  using (
    public.has_supply_manage()
    or public.has_asset_manage()
    or public.has_asset_inspect()
    or public.has_asset_dispose()
  )
  with check (
    public.has_supply_manage()
    or public.has_asset_manage()
    or public.has_asset_inspect()
    or public.has_asset_dispose()
  );
create policy supply_approval_steps_delete on public.supply_approval_steps
  for delete to authenticated
  using (
    public.has_supply_manage()
    or public.has_asset_manage()
    or public.has_asset_inspect()
    or public.has_asset_dispose()
  );

notify pgrst, 'reload schema';
