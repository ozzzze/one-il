# PRD — <ชื่อระบบ> (`<slug>`)

> เทมเพลตนี้คือ Artifact ของด่าน **PLAN** ใน [`../../SYSTEM-BLUEPRINT.md`](../../SYSTEM-BLUEPRINT.md)
> คัดลอกโฟลเดอร์ `_TEMPLATE` → `docs/systems/<slug>/` แล้วเติมให้ครบก่อนขอ **ACCEPT**

---

## 1. ภาพรวม

- **ระบบ:** <ชื่อเต็ม + ชื่อย่อ>
- **slug / base path:** `/<slug>`
- **ปัญหาที่แก้:** <ทำไมต้องมีระบบนี้>
- **ผู้ใช้หลัก:** <role + จำนวนคร่าว ๆ>

## 2. ขอบเขต (Scope)

- **In scope:** <ทำอะไร>
- **Out of scope:** <ไม่ทำอะไร — สำคัญพอ ๆ กับ in scope>

## 3. โมดูลภายในระบบ

> แต่ละโมดูลจะ develop ตาม [`../../BLUEPRINT.md`](../../BLUEPRINT.md)

| โมดูล | ชนิด (CRUD / Workflow)    | ความซับซ้อน  | หมายเหตุ |
| ----- | ------------------------- | ------------ | -------- |
| <m1>  | <CRUD / Workflow+อนุมัติ> | ⭐..⭐⭐⭐⭐ |          |

## 4. Roles & สิทธิ์ (RBAC)

> permission keys ที่ต้องเพิ่มใน gateway `src/lib/auth/roles.ts`

| Role | ทำอะไรได้ | permission key (เสนอ) |
| ---- | --------- | --------------------- |
|      |           |                       |

## 5. ข้อมูล (Data)

- **ตารางหลัก:** <list>
- **ความสัมพันธ์กับ identity core (`one_leave.*`):** <employees/users เชื่อมยังไง>
- **RLS:** <ใครเห็น row ไหน>

## 6. Workflow / สถานะ (ถ้ามีการอนุมัติ)

- **State machine:** <draft → … → closed>
- **Separation of Duties:** <ใครยื่น/อนุมัติ/ดำเนินการ — ต้องไม่ใช่คนเดียวกัน>

## 7. Audit / Compliance (E&Y)

- **บันทึก audit trail ที่ action ใด:** <list>
- **ประเด็น compliance เฉพาะระบบ:** <ถ้ามี>

---

## ✅ Platform Contract checklist (ด่าน RULE)

> ติ๊กครบจึงขอ ACCEPT ได้ — รายละเอียดเต็มใน [`../../SYSTEM-BLUEPRINT.md §2`](../../SYSTEM-BLUEPRINT.md)

- [ ] SSO (`one_leave_session`, `SESSION_SECRET` ร่วม)
- [ ] Zero-trust re-validate ใน `hooks.server.ts`
- [ ] RBAC keys ลงทะเบียนใน `roles.ts`
- [ ] RLS ทุกตาราง
- [ ] repo แยก + `paths.base = "/<slug>"`
- [ ] Reverse proxy mapping `/<slug>`
- [ ] Menu entry (`menu_groups`/`menu_items`)
- [ ] Supabase project เดิม + regenerate DB types เอง
- [ ] ใช้ shared canon (tokens / `ui/*` / auth) + อยู่ใต้ AI-RULES + BLUEPRINT

---

## 🖋️ Acceptance (ด่าน ACCEPT)

- **Accepted by:** <ชื่อ>
- **วันที่:** <YYYY-MM-DD>
- **สถานะใน REGISTRY:** อัปเดตเป็น `Accepted` แล้ว → [ ]
