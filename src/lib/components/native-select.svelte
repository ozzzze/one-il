<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLSelectAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	let {
		id,
		name,
		value = $bindable(""),
		disabled = false,
		required = false,
		class: className,
		selectSize = "sm",
		children,
		...restProps
	}: Omit<HTMLSelectAttributes, "size"> & {
		selectSize?: "sm" | "default";
		children: Snippet;
	} = $props();
</script>

<select
	{id}
	{name}
	bind:value
	{disabled}
	{required}
	data-slot="native-select"
	data-size={selectSize}
	class={cn(
		"border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
		selectSize === "sm" ? "h-8" : "h-9",
		className
	)}
	{...restProps}
>
	{@render children()}
</select>
