<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { resolve } from "$app/paths";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import Building2Icon from "@lucide/svelte/icons/building-2";
	import CalendarCheckIcon from "@lucide/svelte/icons/calendar-check";
	import ClipboardCheckIcon from "@lucide/svelte/icons/clipboard-check";
	import GraduationCapIcon from "@lucide/svelte/icons/graduation-cap";
	import HandshakeIcon from "@lucide/svelte/icons/handshake";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import LibraryBigIcon from "@lucide/svelte/icons/library-big";
	import SearchIcon from "@lucide/svelte/icons/search";
	import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import TicketCheckIcon from "@lucide/svelte/icons/ticket-check";
	import type { Component } from "svelte";
	import { getGatewayPageCopy } from "$lib/content/page-copy.js";

	let { data } = $props();
	const copy = $derived(getGatewayPageCopy(data.locale));

	type Module = {
		title: string;
		description: string;
		group: string;
		icon: Component;
		status: "Ready" | "Next" | "Planned";
		href: string;
		features: string[];
	};

	type QuickAction = {
		title: string;
		description: string;
		icon: Component;
		href: string;
	};

	const gatewayUi = $derived.by(() =>
		data.locale === "th"
			? {
					primaryMenu: "เมนูหลัก",
					primaryMenuValue: "5-6 รายการ",
					moduleAccess: "การเข้าถึงโมดูล",
					moduleAccessValue: "การ์ด + ค้นหา",
					loginModel: "รูปแบบการล็อกอิน",
					loginModelValue: "เซสชันเดียว",
					quickActions: [
						{
							title: "คำขอลา",
							description: "สร้างคำขอลาโดยตรงจากเวิร์กโฟลว์หลัก",
							icon: TicketCheckIcon,
							href: "/requests/new?kind=leave",
						},
						{
							title: "คำขอ",
							description: "เริ่มคำขอจอง ยืมอุปกรณ์ หรือบริการวิชาการได้จากที่เดียว",
							icon: ClipboardCheckIcon,
							href: "/requests",
						},
						{
							title: "จองห้อง",
							description: "จองห้องประชุม ห้องเรียน และพื้นที่ใช้งานร่วม",
							icon: CalendarCheckIcon,
							href: "/requests/new?kind=room_booking",
						},
					] as QuickAction[],
					modules: [
						{
							title: "สำนักงาน",
							description:
								"งานปฏิบัติการของคณะสำหรับ HR, ลา, สวัสดิการ, พัสดุ, ทรัพย์สิน, งานแผ่น และแดชบอร์ดผู้บริหาร",
							group: "สำนักงาน",
							icon: Building2Icon,
							status: "Next",
							href: "/gateway",
							features: ["ทรัพยากรบุคคล", "ลา", "สวัสดิการ", "พัสดุ", "ทรัพย์สิน", "งานแผ่น"],
						},
						{
							title: "วิชาการ",
							description: "เวิร์กโฟลว์นักศึกษา อาจารย์ที่ปรึกษา งานวิจัย และสต็อกห้องปฏิบัติการ",
							group: "วิชาการ",
							icon: GraduationCapIcon,
							status: "Planned",
							href: "/gateway",
							features: ["นักศึกษา/อาจารย์ที่ปรึกษา", "วิจัย", "สต็อกห้องปฏิบัติการ"],
						},
						{
							title: "บริการส่วนกลาง",
							description: "บริการข้ามหน่วยงานที่ทั้งทีมสำนักงานและวิชาการใช้ร่วมกัน",
							group: "บริการ",
							icon: HandshakeIcon,
							status: "Planned",
							href: "/gateway",
							features: ["บริการวิชาการ", "ยืมอุปกรณ์", "จองห้อง"],
						},
						{
							title: "รายงานและตรวจสอบ",
							description: "QCDSM หลักฐานตรวจสอบ สรุปผู้บริหาร และตัวชี้วัดการดำเนินงาน",
							group: "ธรรมาภิบาล",
							icon: LayoutDashboardIcon,
							status: "Planned",
							href: "/analytics",
							features: ["แดชบอร์ดผู้บริหาร", "บันทึกการตรวจสอบ", "ตัวชี้วัดคุณภาพ"],
						},
						{
							title: "องค์ความรู้และผลงานวิจัย",
							description: "ติดตามผลงานวิจัย ผลิตภัณฑ์ และสินทรัพย์ความรู้ที่นำกลับมาใช้ซ้ำได้",
							group: "วิชาการ",
							icon: LibraryBigIcon,
							status: "Planned",
							href: "/content",
							features: ["ผลงานวิจัย", "เนื้อหา", "เอกสารใช้ซ้ำ"],
						},
						{
							title: "ตัวตนและสิทธิ์",
							description: "โครงพื้นฐาน SSO พร้อม RBAC สำหรับทุกโมดูล",
							group: "ธรรมาภิบาล",
							icon: ShieldCheckIcon,
							status: "Ready",
							href: "/roles",
							features: ["Supabase Auth", "บทบาท", "Permission Claims"],
						},
					] as Module[],
				}
			: {
					primaryMenu: "Primary menu",
					primaryMenuValue: "5-6 items",
					moduleAccess: "Module access",
					moduleAccessValue: "Cards + search",
					loginModel: "Login model",
					loginModelValue: "Single session",
					quickActions: [
						{
							title: "Leave Request",
							description: "Create a leave request directly from the main workflow.",
							icon: TicketCheckIcon,
							href: "/requests/new?kind=leave",
						},
						{
							title: "Requests",
							description: "Start booking, equipment borrowing, or academic service requests from one place.",
							icon: ClipboardCheckIcon,
							href: "/requests",
						},
						{
							title: "Room Booking",
							description: "Reserve meeting rooms, classrooms, and shared spaces.",
							icon: CalendarCheckIcon,
							href: "/requests/new?kind=room_booking",
						},
					] as QuickAction[],
					modules: [
						{
							title: "Office",
							description:
								"Faculty operations for HR, leave, welfare, supply, assets, worksheets, and executive dashboards.",
							group: "Office",
							icon: Building2Icon,
							status: "Next",
							href: "/gateway",
							features: ["Human Resource", "Leave", "Welfare", "Supply", "Asset", "Worksheet"],
						},
						{
							title: "Academic",
							description: "Student, advisor, research, and laboratory stock workflows for graduate programs.",
							group: "Academic",
							icon: GraduationCapIcon,
							status: "Planned",
							href: "/gateway",
							features: ["Student/Advisor", "Research", "Laboratory Stock"],
						},
						{
							title: "Shared Services",
							description: "Cross-functional services used by both office and academic teams.",
							group: "Services",
							icon: HandshakeIcon,
							status: "Planned",
							href: "/gateway",
							features: ["Academic Service", "Equipment Borrowing", "Booking Room"],
						},
						{
							title: "Reports & Audit",
							description: "QCDSM, audit evidence, executive summaries, and operational indicators.",
							group: "Governance",
							icon: LayoutDashboardIcon,
							status: "Planned",
							href: "/analytics",
							features: ["Executive Dashboard", "Audit Trail", "Quality Indicators"],
						},
						{
							title: "Knowledge & Research Products",
							description: "Track research outputs, products, and reusable faculty knowledge assets.",
							group: "Academic",
							icon: LibraryBigIcon,
							status: "Planned",
							href: "/content",
							features: ["Research Products", "Content", "Reusable Documents"],
						},
						{
							title: "Identity & Permissions",
							description: "Single sign-on foundation with role-based access for every module.",
							group: "Governance",
							icon: ShieldCheckIcon,
							status: "Ready",
							href: "/roles",
							features: ["Supabase Auth", "Roles", "Permission Claims"],
						},
					] as Module[],
				}
	);

	const statusTone = {
		Ready: "border-green-500 text-green-700 dark:text-green-400",
		Next: "border-blue-500 text-blue-700 dark:text-blue-400",
		Planned: "border-muted-foreground/30 text-muted-foreground",
	} satisfies Record<Module["status"], string>;

	const visibleModules = $derived(
		data.canManageAccess
			? gatewayUi.modules
			: gatewayUi.modules.filter((module) => module.href !== "/roles")
	);

