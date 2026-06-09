# ONE-IL — documentation index

**สำหรับ AI / ทีม:** ก่อนลงมือเขียนโค้ดหรือออกแบบฟีเจอร์ ให้อ่านไฟล์ตามลำดับนี้ (หรืออย่างน้อยข้อ 1–2) แล้วค่อยดู `CLAUDE.md` ที่ root สำหรับคำสั่งและโครงสร้างเทคนิค

1. **[PRD.md](./PRD.md)** — ภาพรวมโปรเจกต์ โมดูล และเป้าหมาย
2. **[GATEWAY-NEXT-STEPS.md](./GATEWAY-NEXT-STEPS.md)** — ⭐ handoff ล่าสุด + บริบทปัจจุบัน (อ่านก่อน session ใหม่ทุกครั้ง)
   2.5 **[BLUEPRINT.md](./BLUEPRINT.md)** — ⭐ module blueprint (ชั้น 3): สร้างทุกโมดูล (reference = SCR, โครงไฟล์, Definition of Done, copy recipe) — อ่านก่อนเริ่มโมดูลใหม่
   2.6 **[SYSTEM-BLUEPRINT.md](./SYSTEM-BLUEPRINT.md)** — ⭐ system blueprint (ชั้น 2): กติการับระบบใหม่เข้า gateway (stage-gate + Platform Contract) — อ่านก่อนเริ่มระบบใหม่
   2.7 **[REGISTRY.md](./REGISTRY.md)** — ทะเบียนระบบกลาง (มีกี่ระบบ อยู่ด่านไหน ใครดูแล) — แหล่งความจริงเดียว
   2.8 เทมเพลต PRD ระบบใหม่: [systems/\_TEMPLATE/PRD.md](./systems/_TEMPLATE/PRD.md) — คัดลอกไป `systems/<slug>/`
3. **[GATEWAY-ARCHITECTURE.md](./GATEWAY-ARCHITECTURE.md)** — สถาปัตยกรรม gateway + one-leave (SSO, proxy, shared canon)
4. **[PRD-asset-module.md](./PRD-asset-module.md)** — โมดูลครุภัณฑ์/วัสดุ (ร่าง)
5. **[ROOM_BOOKING_CHAT_ASSISTANT.md](./ROOM_BOOKING_CHAT_ASSISTANT.md)** — แนวทางต่อยอด Room Booking ให้รองรับ AI Chat / LINE

อื่น ๆ ที่ root: `CLAUDE.md` (stack & commands), `AI-RULES.md` (มาตรฐานโค้ด), `CHANGELOG.md`, `README.md`
