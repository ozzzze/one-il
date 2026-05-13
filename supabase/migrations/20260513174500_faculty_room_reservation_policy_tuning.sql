-- Faculty room reservation policy tuning.
-- Keep new request/room-booking tables read-only for authenticated users and
-- leave writes to service-role backed server actions / RPC only.

drop policy if exists faculty_requests_insert on public.faculty_requests;
drop policy if exists faculty_requests_update on public.faculty_requests;
drop policy if exists faculty_request_steps_write on public.faculty_request_steps;
drop policy if exists faculty_request_events_insert on public.faculty_request_events;
drop policy if exists reservable_rooms_manage on public.reservable_rooms;
drop policy if exists reservable_asset_settings_manage on public.reservable_asset_settings;
drop policy if exists room_booking_requests_write on public.room_booking_requests;
drop policy if exists room_booking_equipment_lines_write on public.room_booking_equipment_lines;
drop policy if exists room_default_assets_manage on public.room_default_assets;
drop policy if exists room_schedule_blocks_manage on public.room_schedule_blocks;

drop policy if exists faculty_requests_read on public.faculty_requests;
create policy faculty_requests_read on public.faculty_requests
  for select to authenticated
  using (
    public.has_requests_manage()
    or created_by_user_id = (select auth.uid())
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
          r.created_by_user_id = (select auth.uid())
          or r.requester_employee_id = public.current_employee_id()
        )
    )
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
          r.created_by_user_id = (select auth.uid())
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

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
          r.created_by_user_id = (select auth.uid())
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
          r.created_by_user_id = (select auth.uid())
          or r.requester_employee_id = public.current_employee_id()
        )
    )
  );

notify pgrst, 'reload schema';