</script>

<svelte:head>
	<title>{copy.title}</title>
</svelte:head>

<div class="space-y-6">
	<section class="overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top_left,var(--muted),transparent_38%),linear-gradient(135deg,var(--background),var(--muted))] p-6 md:p-8">
		<div class="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
			<div class="space-y-5">
				<Badge variant="secondary" class="w-fit gap-1.5">
					<SparklesIcon class="size-3.5" />
					{copy.heroBadge}
				</Badge>
				<div class="max-w-3xl space-y-3">
					<h1 class="text-3xl font-bold tracking-tight md:text-5xl">{copy.heroHeading}</h1>
					<p class="text-muted-foreground text-base md:text-lg">{copy.heroDescription}</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button href="/requests/new?kind=leave">
						{copy.createLeaveRequestCta}
						<ArrowRightIcon class="size-4" />
					</Button>
					{#if data.canManageAccess}
						<Button href={resolve("/roles")} variant="outline">
							{copy.manageAccessCta}
							<ShieldCheckIcon class="size-4" />
						</Button>
					{/if}
				</div>
			</div>

			<Card.Root class="bg-background/80 backdrop-blur">
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<SearchIcon class="text-muted-foreground size-4" />
						{copy.navigationRuleHeading}
					</Card.Title>
					<Card.Description>{copy.navigationRuleDescription}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-3 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">{gatewayUi.primaryMenu}</span>
						<span class="font-medium">{gatewayUi.primaryMenuValue}</span>
					</div>
					<Separator />
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">{gatewayUi.moduleAccess}</span>
						<span class="font-medium">{gatewayUi.moduleAccessValue}</span>
					</div>
					<Separator />
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">{gatewayUi.loginModel}</span>
						<span class="font-medium">{gatewayUi.loginModelValue}</span>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-3">
		{#each gatewayUi.quickActions as action (action.title)}
			{@const Icon = action.icon}
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<Icon class="text-muted-foreground size-4" />
						{action.title}
					</Card.Title>
					<Card.Description>{action.description}</Card.Description>
				</Card.Header>
				<Card.Content>
					<a
						href={action.href}
						class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
					>
						{copy.openAction}
						<ArrowRightIcon class="size-3.5" />
					</a>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section class="space-y-4">
		<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">{copy.moduleMapHeading}</h2>
				<p class="text-muted-foreground text-sm">{copy.moduleMapDescription}</p>
			</div>
			<Badge variant="outline">{copy.smallTeamFriendly}</Badge>
		</div>

		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each visibleModules as module (module.title)}
				{@const Icon = module.icon}
				<Card.Root class="transition-colors hover:bg-muted/40">
					<Card.Header class="space-y-3">
						<div class="flex items-start justify-between gap-3">
							<div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
								<Icon class="size-5" />
							</div>
							<Badge variant="outline" class={statusTone[module.status]}>{module.status}</Badge>
						</div>
						<div>
							<Card.Title>{module.title}</Card.Title>
							<Card.Description>{module.description}</Card.Description>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="flex flex-wrap gap-1.5">
							{#each module.features as feature (feature)}
								<Badge variant="secondary">{feature}</Badge>
							{/each}
						</div>
						<a
							href={module.href}
							class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
						>
						{copy.viewModulePath}
							<ArrowRightIcon class="size-3.5" />
						</a>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<section class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.recommendedBuildOrder}</Card.Title>
				<Card.Description>{copy.recommendedBuildOrderDesc}</Card.Description>
			</Card.Header>
			<Card.Content>
				<ol class="space-y-3 text-sm">
					<li class="flex gap-3">
						<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">1</span>
						<span>{copy.steps[0]}</span>
					</li>
					<li class="flex gap-3">
						<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">2</span>
						<span>{copy.steps[1]}</span>
					</li>
					<li class="flex gap-3">
						<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">3</span>
						<span>{copy.steps[2]}</span>
					</li>
				</ol>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.ssoTitle}</Card.Title>
				<Card.Description>{copy.ssoDescription}</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-3 text-sm sm:grid-cols-3">
				<div class="rounded-xl border p-3">
					<p class="font-medium">{copy.session}</p>
					<p class="text-muted-foreground mt-1">{copy.sessionDesc}</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="font-medium">{copy.roles}</p>
					<p class="text-muted-foreground mt-1">{copy.rolesDesc}</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="font-medium">{copy.permissions}</p>
					<p class="text-muted-foreground mt-1">{copy.permissionsDesc}</p>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</div>
