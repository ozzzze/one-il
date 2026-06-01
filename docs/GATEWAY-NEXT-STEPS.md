# Gateway — next steps & session handoff

> **อัปเดตล่าสุด:** 2026-06-01 (session ต่อ — proxy IPv6 fix, DB seed, one-leave `paths.base`)  
> **Commit อ้างอิง (one-il `main`):** `309dc0f` — feat: gateway hub, one-leave auth, and licensed fonts  
> **Remote:** https://github.com/ozzzze/one-il (`origin/main`)

เอกสารนี้รวม **context จาก session** + checklist ใช้ one-leave ผ่าน one-il  
สถาปัตยกรรมเต็ม: [`GATEWAY-ARCHITECTURE.md`](./GATEWAY-ARCHITECTURE.md)

---

## สรุป session (2026-06-01)

### ทำแล้วใน one-il

| หัวข้อ | รายละเอียด |
|--------|-------------|
| Gateway + auth | ล็อกอิน `/login` → `one_leave.users` (Postgres), cookie `one_leave_session` |
| one-leave bridge | `src/lib/server/one-leave/*`, proxy dev `/leave` → พอร์ต `5174` |
| Launcher | `gateway-launcher.ts` + menu catalog migrations (รัน DB เอง) |
| ฟอนต์ | PK Nonthaburi (local, **gitignore**) + Chulabhorn Likit (ใน repo) — `src/app.css` |
| License note | `static/fonts/LICENSE-PK-NONTHABURI.md` (Education / non-profit) |
| Push | `main` @ `309dc0f` — **ไม่** commit `.env`, **ไม่** commit `pk-nonthaburi/` |

### ยังไม่ทำ (รอรอบถัดไป)

1. **Local E2E (ล็อกอินจริง)** — proxy ผ่านแล้ว (`/leave/*` → 303 login); ทด SSO หลัง login ด้วยบัญชีจริง
2. ~~**one-leave repo** — `paths.base: '/leave'`~~ → ทำแล้วใน `one-leave/apps/web/svelte.config.js`
3. ~~**DB ops**~~ — รัน `db:apply:user-change-requests` + `db:seed:menu-catalog` แล้ว (2026-06-01)
4. **Production** — reverse proxy + build สองแอป + `PUBLIC_APP_URL` / CSRF

### ทำใน session นี้ (2026-06-01 ต่อ)

| หัวข้อ | รายละเอียด |
|--------|-------------|
| Proxy fix | `vite.config.ts` ใช้ `localhost` แทน `127.0.0.1` (Windows + Vite bind `[::1]`) |
| `isOneLeaveAppPath` | รวม `/leave` (ไม่มี slash ท้าย) |
| one-leave | `kit.paths.base` + อัปเดต `.env.example` (Postgres, OAuth callback ผ่าน gateway) |

### Path mapping (จำไว้)

| URL บน browser (ผ่าน gateway) | ไปที่ one-leave (หลัง proxy ตัด `/leave`) |
|------------------------------|----------------------------------------|
| `/leave` | `/` (home แอปลา) |
| `/leave/leave` | `/leave` (รายการใบลา) |
| `/leave/login` | `/login` |
| `/login` | หน้า login **ของ gateway** (ไม่ต้องรัน one-leave แค่เพื่อล็อกอิน) |

---

## เมื่อกลับมา เริ่มที่นี่

```bash
# 1) ตรวจ .env ทั้งสอง repo — DATABASE_URL + SESSION_SECRET ต้องตรงกัน
# 2) Terminal A
cd D:\one-leave\apps\web
pnpm dev --port 5174

# 3) Terminal B
cd D:\one-il
pnpm dev

# 4) เปิด http://localhost:5173/login แล้วลอง http://localhost:5173/leave/leave
```

ถ้า login fail: `node --env-file=.env scripts/test-leave-login.mjs`

---

## สถานะที่ทำแล้ว (one-il)

