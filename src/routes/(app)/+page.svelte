<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import InfoIcon from "@lucide/svelte/icons/info";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	import LockIcon from "@lucide/svelte/icons/lock";
	import { base } from "$app/paths";
	import { enhance } from "$app/forms";
	import { getDashboardPageCopy } from "$lib/content/page-copy.js";
	import { orderHomeCardsByShortcuts } from "$lib/navigation/catalog.js";
	import { menuIconFor } from "$lib/navigation/icons.js";

	let { data } = $props();
	const copy = $derived(getDashboardPageCopy(data.locale));

	let menuSearch = $state("");
	let showFullMenu = $state(false);

	const navigation = $derived(data.navigation);
	const shortcutIds = $derived(navigation.shortcutMenuItemIds);
	const baseCards = $derived(navigation.homeNavCards);

	const cardsPrimary = $derived.by(() => {
		if (shortcutIds.length > 0 && !showFullMenu) {
			return orderHomeCardsByShortcuts(baseCards, shortcutIds);
		}
		return baseCards;
	});

	const filteredNavCards = $derived.by(() => {
		const list = cardsPrimary;
		const q = menuSearch.trim().toLowerCase();
		if (!q) return list;
		return list.filter(
			(c) =>
				c.label.toLowerCase().includes(q) ||
				c.groupLabel.toLowerCase().includes(q) ||
				c.keywords.some((k) => k.toLowerCase().includes(q)),
		);
	});

	function isPinned(id: string): boolean {
		return shortcutIds.includes(id);
	}

	/** App links may point to other apps (e.g. /leave) served by the same reverse proxy. */
	function appHref(href: string): string {
		return `${base}${href}`;
	}

	function notifIcon(type: string) {
		switch (type) {
			case "warning":
				return AlertTriangleIcon;
			case "error":
				return CircleAlertIcon;
			case "success":
				return CheckCircleIcon;
			default:
				return InfoIcon;
		}
	}

	function notifColor(type: string) {
		switch (type) {
			case "warning":
				return "text-yellow-600 dark:text-yellow-400";
			case "error":
				return "text-red-600 dark:text-red-400";
			case "success":
				return "text-green-600 dark:text-green-400";
			default:
				return "text-blue-600 dark:text-blue-400";
		}
	}
</script>

<svelte:head>
	<title>{copy.title}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-1">
		<h1 class="text-3xl font-bold tracking-tight">{copy.heading}</h1>
		<p class="text-muted-foreground">{copy.description}</p>
	</div>

	<section class="flex flex-col gap-3" aria-labelledby="nav-shortcuts-heading">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 id="nav-shortcuts-heading" class="text-lg font-semibold">{copy.navShortcuts.sectionTitle}</h2>
				<p class="text-muted-foreground text-sm">
					{shortcutIds.length > 0 ? copy.navShortcuts.yourShortcuts : copy.navShortcuts.allModules}
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if shortcutIds.length > 0}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => {
							showFullMenu = !showFullMenu;
						}}
					>
						{showFullMenu ? copy.navShortcuts.showShortcutsOnly : copy.navShortcuts.showAllLink}
					</Button>
					<form method="POST" action="?/clearMenuShortcuts" use:enhance>
						<Button type="submit" variant="ghost" size="sm">{copy.navShortcuts.clearShortcuts}</Button>
					</form>
				{/if}
			</div>
		</div>
		<div class="relative">
			<input
				type="search"
				class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
				placeholder={copy.navShortcuts.searchPlaceholder}
				bind:value={menuSearch}
				autocomplete="off"
			/>
		</div>
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredNavCards as card (card.id)}
				{@const Icon = menuIconFor(card.iconKey)}
				<Card.Root class={!card.accessible ? "border-muted bg-muted/30" : "transition-colors hover:bg-muted/40"}>
					<Card.Header class="pb-2">
						<div class="flex items-start gap-3">
							<div class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
								<Icon class="text-foreground size-5" />
							</div>
							<div class="min-w-0 flex-1 space-y-1">
								{#if card.accessible && card.href}
									<a href={appHref(card.href)} class="font-medium hover:underline">{card.label}</a>
								{:else}
									<p class="text-muted-foreground flex items-center gap-1.5 font-medium">
										<LockIcon class="size-3.5" />
										{card.label}
									</p>
								{/if}
								<p class="text-muted-foreground text-xs">{card.groupLabel}</p>
								{#if !card.accessible}
									<p class="text-muted-foreground text-[11px]">
										{card.lockReason === "planned"
											? copy.navShortcuts.comingSoonHint
											: copy.navShortcuts.noAccessHint}
									</p>
								{/if}
							</div>
						</div>
					</Card.Header>
					<Card.Content class="pt-0">
						<div class="flex flex-wrap gap-2">
							{#if card.accessible && card.href}
								{#if !isPinned(card.id)}
									<form method="POST" action="?/addMenuShortcut" use:enhance>
										<input type="hidden" name="menuItemId" value={card.id} />
										<Button type="submit" variant="secondary" size="sm">{copy.navShortcuts.addShortcut}</Button>
									</form>
								{:else}
									<form method="POST" action="?/removeMenuShortcut" use:enhance>
										<input type="hidden" name="menuItemId" value={card.id} />
										<Button type="submit" variant="outline" size="sm">{copy.navShortcuts.removeShortcut}</Button>
									</form>
								{/if}
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<div>
				<Card.Title>{copy.notifications.title}</Card.Title>
				<Card.Description>{copy.notifications.description}</Card.Description>
			</div>
			<a href={appHref("/notifications")} class="text-primary text-xs font-medium hover:underline">
				{copy.notifications.viewAll}
			</a>
		</Card.Header>
		<Card.Content>
			{#if data.recentNotifications.length > 0}
				<ScrollArea class="max-h-[250px]">
					<div class="space-y-3">
						{#each data.recentNotifications as notif (notif.id)}
							{@const Icon = notifIcon(notif.type)}
							<div class="flex items-start gap-3">
								<div class={`mt-0.5 shrink-0 ${notifColor(notif.type)}`}>
									<Icon class="size-4" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{notif.title}</p>
									<p class="text-muted-foreground truncate text-xs">{notif.message}</p>
								</div>
							</div>
						{/each}
					</div>
				</ScrollArea>
			{:else}
				<div class="flex h-[100px] items-center justify-center">
					<p class="text-muted-foreground text-sm">{copy.notifications.none}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
