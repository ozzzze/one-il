-- Link employees <-> public.users: HR provisioning + email match + self-read RLS

-- Align users.role check with app (includes "user")
alter table public.users drop constraint if exists users_role_check;
alter table public.users
	add constraint users_role_check check (role in ('admin', 'editor', 'viewer', 'user'));

alter table public.employees
	add column if not exists user_id uuid references public.users (id) on delete set null,
	add column if not exists app_role text;

alter table public.employees drop constraint if exists employees_app_role_check;
alter table public.employees
	add constraint employees_app_role_check check (
		app_role is null or app_role in ('admin', 'editor', 'viewer', 'user')
	);

create unique index if not exists uq_employees_user_id on public.employees (user_id)
	where
		user_id is not null;

create index if not exists idx_employees_email_lower on public.employees ((lower(trim(email))))
	where
		email is not null;

create or replace function public.is_valid_app_role(r text)
returns boolean
language sql
immutable
strict
set search_path = public, pg_temp
as $$
	select r in ('admin', 'editor', 'viewer', 'user');
$$;

-- Idempotent: link one unmatched employee to this user by normalized email; sync role/name from employee when valid.
create or replace function public.link_employee_user_by_email(target_user_id uuid, user_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
	emp record;
	display_name text;
	new_role text;
begin
	if target_user_id is null or user_email is null or length(trim(user_email)) = 0 then
		return;
	end if;

	if exists (
		select 1
		from public.employees e
		where
			e.user_id = target_user_id
	) then
		return;
	end if;

	select e.*
	into emp
	from public.employees e
	where
		e.user_id is null
		and e.email is not null
		and lower(trim(e.email)) = lower(trim(user_email))
	limit 1;

	if emp.id is null then
		return;
	end if;

	update public.employees e
	set
		user_id = target_user_id
	where
		e.id = emp.id;

	display_name := trim(emp.first_name || ' ' || emp.last_name);
	new_role :=
		case
			when public.is_valid_app_role(emp.app_role) then emp.app_role
			else null::text
		end;

	update public.users u
	set
		role = coalesce(new_role, u.role),
		name = case
			when length(display_name) > 0 then display_name
			else u.name
		end
	where
		u.id = target_user_id;
end;
$$;

create or replace function public.trg_users_after_insert_link_employee()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
	perform public.link_employee_user_by_email(new.id, new.email);
	return new;
end;
$$;

drop trigger if exists users_after_insert_link_employee on public.users;
create trigger users_after_insert_link_employee
after insert on public.users for each row
execute procedure public.trg_users_after_insert_link_employee();

-- Backfill: HR creates employee after user exists
create or replace function public.trg_employees_try_link_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
	matched_user record;
	display_name text;
	new_role text;
begin
	if new.user_id is not null then
		return new;
	end if;
	if new.email is null or length(trim(new.email)) = 0 then
		return new;
	end if;

	select u.*
	into matched_user
	from public.users u
	where
		lower(trim(u.email)) = lower(trim(new.email))
		and not exists (
			select 1
			from public.employees e
			where
				e.user_id = u.id
		)
	limit 1;

	if matched_user.id is null then
		return new;
	end if;

	display_name := trim(new.first_name || ' ' || new.last_name);
	new_role :=
		case
			when public.is_valid_app_role(new.app_role) then new.app_role
			else null::text
		end;

	update public.employees e
	set
		user_id = matched_user.id
	where
		e.id = new.id;

	update public.users u
	set
		role = coalesce(new_role, u.role),
		name = case
			when length(display_name) > 0 then display_name
			else u.name
		end
	where
		u.id = matched_user.id;

	return new;
end;
$$;

drop trigger if exists employees_after_insert_try_link_user on public.employees;
create trigger employees_after_insert_try_link_user
after insert on public.employees for each row
execute procedure public.trg_employees_try_link_user();

drop trigger if exists employees_after_update_try_link_user on public.employees;
create trigger employees_after_update_try_link_user
after update of email, app_role on public.employees for each row
	when (
		new.user_id is null
	)
execute procedure public.trg_employees_try_link_user();

-- Self-service read: employee row linked to current auth user
drop policy if exists employees_self_read on public.employees;
create policy employees_self_read on public.employees for
select
	using (user_id = (select auth.uid()));

grant execute on function public.link_employee_user_by_email (uuid, text) to service_role;
