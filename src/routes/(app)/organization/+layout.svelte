<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button/index.js";
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
		<h1 class="text-2xl font-semibold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground text-sm">{copy.description}</p>
	</div>

	<nav class="flex flex-wrap gap-2" aria-label={copy.title}>
		{#each tabs as tab, i (tab.href)}
			<Button variant={tabActive(tab.href) ? "default" : "outline"} size="sm" href={tab.href}>
				{tab.label}
			</Button>
		{/each}
	</nav>

	{@render children()}
</div>
