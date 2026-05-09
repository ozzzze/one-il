# ONE-IL — Context handoff log (personnel / org schema)

ใช้ไฟล์นี้ต่อบทสนทนาหรืองานที่บ้านได้ โดยคัดลู่วางใน Cursor chat หรือเปิดอ้างอิงจาก repo

**อัปเดตล่าสุด:** 2026-05-08 (ประมาณ UTC+7)

---

## เป้าหมายที่คุย/ทำไว้

### Schema บุคลากร (ทำแล้วใน repo)

ออกแบบให้สอดคล้องผังองค์กร:

- **ผอ. (DIRECTOR)** มี active ได้คนเดียวทั้งองค์กร
- **รองผอ.** แยก 3 ประเภท (`ADMIN`, `RESEARCH`, `EDU_NETWORK`) — ใช้ `positions.code` แยกแถว (`DEPUTY_DIRECTOR`, `DEPUTY_DIRECTOR_*`) และแต่ละตำแหน่งมีผู้ครอง active ได้คนเดียว
- เจ้าหน้าที่ (**STAFF**) อยู่ใต้สำนักงานผู้อำนวยการ มีสายบังคับบัญชา **HEAD → STAFF**
- **อาจารย์ (LECTURER)** อยู่ฝั่งกลุ่มวิชาวิทยาศาสตร์และเทคโนโลยีศึกษา — trigger อนุญาตให้รายงานต่อ **HEAD** หรือ **DIRECTOR**
- **ประธานหลักสูตร (PROGRAM_CHAIR)** หลายหลักสูตร, หลักสูตรละ chair active ได้คนหนึ่ง; **ห้าม** เป็นผู้บังคับบัญชาในสาย `LINE`

แหล่งความจริงใน repo:

- [`scratch/org_personnel_schema.sql`](scratch/org_personnel_schema.sql)

### ระบบลา (กำหนดธุรกิจไว้ — ยังไม่ลงรายละเอียดเต็มในการ deploy)

ข้อตกลงลำดับการพิจารณา (อ้างอิงถัดไปเมื่อออกแบบตาราง/โฟลว์):

1. **หัวหน้างาน** ลา → รองผอ. **รับทราบ** → ผอ. **อนุญาต**
2. **เจ้าหน้าที่** ลา → **หัวหน้างาน** → รองผอ. **รับทราบ** → ผอ. **อนุญาต**
3. **อาจารย์** ลา → ผอ. **อนุญาต**
4. **รองผอ.** ลา → ผอ. **อนุญาต**

ไฟล์ SQL ใน repo อาจมี draft ตาราง/ทริกเกอร์ลาเพิ่มจากการ brainstorm — **ยืนยันกับ Supabase** ว่ามี apply จริงหรือยังก่อนใช้ production

---

## โครงสร้างหลักที่เกี่ยวข้อง

| ตาราง | หมายเหตุสั้น ๆ |
|-------|----------------|
| `org_units` | ผังหน่วยงานแบบ tree |
| `positions` | ประเภทตำแหน่ง + `role_level`, `can_command_staff`, `deputy_category` |
| `employees` | ข้อมูลคน |
| `employee_assignments` | คน × ตำแหน่ง × หน่วยงาน + ช่วงวัน (`starts_at`/`ends_at`) |
| `employee_supervisors` | ผู้บังคับบัญชาโดยตรงสาย `LINE` |
| `programs`, `program_chairs` | หลักสูตร + ประธานหลักสูตร |

ฟังก์ชัน/ทริกเกอร์สำคัญในไฟล์ scratch:

- `validate_line_supervisor_chain` — สายบังคับบัญชา + ห้าม PROGRAM_CHAIR เป็น LINE supervisor
- `validate_singleton_active_roles` — จำกัดผอ. และ deputy ตามตำแหน่ง

---

## Git / remote

- สาขาแนะนำตามการทำงานล่าสุด: **`main`**
- Commit ที่รวม schema scratch และการเปลี่ยนแปลง UI/fonts (ถ้ามีในแผนที่รวม): ข้อความประมาณ  
  **`feat: add personnel schema and UI font updates`**
- ก่อนทำต่อที่บ้าน: **`git pull origin main`**

---

## Supabase (hosted)

- โครงการมีการใช้ Supabase Postgres — apply DDL ผ่าน migration/dashboard ตามที่ใช้จริงในโปรเจ็กต์ของคุณ
- **หมายเหตุความปลอดภัย:** อย่า commit `.env`; API keys / service role ใช้เฉพาะเครื่องหรือ secret manager

---

## ขั้นถัดไปที่แนะนำ

1. เปิด [`scratch/org_personnel_schema.sql`](scratch/org_personnel_schema.sql) แล้ว sync กับสภาพ DB จริง (บันทึก migration ถาวรถ้ายังไม่มี)
2. เปิด **RLS** บนตาราง `public` ที่เกี่ยวกับบุคลากรเมื่อเปิดผ่าน Data API
3. (เลือก) View เช่น `v_org_chart_current` สำหรับแดชบอร์ด
4. ออกแบบตารางลา + approval steps ให้ตรง 4 กรณีด้านบน

---

## ข้อความคัดวางสำหรับ Cursor chat รอบหน้า

```
Continue ONE-IL personnel work. Read CONTEXT_HANDOFF.md and scratch/org_personnel_schema.sql on branch main.
Core personnel tables + triggers are the intended baseline; leave workflow rules are documented in CONTEXT_HANDOFF.md but leave tables may still be incomplete or not applied—confirm Supabase before implementing UI.
Next priorities: RLS, optional org chart view, then leave schema aligned with the 4 approval paths (HEAD/STAFF/LECTURER/DEPUTY).
```
