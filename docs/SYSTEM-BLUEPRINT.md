# ONE-IL — System Master Blueprint (Platform level)

> **จุดประสงค์:** กติกาสำหรับ "รับระบบใหม่เข้า platform ONE-IL" ทุกระบบ (เช่น one-leave, one-support,
> IT Service Management ในอนาคต) **ห้ามเริ่ม develop business logic** จนกว่าจะผ่านด่าน **ACCEPT** ในเอกสารนี้
> (ยกเว้น Stage 0 Bootstrap — UI shell ก่อน PRD — ดู §0.5)
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

## 0.5 Stage 0 Bootstrap — UI shell ก่อน PRD

> ด่านนี้ทำได้ **โดยไม่ต้องผ่าน gate ใดๆ** — เป้าหมายคือสร้าง admin shell ที่ login ได้และแสดง navigation
> skeleton ให้ผู้ใช้เห็นก่อน เพื่อให้การเขียน PRD ใน Stage 1 มีของจริงให้คุยกัน

### ขอบเขต Stage 0

| ทำได้                                                     | ห้าม                              |
| --------------------------------------------------------- | --------------------------------- |
| App shell: sidebar, topbar, breadcrumb                    | DB schema / migration ใหม่        |
| Login + session (`AUTH_MOCK=true`)                        | Supabase table ใหม่               |
| Read-only query จาก DB ที่มีอยู่แล้ว (employees, users)   | Business logic / form action ใดๆ  |
| Navigation skeleton (hardcode routes + placeholder pages) | Permission check จริง             |
| Theme + design tokens (copy จาก one-il)                   | API endpoint ที่ return real data |
| `pnpm dev` ขึ้นได้ login ได้                              | —                                 |

**Time-box:** ≤ 1 sprint — ถ้าเกินแสดงว่ากำลัง Dev โดยไม่มี PRD ให้หยุดทำ Platform Contract ก่อน

---

### Bootstrap Copy Recipe (Tier B — แนะนำ)

Copy จาก `one-il` เท่านั้น แบ่งเป็น 2 ชั้น:

#### Tier A — Visual shell

| ไฟล์ / dir                                                                                                   | หมายเหตุ                                               |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `src/routes/+layout.svelte`                                                                                  | root layout (app.css, ModeWatcher)                     |
| `src/routes/(app)/+layout.svelte`                                                                            | app shell (sidebar + topbar header)                    |
| `src/routes/(app)/+layout.server.ts`                                                                         | load user, locale, permissions, nav                    |
| `src/routes/(auth)/+layout.svelte`                                                                           | auth pages wrapper                                     |
| `src/lib/components/app-sidebar.svelte`                                                                      | sidebar nav tree                                       |
| `src/lib/components/theme-toggle.svelte`                                                                     | dark/light toggle                                      |
| `src/lib/components/language-switcher.svelte`                                                                | TH/EN switcher                                         |
| `src/lib/components/command-palette.svelte`                                                                  | Cmd+K dialog (ตัดส่วน SCR ออก)                         |
| `src/lib/navigation/catalog.ts`                                                                              | **แก้ไข**: hardcode nav ของระบบใหม่แทน gateway catalog |
| `src/lib/navigation/icons.ts`, `types.ts`, `sidebar-expand.ts`                                               | nav helpers                                            |
| `src/lib/i18n/locales.ts`, `display.ts`                                                                      | locale cookie + bilingual helpers                      |
| `src/lib/content/labels.ts`                                                                                  | static TH/EN UI copy                                   |
| `src/app.css`                                                                                                | Tailwind v4 + OKLCH tokens + fonts                     |
| `src/lib/utils.ts`, `components.json`                                                                        | cn() helper + shadcn config                            |
| `src/lib/components/ui/sidebar/`, `breadcrumb/`, `button/`, `badge/`, `card/`, `input/`, `label/`, `dialog/` | shadcn components (copy หรือ re-add ด้วย CLI)          |

#### Tier B — Login (ต้องทำก่อน demo)

| ไฟล์                                                             | หมายเหตุ                           |
| ---------------------------------------------------------------- | ---------------------------------- |
| `src/hooks.server.ts`                                            | ลบ `/leave` proxy guard ออก        |
| `src/app.d.ts`                                                   | `App.Locals` types                 |
| `src/routes/(auth)/login/+page.svelte` + `+page.server.ts`       | login UI + action                  |
| `src/routes/logout/+server.ts`                                   | clear session                      |
| `src/lib/server/one-leave/session.ts`                            | HMAC cookie sign/verify            |
| `src/lib/server/one-leave/authenticate.ts`                       | username/password auth             |
| `src/lib/server/one-leave/users.ts`                              | load user by id                    |
| `src/lib/server/one-leave/mock-auth.ts`                          | mock users สำหรับ `AUTH_MOCK=true` |
| `src/lib/server/one-leave/pg.ts`, `pg-config.ts`, `pg-errors.ts` | Postgres pool                      |
| `src/lib/server/auth.ts`, `guards.ts`                            | session user + permission helpers  |
| `src/lib/auth/roles.ts`                                          | role/permission keys               |
| `.env.example`                                                   | ดูข้อ env ด้านล่าง                 |

#### ไฟล์ที่ **skip** (one-il specific ไม่เกี่ยวกับระบบใหม่)

