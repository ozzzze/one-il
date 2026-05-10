---
name: sveltekit-forms-enhance
description: >-
  Guides SvelteKit progressive-enhanced forms so saves persist in UI without a manual refresh:
  use update({ reset:false }), applyAction for cross-route POSTs, and checkbox/select state patterns.
  Use when implementing or debugging use:enhance, FormData actions, checkboxes that clear after Save,
  or forms posting to a different route than the current page.
---

# SvelteKit forms — enhance, reset, และข้าม route

## อาการที่ควรจับได้เร็ว

- บันทึกสำเร็จใน DB แต่ checkbox / select / date กลับว่างหรือ uncheck จนกว่าจะ refresh
- ปุ่ม Save แสดง success แต่ข้อมูลไม่เปลี่ยน (โดยเฉพาะเมื่อ `action` ชี้ไป route อื่น)

สาเหตุหลักมักเป็น **ค่า default ของ `update()` หลัง action สำเร็จจะ reset form ในเบราว์เซอร์** — control ที่ผูกกับ state แบบ one-way (`checked={...}` + `onchange`) จะถูกดึงกลับเป็นค่าว่างชั่วคราวก่อน `load` / invalidate จะอัปเดต props

## Checklist ก่อนปิดงาน form

1. **ฟอร์มบนหน้าเดียวกับ action** (`action="?/myAction"`): ใน `use:enhance` ให้เรียกอย่างใดอย่างหนึ่ง
   - `await update({ reset: false, invalidateAll: true })` — ไม่ reset DOM form แต่ยังโหลด `data` / `form` ใหม่ทั้งแอป
   - หรืออย่างน้อย `await update({ reset: false })` แล้วค่อย `invalidateAll()` ถ้าต้องการควบคุมแยก

2. **ฟอร์ม POST ไป route อื่น** (เช่น `action="/employees?/updateFoo"` ขณะอยู่ที่ `/employees/[id]`): **ห้ามพึ่งแค่ `update()` อย่างเดียว**
   - ใช้ `import { applyAction } from "$app/forms"`
   - `await applyAction(result)` จาก callback ของ enhance
   - ถ้าต้องการให้หน้าปัจจุบันเห็นข้อมูลใหม่: เมื่อ `result.type === "success"` ให้ `await invalidateAll()` (หรือ `invalidate()` เฉพาะที่จำเป็น)

3. **Checkbox group ที่ส่งเป็น `name` เดียวกันหลายค่า**: หลัง save ถ้ายังใช้ `checked={local}` + reset form จะเสี่ยงไม่ตรงกับ DOM — ควรมีหนึ่งในนี้
   - ปิด reset ตามข้อ 1 และให้ local state sync จาก `data` หลัง reload (เช่น writable `$derived` จาก server snapshot)
   - หรือใช้ `bind:group` กับ array ของ id ที่เลือก

4. **หลีกเลี่ยง**: `$effect.pre` / `$effect` ที่ **เขียนทับ** local checkbox state จาก props **ทุกครั้ง** โดยไม่มีเงื่อนไข — จะชนกับค่าที่ผู้ใช้คลิกหรือกับช่วงหลัง submit

## Pattern อ้างอิง (minimal)

Same-page + ไม่ reset + reload data:

```ts
function samePageEnhance(setter: (v: boolean) => void) {
	return pendingEnhance(setter, () => async ({ update }) => {
		await update({ reset: false, invalidateAll: true });
	});
}
```

Cross-route:

```ts
import { applyAction } from "$app/forms";
import { invalidateAll } from "$app/navigation";

function crossRouteEnhance(setter: (v: boolean) => void) {
	return pendingEnhance(setter, () => async ({ result }) => {
		await applyAction(result);
		if (result.type === "success") await invalidateAll();
	});
}
```

Writable derived จากโหลดล่าสุด (ให้ checkbox สะท้อนหลัง invalidate โดยไม่ต้อง effect เขียนทับ):

```ts
let deductionPick = $derived.by(() => {
	/* build Record<id, boolean> จาก data */
});
```

ใน template ใช้ `bind:checked={deductionPick[dt.id]}` ถ้า compiler รองรับ property path; ถ้าไม่ให้ใช้ `checked` + `onchange` ที่อัปเดต object ใหม่ (`{ ...deductionPick, [id]: on }`) **คู่กับ** `reset: false`

## ทางเลือกที่ “ป้องกันได้ดีกว่า”ในระยะยาว

- **ลดการพึ่ง DOM form state**: ค่าที่แสดงอิง `$props().data` เป็นหลัก หลัง `invalidateAll` แล้ว UI จะตรง DB เสมอ
- **ใช้ `bind:group` สำหรับ checkbox หลายตัว** แทน hidden + หลาย input ที่ซับซ้อน ถ้าเหมาะกับ payload
- **ถ้าไม่จำเป็นต้อง progressive enhancement**: พิจารณา `method="POST"` ธรรมดา (redirect/reload) เพื่อเลี่ยง client reset ทั้งหมด — trade-off UX

## การตรวจในโปรเจกต์นี้

รัน `pnpm check` หลังแก้ enhance หรือ derived/checkbox binding

## อ้างอิงใน repo

ตัวอย่างที่ใช้ pattern นี้แล้ว: `src/routes/(app)/employees/[id]/+page.svelte` (`samePageEnhance`, `crossRouteEnhance`, และฟอร์ม deductions / organization)
