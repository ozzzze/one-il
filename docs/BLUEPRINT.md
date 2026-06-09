# ONE-IL — Module Master Blueprint

> **จุดประสงค์:** เอกสารนี้คือ "ต้นแบบทางการ" สำหรับสร้างทุกโมดูลธุรกิจใน ONE-IL ให้ได้คุณภาพ
> สม่ำเสมอตามมาตรฐาน **E&Y audit** + **AI-RULES** ก่อนเริ่มโมดูลใหม่ทุกตัว ให้อ่านไฟล์นี้ →
> ลอกโครงจาก **reference module** → ติ๊ก **Definition of Done** ให้ครบก่อนปิดงาน
>
> อ่านคู่กับ: [`AI-RULES.md`](../AI-RULES.md) (กฎโค้ด), [`docs/GATEWAY-ARCHITECTURE.md`](./GATEWAY-ARCHITECTURE.md) (สถาปัตยกรรม), [`docs/PRD.md`](./PRD.md) (ขอบเขต)

---

## 0. Reference module = `change-request` (SCR)

โมดูล **System Change Request** คือต้นแบบที่ผ่านการตรวจแล้วว่าโครงสร้างได้มาตรฐาน
**ห้ามคิดโครงใหม่** — ทุกโมดูลใหม่ให้ลอกแพทเทิร์นจากนี่:

- Server logic: [`src/lib/server/one-leave/change-request/`](../src/lib/server/one-leave/change-request/)
- Routes: [`src/routes/(app)/change-requests/`](<../src/routes/(app)/change-requests/>)

> เหตุผลที่ SCR เป็นต้นแบบ: แยกชั้นชัด, มี Separation of Duties แบบ explicit, มี audit trail,
> validation ครบ และ authz 2 ชั้น — ครบทุกแกนที่ audit ต้องการ

---

## 1. โครงไฟล์มาตรฐานต่อโมดูล (บังคับ)

ทุกโมดูลแยกเป็น 2 ส่วน: **server logic** (ไม่ผูกกับ UI, เทสต์ได้) + **routes** (load/action + UI)

### 1.1 Server logic — `src/lib/server/one-leave/<module>/`

| ไฟล์                                                                                 | หน้าที่                                           | กฎ                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------ |
| `types.ts`                                                                           | interface/type ทั้งหมดของโดเมน                    | ไม่มี `any`; เป็น source of truth ของ shape                  |
| `schemas.ts`                                                                         | Zod schema + `parse*Form()` / `parse*Filter()`    | validate **ทุก** input ก่อนแตะ DB; cross-field check ในนี้   |
| `repository.ts`                                                                      | query DB ทั้งหมด (อ่าน/เขียน)                     | ที่เดียวที่คุยกับ DB; รับ/คืน type จาก `types.ts`            |
| `access.ts`                                                                          | permission **pure functions** (`canX`, `assertX`) | ไม่มี side-effect; เป็นหัวใจที่ audit ตรวจ → **ต้องมีเทสต์** |
| `labels.ts`                                                                          | map enum/status → ข้อความแสดงผล (i18n-ready)      | ไม่ปน logic                                                  |
| `db-helpers.ts`                                                                      | `formatDbError()` ฯลฯ                             | ไม่โยน error ดิบ(technical) ออกหน้า user                     |
| (option) `filters.ts`, `*-actions.ts`, `*-queue.ts`, `attachments.ts`, `*-export.ts` | logic เฉพาะทาง                                    | แยกตามหน้าที่เดียว/ไฟล์                                      |

### 1.2 Routes — `src/routes/(app)/<module>/`

```
<module>/
  +page.server.ts      ← load (list) + filter
  +page.svelte         ← ตาราง/list (แสดงผลอย่างเดียว)
  new/
    +page.server.ts    ← load (master data) + actions: saveDraft, submit
    +page.svelte       ← ฟอร์ม
  [id]/
    +page.server.ts    ← load (detail + authz) + actions: edit, approve, deny, ...
    +page.svelte       ← detail + ปุ่ม action ตามสิทธิ์
  approvals/           ← (ถ้ามี workflow อนุมัติ) คิวงานของผู้อนุมัติ
  attachments/[id]/+server.ts  ← (ถ้ามีไฟล์แนบ) serve ไฟล์แบบ authz
```

