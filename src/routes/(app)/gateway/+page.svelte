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
	import { gatewayPageCopy } from "$lib/content/page-copy.js";

	let { data } = $props();

	type Module = {
		title: string;
		description: string;
		group: "Office" | "Academic" | "Services" | "Governance";
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

	const quickActions: QuickAction[] = [
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
	];

	const modules: Module[] = [
		{
			title: "Office",
			description: "Faculty operations for HR, leave, welfare, supply, assets, worksheets, and executive dashboards.",
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
	];

	const statusTone = {
		Ready: "border-green-500 text-green-700 dark:text-green-400",
		Next: "border-blue-500 text-blue-700 dark:text-blue-400",
		Planned: "border-muted-foreground/30 text-muted-foreground",
	} satisfies Record<Module["status"], string>;

	const visibleModules = $derived(data.canManageAccess ? modules : modules.filter((module) => module.href !== "/roles"));

</script>

<svelte:head>
	<title>{gatewayPageCopy.title}</title>
</svelte:head>

<div class="space-y-6">
	<section class="overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top_left,var(--muted),transparent_38%),linear-gradient(135deg,var(--background),var(--muted))] p-6 md:p-8">
		<div class="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
			<div class="space-y-5">
				<Badge variant="secondary" class="w-fit gap-1.5">
					<SparklesIcon class="size-3.5" />
					{gatewayPageCopy.heroBadge}
				</Badge>
				<div class="max-w-3xl space-y-3">
					<h1 class="text-3xl font-bold tracking-tight md:text-5xl">{gatewayPageCopy.heroHeading}</h1>
					<p class="text-muted-foreground text-base md:text-lg">{gatewayPageCopy.heroDescription}</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button href={resolve("/requests/new?kind=leave")}>
						{gatewayPageCopy.createLeaveRequestCta}
						<ArrowRightIcon class="size-4" />
					</Button>
					{#if data.canManageAccess}
						<Button href={resolve("/roles")} variant="outline">
							{gatewayPageCopy.manageAccessCta}
							<ShieldCheckIcon class="size-4" />
						</Button>
					{/if}
				</div>
			</div>

			<Card.Root class="bg-background/80 backdrop-blur">
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<SearchIcon class="text-muted-foreground size-4" />
						{gatewayPageCopy.navigationRuleHeading}
					</Card.Title>
					<Card.Description>{gatewayPageCopy.navigationRuleDescription}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-3 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Primary menu</span>
						<span class="font-medium">5-6 items</span>
					</div>
					<Separator />
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Module access</span>
						<span class="font-medium">Cards + search</span>
					</div>
					<Separator />
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Login model</span>
						<span class="font-medium">Single session</span>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-3">
		{#each quickActions as action (action.title)}
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
						href={resolve(action.href)}
						class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
					>
						Open action
						<ArrowRightIcon class="size-3.5" />
					</a>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section class="space-y-4">
		<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">{gatewayPageCopy.moduleMapHeading}</h2>
				<p class="text-muted-foreground text-sm">{gatewayPageCopy.moduleMapDescription}</p>
			</div>
			<Badge variant="outline">Small-team friendly</Badge>
		</div>

		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each visibleModules as module, i (module.title)}
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
							href={resolve(module.href)}
							class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
						>
							View module path
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
				<Card.Title>Recommended build order</Card.Title>
				<Card.Description>Start with the shared foundation before adding many module screens.</Card.Description>
			</Card.Header>
			<Card.Content>
				<ol class="space-y-3 text-sm">
					<li class="flex gap-3">
						<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">1</span>
						<span>Finish user management, roles, and permission checks.</span>
					</li>
					<li class="flex gap-3">
						<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">2</span>
						<span>Create a shared request center for leave, booking, equipment borrowing, and academic service.</span>
					</li>
					<li class="flex gap-3">
						<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">3</span>
						<span>Add audit logs and reports after the core workflows are stable.</span>
					</li>
				</ol>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>SSO / ticket direction</Card.Title>
				<Card.Description>
					Use one Supabase session as the access ticket across modules. Add Google or Microsoft OAuth later if the faculty already has an identity provider.
				</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-3 text-sm sm:grid-cols-3">
				<div class="rounded-xl border p-3">
					<p class="font-medium">Session</p>
					<p class="text-muted-foreground mt-1">Login once, reuse the same app session.</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="font-medium">Roles</p>
					<p class="text-muted-foreground mt-1">Staff, lecturer, student, admin, executive.</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="font-medium">Permissions</p>
					<p class="text-muted-foreground mt-1">Gate each module by explicit permission claims.</p>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</div>
