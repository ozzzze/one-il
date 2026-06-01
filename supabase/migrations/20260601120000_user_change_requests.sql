-- User change requests: a user asks to change their own profile/account/role data.
-- Submission is self-service; review (approve/reject) is admin-only.
-- Defense-in-depth RLS; server actions use the service-role client + code guards.

create table if not exists public.user_change_requests (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users(id) on delete cascade,
	field text not null,
	current_value text,
	requested_value text not null,
	reason text,
	status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
	reviewed_by uuid references public.users(id) on delete set null,
	review_note text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	reviewed_at timestamptz
);

create index if not exists user_change_requests_user_id_idx on public.user_change_requests (user_id);
create index if not exists user_change_requests_status_idx on public.user_change_requests (status);

alter table public.user_change_requests enable row level security;

-- A user can read their own requests; admins can read all.
create policy user_change_requests_select_own
	on public.user_change_requests
	for select
	to authenticated
	using (user_id = (select auth.uid()) or public.has_admin_role());

-- A user can submit a pending request for themselves only.
create policy user_change_requests_insert_own
	on public.user_change_requests
	for insert
	to authenticated
	with check (user_id = (select auth.uid()) and status = 'pending');

-- A user can withdraw their own request while it is still pending.
create policy user_change_requests_delete_own
	on public.user_change_requests
	for delete
	to authenticated
	using (user_id = (select auth.uid()) and status = 'pending');

-- Only admins can review (approve/reject) requests.
create policy user_change_requests_update_admin
	on public.user_change_requests
	for update
	to authenticated
	using (public.has_admin_role())
	with check (public.has_admin_role());
