# ONE-IL — Context handoff log

ใช้ไฟล์นี้ต่อบทสนทนาหรืองานที่บ้านได้ โดยคัดลู่วางใน Cursor chat หรือ `git pull` แล้วเปิดอ้างอิงจาก repo

**อัปเดตล่าสุด:** 2026-05-18

---

## รอบล่าสุด: Room booking email + VPS Supabase (2026-05-18)

### เป้าหมายที่ทำแล้ว (commit `817184a` บน `main`)

เมื่อกด Submit จองห้อง (`/room-booking` หรือ `/requests/new`) ระบบจะ:

1. บันทึกคำขอผ่าน RPC `submit_room_booking_request` (เดิม)
2. แจ้ง **in-app** ไป `public.notifications` ถ้า approver มี `employees.user_id`
3. **enqueue อีเมล** ไป `public.notifications_outbox` แล้วพยายามส่งทันทีผ่าน SMTP (Gmail ชั่วคราว)

**โค้ดหลัก**

| ส่วน              | path                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| Migration outbox  | `supabase/migrations/20260518140000_notifications_outbox.sql`         |
| Enqueue           | `src/lib/server/notifications/outbox.ts`                              |
| SMTP config       | `src/lib/server/notifications/smtp-config.ts`                         |
| ส่งเมล            | `src/lib/server/notifications/mailer.ts` + `process-outbox.ts`        |
| แจ้งหลังจอง       | `src/lib/server/notifications/room-booking-submitted.ts`              |
| เรียกหลัง submit  | `src/lib/server/faculty-requests.ts` → `notifyRoomBookingSubmitted()` |
| เมนู room booking | migrations `20260518120000_*`, `20260518130000_*`                     |
| หน้าคำขอของฉัน    | `src/routes/(app)/room-booking/requests/`                             |

**สคริปต์ ops**

```bash
pnpm test:email              # ทดสอบ SMTP + outbox + ส่งเมลทดสอบไป SMTP_USER
pnpm notifications:process   # ส่งคิวที่ค้างใน outbox
node scripts/apply-outbox-migration-pg.mjs   # apply migration ตรง Postgres (ต้องมี DATABASE_URL)
```

---

### Infrastructure ที่ใช้จริง (สำคัญ)

| รายการ                                        | ค่า                                               |
| --------------------------------------------- | ------------------------------------------------- |
| VPS Hostinger                                 | `srv1663763.hstgr.cloud` / IP **`187.77.137.14`** |
| Supabase API (self-hosted)                    | `http://187.77.137.14:8000`                       |
| **ไม่ใช้** Supabase Cloud สำหรับ runtime แล้ว | โปรเจกต์ cloud `kcmcqadqsbrhuzekxxlp` แยก DB      |

**`.env` สำหรับรันแอป (เพียงพอ — ไม่ต้องมี DATABASE_URL)**

```env
PUBLIC_SUPABASE_URL=http://187.77.137.14:8000
PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ORIGIN=http://localhost:5173
```

**อีเมล (server-only, ดู `.env.example`)**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=il.websystem@gmail.com
SMTP_PASS=...          # Gmail App Password (16 ตัว ไม่มีช่องว่าง)
SMTP_FROM=ONE-IL <il.websystem@gmail.com>
```

- `SUPABASE_SERVICE_ROLE_KEY` **ไม่ใช่** รหัส Postgres
- `127.0.0.1:5432` ใช้ได้เฉพาะ **บน VPS** (SSH); จากเครื่อง dev ใช้ `187.77.137.14:5432` ถ้าต้อง `DATABASE_URL`

---

### สถานะทดสอบเมื่อ 2026-05-18 (ยังไม่จบ)

| รายการ                                      | ผล                                                             |
| ------------------------------------------- | -------------------------------------------------------------- |
| `pnpm check`                                | ผ่าน                                                           |
| โหลด approver email จาก DB                  | ผ่าน (เช่น `nopparat.jap@mahidol.ac.th`)                       |
| ตาราง `notifications_outbox` บน **VPS API** | **ยังไม่มี** — PostgREST 404 (schema cache)                    |
| Migration บน Supabase Cloud                 | apply แล้วผ่าน MCP แต่ **คนละ DB** กับ VPS                     |
| Gmail SMTP `pnpm test:email`                | **ล้มเหลว** `535 BadCredentials` — ต้องสร้าง App Password ใหม่ |

---

### งานที่ต้องทำต่อที่บ้าน (ลำดับแนะนำ)

1. **`git pull origin main`** (มี commit `817184a` แล้ว)
2. **Apply migration บน Postgres ของ VPS** (เลือกวิธีใดวิธีหนึ่ง):
   - SSH เข้า VPS → รัน SQL จาก `supabase/migrations/20260518140000_notifications_outbox.sql` แล้ว `NOTIFY pgrst, 'reload schema';`
   - หรือ Studio บนเซิร์ฟเวอร์
   - หรือใส่ `SELF_HOSTED_DATABASE_URL` / `DATABASE_URL` ชี้ `187.77.137.14:5432` แล้ว `node scripts/apply-outbox-migration-pg.mjs`
3. **แก้ `SMTP_PASS`** เป็น Gmail App Password จริง → `pnpm test:email` ต้องได้ `SMTP verify OK` + `Sent OK`
4. ทดสอบจองห้องจาก `/room-booking` → approver ได้ in-app + อีเมล
5. (ภายหลัง) เมื่อ IT ให้บัญชีกลาง แก้แค่ `SMTP_*` ใน env

**ตรวจ outbox หลังทดสอบ**

```bash
node --env-file=.env -e "import { createClient } from '@supabase/supabase-js'; const a=createClient(process.env.PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY); const {data}=await a.from('notifications_outbox').select('status,recipient,last_error,created_at').order('created_at',{ascending:false}).limit(5); console.log(data);"
```

---

### Staff / approver ของห้อง

- ฟิลด์ `reservable_rooms.approver_employee_id` → RPC สร้าง `faculty_request_steps` ให้คนนี้
- อีเมลส่งไป `employees.email` ของ approver
- ตั้งค่าห้องที่ `/room-booking/manage`

---

### Repo / remote

- **GitHub:** https://github.com/ozzzze/one-il.git
- **Branch:** `main`
- **Commit ล่าสุด (room booking email):** `817184a`

---

## ข้อความคัดวางสำหรับ Cursor chat รอบหน้า (room booking email)

```
Continue ONE-IL room booking email notifications on branch main.
Read docs/CONTEXT_HANDOFF.md (section 2026-05-18).

