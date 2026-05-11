<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { resolve } from "$app/paths";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import Building2Icon from "@lucide/svelte/icons/building-2";
	import GraduationCapIcon from "@lucide/svelte/icons/graduation-cap";
	import HandshakeIcon from "@lucide/svelte/icons/handshake";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import type { Component } from "svelte";
	import { getGatewayPageCopy } from "$lib/content/page-copy.js";

	let { data } = $props();
	const copy = $derived(getGatewayPageCopy(data.locale));

	type ModuleStatus = "Ready" | "Next" | "Planned";
	type StatusFilterValue = "All" | ModuleStatus;
	type ModuleRoute = "/gateway" | "/roles" | "/analytics";

	type ModuleCapability = {
		id: string;
		label: string;
		status: ModuleStatus;
		requiresAccess?: boolean;
	};

	type ModuleGroup = {
		id: string;
		title: string;
		description: string;
		icon: Component;
		primaryStatus: ModuleStatus;
		href: ModuleRoute;
		priority: number;
		isCore: boolean;
		capabilities: ModuleCapability[];
	};

	const CAPABILITY_PREVIEW_COUNT = 3;

	const gatewayUi = $derived.by(() =>
		data.locale === "th"
			? {
					statusFilters: [
						{ label: "ทั้งหมด", value: "All" },
						{ label: "พร้อมใช้", value: "Ready" },
						{ label: "ลำดับถัดไป", value: "Next" },
						{ label: "วางแผน", value: "Planned" },
					] as { label: string; value: StatusFilterValue }[],
					moduleGroups: [
						{
							id: "operations",
							title: "Operations",
							description:
								"งานปฏิบัติการหลักของคณะ ตั้งแต่ HR จนถึงการดูแลทรัพย์สินและงานภายใน",
							icon: Building2Icon,
							primaryStatus: "Next",
							href: "/gateway",
							priority: 1,
							isCore: true,
							capabilities: [
								{ id: "hr", label: "ทรัพยากรบุคคล", status: "Next" },
								{ id: "leave", label: "ลา", status: "Next" },
								{ id: "welfare", label: "สวัสดิการ", status: "Planned" },
								{ id: "supply", label: "พัสดุ", status: "Planned" },
								{ id: "asset", label: "ทรัพย์สิน", status: "Planned" },
								{ id: "worksheet", label: "งานแผ่น", status: "Planned" },
							],
						},
						{
							id: "sharedServices",
							title: "Shared Services",
							description: "บริการข้ามหน่วยงานที่ทั้งทีมสำนักงานและวิชาการใช้ร่วมกัน",
							icon: HandshakeIcon,
							primaryStatus: "Next",
							href: "/gateway",
							priority: 2,
							isCore: true,
							capabilities: [
								{ id: "roomBooking", label: "จองห้อง", status: "Next" },
								{ id: "academicService", label: "บริการวิชาการ", status: "Planned" },
								{ id: "equipmentBorrowing", label: "ยืมอุปกรณ์", status: "Planned" },
							],
						},
						{
							id: "academicResearch",
							title: "Academic & Research",
							description: "งานนักศึกษา วิจัย ห้องปฏิบัติการ และองค์ความรู้ที่นำกลับมาใช้ซ้ำได้",
							icon: GraduationCapIcon,
							primaryStatus: "Planned",
							href: "/gateway",
							priority: 3,
							isCore: false,
							capabilities: [
								{ id: "studentAdvisor", label: "นักศึกษา/อาจารย์ที่ปรึกษา", status: "Planned" },
								{ id: "research", label: "วิจัย", status: "Planned" },
								{ id: "labStock", label: "สต็อกห้องปฏิบัติการ", status: "Planned" },
								{ id: "researchProducts", label: "ผลงานวิจัย", status: "Planned" },
								{ id: "content", label: "เนื้อหา", status: "Planned" },
							],
						},
						{
							id: "governanceAccess",
							title: "Governance & Access",
							description: "รายงานผู้บริหาร หลักฐานตรวจสอบ และสิทธิ์การใช้งานแบบบทบาท",
							icon: LayoutDashboardIcon,
							primaryStatus: "Ready",
							href: "/roles",
							priority: 4,
							isCore: true,
							capabilities: [
								{ id: "executiveDashboard", label: "แดชบอร์ดผู้บริหาร", status: "Planned" },
								{ id: "auditTrail", label: "บันทึกการตรวจสอบ", status: "Planned" },
								{ id: "qualityIndicators", label: "ตัวชี้วัดคุณภาพ", status: "Planned" },
								{ id: "auth", label: "Supabase Auth", status: "Ready", requiresAccess: true },
								{ id: "roles", label: "บทบาท", status: "Ready", requiresAccess: true },
								{ id: "permissionClaims", label: "Permission Claims", status: "Ready", requiresAccess: true },
							],
						},
					] as ModuleGroup[],
				}
			: {
					statusFilters: [
						{ label: "All", value: "All" },
						{ label: "Ready", value: "Ready" },
						{ label: "Next", value: "Next" },
						{ label: "Planned", value: "Planned" },
					] as { label: string; value: StatusFilterValue }[],
					moduleGroups: [
						{
							id: "operations",
							title: "Operations",
							description:
								"Core faculty operations from HR to assets, welfare, and daily operations management.",
							icon: Building2Icon,
							primaryStatus: "Next",
							href: "/gateway",
							priority: 1,
							isCore: true,
							capabilities: [
								{ id: "hr", label: "Human Resource", status: "Next" },
								{ id: "leave", label: "Leave", status: "Next" },
								{ id: "welfare", label: "Welfare", status: "Planned" },
								{ id: "supply", label: "Supply", status: "Planned" },
								{ id: "asset", label: "Asset", status: "Planned" },
								{ id: "worksheet", label: "Worksheet", status: "Planned" },
							],
						},
						{
							id: "sharedServices",
							title: "Shared Services",
							description: "Cross-functional services used by both office and academic teams.",
							icon: HandshakeIcon,
							primaryStatus: "Next",
							href: "/gateway",
							priority: 2,
							isCore: true,
							capabilities: [
								{ id: "roomBooking", label: "Room Booking", status: "Next" },
								{ id: "academicService", label: "Academic Service", status: "Planned" },
								{ id: "equipmentBorrowing", label: "Equipment Borrowing", status: "Planned" },
							],
						},
						{
							id: "academicResearch",
							title: "Academic & Research",
							description:
								"Student, advisor, research, laboratory, and reusable knowledge workflows for graduate programs.",
							icon: GraduationCapIcon,
							primaryStatus: "Planned",
							href: "/gateway",
							priority: 3,
							isCore: false,
							capabilities: [
								{ id: "studentAdvisor", label: "Student/Advisor", status: "Planned" },
								{ id: "research", label: "Research", status: "Planned" },
								{ id: "labStock", label: "Laboratory Stock", status: "Planned" },
								{ id: "researchProducts", label: "Research Products", status: "Planned" },
								{ id: "content", label: "Reusable Content", status: "Planned" },
							],
						},
						{
							id: "governanceAccess",
							title: "Governance & Access",
							description:
								"Executive reporting, audit evidence, and role-based access controls in one governance layer.",
							icon: LayoutDashboardIcon,
							primaryStatus: "Ready",
							href: "/roles",
							priority: 4,
							isCore: true,
							capabilities: [
								{ id: "executiveDashboard", label: "Executive Dashboard", status: "Planned" },
								{ id: "auditTrail", label: "Audit Trail", status: "Planned" },
								{ id: "qualityIndicators", label: "Quality Indicators", status: "Planned" },
								{ id: "auth", label: "Supabase Auth", status: "Ready", requiresAccess: true },
								{ id: "roles", label: "Roles", status: "Ready", requiresAccess: true },
								{ id: "permissionClaims", label: "Permission Claims", status: "Ready", requiresAccess: true },
							],
						},
					] as ModuleGroup[],
				}
	);

	const statusTone = {
		Ready: "border-green-500 text-green-700 dark:text-green-400",
		Next: "border-blue-500 text-blue-700 dark:text-blue-400",
		Planned: "border-muted-foreground/30 text-muted-foreground",
	} satisfies Record<ModuleStatus, string>;

	let selectedStatus = $state<StatusFilterValue>("All");

	const visibleModuleGroups = $derived(
		gatewayUi.moduleGroups
			.map((moduleGroup) => ({
				...moduleGroup,
				href: moduleGroup.id === "governanceAccess" && !data.canManageAccess ? "/analytics" : moduleGroup.href,
				capabilities: moduleGroup.capabilities.filter(
					(capability) => data.canManageAccess || !capability.requiresAccess
				),
			}))
			.filter((moduleGroup) => moduleGroup.capabilities.length > 0)
	);

	const filteredModuleGroups = $derived(
		[...visibleModuleGroups]
			.sort((left, right) => left.priority - right.priority)
			.filter((moduleGroup) =>
				selectedStatus === "All" ? true : moduleGroup.primaryStatus === selectedStatus
			)
	);

	const coreModuleGroups = $derived(filteredModuleGroups.filter((moduleGroup) => moduleGroup.isCore));
	const futureModuleGroups = $derived(filteredModuleGroups.filter((moduleGroup) => !moduleGroup.isCore));
