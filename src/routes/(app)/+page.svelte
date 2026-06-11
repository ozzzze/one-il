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
	import PinIcon from "@lucide/svelte/icons/pin";
	import PinOffIcon from "@lucide/svelte/icons/pin-off";

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
				c.keywords.some((k) => k.toLowerCase().includes(q))
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

	function notifBgColor(type: string) {
		switch (type) {
			case "warning":
				return "bg-yellow-50 dark:bg-yellow-950/20";
			case "error":
				return "bg-red-50 dark:bg-red-950/20";
			case "success":
				return "bg-green-50 dark:bg-green-950/20";
			default:
				return "bg-blue-50 dark:bg-blue-950/20";
		}
	}

	function relativeTime(dateStr: string) {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return copy.time.justNow;
		if (diffMins < 60) return copy.time.minAgo(diffMins);
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return copy.time.hourAgo(diffHours);
		const diffDays = Math.floor(diffHours / 24);
		return copy.time.dayAgo(diffDays);
	}

</script>

<svelte:head>
	<title>{copy.title}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Premium Welcome Banner (inspired by shadcnspace widget-08) -->
	<div class="relative overflow-hidden rounded-2xl border border-border/50 bg-linear-to-r from-card to-muted/20 p-6 md:p-8 shadow-sm">
		<!-- Dynamic Background Accents -->
		<div class="absolute -right-16 -top-16 size-48 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"></div>
		<div class="absolute -bottom-16 -left-16 size-48 rounded-full bg-chart-1/5 blur-3xl dark:bg-chart-1/10"></div>
		
		<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
			<div class="space-y-2">
				<div class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20">
					<span class="flex size-1.5 rounded-full bg-green-500 animate-pulse"></span>
					{copy.system.operational}
				</div>
				<h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
					{data.locale === "th" ? `สวัสดีคุณ ${data.user?.name}` : `Welcome back, ${data.user?.name}`}
				</h1>
				<p class="text-muted-foreground text-sm max-w-xl">{copy.description}</p>
			</div>

			<!-- KPI Mini Cards -->
			<div class="grid grid-cols-2 sm:flex items-center gap-4">
				<div class="flex flex-col rounded-xl border border-border/40 bg-card/50 p-4 min-w-32 backdrop-blur-xs shadow-xs hover:border-primary/20 transition-all duration-300">
					<span class="text-muted-foreground text-xs font-medium">{copy.navShortcuts.yourShortcuts}</span>
					<span class="text-2xl font-bold mt-1 text-foreground">{shortcutIds.length}</span>
				</div>
				<div class="flex flex-col rounded-xl border border-border/40 bg-card/50 p-4 min-w-32 backdrop-blur-xs shadow-xs hover:border-primary/20 transition-all duration-300">
					<span class="text-muted-foreground text-xs font-medium">{copy.notifications.title}</span>
					<div class="flex items-baseline gap-1 mt-1">
						<span class="text-2xl font-bold text-foreground">{data.recentNotifications.length}</span>
						{#if data.unreadNotificationCount > 0}
							<span class="text-[10px] font-semibold text-destructive px-1.5 py-0.5 rounded-full bg-destructive/10 animate-bounce">{copy.notifications.new}</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	<section class="flex flex-col gap-3" aria-labelledby="nav-shortcuts-heading">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 id="nav-shortcuts-heading" class="text-lg font-semibold">
					{copy.navShortcuts.sectionTitle}
				</h2>
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
						<Button type="submit" variant="ghost" size="sm"
							>{copy.navShortcuts.clearShortcuts}</Button
						>
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
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredNavCards as card (card.id)}
				{@const Icon = menuIconFor(card.iconKey)}
				<div
					class="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md
						{!card.accessible
							? 'border-border/30 bg-muted/20 opacity-75'
							: 'border-border/60 bg-card hover:border-primary/30'}"
				>
					<!-- Glow effect on hover -->
					{#if card.accessible}
						<div class="absolute -right-20 -top-20 size-40 rounded-full bg-primary/5 opacity-0 blur-2xl group-hover:opacity-100 transition-opacity duration-500"></div>
					{/if}

					<div class="p-5 flex flex-col justify-between h-full relative z-10">
						<div class="space-y-4">
							<div class="flex items-start justify-between gap-3">
								<div class="bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:shadow-md">
									<Icon class="size-5 transition-transform group-hover:scale-110" />
								</div>
								
								<!-- Shortcut Pin Form -->
								{#if card.accessible && card.href}
									<div class="{isPinned(card.id) ? 'opacity-100' : 'opacity-100 sm:opacity-0'} group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
										{#if !isPinned(card.id)}
											<form method="POST" action="?/addMenuShortcut" use:enhance>
												<input type="hidden" name="menuItemId" value={card.id} />
												<button type="submit" class="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors" title={copy.navShortcuts.addShortcut}>
													<PinIcon class="size-4 rotate-45" />
												</button>
											</form>
										{:else}
											<form method="POST" action="?/removeMenuShortcut" use:enhance>
												<input type="hidden" name="menuItemId" value={card.id} />
												<button type="submit" class="p-2 text-primary hover:text-destructive rounded-lg hover:bg-muted transition-colors" title={copy.navShortcuts.removeShortcut}>
													<PinOffIcon class="size-4" />
												</button>
											</form>
										{/if}
									</div>
								{/if}
							</div>

							<div class="space-y-1.5">
								<div class="flex items-center gap-1.5">
									{#if card.accessible && card.href}
										<a href={appHref(card.href)} class="font-semibold text-foreground hover:text-primary hover:underline transition-colors block text-base">
											{card.label}
										</a>
									{:else}
										<span class="font-semibold text-muted-foreground flex items-center gap-1.5 text-base">
											<LockIcon class="size-4 animate-pulse" />
											{card.label}
										</span>
									{/if}
								</div>
								
								<p class="text-muted-foreground text-xs font-medium">{card.groupLabel}</p>
								
								{#if !card.accessible}
									<div class="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground mt-1">
										{card.lockReason === "planned"
											? copy.navShortcuts.comingSoonHint
											: copy.navShortcuts.noAccessHint}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<div class="rounded-2xl border border-border/60 bg-card shadow-sm">
		<div class="p-6 flex flex-row items-center justify-between border-b border-border/50">
			<div>
				<h2 class="text-lg font-semibold tracking-tight text-foreground">{copy.notifications.title}</h2>
				<p class="text-muted-foreground text-sm">{copy.notifications.description}</p>
			</div>
			<a href={appHref("/notifications")} class="inline-flex items-center gap-1 text-primary text-xs font-semibold hover:underline bg-primary/5 px-2.5 py-1.5 rounded-lg transition-colors">
				{copy.notifications.viewAll}
			</a>
		</div>
		<div class="p-6">
			{#if data.recentNotifications.length > 0}
				<div class="relative pl-6 space-y-6 after:absolute after:bottom-2 after:left-[9px] after:top-2 after:w-0.5 after:bg-border/60">
					{#each data.recentNotifications as notif (notif.id)}
						{@const Icon = notifIcon(notif.type)}
						<div class="relative flex gap-4">
							<!-- Timeline dot -->
							<div class="absolute -left-[23px] flex size-5 items-center justify-center rounded-full bg-card ring-2 ring-border/50 z-10 transition-transform duration-300 hover:scale-110">
								<span class={`flex size-2 rounded-full ${notifColor(notif.type).replace("text-", "bg-")}`}></span>
							</div>

							<!-- Notification icon with themed background -->
							<div class={`flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/40 ${notifBgColor(notif.type)}`}>
								<Icon class={`size-4.5 ${notifColor(notif.type)}`} />
							</div>

							<!-- Content -->
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex items-center justify-between gap-2">
									<p class="text-sm font-semibold text-foreground truncate">{notif.title}</p>
									<span class="text-[10px] font-medium text-muted-foreground shrink-0">{relativeTime(notif.createdAt)}</span>
								</div>
								<p class="text-muted-foreground text-xs leading-relaxed">{notif.message}</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex h-32 flex-col items-center justify-center gap-2">
					<InfoIcon class="size-8 text-muted-foreground/50" />
					<p class="text-muted-foreground text-sm font-medium">{copy.notifications.none}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
