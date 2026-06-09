<script lang="ts">
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { cn } from "$lib/utils.js";

	let {
		id,
		initialChecked,
		activeLabel,
		inactiveLabel,
		class: className,
	}: {
		id: string;
		initialChecked: boolean;
		activeLabel: string;
		inactiveLabel: string;
		class?: string;
	} = $props();

	let checked = $state(false);
	$effect.pre(() => {
		checked = initialChecked;
	});
</script>

<div class={cn("flex items-center gap-2", className)}>
	<input type="hidden" name="isActive" value={checked ? "true" : "false"} />
	<Switch {id} bind:checked aria-label={checked ? activeLabel : inactiveLabel} />
</div>
