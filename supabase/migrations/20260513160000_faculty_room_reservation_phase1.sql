-- Faculty room reservation phase 1.
-- Adds shared request workflow tables, reservable room masters,
-- room booking payloads, requestable equipment settings, blackout schedules,
-- and baseline RLS aligned with the current requests/asset roles.

create or replace function public.has_requests_manage()
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

grant execute on function public.has_requests_manage() to authenticated;

create table if not exists public.faculty_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text not null unique,
  kind text not null check (kind in ('leave', 'room_booking', 'equipment_borrow', 'academic_service')),
  requester_employee_id uuid not null references public.employees (id) on delete restrict,
  created_by_user_id uuid not null references public.users (id) on delete restrict,
  title text not null,
  details text,
  status text not null default 'pending_approval' check (
    status in ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled')
  ),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  last_decision_remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faculty_request_steps (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.faculty_requests (id) on delete cascade,
  step_order int not null check (step_order > 0),
  approver_employee_id uuid not null references public.employees (id) on delete restrict,
  action_type text not null check (action_type in ('review', 'approve')),
  step_status text not null default 'pending' check (
    step_status in ('pending', 'approved', 'rejected', 'skipped', 'cancelled')
  ),
  acted_at timestamptz,
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, step_order)
);

create table if not exists public.faculty_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.faculty_requests (id) on delete cascade,
  event_type text not null check (
    event_type in ('submitted', 'approved', 'rejected', 'cancelled', 'updated')
  ),
  actor_user_id uuid references public.users (id) on delete set null,
  actor_employee_id uuid references public.employees (id) on delete set null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reservable_rooms (
  id uuid primary key default gen_random_uuid(),
  stock_location_id uuid not null references public.stock_locations (id) on delete restrict,
  room_code text not null unique,
  name text not null,
  name_en text,
  room_type text not null default 'meeting_room' check (
    room_type in ('classroom', 'meeting_room', 'lab', 'shared_space')
  ),
  capacity int not null default 1 check (capacity > 0),
  approver_employee_id uuid references public.employees (id) on delete set null,
  booking_window_days int not null default 180 check (booking_window_days > 0),
  min_advance_hours int not null default 48 check (min_advance_hours >= 0),
  setup_buffer_minutes int not null default 15 check (setup_buffer_minutes >= 0),
  cleanup_buffer_minutes int not null default 15 check (cleanup_buffer_minutes >= 0),
  cancellation_cutoff_hours int not null default 24 check (cancellation_cutoff_hours >= 0),
  allow_equipment_request boolean not null default true,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stock_location_id)
);

create table if not exists public.reservable_asset_settings (
  asset_id uuid primary key references public.asset_registers (id) on delete cascade,
  is_requestable boolean not null default true,
  is_portable boolean not null default true,
  sort_order int not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_booking_requests (
  request_id uuid primary key references public.faculty_requests (id) on delete cascade,
  room_id uuid not null references public.reservable_rooms (id) on delete restrict,
  requested_start_at timestamptz not null,
  requested_end_at timestamptz not null,
  setup_buffer_minutes int not null default 0 check (setup_buffer_minutes >= 0),
  cleanup_buffer_minutes int not null default 0 check (cleanup_buffer_minutes >= 0),
  attendee_count int not null default 1 check (attendee_count > 0),
  purpose text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_room_booking_request_time_range check (requested_end_at > requested_start_at)
);

create table if not exists public.room_booking_equipment_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.room_booking_requests (request_id) on delete cascade,
  asset_id uuid not null references public.asset_registers (id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, asset_id)
);

create table if not exists public.room_default_assets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.reservable_rooms (id) on delete cascade,
  asset_id uuid not null references public.asset_registers (id) on delete restrict,
  sort_order int not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, asset_id)
);

create table if not exists public.room_schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.reservable_rooms (id) on delete cascade,
  block_type text not null default 'maintenance' check (
    block_type in ('maintenance', 'event', 'exam', 'closed')
  ),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_room_schedule_block_range check (ends_at > starts_at)
);

create index if not exists idx_faculty_requests_kind_status
  on public.faculty_requests (kind, status, requested_at desc);
create index if not exists idx_faculty_requests_requester
  on public.faculty_requests (requester_employee_id, requested_at desc);
create index if not exists idx_faculty_requests_created_by
  on public.faculty_requests (created_by_user_id, requested_at desc);
create index if not exists idx_faculty_request_steps_approver
  on public.faculty_request_steps (approver_employee_id, step_status, step_order);
create index if not exists idx_faculty_request_events_request
  on public.faculty_request_events (request_id, created_at desc);
