<script lang="ts">
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import SearchIcon from "@lucide/svelte/icons/search";
	import UserIcon from "@lucide/svelte/icons/user";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import BellIcon from "@lucide/svelte/icons/bell";
	import LoaderIcon from "@lucide/svelte/icons/loader";

	type SearchResult = {
		type: "user" | "page" | "notification";
		id: string;
		title: string;
		subtitle: string;
		href: string;
	};

	let query = $state("");
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let open = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl = $state<HTMLInputElement | null>(null);

	function typeIcon(type: string) {
		switch (type) {
			case "user":
				return UserIcon;
			case "page":
				return FileTextIcon;
			default:
				return BellIcon;
		}
	}

	function typeLabel(type: string) {
		switch (type) {
			case "user":
				return "Users";
			case "page":
				return "Pages";
			default:
				return "Notifications";
		}
	}

	async function search(q: string) {
		if (q.length < 2) {
			results = [];
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				results = await res.json();
			}
		} finally {
			loading = false;
		}
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			search(query);
		}, 300);
	}

	const groupedResults = $derived(() => {
		const groups = new Map<string, SearchResult[]>();
		for (const r of results) {
			const existing = groups.get(r.type) ?? [];
			existing.push(r);
			groups.set(r.type, existing);
		}
		return groups;
	});
</script>

<Popover.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (isOpen) {
			setTimeout(() => inputEl?.focus(), 0);
		} else {
			query = "";
			results = [];
		}
	}}
>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<SearchIcon class="size-4" />
				<span class="sr-only">Search</span>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 overflow-hidden p-0" align="end">
		<div class="border-b px-3 py-2">
			<div class="relative">
				<SearchIcon class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
				<Input
					bind:ref={inputEl}
					type="search"
					placeholder="Search users, pages..."
					class="h-8 pl-8 text-sm"
					bind:value={query}
					oninput={handleInput}
				/>
			</div>
		</div>
		{#if loading}
			<div class="flex items-center justify-center py-6">
				<LoaderIcon class="text-muted-foreground size-5 animate-spin" />
			</div>
		{:else if query.length < 2}
			<div class="py-6 text-center">
				<p class="text-muted-foreground text-xs">Type at least 2 characters</p>
			</div>
		{:else if results.length === 0}
			<div class="py-6 text-center">
				<p class="text-muted-foreground text-xs">No results found</p>
			</div>
		{:else}
			<div class="max-h-[300px] overflow-y-auto">
				{#each [...groupedResults().entries()] as [type, items] (type)}
					<div class="px-3 pt-3 pb-1">
						<p class="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
							{typeLabel(type)}
						</p>
					</div>
					{#each items as item (item.id)}
						{@const Icon = typeIcon(item.type)}
						<a
							href={item.href}
							class="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
							onclick={() => {
								open = false;
							}}
						>
							<Icon class="text-muted-foreground size-4 shrink-0" />
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{item.title}</p>
								<p class="text-muted-foreground truncate text-xs">{item.subtitle}</p>
							</div>
						</a>
					{/each}
				{/each}
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
