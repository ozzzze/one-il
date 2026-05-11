-- Bilingual UI: English labels for HR lookup tables (paired with label_th).

alter table public.employment_contract_types add column if not exists label_en text;
alter table public.hr_employment_statuses add column if not exists label_en text;
alter table public.personnel_categories add column if not exists label_en text;
alter table public.deduction_types add column if not exists label_en text;

update public.employment_contract_types
set label_en = v.en
from (values
  ('civil_servant', 'Civil servant'),
  ('budget_employee', 'Budget-funded employee'),
  ('revenue_employee', 'Revenue-funded employee'),
  ('contract_hire', 'Contract hire')
) as v(code, en)
where employment_contract_types.code = v.code;

update public.hr_employment_statuses
set label_en = v.en
from (values
  ('active', 'Active'),
  ('resigned', 'Resigned'),
  ('disabled', 'Disabled'),
  ('vacancy_dropout', 'Dropped from authorized position'),
  ('contract_end', 'Contract ended'),
  ('probation_failed', 'Failed probation'),
  ('transferred', 'Transferred')
) as v(code, en)
where hr_employment_statuses.code = v.code;

update public.personnel_categories
set label_en = v.en
from (values
  ('uni_staff', 'University staff'),
  ('civil_servant', 'Civil servant'),
  ('hired', 'Hired staff')
) as v(code, en)
where personnel_categories.code = v.code;

update public.deduction_types
set label_en = v.en
from (values
  ('social_security', 'Social security'),
  ('provident_fund', 'Provident fund'),
  ('savings_cooperative', 'Savings cooperative')
) as v(code, en)
where deduction_types.code = v.code;

-- Fallback for any extra rows created outside seeds (UI uses Thai until translated).
update public.employment_contract_types set label_en = label_th where label_en is null;
update public.hr_employment_statuses set label_en = label_th where label_en is null;
update public.personnel_categories set label_en = label_th where label_en is null;
update public.deduction_types set label_en = label_th where label_en is null;

alter table public.employment_contract_types alter column label_en set not null;
alter table public.hr_employment_statuses alter column label_en set not null;
alter table public.personnel_categories alter column label_en set not null;
alter table public.deduction_types alter column label_en set not null;