- `src/lib/server/one-leave/change-request/*` — SCR module
- `src/lib/server/gateway-launcher.ts`, `navigation-menu-load.ts` — gateway catalog
- `src/lib/server/user-change-requests.ts`, `menu-shortcuts-actions.ts`
- `src/lib/server/notifications/*` — outbox/mailer (ใส่ทีหลังถ้าต้องการ)
- `vite.config.ts` — ลบ block `/leave` proxy + `rewriteLeaveProxyPath`
- `src/routes/(app)/admin/*`, `change-requests/*`, `gateway/*`, `roles/*`

---

### ขั้นตอน Bootstrap

```bash
# 1. init repo
git init one-support
cd one-support
# copy package.json จาก one-il (ลบ layerchart, nodemailer ถ้ายังไม่ใช้)

# 2. copy ไฟล์ตาม Tier A + B ข้างบน

# 3. แก้ svelte.config.js
#    paths.base = process.env.NODE_ENV === 'production' ? '/support' : ''

# 4. แก้ catalog.ts → hardcode navigation skeleton
#    ตัวอย่าง ITSM: Dashboard, Requests, Catalog, Approvals, Assets, Admin

# 5. ตั้ง .env
AUTH_MOCK=true
SESSION_SECRET=<ค่าเดียวกับ one-il>   # SSO ใช้งานได้ทันที
DATABASE_URL=<ค่าเดียวกับ one-il>      # read-only query จาก one_leave.employees ได้

# 6. รัน
pnpm install
pnpm dev   # → http://localhost:<PORT>/login ต้อง login ด้วย mock user ได้
```

> เมื่อ demo ผ่านและ user เข้าใจ flow → เขียน PRD แล้วไปต่อที่ **Stage 1 (PLAN)**

---

## 1. Stage-Gate — ทุกระบบใหม่ต้องผ่านตามลำดับ

| ด่าน             | ทำอะไร                                     | Artifact ที่ต้องมี                                                                 | ผู้รับรอง     |
| ---------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- | ------------- |
| **0. BOOTSTRAP** | สร้าง UI shell เพื่อ demo ก่อนเขียน PRD    | repo init + UI shell ทำงานได้ (ดู §0.5)                                            | ผู้พัฒนา      |
| **1. PLAN**      | นิยามขอบเขต ผู้ใช้ ฟีเจอร์ ของระบบ         | `docs/systems/<system>/PRD.md` (จากเทมเพลต)                                        | Product owner |
| **2. RULE**      | ตรวจว่าระบบจะเสียบเข้า gateway ได้ถูกกติกา | **Platform Contract** (§2) ติ๊กครบ                                                 | สถาปนิก       |
| **3. ACCEPT** ✅ | design review → อนุมัติ blueprint          | ลายเซ็น `Accepted: <ชื่อ> <วันที่>` ใน PRD + อัปเดต [`REGISTRY.md`](./REGISTRY.md) | gate บังคับ   |
| **4. DEVELOP**   | ลงมือ (ใน Cursor) ลอกโครงจาก reference     | โค้ด + เทสต์ตาม Definition of Done ใน BLUEPRINT.md                                 | —             |

> **กฎทอง:** ห้ามขึ้นด่าน 4 จนกว่าด่าน 3 จะ Accepted — กันการ dev ผิดทางแล้วรื้อ (ตัวเผา budget ตัวจริง)
> **กฎ Bootstrap:** ด่าน 0 ทำได้ก่อน PRD แต่ **ห้าม** เขียน business logic หรือสร้าง DB schema ใหม่

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
- [ ] **DB types** — regenerate ของระบบเอง (`pnpm db:types`) ไม่ share ไฟล์ type
- [ ] **Shared canon** — ใช้ design tokens (`app.css`), `ui/*`, auth helper ชุดเดียวกัน (copy-now-extract-later)
- [ ] **มาตรฐานโค้ด** — ระบบทั้งหมดอยู่ใต้ [`AI-RULES.md`](../AI-RULES.md) + [`BLUEPRINT.md`](./BLUEPRINT.md)

---

## 3. หลัง Accepted แล้วทำอะไรต่อ

1. **repo พร้อมแล้ว** (ถ้าทำ Stage 0 Bootstrap ไว้แล้ว ข้ามไปข้อ 2 ได้เลย) — ถ้ายังไม่มี: ลอก Tier A+B จาก one-il ตาม §0.5
2. ลงทะเบียนระบบใน [`REGISTRY.md`](./REGISTRY.md) (สถานะ → `Dev`)
3. ลบ `AUTH_MOCK=true` ออกจาก `.env` → เปิดใช้ real Postgres auth
4. develop โมดูลทีละตัวตาม [`BLUEPRINT.md`](./BLUEPRINT.md) (ลอกโครง SCR)
5. ทำ Platform Contract §2 ให้เป็นจริงในโค้ด (proxy, base path, RBAC keys, menu)

---

## 4. หลักการบริหาร (สรุป)

- **เอกสารคือสัญญา ไม่ใช่พิธีกรรม** — มีเท่าที่จำเป็นต่อการตัดสินใจ ไม่เกินนั้น
- **แยกงานคิด (วางแผน/รีวิว) ออกจากงานพิมพ์ (dev)** — คุม budget AI ได้จริง
- **REGISTRY คือแหล่งความจริงเดียว** ว่าตอนนี้มีกี่ระบบ อยู่ด่านไหน ใครดูแล
