<script lang="ts">
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { base } from "$app/paths";
	import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
	import { getVisibleCommandItems } from "$lib/navigation/menu.js";
	import { menuIcons } from "$lib/navigation/icons.js";

	type Props = {
		allowedMenuIds: string[];
	};

	let { allowedMenuIds }: Props = $props();

	const apps = $derived(getVisibleCommandItems(allowedMenuIds).filter((item) => !item.id.startsWith("gateway-")));

	let open = $state(false);

	function withBase(path: string) {
		return `${base}${path}`;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<LayoutGridIcon class="size-4" />
				<span class="sr-only">Apps menu</span>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-64 p-2" align="end">
		<div class="grid grid-cols-3 gap-1">
			{#each apps as app, i (app.id)}
				{@const Icon = menuIcons[app.iconKey]}
				<a
					href={withBase(app.href)}
					class="hover:bg-muted flex flex-col items-center gap-1.5 rounded-md px-2 py-3 text-center transition-colors"
					onclick={() => { open = false; }}
				>
					<div class="bg-muted flex size-9 items-center justify-center rounded-lg">
						<Icon class="text-foreground size-4" />
					</div>
					<span class="text-[11px] font-medium">{app.label}</span>
				</a>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
