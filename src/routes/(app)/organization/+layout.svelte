<script lang="ts">
	import { page } from "$app/state";
	import { cn } from "$lib/utils.js";
	import type { LayoutData } from "./$types.js";
	import type { Snippet } from "svelte";

	let {
		children,
		data,
	}: {
		children: Snippet;
		data: LayoutData;
	} = $props();

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "องค์กร - ONE-IL",
					title: "องค์กร",
					description: "จัดการตำแหน่งในโครงสร้างและหน่วยงานให้สอดคล้องกับองค์กร",
					tabPositions: "ตำแหน่ง",
					tabOrgUnits: "หน่วยงาน",
				}
			: {
					pageTitle: "Organization - ONE-IL",
					title: "Organization",
					description: "Manage job positions and the organizational unit hierarchy.",
					tabPositions: "Positions",
					tabOrgUnits: "Org units",
				}
	);

	const tabs = $derived.by(() =>
		[
			{ href: "/organization/positions", label: copy.tabPositions },
			{ href: "/organization/org-units", label: copy.tabOrgUnits },
		] as const
	);

	function tabActive(href: string): boolean {
		return page.url.pathname === href;
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground text-sm">{copy.description}</p>
	</div>

	<!-- Same chrome as employee detail Tabs.List + Tabs.Trigger (route links, not bits-ui tabs). -->
	<nav
		class={cn(
			"bg-muted text-muted-foreground inline-flex h-auto w-fit flex-wrap gap-1 items-center justify-center rounded-lg p-[3px]",
		)}
		aria-label={copy.title}
	>
		{#each tabs as tab, i (tab.href)}
			<a
				href={tab.href}
				aria-current={tabActive(tab.href) ? "page" : undefined}
				class={cn(
					"inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap transition-[color,box-shadow]",
					"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1 outline-none",
					tabActive(tab.href)
						? "border-transparent bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground"
						: "border-transparent text-foreground dark:text-muted-foreground",
				)}
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	{@render children()}
</div>
