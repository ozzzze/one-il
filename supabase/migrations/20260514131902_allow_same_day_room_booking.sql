-- Allow same-day room booking by default while still preventing past start times.
alter table public.reservable_rooms
  alter column min_advance_hours set default 0;

update public.reservable_rooms
set min_advance_hours = 0
where min_advance_hours = 48;