create index if not exists idx_reservable_rooms_room_type
  on public.reservable_rooms (room_type, is_active, room_code);
create index if not exists idx_reservable_asset_settings_sort
  on public.reservable_asset_settings (is_requestable, sort_order);
create index if not exists idx_room_booking_requests_room_time
  on public.room_booking_requests (room_id, requested_start_at, requested_end_at);
create index if not exists idx_room_schedule_blocks_room_time
  on public.room_schedule_blocks (room_id, starts_at, ends_at);
create index if not exists idx_room_default_assets_room
  on public.room_default_assets (room_id, sort_order);

create or replace function public.room_booking_windows_overlap(
  existing_start timestamptz,
  existing_end timestamptz,
  existing_setup_minutes int,
  existing_cleanup_minutes int,
  candidate_start timestamptz,
  candidate_end timestamptz,
  candidate_setup_minutes int,
  candidate_cleanup_minutes int
)
returns boolean
language sql
immutable
as $$
  select
    (existing_start - make_interval(mins => greatest(existing_setup_minutes, 0)))
      < (candidate_end + make_interval(mins => greatest(candidate_cleanup_minutes, 0)))
    and
    (existing_end + make_interval(mins => greatest(existing_cleanup_minutes, 0)))
      > (candidate_start - make_interval(mins => greatest(candidate_setup_minutes, 0)));
$$;

grant execute on function public.room_booking_windows_overlap(
  timestamptz,
  timestamptz,
  int,
  int,
  timestamptz,
  timestamptz,
  int,
  int
) to authenticated;

