# Project Name : ONE-IL , Subtitle: Innovative Learning , Mahidol University

## 1. Over all

- Web Application for Faculty in University.
- Size scale. Staff/Lecturer: 30 person, Student: 30 - 60 person
- English language First. Support International Student (Master, Doctor degree)
- Standard software for small business, Stadard for Total Quality Control. (QCDSM)

## 2. Target & Index

- Analyst from raw data, information, Invent of business and education
- Serve for Audit (Ernst & Young Company)
- Standard for WAF (Web Application Firewall)

## 3. Devkit (FullStack)

- Framework: SvelteKit (Svelte 5 Rune)
- Language: TypeScript
- Tool: Vercel, vite, pnpm
- UI: ONE-IL (https://github.com/ColorlibHQ/svelteforge-admin)
- Font: PK Nonthaburi (Pocket Fonts Education, non-profit org) + Chulabhorn Likit (free); self-host `static/fonts/` — see `LICENSE-PK-NONTHABURI.md`
- Validate: zod
- Database: Supabase (local)

## 4. Functional

- Request Form with Email to Staff in work
- Sharing: [CSS, Function] basic component, Example Modal, Toast, Loading,
- Solve: Null, Undefied, Empty

## 5. Architecture

- **Multi-repo Gateway** — `one-il` คือ gateway/portal (ชั้น 1: identity + launcher + RBAC catalog)
- ระบบย่อยแต่ละตัวอยู่ใน repo แยก (ชั้น 2) เสียบเข้า gateway ผ่าน reverse proxy (same-origin cookie SSO)
- รายละเอียด: [`docs/GATEWAY-ARCHITECTURE.md`](./GATEWAY-ARCHITECTURE.md), stage-gate: [`docs/SYSTEM-BLUEPRINT.md`](./SYSTEM-BLUEPRINT.md)

## 6. Module in app

> โมดูลด้านล่างคือขอบเขตทั้ง platform — บางโมดูลอยู่ใน `one-leave`, บางโมดูลจะเป็น repo ใหม่
> ดูสถานะจริงที่ [`docs/REGISTRY.md`](./REGISTRY.md)

- **Office**
  - Human Resource / Employee
  - Leave *(one-leave)*
  - Welfare
  - Dashboard for Executive
  - Supply
  - Asset
  - WorkSheet
  - Product from Research
- **Academic**
  - Student/Advisor
  - Research
  - Laboratory Stock
- **Office & Academic**
  - Academic Service
  - Borrow/Return Equipment
  - Room Booking *(one-il)*
- **My Account**

## 7. Milestone
    - Create ONE-IL
    - Create User management & permisssion
## 8. Plan before code