</script>

<svelte:head>
	<title>{copy.title}</title>
</svelte:head>

<div class="space-y-6">
	<section class="space-y-4">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">{copy.moduleMapHeading}</h2>
				<p class="text-muted-foreground text-sm">{copy.moduleMapDescription}</p>
			</div>
			<Badge variant="outline">{copy.smallTeamFriendly}</Badge>
		</div>

		<div class="flex flex-wrap gap-2">
			{#each gatewayUi.statusFilters as statusFilter (statusFilter.value)}
				<button
					type="button"
					onclick={() => (selectedStatus = statusFilter.value)}
					class={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-colors ${
						selectedStatus === statusFilter.value
							? "bg-primary text-primary-foreground border-primary"
							: "text-muted-foreground hover:bg-muted"
					}`}
				>
					{statusFilter.label}
				</button>
			{/each}
		</div>

		<div class="space-y-3">
			<h3 class="text-base font-semibold">{copy.coreModulesHeading}</h3>
			<p class="text-muted-foreground text-sm">{copy.coreModulesDescription}</p>
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each coreModuleGroups as moduleGroup (moduleGroup.id)}
					{@const Icon = moduleGroup.icon}
					<Card.Root class="transition-colors hover:bg-muted/40">
						<Card.Header class="space-y-3">
							<div class="flex items-start justify-between gap-3">
								<div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
									<Icon class="size-5" />
								</div>
								<Badge variant="outline" class={statusTone[moduleGroup.primaryStatus]}>
									{moduleGroup.primaryStatus}
								</Badge>
							</div>
							<div>
								<Card.Title>{moduleGroup.title}</Card.Title>
								<Card.Description>{moduleGroup.description}</Card.Description>
							</div>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="flex flex-wrap gap-1.5">
								{#each moduleGroup.capabilities.slice(0, CAPABILITY_PREVIEW_COUNT) as capability (capability.id)}
									<Badge variant="secondary">{capability.label}</Badge>
								{/each}
								{#if moduleGroup.capabilities.length > CAPABILITY_PREVIEW_COUNT}
									<Badge variant="outline">
										+{moduleGroup.capabilities.length - CAPABILITY_PREVIEW_COUNT}
									</Badge>
								{/if}
							</div>
							<a
								href={resolve(moduleGroup.href)}
								class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
							>
								{copy.viewModulePath}
								<ArrowRightIcon class="size-3.5" />
							</a>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>

		{#if futureModuleGroups.length > 0}
			<div class="space-y-3">
				<h3 class="text-base font-semibold">{copy.futureModulesHeading}</h3>
				<p class="text-muted-foreground text-sm">{copy.futureModulesDescription}</p>
				<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{#each futureModuleGroups as moduleGroup (moduleGroup.id)}
						{@const Icon = moduleGroup.icon}
						<Card.Root class="transition-colors hover:bg-muted/40">
							<Card.Header class="space-y-3">
								<div class="flex items-start justify-between gap-3">
									<div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
										<Icon class="size-5" />
									</div>
									<Badge variant="outline" class={statusTone[moduleGroup.primaryStatus]}>
										{moduleGroup.primaryStatus}
									</Badge>
								</div>
								<div>
									<Card.Title>{moduleGroup.title}</Card.Title>
									<Card.Description>{moduleGroup.description}</Card.Description>
								</div>
							</Card.Header>
							<Card.Content class="space-y-4">
								<div class="flex flex-wrap gap-1.5">
									{#each moduleGroup.capabilities.slice(0, CAPABILITY_PREVIEW_COUNT) as capability (capability.id)}
										<Badge variant="secondary">{capability.label}</Badge>
									{/each}
									{#if moduleGroup.capabilities.length > CAPABILITY_PREVIEW_COUNT}
										<Badge variant="outline">
											+{moduleGroup.capabilities.length - CAPABILITY_PREVIEW_COUNT}
										</Badge>
									{/if}
								</div>
								<a
									href={resolve(moduleGroup.href)}
									class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
								>
									{copy.viewModulePath}
									<ArrowRightIcon class="size-3.5" />
								</a>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			</div>
		{/if}
	</section>

</div>
