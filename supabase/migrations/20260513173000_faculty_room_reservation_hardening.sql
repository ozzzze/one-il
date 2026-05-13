-- Faculty room reservation hardening.
-- Tightens function execute permissions and adds missing FK indexes
-- reported by Supabase advisors after phase 1 rollout.

create index if not exists idx_faculty_request_events_actor_user
  on public.faculty_request_events (actor_user_id)
  where actor_user_id is not null;

create index if not exists idx_faculty_request_events_actor_employee
  on public.faculty_request_events (actor_employee_id)
  where actor_employee_id is not null;

create index if not exists idx_reservable_rooms_stock_location
  on public.reservable_rooms (stock_location_id);

create index if not exists idx_reservable_rooms_approver
  on public.reservable_rooms (approver_employee_id)
  where approver_employee_id is not null;

create index if not exists idx_room_booking_equipment_lines_asset
  on public.room_booking_equipment_lines (asset_id);

create index if not exists idx_room_schedule_blocks_created_by
  on public.room_schedule_blocks (created_by_user_id)
  where created_by_user_id is not null;

create index if not exists idx_room_default_assets_asset
  on public.room_default_assets (asset_id);

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
set search_path = pg_catalog, pg_temp
as $$
  select
    (existing_start - make_interval(mins => greatest(existing_setup_minutes, 0)))
      < (candidate_end + make_interval(mins => greatest(candidate_cleanup_minutes, 0)))
    and
    (existing_end + make_interval(mins => greatest(existing_cleanup_minutes, 0)))
      > (candidate_start - make_interval(mins => greatest(candidate_setup_minutes, 0)));
$$;

revoke execute on function public.submit_room_booking_request(
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
) from public, anon, authenticated;

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

revoke execute on function public.cancel_faculty_request(
  uuid,
  uuid,
  uuid,
  text
) from public, anon, authenticated;

grant execute on function public.cancel_faculty_request(
  uuid,
  uuid,
  uuid,
  text
) to service_role;

revoke execute on function public.decide_room_booking_request(
  uuid,
  uuid,
  uuid,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.decide_room_booking_request(
  uuid,
  uuid,
  uuid,
  text,
  text
) to service_role;

revoke execute on function public.validate_room_booking_request() from public, anon, authenticated;
grant execute on function public.validate_room_booking_request() to service_role;

notify pgrst, 'reload schema';
