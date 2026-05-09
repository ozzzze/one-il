<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { page } from "$app/state";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import CommandPalette from "$lib/components/command-palette.svelte";
	import NotificationBell from "$lib/components/notification-bell.svelte";
	import AppsMenu from "$lib/components/apps-menu.svelte";
	import LanguageSwitcher from "$lib/components/language-switcher.svelte";
	import { getMenuItemLabels } from "$lib/content/labels.js";

	let { children, data } = $props();
	const menuLabels = $derived(getMenuItemLabels(data.locale));

	function getBreadcrumbs() {
		const path = page.url.pathname;
		if (path === "/") return [{ label: menuLabels.dashboard, href: "/" }];

		const segments = path.split("/").filter(Boolean);
		return segments.map((segment, i) => ({
			label: getSegmentLabel(segment),
			href: "/" + segments.slice(0, i + 1).join("/"),
		}));
	}

	function getSegmentLabel(segment: string) {
		const map: Record<string, string> = {
			analytics: menuLabels.analytics,
			requests: menuLabels.requests,
			gateway: menuLabels.modules,
			users: menuLabels.users,
			employees: menuLabels.employees,
			content: menuLabels.content,
			roles: menuLabels.roles,
			notifications: menuLabels.notifications,
			database: menuLabels.database,
			settings: menuLabels.settings,
			docs: menuLabels.documentation,
			"room-booking": menuLabels.roomBooking,
		};

		if (map[segment]) return map[segment];

		return segment
			.split("-")
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}
</script>

<Sidebar.Provider>
	<AppSidebar
		user={data.user}
		allowedMenuIds={data.allowedMenuIds}
		locale={data.locale}
		notificationCount={data.unreadNotificationCount}
	/>
	<Sidebar.Inset>
		<header
			class="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4"
		>
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4! size-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					{#each getBreadcrumbs() as crumb, i (crumb.href)}
						{#if i > 0}
							<Breadcrumb.Separator />
						{/if}
						<Breadcrumb.Item>
							{#if i === getBreadcrumbs().length - 1}
								<Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
							{:else}
								<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
							{/if}
						</Breadcrumb.Item>
					{/each}
				</Breadcrumb.List>
			</Breadcrumb.Root>

			<div class="ml-auto flex items-center gap-1">
				<CommandPalette
					allowedMenuIds={data.allowedMenuIds}
					permissions={data.permissions}
					locale={data.locale}
				/>
				<NotificationBell
					count={data.unreadNotificationCount}
					notifications={data.recentNotifications}
					locale={data.locale}
				/>
				<AppsMenu allowedMenuIds={data.allowedMenuIds} locale={data.locale} />
				<LanguageSwitcher locale={data.locale} compact />
				<ThemeToggle />
			</div>
		</header>

		<main class="flex-1 p-4 md:p-6">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<Toaster />
