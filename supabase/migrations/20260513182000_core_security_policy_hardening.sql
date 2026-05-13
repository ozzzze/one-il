-- Core security / policy hardening for existing tables.
-- Removes unnecessary function execute grants, sets missing search_path values,
-- and adds conservative RLS policies for tables that already had RLS enabled.

create or replace function public.has_admin_role()
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

grant execute on function public.has_admin_role() to authenticated;

create or replace function public.has_content_manage()
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

grant execute on function public.has_content_manage() to authenticated;

alter function public.get_active_role_code(uuid) set search_path = public, pg_temp;
alter function public.validate_singleton_active_roles() set search_path = public, pg_temp;
alter function public.validate_line_supervisor_chain() set search_path = public, pg_temp;

revoke execute on function public.link_employee_user_by_email(uuid, text) from public, anon, authenticated;
revoke execute on function public.trg_users_after_insert_link_employee() from public, anon, authenticated;
revoke execute on function public.trg_employees_try_link_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.get_active_role_code(uuid) from public, anon, authenticated;
revoke execute on function public.validate_singleton_active_roles() from public, anon, authenticated;
revoke execute on function public.validate_line_supervisor_chain() from public, anon, authenticated;

grant execute on function public.link_employee_user_by_email(uuid, text) to service_role;
grant execute on function public.trg_users_after_insert_link_employee() to service_role;
grant execute on function public.trg_employees_try_link_user() to service_role;
grant execute on function public.get_active_role_code(uuid) to service_role;
grant execute on function public.validate_singleton_active_roles() to service_role;
grant execute on function public.validate_line_supervisor_chain() to service_role;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists sessions_select_own on public.sessions;
create policy sessions_select_own on public.sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists pages_read_authenticated on public.pages;
create policy pages_read_authenticated on public.pages
  for select to authenticated
  using (
    status = 'published'
    or author_id = (select auth.uid())
    or public.has_content_manage()
  );

drop policy if exists notifications_read_authenticated on public.notifications;
create policy notifications_read_authenticated on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()) or user_id is null);

drop policy if exists notifications_update_authenticated on public.notifications;
create policy notifications_update_authenticated on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()) or user_id is null)
  with check (user_id = (select auth.uid()) or user_id is null);

drop policy if exists notifications_delete_authenticated on public.notifications;
create policy notifications_delete_authenticated on public.notifications
  for delete to authenticated
  using (user_id = (select auth.uid()) or user_id is null);

drop policy if exists app_settings_read_authenticated on public.app_settings;
create policy app_settings_read_authenticated on public.app_settings
  for select to authenticated
  using (
    public.has_admin_role()
    or key like (((select auth.uid())::text) || ':%')
  );

drop policy if exists app_settings_insert_authenticated on public.app_settings;
create policy app_settings_insert_authenticated on public.app_settings
  for insert to authenticated
  with check (
    public.has_admin_role()
    or key like (((select auth.uid())::text) || ':%')
  );

drop policy if exists app_settings_update_authenticated on public.app_settings;
create policy app_settings_update_authenticated on public.app_settings
  for update to authenticated
  using (
    public.has_admin_role()
    or key like (((select auth.uid())::text) || ':%')
  )
  with check (
    public.has_admin_role()
    or key like (((select auth.uid())::text) || ':%')
  );

drop policy if exists positions_read_authenticated on public.positions;
create policy positions_read_authenticated on public.positions
  for select to authenticated
  using (true);

drop policy if exists org_units_read_authenticated on public.org_units;
create policy org_units_read_authenticated on public.org_units
  for select to authenticated
  using (true);

drop policy if exists oauth_accounts_block_all on public.oauth_accounts;
create policy oauth_accounts_block_all on public.oauth_accounts
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists password_reset_tokens_block_all on public.password_reset_tokens;
create policy password_reset_tokens_block_all on public.password_reset_tokens
  for all to authenticated
  using (false)
  with check (false);

notify pgrst, 'reload schema';
