# Homepage Gateway Preview (Theme-Aligned)

## 1) Theme Alignment Summary

หน้า preview นี้ยึด visual language เดียวกับ `src/routes/(app)/+layout.svelte` และ `src/routes/(app)/+page.svelte` โดยคงแนวทางต่อไปนี้:

- ใช้ app shell เดิม: sidebar + sticky header + breadcrumb + action area ด้านขวา
- ใช้จังหวะ spacing หลักแบบหน้า dashboard (`space-y-6`)
- ใช้ responsive grid ระดับ `md` และ `lg` เหมือนเดิม
- ใช้ card composition แบบเดียวกัน (`Card.Root`, `Card.Header`, `Card.Content`)
- ใช้ข้อความรองผ่าน `text-muted-foreground` และ icon style จาก Lucide
- โทนหน้าเน้นการ "เข้าโมดูลเร็ว" แต่ไม่หลุด family ของ dashboard ปัจจุบัน

## 2) Pseudo-Svelte Layout Mock (Preview Only)

> หมายเหตุ: โค้ดส่วนนี้เป็น mock เพื่อ preview โครงสร้างและ UX เท่านั้น ยังไม่ใช่ implementation จริง

```svelte
<svelte:head>
	<title>Modules - ONE-IL</title>
</svelte:head>

<div class="space-y-6">
	<!-- Hero / Entry -->
	<section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Modules</h1>
			<p class="text-muted-foreground">
				Choose a module to start your daily workflow.
			</p>
		</div>
		<div class="flex w-full gap-2 sm:w-auto">
			<!-- Search + Filter placeholders -->
			<div class="bg-background border-input text-muted-foreground h-9 min-w-[220px] rounded-md border px-3 text-sm leading-9">
				Search module...
			</div>
			<div class="bg-background border-input text-muted-foreground h-9 rounded-md border px-3 text-sm leading-9">
				All Categories
			</div>
		</div>
	</section>

	<!-- Quick Actions -->
	<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Card.Root><Card.Content class="p-4">+ New Request</Card.Content></Card.Root>
		<Card.Root><Card.Content class="p-4">+ Booking Room</Card.Content></Card.Root>
		<Card.Root><Card.Content class="p-4">+ Borrow Equipment</Card.Content></Card.Root>
		<Card.Root><Card.Content class="p-4">+ Submit Academic Service</Card.Content></Card.Root>
	</section>

	<!-- Office -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Office</h2>
			<span class="text-muted-foreground text-sm">8 modules</span>
		</div>
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<!-- Repeated module cards -->
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Title class="text-base">Human Resource</Card.Title>
					<Card.Description>Employee profile and administration</Card.Description>
				</Card.Header>
				<Card.Content class="flex items-center justify-between">
					<Badge variant="outline">Active</Badge>
					<span class="text-muted-foreground text-xs">12 open items</span>
				</Card.Content>
			</Card.Root>
			<!-- Leave, Welfare, Dashboard for Executive, Supply, Asset, WorkSheet, Product from research -->
		</div>
	</section>

	<!-- Academic -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Academic</h2>
			<span class="text-muted-foreground text-sm">3 modules</span>
		</div>
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			<!-- Student/Advisor, Research, Laboratory Stock -->
			<Card.Root>...</Card.Root>
			<Card.Root>...</Card.Root>
			<Card.Root>...</Card.Root>
		</div>
	</section>

	<!-- Office & Academic -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Office & Academic</h2>
			<span class="text-muted-foreground text-sm">3 modules</span>
		</div>
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			<!-- Academic Service, Borrow/Return Equipment, Booking Room -->
			<Card.Root>...</Card.Root>
			<Card.Root>...</Card.Root>
			<Card.Root>...</Card.Root>
		</div>
	</section>

	<!-- My Account -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">My Account</h2>
			<span class="text-muted-foreground text-sm">Personal settings and profile</span>
		</div>
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			<Card.Root>...</Card.Root>
		</div>
	</section>

	<!-- Bottom Utilities -->
	<section class="grid gap-4 lg:grid-cols-7">
		<Card.Root class="lg:col-span-4">
			<Card.Header>
				<Card.Title>Recently Used Modules</Card.Title>
				<Card.Description>Jump back to your frequent workflows</Card.Description>
			</Card.Header>
			<Card.Content>
				<!-- compact list -->
				<div class="space-y-2 text-sm">
					<div class="flex items-center justify-between"><span>Leave</span><span class="text-muted-foreground">2h ago</span></div>
					<div class="flex items-center justify-between"><span>Booking Room</span><span class="text-muted-foreground">Yesterday</span></div>
					<div class="flex items-center justify-between"><span>Research</span><span class="text-muted-foreground">2d ago</span></div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-3">
			<Card.Header>
				<Card.Title>Announcements</Card.Title>
				<Card.Description>Important alerts and updates</Card.Description>
			</Card.Header>
			<Card.Content>
				<!-- lightweight alert list -->
				<div class="space-y-3 text-sm">
					<div><p class="font-medium">System maintenance window</p><p class="text-muted-foreground">Friday 22:00-23:00</p></div>
					<div><p class="font-medium">New policy update</p><p class="text-muted-foreground">Procurement process revised</p></div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</div>
```

## 3) UX Rationale (Why This Structure)

- Hero + search/filter อยู่บนสุดเพื่อรองรับทั้งผู้ใช้ใหม่ (scan) และผู้ใช้เดิม (search ตรงไปโมดูล)
- Quick actions วางก่อนกลุ่มโมดูล ช่วยลดจำนวนคลิกสำหรับงานซ้ำทุกวัน
- Group by domain (`Office`, `Academic`, `Office & Academic`) ทำให้ mental model ชัดและสอดคล้อง PRD
- Module card ใช้คำอธิบายสั้น + status badge + open items เพื่อช่วยตัดสินใจเข้าหน้าไหนก่อน
- ส่วนท้ายเป็น recently used และ announcements เพื่อบาลานซ์ “speed” กับ “awareness”

## 4) Responsive + Interaction Notes

- Mobile:
  - Hero controls เรียงแนวตั้ง
  - Module cards เป็น 1 คอลัมน์
  - Quick actions เป็น 1-2 คอลัมน์
- Tablet (`md`):
  - Module cards เป็น 2 คอลัมน์
  - Bottom utilities เริ่มแยก 2 บล็อกชัดเจน
- Desktop (`lg`/`xl`):
  - Module cards เป็น 3-4 คอลัมน์ตามกลุ่ม
  - Bottom utilities แบบ 4/3 split เพื่ออ่านเร็ว

Interaction proposal:
- คลิก card ที่พื้นที่ใดก็เข้าโมดูลได้ (entire-card clickable)
- Search รองรับชื่อโมดูล + alias (เช่น HR, Lab)
- Filter ตาม category และ status

## 5) Reusable Components From Current Theme

- `Card` family: `Card.Root`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`
- `Badge` สำหรับสถานะ
- `Separator` สำหรับแบ่งรายการใน panel
- Lucide icons รูปแบบเดียวกับ dashboard เดิม
- app layout shell (sidebar + top header) คงตาม route group `(app)` เดิมทั้งหมด

## Optional Next Step (When Ready To Code)

- สร้าง route หน้าแรกใหม่ใน `(app)` โดยใช้โครงนี้
- bind ข้อมูลโมดูลจาก server load
- ต่อ search/filter กับ command palette index ในภายหลัง