- [x] ล็อกอิน gateway ที่ `/login` ผ่าน `one_leave.users` (Postgres)
- [x] Cookie `one_leave_session` + `SESSION_SECRET` (แชร์กับ one-leave)
- [x] Vite proxy `/leave` → one-leave dev port (`LEAVE_DEV_PORT`, default `5174`)
- [x] Launcher สแตติก (`gateway-launcher.ts`) เมื่อไม่มี menu catalog ใน Supabase
- [x] Migrations ใน repo (รันเอง — ดู [B](#b-ฐานข้อมูล))

---

## A. สภาพแวดล้อม (ทั้งสอง repo)

| รายการ | one-il | one-leave (`apps/web`) |
|--------|--------|-------------------------|
| `DATABASE_URL` | Postgres เดียวกัน (`one_leave.*`) | เหมือนกัน (หรือ `PG_*` + `SELF_HOSTED_DB_PASSWORD`) |
| `SESSION_SECRET` | ค่าเดียวกัน 32+ ตัวอักษร | **ต้องตรงทุกตัวอักษร** |
| `.env` | ไม่ commit | ไม่ commit |

```bash
# สร้าง secret (รันครั้งเดียว แล้ว copy ไปทั้งสอง .env)
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**ฟอนต์ (เครื่อง dev):** copy `D:\one-leave\apps\web\static\fonts\pk-nonthaburi\` → `one-il/static/fonts/pk-nonthaburi/` (gitignore)

---

## B. ฐานข้อมูล

1. **Schema `one_leave`** — users, roles, employees, leave tables บน Postgres ที่ `DATABASE_URL` ชี้
2. **ผู้ใช้ทดสอบ** — `one_leave.users` + `one_leave.user_roles` + `password_hash` (bcrypt)
3. **Migrations บน Postgres/Supabase** (จาก repo one-il):

```bash
cd one-il
pnpm db:apply:user-change-requests
pnpm db:seed:menu-catalog   # ต้องมี SUPABASE_SERVICE_ROLE_KEY ถ้า seed ผ่าน Supabase client
```

ถ้าไม่รัน seed → gateway ใช้ `buildGatewayNavigationFromLeave()` ได้

---

## C. Local dev (ทดสอบ end-to-end)

```bash
# Terminal 1
cd one-leave/apps/web
pnpm install
pnpm dev --port 5174

# Terminal 2
cd one-il
pnpm install
pnpm dev    # http://localhost:5173
```

| ขั้น | URL | คาดหวัง |
|------|-----|---------|
| ล็อกอิน | http://localhost:5173/login | เข้าได้ → redirect `/` |
| เปิดแอปลา | http://localhost:5173/leave | หน้า home one-leave (proxy) |
| รายการลา | http://localhost:5173/leave/leave | หน้า `/leave` ในแอปลา |
| SSO | ล็อกอินที่ gateway แล้วเปิด `/leave/...` | ไม่ถาม login ซ้ำ |

---

## D. งานที่ยังต้องทำใน repo one-leave

### D1. Production base path (สำคัญ)

`apps/web/svelte.config.js` **ยังไม่มี** `kit.paths.base: '/leave'`. ต้องเพิ่มก่อน deploy หลัง reverse proxy

```js
paths: {
  base: process.env.PUBLIC_LEAVE_BASE_PATH ?? (process.env.NODE_ENV === 'production' ? '/leave' : '')
}
```

### D2. CSRF / PUBLIC_APP_URL

- `PUBLIC_APP_URL` = origin จริงของผู้ใช้ (gateway + one-leave เหมือนกัน)
- `CSRF_TRUSTED_ORIGINS` — ดู `GATEWAY-ARCHITECTURE.md`

### D3. Google OAuth (ถ้าใช้)

Callback บน origin จริง เช่น `https://app.example.com/leave/auth/google/callback`

### D4. อัปเดต `.env.example` ของ one-leave

ตัวอย่าง root ยังเป็น `sqlserver://` — pool จริงใช้ Postgres (`apps/web/src/lib/server/db/pool.ts`)

---

## E. Production deploy

```text
Browser → Reverse proxy (same origin)
  /        → one-il   (port 3000)
  /leave/* → one-leave (port 3001, kit.paths.base = /leave)
```

1. `pnpm build` ทั้งสองแอป (adapter-node)
2. Caddy/nginx ตาม `GATEWAY-ARCHITECTURE.md`
3. Env: `DATABASE_URL`, `SESSION_SECRET`, `ORIGIN`, `PUBLIC_APP_URL`

---

## F. ทดสอบหลัง deploy

- [ ] `/login` → gateway home
- [ ] Tile “ระบบลา” → `/leave` โหลดได้
- [ ] `/leave/leave` สร้าง/ดูใบลาได้
- [ ] Logout ที่ gateway → `/leave` ไม่เห็นข้อมูล
- [ ] `must_change_password` → `/leave/account/change-password`

---

## G. ไม่บล็อกการทดลอง แต่ควรทำต่อ

- Menu catalog seed + `/menu-catalog`
- Extract `one-shared` (session, UI, roles)
- Email / notification outbox บน VPS

---

## ปัญหาที่พบบ่อย

| อาการ | สาเหตุที่เป็นไปได้ |
|--------|-------------------|
| `/leave` 502 / blank | one-leave ไม่รัน หรือ proxy/port ผิด |
| ล็อกอิน gateway ได้ แต่ `/leave` ให้ login ใหม่ | `SESSION_SECRET` ไม่ตรงกัน |
| DB error ตอน login | `DATABASE_URL` ผิด หรือไม่มี `one_leave.users` |
| CSS/JS 404 บน production | ยังไม่ตั้ง `paths.base: '/leave'` ที่ one-leave |
| เมนู gateway ว่าง | ไม่มี role ใน `user_roles` หรือ permission ไม่ map |

---

## ไฟล์สำคัญ (one-il)

| ไฟล์ | บทบาท |
|------|--------|
| `src/hooks.server.ts` | auth guard, ไม่ redirect ซ้ำบน `/leave/*` |
| `src/lib/server/one-leave/session.ts` | cookie HMAC |
| `src/lib/server/gateway-launcher.ts` | เมนู/การ์ด launcher |
| `vite.config.ts` | proxy `/leave` |
| `.env.example` | ตัวแปรที่ต้อง sync กับ one-leave |
