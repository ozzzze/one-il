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
					pageTitle: "การลา - ONE-IL",
					title: "การลา",
					description: "ยื่นคำขอลาและดูปฏิทินวันหยุดของคณะ",
					tabLeave: "การลา",
					tabHolidays: "วันหยุด",
				}
			: {
					pageTitle: "Leave - ONE-IL",
					title: "Leave",
					description: "Submit leave requests and view the faculty holiday calendar.",
					tabLeave: "Leave",
					tabHolidays: "Holidays",
				},
	);

	const tabs = $derived.by(
		() =>
			[
				{ href: "/leave", label: copy.tabLeave },
				{ href: "/leave/holidays", label: copy.tabHolidays },
			] as const,
	);

	function tabActive(href: string): boolean {
		const p = page.url.pathname;
		if (href === "/leave") return p === "/leave";
		return p === href || p.startsWith(`${href}/`);
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

	<nav
		class={cn(
			"bg-muted text-muted-foreground inline-flex h-auto w-fit flex-wrap gap-1 items-center justify-center rounded-lg p-[3px]",
		)}
		aria-label={copy.title}
	>
		{#each tabs as tab (tab.href)}
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
