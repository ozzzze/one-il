-- Extra lookup seeds aligned with common Thai government asset / inventory wording
-- (categories, statuses, conditions). Safe to re-run: ON CONFLICT DO NOTHING.

insert into public.asset_categories (code, label_th, label_en, sort_order) values
  ('office_equipment', 'ครุภัณฑ์สำนักงาน', 'Office equipment', 15),
  ('electrical_radio', 'ครุภัณฑ์ไฟฟ้าและวิทยุ', 'Electrical and radio equipment', 25),
  ('construction_equip', 'ครุภัณฑ์ก่อสร้าง', 'Construction equipment', 45),
  ('agriculture', 'ครุภัณฑ์การเกษตร', 'Agricultural equipment', 55),
  ('medical', 'ครุภัณฑ์การแพทย์', 'Medical equipment', 65),
  ('musical_arts', 'ครุภัณฑ์ดนตรีและศิลปะ', 'Musical and arts equipment', 75),
  ('sports', 'ครุภัณฑ์กีฬา', 'Sports equipment', 85)
on conflict (code) do nothing;

insert into public.asset_statuses (code, label_th, label_en, sort_order) values
  ('procuring', 'อยู่ระหว่างจัดหา', 'Procurement in progress', 5),
  ('idle_storage', 'ไม่ได้ใช้งาน / เก็บรักษา', 'Idle / in storage', 25),
  ('suspended_use', 'งดใช้ชั่วคราว', 'Suspended from use', 35),
  ('surplus', 'เกินความจำเป็น', 'Surplus', 45)
on conflict (code) do nothing;

insert into public.asset_conditions (code, label_th, label_en, sort_order) values
  ('excellent', 'ดีมาก', 'Excellent', 5),
  ('unusable', 'ใช้การไม่ได้', 'Unusable', 50)
on conflict (code) do nothing;