> **ห้าม** วาง business logic/DB query ใน `.svelte` หรือใน `+page.server.ts` ตรง ๆ —
> ให้เรียกผ่าน `repository.ts` / `access.ts` / `schemas.ts` เสมอ (`+page.server.ts` แค่ wire เข้าด้วยกัน)
> ดูตัวอย่างการ wire ที่ [`change-requests/new/+page.server.ts`](<../src/routes/(app)/change-requests/new/+page.server.ts>)

---

## 2. Definition of Done — checklist ปิดงานต่อโมดูล

ปิดงานโมดูลไม่ได้จนกว่าจะติ๊กครบ **แกน A (Security/Audit)** และ **แกน B (Code Quality)**
แกน C/D เป็น baseline ที่ต้องผ่านอยู่แล้ว

### 🔐 แกน A — Security / Audit (E&Y) — _สำคัญสูงสุด_

- [ ] **Authz 2 ชั้น** — เช็คสิทธิ์ทั้งใน `load` และในทุก `action` (zero-trust)
      → ดู [`new/+page.server.ts:21,47`](<../src/routes/(app)/change-requests/new/+page.server.ts>)
- [ ] **Separation of Duties** — ผู้ยื่น ≠ ผู้อนุมัติ ≠ ผู้ดำเนินการ บังคับด้วย `assert*Separation()`
      → ดู [`access.ts:84-103`](../src/lib/server/one-leave/change-request/access.ts)
- [ ] **State machine** — การเปลี่ยนสถานะถูกคุมด้วย `canX(user, record)` ตามสถานะปัจจุบัน ห้ามข้ามขั้น
- [ ] **Audit trail** — ทุก action ที่เปลี่ยนข้อมูลบันทึก who + IP ผ่าน `auditContextFromUser(user, getRequestIp(event))`
- [ ] **Input validation** — ทุก input ผ่าน Zod ใน `schemas.ts` (รวม filter/query param) ก่อนแตะ DB
- [ ] **RLS** — มี Row Level Security policy ฝั่ง Supabase (ไม่พึ่ง authz ฝั่งแอปอย่างเดียว)
- [ ] **ไม่รั่ว error ดิบ** — error ที่ส่งออก user ผ่าน `formatDbError()` ไม่เผย stack/SQL/internal
- [ ] **Ownership check** — ผู้ใช้ทั่วไปเห็น/แก้ได้เฉพาะ record ของตน (`record.requesterEmployeeId === user.employeeId`)

### 🧱 แกน B — Code Quality (AI-RULES)

- [ ] **ไม่มี `any`** — ทุกอย่างมี `interface`/`type` ใน `types.ts`
- [ ] **async/await + try/catch** เท่านั้น (ไม่มี `.then().catch()`)
- [ ] **Server-first** — fetch/mutate ผ่าน `+page.server.ts` ไม่ fetch Supabase จาก client (ยกเว้น Realtime)
- [ ] **Svelte 5 Runes** — `$props/$state/$derived/{@render}` เท่านั้น (ห้าม `export let`, `writable` สำหรับ local state, `$:`)
- [ ] **แยกชั้นตามข้อ 1** — DB อยู่ใน `repository.ts`, สิทธิ์อยู่ใน `access.ts`, validate อยู่ใน `schemas.ts`
- [ ] **DB types** generate จาก schema (`pnpm db:types`) ไม่เขียน type ของตาราง DB เอง
- [ ] **Form PE** — `use:enhance` ทำตาม skill `sveltekit-forms-enhance` (`update({ reset: false })`)

### 🧪 แกน C — Testing (baseline)

- [ ] **Unit test `access.ts`** — ทุกฟังก์ชัน `canX/assertX` ครอบเคสผ่าน+ปฏิเสธ (audit-critical, pure function เทสต์ง่าย)
- [ ] **Unit test `schemas.ts`** — เคส valid/invalid + cross-field (เช่น วันสิ้นสุด < วันเริ่ม ต้อง fail)
- [ ] **E2E flow หลัก** — สร้าง → submit → อนุมัติ → ปิด (happy path) ใน `e2e/`

### 🎨 แกน D — UI/UX (baseline)

