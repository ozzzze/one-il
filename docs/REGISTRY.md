# ONE-IL — System Registry (ทะเบียนระบบกลาง)

> **แหล่งความจริงเดียว** ว่า platform ONE-IL มีกี่ระบบ แต่ละระบบอยู่ด่านไหน ใครดูแล
> อัปเดตทุกครั้งที่ระบบเปลี่ยนสถานะ (โดยเฉพาะตอน **Accepted** และ **Live**)
>
> สถานะตาม stage-gate ใน [`SYSTEM-BLUEPRINT.md`](./SYSTEM-BLUEPRINT.md): `Plan → Rule → Accepted → Dev → Live`

---

## ระบบทั้งหมด

| ระบบ | slug / base path | repo | สถานะ | Owner | PRD | หมายเหตุ |
|------|------------------|------|-------|-------|-----|----------|
| **Gateway / Portal** | `/` | `one-il` | Dev | — | [PRD.md](./PRD.md) | identity hub + launcher + RBAC catalog กลาง |
| **One-Leave** | `/leave` | `one-leave` | Dev | — | — | ระบบลา + บุคลากร; เป็น identity core (`one_leave.*`) + reference สำหรับลอกโครง |
| **One-Support** (IT Service Management) | `/support` | `one-support` *(ยังไม่ init)* | Plan | — | — | ระบบบริหารจัดการ IT Service; โฟลเดอร์ยังว่าง (มีแค่ `.vscode`) — ต้องทำ PRD + ผ่าน Platform Contract ก่อน Dev |

> ⚠️ ช่องที่มี *(ยืนยัน/เสนอ)* คือค่าที่ยังต้องตรวจสอบกับเจ้าของจริง — แก้ให้ตรงเมื่อยืนยันแล้ว

---

## วิธีใช้ตารางนี้

- **เพิ่มระบบใหม่:** เริ่มที่สถานะ `Plan` พร้อมลิงก์ PRD (`docs/systems/<slug>/PRD.md`)
- **ขยับสถานะ:** อัปเดตคอลัมน์ "สถานะ" ทุกครั้งที่ผ่านด่าน — `Accepted` ต้องมีลายเซ็นใน PRD ก่อน
- **ห้ามมีระบบที่ `Dev` โดยข้าม `Accepted`** — ถ้าเจอ แปลว่าลัดด่าน ให้ย้อนกลับไปทำ Platform Contract

---

## ความหมายสถานะ

| สถานะ | แปลว่า |
|-------|--------|
| `Plan` | กำลังเขียน/รอ PRD |
| `Rule` | PRD เสร็จ กำลังตรวจ Platform Contract |
| `Accepted` ✅ | ผ่าน design review — อนุมัติให้ develop ได้ |
| `Dev` | กำลังพัฒนา (ลอกโครงตาม BLUEPRINT.md) |
| `Live` | ใช้งานจริงบน production |
