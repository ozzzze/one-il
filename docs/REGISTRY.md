# ONE-IL — System Registry (ทะเบียนระบบกลาง)

> **แหล่งความจริงเดียว** ว่า platform ONE-IL มีกี่ระบบ แต่ละระบบอยู่ด่านไหน ใครดูแล
> อัปเดตทุกครั้งที่ระบบเปลี่ยนสถานะ (โดยเฉพาะตอน **Accepted** และ **Live**)
>
> สถานะตาม stage-gate ใน [`SYSTEM-BLUEPRINT.md`](./SYSTEM-BLUEPRINT.md): `Bootstrap → Plan → Rule → Accepted → Dev → Live`

---

## ระบบทั้งหมด

| ระบบ | slug / base path | repo | สถานะ | Owner | PRD | หมายเหตุ |
|------|------------------|------|-------|-------|-----|----------|
| **Gateway / Portal** | `/` | `one-il` | Dev | — | [PRD.md](./PRD.md) | identity hub + launcher + RBAC catalog กลาง |
| **One-Leave** | `/leave` | `one-leave` | Dev | — | — | ระบบลา + บุคลากร; เป็น identity core (`one_leave.*`) + reference สำหรับลอกโครง |
| **One-Support** (IT Service Management) | `/support` | `one-support` *(ยังไม่ init)* | Bootstrap | — | — | Stage 0: สร้าง UI shell (copy จาก one-il) ก่อนเขียน PRD — ดู [§0.5](./SYSTEM-BLUEPRINT.md#05-stage-0-bootstrap--ui-shell-ก่อน-prd) |

> ⚠️ ช่องที่มี *(ยืนยัน/เสนอ)* คือค่าที่ยังต้องตรวจสอบกับเจ้าของจริง — แก้ให้ตรงเมื่อยืนยันแล้ว

---

## วิธีใช้ตารางนี้

- **เพิ่มระบบใหม่:** เริ่มที่สถานะ `Bootstrap` (UI shell ก่อน PRD) หรือ `Plan` (ถ้ามี PRD แล้ว)
- **ขยับสถานะ:** อัปเดตคอลัมน์ "สถานะ" ทุกครั้งที่ผ่านด่าน — `Accepted` ต้องมีลายเซ็นใน PRD ก่อน
- **ห้ามมีระบบที่ `Dev` โดยข้าม `Accepted`** — ถ้าเจอ แปลว่าลัดด่าน ให้ย้อนกลับไปทำ Platform Contract

---

## ความหมายสถานะ

| สถานะ | แปลว่า |
|-------|--------|
| `Bootstrap` | Stage 0: กำลังสร้าง UI shell ก่อนเขียน PRD (ดู [SYSTEM-BLUEPRINT.md §0.5](./SYSTEM-BLUEPRINT.md)) |
| `Plan` | กำลังเขียน/รอ PRD |
| `Rule` | PRD เสร็จ กำลังตรวจ Platform Contract |
| `Accepted` ✅ | ผ่าน design review — อนุมัติให้ develop ได้ |
| `Dev` | กำลังพัฒนา (ลอกโครงตาม BLUEPRINT.md) |
| `Live` | ใช้งานจริงบน production |