Done in code: notifications_outbox migration file, SMTP/nodemailer outbox worker, notifyRoomBookingSubmitted after submit_room_booking_request.

Blocked on VPS:
1) Apply 20260518140000_notifications_outbox.sql on self-hosted Postgres at 187.77.137.14 and NOTIFY pgrst, 'reload schema'.
2) Fix Gmail SMTP_PASS (App Password) — test with pnpm test:email.

App .env uses PUBLIC_SUPABASE_URL=http://187.77.137.14:8000 only (no DATABASE_URL needed for the app).
```

---

## เป้าหมายเก่า: Schema บุคลากร (personnel / org)

(รายละเอียดเดิม — ยังอ้างอิงได้)

### Schema บุคลากร (ทำแล้วใน repo)

ออกแบบให้สอดคล้องผังองค์กร:

- **ผอ. (DIRECTOR)** มี active ได้คนเดียวทั้งองค์กร
- **รองผอ.** แยก 3 ประเภท (`ADMIN`, `RESEARCH`, `EDU_NETWORK`) — ใช้ `positions.code` แยกแถว (`DEPUTY_DIRECTOR`, `DEPUTY_DIRECTOR_*`) และแต่ละตำแหน่งมีผู้ครอง active ได้คนเดียว
- เจ้าหน้าที่ (**STAFF**) อยู่ใต้สำนักงานผู้อำนวยการ มีสายบังคับบัญชา **HEAD → STAFF**
- **อาจารย์ (LECTURER)** อยู่ฝั่งกลุ่มวิชาวิทยาศาสตร์และเทคโนโลยีศึกษา — trigger อนุญาตให้รายงานต่อ **HEAD** หรือ **DIRECTOR**
- **ประธานหลักสูตร (PROGRAM_CHAIR)** หลายหลักสูตร, หลักสูตรละ chair active ได้คนหนึ่ง; **ห้าม** เป็นผู้บังคับบัญชาในสาย `LINE`

แหล่งความจริงใน repo: [`scratch/org_personnel_schema.sql`](../scratch/org_personnel_schema.sql)

### ระบบลา (กำหนดธุรกิจไว้ — ยืนยัน DB ก่อน implement UI)

1. **หัวหน้างาน** ลา → รองผอ. **รับทราบ** → ผอ. **อนุญาต**
2. **เจ้าหน้าที่** ลา → **หัวหน้างาน** → รองผอ. **รับทราบ** → ผอ. **อนุญาต**
3. **อาจารย์** ลา → ผอ. **อนุญาต**
4. **รองผอ.** ลา → ผอ. **อนุญาต**

### โครงสร้างตารางหลัก (personnel)

| ตาราง                        | หมายเหตุ                                                       |
| ---------------------------- | -------------------------------------------------------------- |
| `org_units`                  | ผังหน่วยงาน tree                                               |
| `positions`                  | ตำแหน่ง + `role_level`, `can_command_staff`, `deputy_category` |
| `employees`                  | ข้อมูลคน (+ `email`, `user_id`)                                |
| `employee_assignments`       | คน × ตำแหน่ง × หน่วย                                           |
| `employee_supervisors`       | สาย `LINE`                                                     |
| `programs`, `program_chairs` | หลักสูตร + ประธาน                                              |

### ขั้นถัดไป (personnel — ค้างจากรอบเก่า)

1. Sync `scratch/org_personnel_schema.sql` กับ DB จริงบน VPS
2. RLS บนตารางบุคลากร
3. ออกแบบตารางลา + approval steps ตาม 4 กรณี

---

## ความปลอดภัย

- อย่า commit `.env` (มี SMTP_PASS, service role)
- `notifications_outbox` — RLS ปิดจาก browser; enqueue ผ่าน service role เท่านั้น
