-- Employee HR profile extensions — part 1: tables, columns, seeds, has_employees_manage()
-- Photo files: bucket `employee-photos` is configured in part 2 migration.
-- Omits bank account per product decision.

create table if not exists public.employment_contract_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personnel_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_employment_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deduction_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_th text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.employment_contract_types (code, label_th, sort_order) values
  ('civil_servant', 'ข้าราชการ', 10),
  ('budget_employee', 'พนักงานเงินงบประมาณ', 20),
  ('revenue_employee', 'พนักงานเงินรายได้', 30),
  ('contract_hire', 'ลูกจ้าง', 40)
on conflict (code) do nothing;

insert into public.personnel_categories (code, label_th, sort_order) values
  ('uni_staff', 'พนักงานมหาวิทยาลัย', 10),
  ('civil_servant', 'ข้าราชการ', 20),
  ('hired', 'ลูกจ้าง', 30)
on conflict (code) do nothing;

insert into public.hr_employment_statuses (code, label_th, sort_order) values
  ('active', 'ทำงาน', 10),
  ('resigned', 'ลาออก', 20),
  ('disabled', 'ทุพพลภาพ', 30),
  ('vacancy_dropout', 'ขาดจากอัตรา', 40),
  ('contract_end', 'ครบสัญญา', 50),
  ('probation_failed', 'ไม่ผ่านการทดลองงาน', 60),
  ('transferred', 'โอนย้าย', 70)
on conflict (code) do nothing;

insert into public.deduction_types (code, label_th, sort_order) values
  ('social_security', 'ประกันสังคม', 10),
  ('provident_fund', 'กองทุนสำรองเลี้ยงชีพ', 20),
  ('savings_cooperative', 'สหกรณ์ออมทรัพย์', 30)
on conflict (code) do nothing;

create table if not exists public.employee_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  slot smallint not null check (slot between 1 and 2),
  contact_name text,
  relationship text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, slot)
);

create index if not exists idx_employee_emergency_contacts_employee_id
  on public.employee_emergency_contacts (employee_id);

create table if not exists public.employee_deductions (
  employee_id uuid not null references public.employees (id) on delete cascade,
  deduction_type_id uuid not null references public.deduction_types (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (employee_id, deduction_type_id)
);

create index if not exists idx_employee_deductions_deduction_type_id
  on public.employee_deductions (deduction_type_id);

alter table public.employees
  add column if not exists person_title_th text
    check (
      person_title_th is null
      or person_title_th in ('นาย', 'นาง', 'นางสาว')
    ),
  add column if not exists academic_title_th text,
  add column if not exists person_title_en text
    check (
      person_title_en is null
      or person_title_en in ('Mr.', 'Mrs.', 'Miss')
    ),
  add column if not exists academic_title_en text,
  add column if not exists first_name_en text,
  add column if not exists last_name_en text,
  add column if not exists nickname text,
  add column if not exists address text,
  add column if not exists gender text
    check (gender is null or gender in ('male', 'female')),
  add column if not exists duty_kind text
    check (duty_kind is null or duty_kind in ('teacher', 'staff')),
  add column if not exists professional_teacher_license boolean not null default false,
  add column if not exists professional_recognition_status text,
  add column if not exists birth_date date,
  add column if not exists employment_contract_type_id uuid references public.employment_contract_types (id),
  add column if not exists personnel_category_id uuid references public.personnel_categories (id),
  add column if not exists hr_employment_status_id uuid references public.hr_employment_statuses (id),
  add column if not exists employment_started_at date,
  add column if not exists employment_ended_at date,
  add column if not exists photo_object_key text;

alter table public.employees drop constraint if exists ck_employees_employment_dates;
alter table public.employees
  add constraint ck_employees_employment_dates check (
    employment_ended_at is null
    or employment_started_at is null
    or employment_ended_at >= employment_started_at
  );

comment on column public.employees.photo_object_key is
  'Path inside Storage bucket employee-photos, e.g. {employee_id}/profile.webp';

comment on column public.employees.first_name is 'Legal / primary given name (Thai)';
comment on column public.employees.last_name is 'Legal / primary family name (Thai)';

create or replace function public.has_employees_manage()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

grant execute on function public.has_employees_manage() to authenticated;
