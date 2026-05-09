<script lang="ts">
	import { Button, type ButtonProps } from "$lib/components/ui/button/index.js";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";
	import SaveIcon from "@lucide/svelte/icons/save";
	import { cn } from "$lib/utils.js";

	type Props = Omit<ButtonProps, "type" | "children"> & {
		pending?: boolean;
		idleLabel: string;
		savingLabel: string;
	};

	let {
		pending = false,
		idleLabel,
		savingLabel,
		class: className,
		disabled,
		...rest
	}: Props = $props();
</script>

<Button
	type="submit"
	disabled={pending || disabled}
	class={cn("gap-2", className)}
	aria-busy={pending || undefined}
	{...rest}
>
	{#if pending}
		<Loader2Icon class="size-4 shrink-0 animate-spin opacity-90" aria-hidden="true" />
	{:else}
		<SaveIcon class="size-4 shrink-0 opacity-90" aria-hidden="true" />
	{/if}
	{pending ? savingLabel : idleLabel}
</Button>
