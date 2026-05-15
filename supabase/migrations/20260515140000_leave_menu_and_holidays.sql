-- Leave module menu (parent + children) and institutional holidays.

-- ---------------------------------------------------------------------------
-- Menu: Leave hub with Leave + Holiday children
-- ---------------------------------------------------------------------------

update public.menu_items
set
  href = null,
  implementation_status = 'live',
  required_permission_keys = array['leave:view']::text[],
  sort_order = 10
where id = 'office-leave';

insert into public.menu_items (
  id, group_id, parent_id, label_th, label_en, href, icon_key, keywords,
  required_permission_keys, visibility, implementation_status, sort_order
) values
  (
    'leave-home', 'office', 'office-leave', 'การลา', 'Leave', '/leave', 'calendar_fold',
    array['leave', 'ลา', 'วันลา', 'leave request'],
    array['leave:view']::text[], 'standard', 'live', 0
  ),
  (
    'leave-holidays', 'office', 'office-leave', 'วันหยุด', 'Holidays', '/leave/holidays', 'calendar_days',
    array['holiday', 'holidays', 'วันหยุด', 'public holiday', 'calendar'],
    array['leave:view']::text[], 'standard', 'live', 10
  )
on conflict (id) do update set
  group_id = excluded.group_id,
  parent_id = excluded.parent_id,
  label_th = excluded.label_th,
  label_en = excluded.label_en,
  href = excluded.href,
  icon_key = excluded.icon_key,
  keywords = excluded.keywords,
  required_permission_keys = excluded.required_permission_keys,
  visibility = excluded.visibility,
  implementation_status = excluded.implementation_status,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Institutional holidays (faculty-wide non-working days)
-- ---------------------------------------------------------------------------

create table if not exists public.institutional_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null,
  name_th text not null,
  name_en text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references public.users (id) on delete set null,
  constraint institutional_holidays_date_unique unique (holiday_date),
  constraint institutional_holidays_name_th_nonempty check (char_length(trim(name_th)) > 0)
);

create index if not exists institutional_holidays_date_idx
  on public.institutional_holidays (holiday_date desc);

create or replace function public.set_institutional_holidays_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists institutional_holidays_updated_at on public.institutional_holidays;
create trigger institutional_holidays_updated_at
  before update on public.institutional_holidays
  for each row
  execute function public.set_institutional_holidays_updated_at();

alter table public.institutional_holidays enable row level security;

drop policy if exists institutional_holidays_select_authenticated on public.institutional_holidays;
create policy institutional_holidays_select_authenticated
  on public.institutional_holidays
  for select
  to authenticated
  using (true);

drop policy if exists institutional_holidays_insert_admin on public.institutional_holidays;
create policy institutional_holidays_insert_admin
  on public.institutional_holidays
  for insert
  to authenticated
  with check (public.has_admin_role());

drop policy if exists institutional_holidays_update_admin on public.institutional_holidays;
create policy institutional_holidays_update_admin
  on public.institutional_holidays
  for update
  to authenticated
  using (public.has_admin_role())
  with check (public.has_admin_role());

drop policy if exists institutional_holidays_delete_admin on public.institutional_holidays;
create policy institutional_holidays_delete_admin
  on public.institutional_holidays
  for delete
  to authenticated
  using (public.has_admin_role());

grant select on public.institutional_holidays to authenticated;
grant insert, update, delete on public.institutional_holidays to authenticated;
