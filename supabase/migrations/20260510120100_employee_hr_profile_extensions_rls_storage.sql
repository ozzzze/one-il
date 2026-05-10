-- Employee HR profile extensions — part 2: RLS on new tables + Storage bucket employee-photos
-- Requires: 20260510120000_employee_hr_profile_extensions.sql

alter table public.employment_contract_types enable row level security;
alter table public.personnel_categories enable row level security;
alter table public.hr_employment_statuses enable row level security;
alter table public.deduction_types enable row level security;
alter table public.employee_emergency_contacts enable row level security;
alter table public.employee_deductions enable row level security;

drop policy if exists employment_contract_types_manage_all on public.employment_contract_types;
create policy employment_contract_types_manage_all on public.employment_contract_types
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists personnel_categories_manage_all on public.personnel_categories;
create policy personnel_categories_manage_all on public.personnel_categories
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists hr_employment_statuses_manage_all on public.hr_employment_statuses;
create policy hr_employment_statuses_manage_all on public.hr_employment_statuses
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists deduction_types_manage_all on public.deduction_types;
create policy deduction_types_manage_all on public.deduction_types
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists employee_emergency_contacts_admin_all on public.employee_emergency_contacts;
create policy employee_emergency_contacts_admin_all on public.employee_emergency_contacts
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

drop policy if exists employee_emergency_contacts_self_read on public.employee_emergency_contacts;
create policy employee_emergency_contacts_self_read on public.employee_emergency_contacts
  for select using (
    exists (
      select 1 from public.employees e
      where e.id = employee_emergency_contacts.employee_id
        and e.user_id = (select auth.uid())
    )
  );

drop policy if exists employee_deductions_admin_all on public.employee_deductions;
create policy employee_deductions_admin_all on public.employee_deductions
  for all using (public.has_employees_manage()) with check (public.has_employees_manage());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-photos',
  'employee-photos',
  false,
  5242880,
  array['image/jpeg'::text, 'image/png'::text, 'image/webp'::text]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists employee_photos_select_admin_or_owner on storage.objects;
create policy employee_photos_select_admin_or_owner on storage.objects
  for select to authenticated
  using (
    bucket_id = 'employee-photos'
    and (
      public.has_employees_manage()
      or exists (
        select 1 from public.employees e
        where e.user_id = (select auth.uid())
          and split_part(name, '/', 1) = e.id::text
      )
    )
  );

drop policy if exists employee_photos_insert_admin on storage.objects;
create policy employee_photos_insert_admin on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'employee-photos'
    and public.has_employees_manage()
  );

drop policy if exists employee_photos_update_admin on storage.objects;
create policy employee_photos_update_admin on storage.objects
  for update to authenticated
  using (
    bucket_id = 'employee-photos'
    and public.has_employees_manage()
  )
  with check (
    bucket_id = 'employee-photos'
    and public.has_employees_manage()
  );

drop policy if exists employee_photos_delete_admin on storage.objects;
create policy employee_photos_delete_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'employee-photos'
    and public.has_employees_manage()
  );
