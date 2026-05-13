-- Local/dev seed data.
-- Keep inserts idempotent so `supabase db reset` can run safely multiple times.

-- Starter room booking master data
with seed_room as (
  insert into public.reservable_rooms (
    stock_location_id,
    room_code,
    name,
    name_en,
    room_type,
    capacity,
    approver_employee_id,
    booking_window_days,
    min_advance_hours,
    setup_buffer_minutes,
    cleanup_buffer_minutes,
    cancellation_cutoff_hours,
    allow_equipment_request,
    note,
    is_active
  )
  select
    sl.id,
    'MEETING-01',
    'ห้องประชุม 1',
    'Meeting Room 1',
    'meeting_room',
    12,
    coalesce(
      (
        select ea.employee_id
        from public.employee_assignments ea
        join public.positions p on p.id = ea.position_id
        where ea.ends_at is null
          and p.code in ('HEAD', 'DIRECTOR')
        order by
          case p.code
            when 'HEAD' then 0
            when 'DIRECTOR' then 1
            else 2
          end,
          ea.starts_at desc nulls last,
          ea.created_at desc
        limit 1
      ),
      (
        select e.id
        from public.employees e
        order by e.created_at desc, e.employee_no
        limit 1
      )
    ),
    180,
    48,
    15,
    15,
    24,
    true,
    'Seeded starter room for room booking flows.',
    true
  from public.stock_locations sl
  where sl.is_active = true
    and not exists (
      select 1
      from public.reservable_rooms rr
      where rr.room_code = 'MEETING-01'
    )
  order by sl.sort_order nulls last, sl.code
  limit 1
  returning id
)
select count(*) from seed_room;

insert into public.reservable_asset_settings (
  asset_id,
  is_requestable,
  is_portable,
  sort_order,
  note
)
select
  ar.id,
  true,
  true,
  row_number() over (order by ar.asset_no, ar.id) - 1,
  'Seeded for room booking catalog.'
from public.asset_registers ar
where not exists (
  select 1
  from public.reservable_asset_settings ras
  where ras.asset_id = ar.id
);

insert into public.room_default_assets (
  room_id,
  asset_id,
  sort_order,
  note
)
select
  rr.id,
  ras.asset_id,
  0,
  'Starter default room equipment.'
from public.reservable_rooms rr
join public.reservable_asset_settings ras on true
where rr.room_code = 'MEETING-01'
  and not exists (
    select 1
    from public.room_default_assets rda
    where rda.room_id = rr.id
  )
order by ras.sort_order, ras.asset_id
limit 1;
