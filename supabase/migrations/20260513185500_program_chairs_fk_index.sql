-- Add missing FK index reported by advisors.

create index if not exists idx_program_chairs_employee_id
  on public.program_chairs (employee_id);

notify pgrst, 'reload schema';
