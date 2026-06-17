<script lang="ts">
	import { goto } from "$app/navigation";
	import { Label } from "$lib/components/ui/label/index.js";
	import { cn } from "$lib/utils.js";
	import type { Component } from "svelte";

	export type ModuleSubnavLink = {
		href: string;
		label: string;
		icon: Component;
	};

	let {
		ariaLabel,
		selectId,
		selectLabel = "ไปที่เมนู",
		links,
		isActive,
	}: {
		ariaLabel: string;
		selectId: string;
		selectLabel?: string;
		links: readonly ModuleSubnavLink[];
		isActive: (href: string) => boolean;
	} = $props();

	let activeHref = $derived(
		links.find((link) => isActive(link.href))?.href ?? links[0]?.href ?? "",
	);

	const selectClass =
		"border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full min-w-0 rounded-lg border px-2.5 text-sm transition-colors focus-visible:ring-3 outline-none";

	function onSelectChange(event: Event) {
		const href = (event.currentTarget as HTMLSelectElement).value;
		if (href && href !== activeHref) goto(href);
	}
</script>

<nav aria-label={ariaLabel} class="w-full min-w-0">
	<div class="flex flex-col gap-1.5 md:hidden">
		<Label for={selectId} class="text-sm">{selectLabel}</Label>
		<select
			id={selectId}
			class={selectClass}
			value={activeHref}
			onchange={onSelectChange}
			aria-label={ariaLabel}
		>
			{#each links as link (link.href)}
				<option value={link.href}>{link.label}</option>
			{/each}
		</select>
	</div>

	<div class="hidden w-full min-w-0 md:block">
		<div class="overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]">
			<div
				class="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1"
			>
				{#each links as link (link.href)}
					<a
						href={link.href}
						class={cn(
							"inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
							isActive(link.href)
								? "bg-background text-foreground shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
								: "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground",
						)}
						aria-current={isActive(link.href) ? "page" : undefined}
					>
						<link.icon class="size-4" />
						<span>{link.label}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
</nav>
