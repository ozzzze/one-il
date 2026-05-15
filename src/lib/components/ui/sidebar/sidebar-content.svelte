<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<div
	class="relative flex min-h-0 flex-1 flex-col overflow-hidden group-data-[collapsible=icon]:overflow-hidden"
>
	<div
		bind:this={ref}
		data-slot="sidebar-content"
		data-sidebar="content"
		class={cn(
			"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-y-contain",
			"group-data-[collapsible=icon]:overflow-hidden",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</div>
	<!-- Bottom fade: taller + softer transition (shadcn docs–style) -->
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 shrink-0 bg-[linear-gradient(to_top,var(--sidebar)_0%,color-mix(in_oklch,var(--sidebar)_55%,transparent)_22%,color-mix(in_oklch,var(--sidebar)_22%,transparent)_52%,color-mix(in_oklch,var(--sidebar)_6%,transparent)_78%,transparent_100%)] group-data-[collapsible=icon]:hidden"
		aria-hidden="true"
	></div>
</div>
