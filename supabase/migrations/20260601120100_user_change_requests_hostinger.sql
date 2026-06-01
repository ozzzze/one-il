-- Hostinger / one-leave shared Postgres: no public.users — link to auth.users + one_leave RBAC.

create or replace function public.has_admin_role()
returns boolean
language sql
stable
security invoker
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and (
        is_super_admin is true
        or coalesce(raw_app_meta_data->>'role', '') in ('admin', 'service_role')
      )
  );
$$;

grant execute on function public.has_admin_role() to authenticated;

create table if not exists public.user_change_requests (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	field text not null,
	current_value text,
	requested_value text not null,
	reason text,
	status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
	reviewed_by uuid references auth.users(id) on delete set null,
	review_note text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	reviewed_at timestamptz
);

create index if not exists user_change_requests_user_id_idx on public.user_change_requests (user_id);
create index if not exists user_change_requests_status_idx on public.user_change_requests (status);

alter table public.user_change_requests enable row level security;

drop policy if exists user_change_requests_select_own on public.user_change_requests;
create policy user_change_requests_select_own
	on public.user_change_requests
	for select
	to authenticated
	using (user_id = (select auth.uid()) or public.has_admin_role());

drop policy if exists user_change_requests_insert_own on public.user_change_requests;
create policy user_change_requests_insert_own
	on public.user_change_requests
	for insert
	to authenticated
	with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists user_change_requests_delete_own on public.user_change_requests;
create policy user_change_requests_delete_own
	on public.user_change_requests
	for delete
	to authenticated
	using (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists user_change_requests_update_admin on public.user_change_requests;
create policy user_change_requests_update_admin
	on public.user_change_requests
	for update
	to authenticated
	using (public.has_admin_role())
	with check (public.has_admin_role());
