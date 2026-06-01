-- Gateway account change requests: use one_leave.users (bigint) as identity core.

drop table if exists public.user_change_requests cascade;

create or replace function public.has_admin_role()
returns boolean
language sql
stable
security invoker
set search_path = public, one_leave, pg_temp
as $$
  select exists (
    select 1
    from one_leave.user_roles ur
    where ur.user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint
      and ur.role_code = 'admin'
  );
$$;

grant execute on function public.has_admin_role() to authenticated;

create table public.user_change_requests (
	id uuid primary key default gen_random_uuid(),
	user_id bigint not null references one_leave.users(id) on delete cascade,
	field text not null,
	current_value text,
	requested_value text not null,
	reason text,
	status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
	reviewed_by bigint references one_leave.users(id) on delete set null,
	review_note text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	reviewed_at timestamptz
);

create index user_change_requests_user_id_idx on public.user_change_requests (user_id);
create index user_change_requests_status_idx on public.user_change_requests (status);

alter table public.user_change_requests enable row level security;

-- Server uses DATABASE_URL (service); RLS documents intent if JWT carries leave user id later.
create policy user_change_requests_select_own
	on public.user_change_requests
	for select
	to authenticated
	using (
		user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint
		or public.has_admin_role()
	);

create policy user_change_requests_insert_own
	on public.user_change_requests
	for insert
	to authenticated
	with check (
		user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint
		and status = 'pending'
	);

create policy user_change_requests_delete_own
	on public.user_change_requests
	for delete
	to authenticated
	using (user_id = nullif(current_setting('app.leave_user_id', true), '')::bigint and status = 'pending');

create policy user_change_requests_update_admin
	on public.user_change_requests
	for update
	to authenticated
	using (public.has_admin_role())
	with check (public.has_admin_role());

notify pgrst, 'reload schema';
