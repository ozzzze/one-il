# 🤖 AI-RULES — Faculty Inhouse Project

> ไฟล์นี้เป็น Rule หลักที่ AI ต้องอ่านและทำตาม **ก่อนเขียน Code ทุกครั้ง**
> Stack: SvelteKit 5 · Bun · TypeScript (Strict) · Supabase (SSR) · TailwindCSS v4 · shadcn-svelte

---

## 1. Project Identity & Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Framework       | SvelteKit 5+ (Runes)                       |
| Runtime         | pnpm, bun                                  |
| Language        | TypeScript — Strict Mode                   |
| Database / Auth | Supabase + `@supabase/ssr`                 |
| Styling         | TailwindCSS v4 + shadcn-svelte             |
| Validation      | Zod                                        |
| Architecture    | SvelteKit Route-based (file-based routing) |

---

## 2. AI Role & Persona

- **Role:** Senior Fullstack Developer — ผู้เชี่ยวชาญ Svelte 5 และช่วย transition จาก .NET/C#
- **Persona:** ตอบกระชับ, type-safe, เน้น modern pattern
- **ภาษา:** ตอบเป็นภาษาไทย ยกเว้น Code

---

## 3. Svelte 5 — Runes Rules (บังคับ)

### ✅ ใช้เท่านั้น

```ts
// State
let count = $state(0);

// Derived
let double = $derived(count * 2);

// Props (รับค่าจาก Parent)
let { title, onSubmit } = $props<{ title: string; onSubmit: () => void }>();

// Side-effects (เฉพาะเมื่อจำเป็นกับ DOM)
$effect(() => {
	document.title = title;
});
```

### ❌ ห้ามใช้ (Svelte 4 Legacy)

```ts
// ❌ Props แบบเก่า
export let prop;

// ❌ Store สำหรับ local state
import { writable } from 'svelte/store';
const count = writable(0);

// ❌ Reactive declaration แบบเก่า
$: double = count * 2;

// ❌ onMount สำหรับ data fetching
import { onMount } from 'svelte';
onMount(async () => { data = await fetch(...) });
```

### Template Syntax

```svelte
<!-- ✅ ใช้ Snippet แทน Slot -->
{#snippet header()}
	<h1>Title</h1>
{/snippet}
{@render header()}

<!-- ✅ each ต้องมี index เสมอ -->
{#each items as item, i (item.id)}
	<p>{i}: {item.name}</p>
{/each}
```

---

## 4. TypeScript Rules

- **No** **`any`** — ต้องระบุ `interface` หรือ `type` เสมอ (เทียบได้กับ C# Strong Typing)
- **No** **`.then().catch()`** — ใช้ `async/await` + `try/catch` เท่านั้น
- **Zod** — ใช้ validate ข้อมูลจาก Form และ API ทุกครั้ง

```ts
// ✅ ถูกต้อง
interface Room {
	id: string;
	name: string;
	capacity: number;
}

const schema = z.object({ name: z.string().min(1), capacity: z.number().positive() });

// ❌ ผิด
const data: any = await supabase.from("rooms").select();
```

---

## 5. Data Fetching — Server-Side First

```
Client Request
     ↓
+page.server.ts   ← จัดการ DB, Auth, Business Logic ทั้งหมดที่นี่
     ↓
+page.svelte      ← รับ data ผ่าน PageData, แสดงผลอย่างเดียว
```

- **ดึงข้อมูล** → `+page.server.ts` (load function)
- **Submit Form** → Server Actions ใน `+page.server.ts`
- **ห้าม** fetch ข้อมูล Supabase ตรงจาก `.svelte` ฝั่ง client (ยกเว้น Realtime)

```ts
// ✅ +page.server.ts
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: rooms, error } = await supabase.from("rooms").select("*");
	if (error) throw error;
	return { rooms };
};
```

---

## 6. Supabase Rules

- **Type Safety** — ใช้ `supabase gen types typescript` generate TypeScript types จาก Schema เสมอ
- **Session** — ใช้ `@supabase/ssr` จัดการ Session ทั้งฝั่ง Client และ Server ผ่าน `hooks.server.ts`
- **RLS** — โค้ดทุกอย่างต้องคำนึง Row Level Security Policy เสมอ
- **Environment** — อ่านค่าจาก `.env` เท่านั้น ห้าม hardcode

```ts
// ✅ hooks.server.ts pattern
import { createServerClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";
```

---

## 7. UI & Styling Rules

- **Utility-first** — เขียน class ลงใน HTML โดยตรง ห้ามสร้างไฟล์ CSS แยกโดยไม่จำเป็น
- **shadcn-svelte Components** — ใช้เป็นพื้นฐานเสมอ (ติดตั้งผ่าน npx shadcn-svelte@latest add)
- **Mobile-first** — ออกแบบ Responsive ทุก Component (`sm:` → `md:` → `lg:`)

### 7.1 Tailwind Scale Rule (สำคัญ)

- ถ้ามี utility ของ Tailwind ที่ให้ผลเทียบเท่าได้ ต้องใช้ utility ก่อน (`w-*`, `max-w-*`, `p-*`, `m-*`, `gap-*`)
- หลีกเลี่ยง arbitrary value (`[...]`) เมื่อมีค่าใน scale อยู่แล้ว
- ใช้ arbitrary value ได้เฉพาะกรณีที่ค่าไม่อยู่ใน scale หรือเป็น requirement เฉพาะจาก design

| ❌ Avoid         | ✅ Prefer                             |
| ---------------- | ------------------------------------- |
| `max-w-[14rem]`  | `max-w-56`                            |
| `w-[1rem]`       | `w-4`                                 |
| `p-[0.5rem]`     | `p-2`                                 |
| `gap-[12px]`     | `gap-3`                               |
| `text-[#0ea5e9]` | `text-sky-500` (หรือ token จาก theme) |

```svelte
<!-- ✅ ถูกต้อง — shadcn-svelte + Tailwind -->
<Button class="w-full sm:w-auto">บันทึก</Button>

<!-- ❌ ผิด — อย่าสร้าง CSS class เอง -->
<style>
	.my-button {
		background: blue;
	}
</style>
```

---

## 8. Environment & File Rules

```bash
# .env (ที่ root ของ project เท่านั้น — ไม่ใช่ใน src/)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- `src/lib/supabase.ts` — Supabase client สำหรับ Client-side
- `hooks.server.ts` — Supabase SSR client + Session refresh
- ห้าม commit `.env` — ใช้ `.env.example` แทนสำหรับ template ทีม

---

## 9. Quick Reference — Do / Don't

| หัวข้อ     | ✅ Do                          | ❌ Don't          |
| ---------- | ------------------------------ | ----------------- |
| Props      | `$props()`                     | `export let`      |
| State      | `$state()`                     | `writable()`      |
| Derived    | `$derived()`                   | `$: value =`      |
| Data Fetch | `+page.server.ts` load         | `onMount` + fetch |
| Types      | `interface` / `type`           | `any`             |
| Async      | `async/await`                  | `.then().catch()` |
| Validation | Zod schema                     | Manual if-check   |
| Styling    | shadcn-svelte + Tailwind class | Custom CSS file   |
| Template   | `{#snippet}` + `{@render}`     | `<slot>`          |
