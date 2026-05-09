-- Bilingual display: Thai canonical name in `name`, English in `name_en`.
alter table public.positions add column if not exists name_en text;
alter table public.org_units add column if not exists name_en text;

-- Seed-backed rows (by stable code). Rows without a match keep name_en null until edited.
update public.positions
set
	name_en = case code
		when 'DIRECTOR' then 'Director'
		when 'DEPUTY_DIRECTOR' then 'Deputy Director (Administration)'
		when 'DEPUTY_DIRECTOR_RESEARCH' then 'Deputy Director (Research and Innovation)'
		when 'DEPUTY_DIRECTOR_EDU_NETWORK' then 'Deputy Director (Education and Networks)'
		when 'HEAD' then 'Section Head'
		when 'STAFF' then 'Staff'
		when 'LECTURER' then 'Lecturer'
		when 'PROGRAM_CHAIR' then 'Program Chair'
	end,
	updated_at = now()
where code in (
	'DIRECTOR',
	'DEPUTY_DIRECTOR',
	'DEPUTY_DIRECTOR_RESEARCH',
	'DEPUTY_DIRECTOR_EDU_NETWORK',
	'HEAD',
	'STAFF',
	'LECTURER',
	'PROGRAM_CHAIR'
);

update public.org_units
set
	name_en = case code
		when 'DIRECTOR_OFFICE' then 'Director''s Office'
		when 'SCI_TECH_GROUP' then 'Science and Educational Technology Group'
		when 'SUPPORT_GENERAL_ADMIN' then 'General Administration'
		when 'SUPPORT_FINANCE_SUPPLY' then 'Finance and Supplies'
		when 'SUPPORT_EDUCATION' then 'Academic Affairs'
		when 'SUPPORT_IT' then 'Information Technology'
		when 'ACADEMIC_LECTURERS' then 'Institute Faculty'
	end,
	updated_at = now()
where code in (
	'DIRECTOR_OFFICE',
	'SCI_TECH_GROUP',
	'SUPPORT_GENERAL_ADMIN',
	'SUPPORT_FINANCE_SUPPLY',
	'SUPPORT_EDUCATION',
	'SUPPORT_IT',
	'ACADEMIC_LECTURERS'
);