- [ ] ใช้ **shadcn-svelte + Tailwind** เท่านั้น; ไม่สร้างไฟล์ CSS เอง
- [ ] ใช้ Tailwind scale (`w-4`, `p-2`, `gap-3`) เลี่ยง arbitrary value (`[...]`)
- [ ] Responsive mobile-first (`sm:`→`md:`→`lg:`)
- [ ] ใช้ component ร่วมของระบบ: [`delete-confirm-dialog`](../src/lib/components/delete-confirm-dialog.svelte), [`save-submit-button`](../src/lib/components/save-submit-button.svelte), [`form-is-active-switch`](../src/lib/components/form-is-active-switch.svelte)
- [ ] จัดการ null/undefined/empty ทุก field (ตาม PRD ข้อ 4)

---

## 3. Copy recipe — สั่ง AI สร้างโมดูลใหม่ (ประหยัด token)

เมื่อเริ่มโมดูลใหม่ ใช้ prompt รูปแบบนี้ (แทน `<Module>` และฟิลด์จริง) เพื่อให้ AI ลอกโครงแทนคิดใหม่:

```
สร้างโมดูล <Module> โดยลอกโครงสร้างจาก reference module SCR ตาม docs/BLUEPRINT.md:
- entity/ฟิลด์: <ระบุ field + type>
- workflow/สถานะ: <draft → ... ถ้ามี; ถ้าเป็น CRUD ล้วนให้บอกว่าไม่มี approval>
- สิทธิ์: <ใครสร้าง/เห็น/แก้/อนุมัติได้>
ทำตามลำดับ: types.ts → schemas.ts → repository.ts → access.ts (+เทสต์) → routes (list/new/[id])
ปิดงานต้องผ่าน Definition of Done แกน A และ B ใน BLUEPRINT.md
```

**ทำไมประหยัด token:** AI ไม่ต้องไล่อ่าน codebase ใหม่/ออกแบบโครงใหม่ทุกครั้ง แค่ map โดเมนใหม่ลงโครงเดิม
และเขียนเฉพาะ logic ที่ต่าง → งานส่วนใหญ่กลายเป็นการ "เติมในแบบฟอร์ม" ไม่ใช่ "ออกแบบ"

> เคล็ดเสริม: ทำโมดูลที่เป็น **CRUD ล้วน** (เช่น Asset, Supply, Lab Stock) ด้วย **Auto/Composer/Sonnet**
> เก็บ Opus ไว้สำหรับโมดูลที่มี workflow/สิทธิ์ซับซ้อน (Welfare approval, Academic Service)

---

## 4. ช่องว่างที่ต้องอุดใน reference module (ก่อนถือว่า "เนี้ยบ 100%")

> สถานะ ณ ตอนเขียน blueprint นี้ — SCR โครงดีแล้ว แต่ยังขาด:

- [ ] **เทสต์ `change-request/access.ts`** — ฟังก์ชัน SoD ทั้งหมดยังไม่มีเทสต์ (เสี่ยงสูงสุดเชิง audit)
- [ ] **เทสต์ `change-request/schemas.ts`** — ยังไม่มีเทสต์ valid/invalid/cross-field

ปิด 2 ข้อนี้เมื่อไหร่ SCR ถึงเป็น reference module ที่สมบูรณ์จริง และใช้เป็น "มาตรฐานทอง" ได้เต็มปาก

---

## 5. ลำดับทำโมดูลที่เหลือ (จาก PRD §6)

จัดเรียงจาก "ลอกง่าย/ต้นทุนต่ำ" → "ซับซ้อน":

| กลุ่ม              | โมดูล                                              | ความซับซ้อน                     |
| ------------------ | -------------------------------------------------- | ------------------------------- |
| CRUD ล้วน          | Asset · Supply · Lab Stock · WorkSheet             | ⭐ ลอก SCR ตรง ๆ ตัด workflow   |
| CRUD + relation    | Student/Advisor · Research · Product-from-research | ⭐⭐                            |
| Workflow + อนุมัติ | Welfare · Academic Service · Borrow/Return         | ⭐⭐⭐ ใช้ workflow SCR เต็มรูป |
| เฉพาะทาง           | Room Booking (+AI chat) · Executive Dashboard      | ⭐⭐⭐⭐ ดู PRD เฉพาะโมดูล      |

> แนะนำเริ่ม **Asset** เป็นตัวพิสูจน์ recipe — ถ้าลอกแล้วลื่น แปลว่า blueprint ใช้ได้จริง
