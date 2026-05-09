<script lang="ts">
	import { Command } from "bits-ui";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { goto } from "$app/navigation";
	import { base, resolve } from "$app/paths";
	import { toggleMode } from "mode-watcher";
	import SearchIcon from "@lucide/svelte/icons/search";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import BellIcon from "@lucide/svelte/icons/bell";
	import TicketCheckIcon from "@lucide/svelte/icons/ticket-check";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SunMoonIcon from "@lucide/svelte/icons/sun-moon";
	import UserIcon from "@lucide/svelte/icons/user";
	import LoaderIcon from "@lucide/svelte/icons/loader";
	import type { PermissionKey } from "$lib/auth/roles.js";
	import { getUiLabels } from "$lib/content/labels.js";
	import type { Locale } from "$lib/i18n/locales.js";
	import { getVisibleCommandItems } from "$lib/navigation/menu.js";
	import { menuIcons } from "$lib/navigation/icons.js";

	type SearchResult = {
		type: "user" | "page" | "notification";
		id: string;
		title: string;
		subtitle: string;
		href: string;
	};

	type Props = {
		allowedMenuIds: string[];
		permissions: PermissionKey[];
		locale: Locale;
	};

	let { allowedMenuIds, permissions, locale }: Props = $props();

	let open = $state(false);
	let query = $state("");
	let searchResults = $state<SearchResult[]>([]);
	let loading = $state(false);

	const navItems = $derived(getVisibleCommandItems(allowedMenuIds, locale));
	const ui = $derived(getUiLabels(locale));

	function resultIcon(type: string) {
		switch (type) {
			case "user": return UserIcon;
			case "page": return FileTextIcon;
			default: return BellIcon;
		}
	}

	async function fetchSearch(q: string) {
		if (q.length < 2) {
			searchResults = [];
			return;
		}
		loading = true;
		try {
		const res = await fetch(`${resolve("/api/search")}?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				searchResults = await res.json();
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const q = query;
		const timer = setTimeout(() => fetchSearch(q), 250);
		return () => clearTimeout(timer);
	});

	function withBase(path: string) {
		return `${base}${path}`;
	}

	function navigate(href: string) {
		open = false;
		goto(withBase(href));
	}

	function handleAction(action: () => void) {
		open = false;
		action();
	}

	function can(permission: PermissionKey) {
		return permissions.includes(permission);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}}
/>

<button
	type="button"
	class="border-input bg-muted/40 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm transition-colors"
	onclick={() => (open = true)}
>
	<SearchIcon class="size-3.5" />
	<span class="hidden sm:inline">{ui.search}</span>
	<kbd class="bg-background pointer-events-none hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
		<span class="text-xs">&#8984;</span>K
	</kbd>
</button>

<Dialog.Root bind:open onOpenChange={() => { query = ""; searchResults = []; }}>
	<Dialog.Content
		showCloseButton={false}
		class="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
	>
		<Command.Root
			shouldFilter={true}
			loop
			label={ui.commandPaletteLabel}
		>
			<div class="flex items-center border-b px-3">
				<SearchIcon class="text-muted-foreground mr-2 size-4 shrink-0" />
				<Command.Input
					class="placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
					placeholder={ui.commandPalettePlaceholder}
					bind:value={query}
				/>
				{#if loading}
					<LoaderIcon class="text-muted-foreground ml-2 size-4 shrink-0 animate-spin" />
				{/if}
			</div>
			<Command.List class="max-h-[300px] overflow-y-auto overflow-x-hidden px-1 py-1.5">
				<Command.Empty class="text-muted-foreground py-6 text-center text-sm">
					{ui.noResultsFound}
				</Command.Empty>

				<Command.Group value="navigation">
					<Command.GroupHeading
						class="text-muted-foreground px-2 py-1.5 text-xs font-medium"
					>
						{ui.navigation}
					</Command.GroupHeading>
					<Command.GroupItems>
						{#each navItems as item, i (item.id)}
							{@const Icon = menuIcons[item.iconKey]}
							<Command.Item
								value={item.label}
								keywords={item.keywords ?? []}
								onSelect={() => navigate(item.href)}
								class="data-selected:bg-accent data-selected:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
							>
								<Icon class="text-muted-foreground size-4" />
								{item.label}
							</Command.Item>
						{/each}
					</Command.GroupItems>
				</Command.Group>

				{#if searchResults.length > 0}
					<Command.Separator class="bg-border -mx-1 my-1 h-px" />
					<Command.Group value="search-results" forceMount>
						<Command.GroupHeading
							class="text-muted-foreground px-2 py-1.5 text-xs font-medium"
						>
							{ui.searchResults}
						</Command.GroupHeading>
						<Command.GroupItems>
							{#each searchResults as result (result.id)}
								{@const Icon = resultIcon(result.type)}
								<Command.Item
									value={`search-${result.id}`}
									forceMount
									onSelect={() => navigate(result.href)}
									class="data-selected:bg-accent data-selected:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
								>
									<Icon class="text-muted-foreground size-4 shrink-0" />
									<div class="min-w-0 flex-1">
										<span class="block truncate">{result.title}</span>
										<span class="text-muted-foreground block truncate text-xs">{result.subtitle}</span>
									</div>
								</Command.Item>
							{/each}
						</Command.GroupItems>
					</Command.Group>
				{/if}

				<Command.Separator class="bg-border -mx-1 my-1 h-px" />
				<Command.Group value="actions">
					<Command.GroupHeading
						class="text-muted-foreground px-2 py-1.5 text-xs font-medium"
					>
						{ui.quickActions}
					</Command.GroupHeading>
					<Command.GroupItems>
						{#if can("requests:create")}
							<Command.Item
								value={ui.newRequest}
								keywords={["create", "add", "leave", "booking", "borrow", "service"]}
								onSelect={() => navigate("/requests")}
								class="data-selected:bg-accent data-selected:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
							>
								<TicketCheckIcon class="text-muted-foreground size-4" />
								{ui.newRequest}
							</Command.Item>
						{/if}
						{#if can("content:manage")}
							<Command.Item
								value={ui.newPage}
								keywords={["create", "add", "content"]}
								onSelect={() => navigate("/content/new")}
								class="data-selected:bg-accent data-selected:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
							>
								<PlusIcon class="text-muted-foreground size-4" />
								{ui.newContentPage}
							</Command.Item>
						{/if}
						<Command.Item
							value={ui.toggleTheme}
							keywords={["dark", "light", "mode", "switch"]}
							onSelect={() => handleAction(toggleMode)}
							class="data-selected:bg-accent data-selected:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
						>
							<SunMoonIcon class="text-muted-foreground size-4" />
							{ui.toggleTheme}
						</Command.Item>
					</Command.GroupItems>
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Dialog.Content>
</Dialog.Root>
