# ONE-IL — System Master Blueprint (Platform level)

> **จุดประสงค์:** กติกาสำหรับ "รับระบบใหม่เข้า platform ONE-IL" ทุกระบบ (เช่น one-leave, one-support,
> IT Service Management ในอนาคต) **ห้ามเริ่ม develop** จนกว่าจะผ่านด่าน **ACCEPT** ในเอกสารนี้
>
> นี่คือ blueprint **ชั้นที่ 2 (ระบบ/repo)** — ส่วน blueprint **ชั้นที่ 3 (โมดูลภายในระบบ)** อยู่ที่
> [`BLUEPRINT.md`](./BLUEPRINT.md). อ่านคู่กับ [`GATEWAY-ARCHITECTURE.md`](./GATEWAY-ARCHITECTURE.md)

---

## 0. โครงสร้าง 3 ชั้น (ต้องแยกให้ขาด)

```
ชั้น 1  PLATFORM   one-il (gateway)         ← identity + launcher + RBAC catalog กลาง
ชั้น 2  SYSTEM     one-leave · IT-Service…  ← แต่ละระบบ = repo แยก, plug เข้า gateway  ← เอกสารนี้คุมชั้นนี้
ชั้น 3  MODULE     Leave · SCR · Asset…     ← ฟีเจอร์ภายในระบบ                          ← BLUEPRINT.md คุมชั้นนี้
```

---

## 1. Stage-Gate — ทุกระบบใหม่ต้องผ่าน 4 ด่านตามลำดับ

| ด่าน | ทำอะไร | Artifact ที่ต้องมี | ผู้รับรอง |
|------|--------|--------------------|-----------|
| **1. PLAN** | นิยามขอบเขต ผู้ใช้ ฟีเจอร์ ของระบบ | `docs/systems/<system>/PRD.md` (จากเทมเพลต) | Product owner |
| **2. RULE** | ตรวจว่าระบบจะเสียบเข้า gateway ได้ถูกกติกา | **Platform Contract** (§2) ติ๊กครบ | สถาปนิก |
| **3. ACCEPT** ✅ | design review → อนุมัติ blueprint | ลายเซ็น `Accepted: <ชื่อ> <วันที่>` ใน PRD + อัปเดต [`REGISTRY.md`](./REGISTRY.md) | gate บังคับ |
| **4. DEVELOP** | ลงมือ (ใน Cursor) ลอกโครงจาก reference | โค้ด + เทสต์ตาม Definition of Done ใน BLUEPRINT.md | — |

> **กฎทอง:** ห้ามขึ้นด่าน 4 จนกว่าด่าน 3 จะ Accepted — กันการ dev ผิดทางแล้วรื้อ (ตัวเผา budget ตัวจริง)

---

## 2. Platform Contract — เกณฑ์ด่าน RULE (บังคับครบทุกข้อ)

ระบบใหม่จะ **Accepted** ได้ ต้องตอบครบ (สกัดจาก [GATEWAY-ARCHITECTURE.md](./GATEWAY-ARCHITECTURE.md)):

### 2.1 Identity & Access
- [ ] **SSO** — แชร์ cookie `one_leave_session` (`SESSION_SECRET` เดียวกับ gateway)
- [ ] **Zero-trust** — re-validate session ใน `hooks.server.ts` ของระบบเอง ไม่เชื่อ gateway อย่างเดียว
- [ ] **RBAC keys** — ลงทะเบียน permission keys ใหม่ใน gateway `src/lib/auth/roles.ts`
- [ ] **RLS** — ทุกตารางมี Row Level Security policy ฝั่ง Supabase

### 2.2 Deployment & Routing
- [ ] **repo แยก** ตามชื่อระบบ (`one-il`, `one-leave`, …)
- [ ] **base path** — ตั้ง `paths.base = "/<slug>"` (prod) ใน `svelte.config.js`
- [ ] **Reverse proxy** — เพิ่ม mapping `/<slug> → :port` (Caddy/nginx)
- [ ] **Menu entry** — เพิ่มใน `menu_groups`/`menu_items` เพื่อให้ gateway แสดง tile ตามสิทธิ์

### 2.3 Data & Shared canon
- [ ] **Supabase project เดิม** — ใช้ DB กลางเดียวกัน
- [ ] **DB types** — regenerate ของระบบเอง (`pnpm supabase:types`) ไม่ share ไฟล์ type
- [ ] **Shared canon** — ใช้ design tokens (`app.css`), `ui/*`, auth helper ชุดเดียวกัน (copy-now-extract-later)
- [ ] **มาตรฐานโค้ด** — ระบบทั้งหมดอยู่ใต้ [`AI-RULES.md`](../AI-RULES.md) + [`BLUEPRINT.md`](./BLUEPRINT.md)

---

## 3. หลัง Accepted แล้วทำอะไรต่อ

1. สร้าง repo ใหม่ → คัด shared canon มาจาก one-leave (ดูรายการใน [GATEWAY-ARCHITECTURE.md §Shared canon](./GATEWAY-ARCHITECTURE.md))
2. ลงทะเบียนระบบใน [`REGISTRY.md`](./REGISTRY.md) (สถานะ → `Dev`)
3. develop โมดูลทีละตัวตาม [`BLUEPRINT.md`](./BLUEPRINT.md) (ลอกโครง SCR)
4. ทำ Platform Contract §2 ให้เป็นจริงในโค้ด (proxy, base path, RBAC keys, menu)

---

## 4. หลักการบริหาร (สรุป)

- **เอกสารคือสัญญา ไม่ใช่พิธีกรรม** — มีเท่าที่จำเป็นต่อการตัดสินใจ ไม่เกินนั้น
- **แยกงานคิด (วางแผน/รีวิว) ออกจากงานพิมพ์ (dev)** — คุม budget AI ได้จริง
- **REGISTRY คือแหล่งความจริงเดียว** ว่าตอนนี้มีกี่ระบบ อยู่ด่านไหน ใครดูแล