create or replace function public.submit_room_booking_request(
  p_request_no text,
  p_requester_employee_id uuid,
  p_created_by_user_id uuid,
  p_title text,
  p_details text,
  p_room_id uuid,
  p_requested_start_at timestamptz,
  p_requested_end_at timestamptz,
  p_setup_buffer_minutes int,
  p_cleanup_buffer_minutes int,
  p_attendee_count int,
  p_purpose text,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_equipment_asset_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_id uuid;
  v_room public.reservable_rooms%rowtype;
  v_expected_count int;
  v_actual_count int;
begin
  select *
  into v_room
  from public.reservable_rooms
  where id = p_room_id;

  if not found then
    raise exception 'Reservable room % not found', p_room_id;
  end if;

  if v_room.approver_employee_id is null then
    raise exception 'Room % is not configured with an approver', p_room_id;
  end if;

  if array_length(p_equipment_asset_ids, 1) is not null then
    select count(*)
    into v_expected_count
    from (
      select distinct asset_id
      from unnest(p_equipment_asset_ids) as asset_id
    ) as requested_assets;

    select count(*)
    into v_actual_count
    from public.reservable_asset_settings ras
    where ras.asset_id = any(p_equipment_asset_ids)
      and ras.is_requestable = true;

    if v_expected_count <> v_actual_count then
      raise exception 'One or more equipment items are not requestable';
    end if;
  end if;

  insert into public.faculty_requests (
    request_no,
    kind,
    requester_employee_id,
    created_by_user_id,
    title,
    details,
    status
  )
  values (
    p_request_no,
    'room_booking',
    p_requester_employee_id,
    p_created_by_user_id,
    p_title,
    p_details,
    'pending_approval'
  )
  returning id into v_request_id;

  insert into public.room_booking_requests (
    request_id,
    room_id,
    requested_start_at,
    requested_end_at,
    setup_buffer_minutes,
    cleanup_buffer_minutes,
    attendee_count,
    purpose,
    contact_name,
    contact_email,
    contact_phone
  )
  values (
    v_request_id,
    p_room_id,
    p_requested_start_at,
    p_requested_end_at,
    greatest(p_setup_buffer_minutes, 0),
    greatest(p_cleanup_buffer_minutes, 0),
    p_attendee_count,
    p_purpose,
    nullif(trim(p_contact_name), ''),
    nullif(trim(p_contact_email), ''),
    nullif(trim(p_contact_phone), '')
  );

  if array_length(p_equipment_asset_ids, 1) is not null then
    insert into public.room_booking_equipment_lines (request_id, asset_id, quantity)
    select
      v_request_id,
      requested_assets.asset_id,
      1
    from (
      select distinct asset_id
      from unnest(p_equipment_asset_ids) as asset_id
    ) as requested_assets;
  end if;

  insert into public.faculty_request_steps (
    request_id,
    step_order,
    approver_employee_id,
    action_type,
    step_status
  )
  values (
    v_request_id,
    1,
    v_room.approver_employee_id,
    'approve',
    'pending'
  );

  insert into public.faculty_request_events (
    request_id,
    event_type,
    actor_user_id,
    actor_employee_id,
    summary,
    metadata
  )
  values (
    v_request_id,
    'submitted',
    p_created_by_user_id,
    p_requester_employee_id,
    format('Submitted room booking %s', p_request_no),
    jsonb_build_object(
      'room_id', p_room_id,
      'starts_at', p_requested_start_at,
      'ends_at', p_requested_end_at
    )
  );

  return v_request_id;
end;
$$;

create or replace function public.cancel_faculty_request(
  p_request_id uuid,
  p_actor_user_id uuid,
  p_actor_employee_id uuid,
  p_cancel_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.faculty_requests%rowtype;
  v_booking public.room_booking_requests%rowtype;
  v_room public.reservable_rooms%rowtype;
begin
  select *
  into v_request
  from public.faculty_requests
  where id = p_request_id;

  if not found then
    raise exception 'Faculty request % not found', p_request_id;
  end if;

  if v_request.status not in ('pending_approval', 'approved') then
    raise exception 'Faculty request % cannot be cancelled from status %', p_request_id, v_request.status;
  end if;

  if v_request.kind = 'room_booking' then
    select *
    into v_booking
    from public.room_booking_requests
    where request_id = p_request_id;

    select *
    into v_room
    from public.reservable_rooms
    where id = v_booking.room_id;

    if now() > v_booking.requested_start_at - make_interval(hours => coalesce(v_room.cancellation_cutoff_hours, 0)) then
      raise exception 'Room booking % is past the cancellation cutoff', p_request_id;
    end if;
  end if;

  update public.faculty_requests
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancel_reason = nullif(trim(p_cancel_reason), ''),
    updated_at = now()
  where id = p_request_id;

  update public.faculty_request_steps
  set
    step_status = case when step_status = 'pending' then 'cancelled' else step_status end,
    updated_at = now()
  where request_id = p_request_id;

  insert into public.faculty_request_events (
    request_id,
    event_type,
    actor_user_id,
    actor_employee_id,
    summary,
    metadata
  )
  values (
    p_request_id,
    'cancelled',
    p_actor_user_id,
    p_actor_employee_id,
    'Cancelled faculty request',
    jsonb_build_object('cancel_reason', nullif(trim(p_cancel_reason), ''))
  );
end;
$$;

create or replace function public.decide_room_booking_request(
  p_request_id uuid,
  p_approver_employee_id uuid,
  p_actor_user_id uuid,
  p_decision text,
  p_remark text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.faculty_requests%rowtype;
  v_next_status text;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision % is invalid', p_decision;
  end if;

  select *
  into v_request
  from public.faculty_requests
  where id = p_request_id;

  if not found then
    raise exception 'Faculty request % not found', p_request_id;
  end if;

  if v_request.kind <> 'room_booking' then
    raise exception 'Faculty request % is not a room booking', p_request_id;
  end if;

  if v_request.status <> 'pending_approval' then
    raise exception 'Faculty request % is not pending approval', p_request_id;
  end if;

  update public.faculty_request_steps
  set
    step_status = p_decision,
    acted_at = now(),
    remark = nullif(trim(p_remark), ''),
    updated_at = now()
  where request_id = p_request_id
    and approver_employee_id = p_approver_employee_id
    and step_status = 'pending';

  if not found then
    raise exception 'No pending approval step found for request % and approver %', p_request_id, p_approver_employee_id;
  end if;

  if p_decision = 'approved' then
    if exists (
      select 1
      from public.faculty_request_steps s
      where s.request_id = p_request_id
        and s.step_status = 'pending'
    ) then
      v_next_status := 'pending_approval';
    else
      v_next_status := 'approved';
    end if;

    update public.faculty_requests
    set
      status = v_next_status,
      approved_at = case when v_next_status = 'approved' then now() else approved_at end,
      last_decision_remark = nullif(trim(p_remark), ''),
      updated_at = now()
    where id = p_request_id;
  else
    update public.faculty_request_steps
    set
      step_status = case when step_status = 'pending' then 'skipped' else step_status end,
      updated_at = now()
    where request_id = p_request_id;

    update public.faculty_requests
    set
      status = 'rejected',
      rejected_at = now(),
      last_decision_remark = nullif(trim(p_remark), ''),
      updated_at = now()
    where id = p_request_id;
  end if;

  insert into public.faculty_request_events (
    request_id,
    event_type,
    actor_user_id,
    actor_employee_id,
    summary,
    metadata
  )
  values (
    p_request_id,
    p_decision,
    p_actor_user_id,
    p_approver_employee_id,
    case when p_decision = 'approved' then 'Approved room booking request' else 'Rejected room booking request' end,
    jsonb_build_object('remark', nullif(trim(p_remark), ''))
  );
end;
$$;

grant execute on function public.submit_room_booking_request(
  text,
  uuid,
  uuid,
  text,
  text,
  uuid,
  timestamptz,
  timestamptz,
  int,
  int,
  int,
  text,
  text,
  text,
  text,
  uuid[]
) to service_role;

grant execute on function public.cancel_faculty_request(
  uuid,
  uuid,
  uuid,
  text
) to service_role;

grant execute on function public.decide_room_booking_request(
  uuid,
  uuid,
  uuid,
  text,
  text
) to service_role;

create or replace function public.validate_room_booking_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.reservable_rooms%rowtype;
  v_request public.faculty_requests%rowtype;
begin
  select *
  into v_room
  from public.reservable_rooms
  where id = new.room_id;

  if not found then
    raise exception 'Reservable room % not found', new.room_id;
  end if;

  if not v_room.is_active then
    raise exception 'Room % is inactive', new.room_id;
  end if;

  select *
  into v_request
  from public.faculty_requests
  where id = new.request_id;

  if not found then
    raise exception 'Faculty request % not found', new.request_id;
  end if;

  if v_request.kind <> 'room_booking' then
    raise exception 'Faculty request % is not a room booking request', new.request_id;
  end if;

  if new.attendee_count > v_room.capacity then
    raise exception 'Attendee count exceeds room capacity';
  end if;

  if new.requested_start_at < now() + make_interval(hours => v_room.min_advance_hours) then
    raise exception 'Room booking does not satisfy minimum advance notice';
  end if;

  if new.requested_start_at > now() + make_interval(days => v_room.booking_window_days) then
    raise exception 'Room booking exceeds booking window';
  end if;

  if exists (
    select 1
    from public.room_schedule_blocks b
    where b.room_id = new.room_id
      and public.room_booking_windows_overlap(
        b.starts_at,
        b.ends_at,
        0,
        0,
        new.requested_start_at,
        new.requested_end_at,
        new.setup_buffer_minutes,
        new.cleanup_buffer_minutes
      )
  ) then
    raise exception 'Room is blocked during the requested period';
  end if;

  if exists (
    select 1
    from public.room_booking_requests r
    join public.faculty_requests fr on fr.id = r.request_id
    where r.room_id = new.room_id
      and r.request_id <> new.request_id
      and fr.status in ('pending_approval', 'approved')
      and public.room_booking_windows_overlap(
        r.requested_start_at,
        r.requested_end_at,
        r.setup_buffer_minutes,
        r.cleanup_buffer_minutes,
        new.requested_start_at,
        new.requested_end_at,
        new.setup_buffer_minutes,
        new.cleanup_buffer_minutes
      )
  ) then
    raise exception 'Room is already reserved for the requested period';
  end if;

  return new;
end;
$$;

grant execute on function public.validate_room_booking_request() to service_role;

drop trigger if exists room_booking_requests_validate on public.room_booking_requests;
create trigger room_booking_requests_validate
before insert or update on public.room_booking_requests
for each row execute procedure public.validate_room_booking_request();

create or replace view public.room_reservable_asset_catalog
with (security_invoker = true)
as
select
  a.id as asset_id,
  a.asset_no,
  a.name,
  a.name_en,
  a.brand,
  a.model,
  a.serial_no,
  a.location_id,
  s.code as status_code,
  ras.is_portable,
  ras.sort_order,
  ras.note
from public.reservable_asset_settings ras
join public.asset_registers a on a.id = ras.asset_id
join public.asset_statuses s on s.id = a.status_id
where ras.is_requestable = true;

alter table public.faculty_requests enable row level security;
alter table public.faculty_request_steps enable row level security;
alter table public.faculty_request_events enable row level security;
alter table public.reservable_rooms enable row level security;
alter table public.reservable_asset_settings enable row level security;
alter table public.room_booking_requests enable row level security;
alter table public.room_booking_equipment_lines enable row level security;
alter table public.room_default_assets enable row level security;
alter table public.room_schedule_blocks enable row level security;

drop policy if exists faculty_requests_read on public.faculty_requests;
create policy faculty_requests_read on public.faculty_requests
  for select to authenticated
  using (
    public.has_requests_manage()
    or created_by_user_id = auth.uid()
    or requester_employee_id = public.current_employee_id()
  );

drop policy if exists faculty_requests_insert on public.faculty_requests;
create policy faculty_requests_insert on public.faculty_requests
  for insert
  with check (
    public.has_requests_manage()
    or (
      created_by_user_id = auth.uid()
      and requester_employee_id = public.current_employee_id()
    )
  );

drop policy if exists faculty_requests_update on public.faculty_requests;
create policy faculty_requests_update on public.faculty_requests
  for update to authenticated
  using (
    public.has_requests_manage()
    or created_by_user_id = auth.uid()
    or requester_employee_id = public.current_employee_id()
  )
  with check (
    public.has_requests_manage()
    or created_by_user_id = auth.uid()
    or requester_employee_id = public.current_employee_id()
  );

drop policy if exists faculty_request_steps_read on public.faculty_request_steps;
create policy faculty_request_steps_read on public.faculty_request_steps
  for select to authenticated
  using (
    public.has_requests_manage()
    or approver_employee_id = public.current_employee_id()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

drop policy if exists faculty_request_steps_write on public.faculty_request_steps;
create policy faculty_request_steps_write on public.faculty_request_steps
  for all to authenticated
  using (
    public.has_requests_manage()
    or approver_employee_id = public.current_employee_id()
  )
  with check (
    public.has_requests_manage()
    or approver_employee_id = public.current_employee_id()
  );

drop policy if exists faculty_request_events_read on public.faculty_request_events;
create policy faculty_request_events_read on public.faculty_request_events
  for select to authenticated
  using (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

drop policy if exists faculty_request_events_insert on public.faculty_request_events;
create policy faculty_request_events_insert on public.faculty_request_events
  for insert
  with check (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

drop policy if exists reservable_rooms_read on public.reservable_rooms;
create policy reservable_rooms_read on public.reservable_rooms
  for select to authenticated
  using (is_active = true or public.has_requests_manage());

drop policy if exists reservable_rooms_manage on public.reservable_rooms;
create policy reservable_rooms_manage on public.reservable_rooms
  for all to authenticated
  using (public.has_requests_manage())
  with check (public.has_requests_manage());

drop policy if exists reservable_asset_settings_read on public.reservable_asset_settings;
create policy reservable_asset_settings_read on public.reservable_asset_settings
  for select to authenticated
  using (public.has_requests_manage());

drop policy if exists reservable_asset_settings_manage on public.reservable_asset_settings;
create policy reservable_asset_settings_manage on public.reservable_asset_settings
  for all to authenticated
  using (public.has_requests_manage())
  with check (public.has_requests_manage());

drop policy if exists room_booking_requests_read on public.room_booking_requests;
create policy room_booking_requests_read on public.room_booking_requests
  for select to authenticated
  using (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
    or exists (
      select 1
      from public.faculty_request_steps s
      where s.request_id = room_booking_requests.request_id
        and s.approver_employee_id = public.current_employee_id()
    )
  );

drop policy if exists room_booking_requests_write on public.room_booking_requests;
create policy room_booking_requests_write on public.room_booking_requests
  for all to authenticated
  using (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  )
  with check (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

drop policy if exists room_booking_equipment_lines_read on public.room_booking_equipment_lines;
create policy room_booking_equipment_lines_read on public.room_booking_equipment_lines
  for select to authenticated
  using (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

drop policy if exists room_booking_equipment_lines_write on public.room_booking_equipment_lines;
create policy room_booking_equipment_lines_write on public.room_booking_equipment_lines
  for all to authenticated
  using (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  )
  with check (
    public.has_requests_manage()
    or exists (
      select 1
      from public.faculty_requests r
      where r.id = request_id
        and (
          r.created_by_user_id = auth.uid()
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

drop policy if exists room_default_assets_read on public.room_default_assets;
create policy room_default_assets_read on public.room_default_assets
  for select to authenticated
  using (true);

drop policy if exists room_default_assets_manage on public.room_default_assets;
create policy room_default_assets_manage on public.room_default_assets
  for all to authenticated
  using (public.has_requests_manage())
  with check (public.has_requests_manage());

drop policy if exists room_schedule_blocks_read on public.room_schedule_blocks;
create policy room_schedule_blocks_read on public.room_schedule_blocks
  for select to authenticated
  using (true);

drop policy if exists room_schedule_blocks_manage on public.room_schedule_blocks;
create policy room_schedule_blocks_manage on public.room_schedule_blocks
  for all to authenticated
  using (public.has_requests_manage())
  with check (public.has_requests_manage());

notify pgrst, 'reload schema';
