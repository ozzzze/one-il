-- Align RLS with app permission leave:manage (admin + editor), not only has_admin_role().

create or replace function public.has_leave_manage_role()
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

grant execute on function public.has_leave_manage_role() to authenticated;

drop policy if exists institutional_holidays_insert_admin on public.institutional_holidays;
create policy institutional_holidays_insert_leave_manage
  on public.institutional_holidays
  for insert
  to authenticated
  with check (public.has_leave_manage_role());

drop policy if exists institutional_holidays_update_admin on public.institutional_holidays;
create policy institutional_holidays_update_leave_manage
  on public.institutional_holidays
  for update
  to authenticated
  using (public.has_leave_manage_role())
  with check (public.has_leave_manage_role());

drop policy if exists institutional_holidays_delete_admin on public.institutional_holidays;
create policy institutional_holidays_delete_leave_manage
  on public.institutional_holidays
  for delete
  to authenticated
  using (public.has_leave_manage_role());
