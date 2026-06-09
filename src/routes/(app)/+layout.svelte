<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { page } from "$app/state";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import CommandPalette from "$lib/components/command-palette.svelte";
	import DevErrorPanel from "$lib/components/dev-error-panel.svelte";
	import NotificationBell from "$lib/components/notification-bell.svelte";
	import AppsMenu from "$lib/components/apps-menu.svelte";
	import LanguageSwitcher from "$lib/components/language-switcher.svelte";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import UserIcon from "@lucide/svelte/icons/user";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import FilePenLineIcon from "@lucide/svelte/icons/file-pen-line";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import { resolve } from "$app/paths";
	import { getMenuItemLabels, getUiLabels } from "$lib/content/labels.js";

	let { children, data } = $props();
	const menuLabels = $derived(getMenuItemLabels(data.locale));
	const ui = $derived(getUiLabels(data.locale));

	function userInitials(name: string) {
		return name
			.split(" ")
			.filter(Boolean)
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	function isUuidSegment(segment: string): boolean {
		return uuidRegex.test(segment);
	}

	/** Employee detail route merges `employee` into page data — prefer employee no. over raw id in breadcrumbs */
	function employeeDetailCrumbLabel(segment: string, segments: string[]): string | null {
		if (segments.length !== 2 || segments[0] !== "employees" || !isUuidSegment(segment))
			return null;
		const emp = (page.data as { employee?: { employeeNo?: string | null; fullName?: string } })
			.employee;
		if (!emp) return null;
		const no = emp.employeeNo?.trim();
		if (no && no.length > 0) return no;
		const name = emp.fullName?.trim();
		return name && name.length > 0 ? name : null;
	}

	/** Asset detail route merges `asset` into page data — prefer asset no. when set */
	function assetDetailCrumbLabel(segment: string, segments: string[]): string | null {
		if (segments.length !== 2 || segments[0] !== "assets" || !isUuidSegment(segment)) return null;
		const asset = (page.data as { asset?: { assetNo?: string | null } }).asset;
		if (!asset) return null;
		const no = asset.assetNo?.trim();
		return no && no.length > 0 ? no : null;
	}

	function getBreadcrumbs() {
		const path = page.url.pathname;
		if (path === "/") return [{ label: menuLabels.dashboard, href: "/" }];

		const segments = path.split("/").filter(Boolean);
		return segments.map((segment, i) => ({
			label:
				employeeDetailCrumbLabel(segment, segments) ??
				assetDetailCrumbLabel(segment, segments) ??
				getSegmentLabel(segment, segments),
			href: "/" + segments.slice(0, i + 1).join("/"),
		}));
	}

	function getSegmentLabel(segment: string, segments: string[]) {
		if (segments[0] === "room-booking" && segment === "requests") {
			return data.locale === "th" ? "คำขอของฉัน" : "My requests";
		}
		if (segments[0] === "room-booking" && segment === "manage") {
			return data.locale === "th" ? "จัดการการจองห้อง" : "Manage bookings";
		}

		const map: Record<string, string> = {
			analytics: menuLabels.analytics,
			requests: menuLabels.requests,
			gateway: menuLabels.modules,
			users: menuLabels.users,
			employees: menuLabels.employees,
			assets: menuLabels.assets,
			content: menuLabels.content,
			roles: menuLabels.roles,
			notifications: menuLabels.notifications,
			database: menuLabels.database,
			settings: menuLabels.settings,
			docs: menuLabels.documentation,
			"room-booking": menuLabels.roomBooking,
			leave: menuLabels.leave,
			holidays: menuLabels.holidays,
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
		navMenuGroups={data.navigation.sidebarGroups}
		locale={data.locale}
		notificationCount={data.unreadNotificationCount}
	/>
	<Sidebar.Inset>
		<header
			class="shell-header bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4"
		>
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 size-4 h-4!" />
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
					commandPaletteNav={data.navigation.commandPaletteNav}
					permissions={data.permissions}
					locale={data.locale}
				/>
				<DevErrorPanel />
				<NotificationBell
					count={data.unreadNotificationCount}
					notifications={data.recentNotifications}
					locale={data.locale}
				/>
				<AppsMenu appsMenuNav={data.navigation.appsMenuNav} locale={data.locale} />
				<LanguageSwitcher locale={data.locale} compact />
				<ThemeToggle />
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button
								type="button"
								class="focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground ml-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border shadow-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
								aria-label={ui.myAccount}
								{...props}
							>
								<Avatar.Root class="size-8 border-0">
									{#if data.user.avatarUrl}
										<Avatar.Image src={data.user.avatarUrl} alt="" />
									{:else}
										<Avatar.Fallback class="text-xs font-medium"
											>{userInitials(data.user.name)}</Avatar.Fallback
										>
									{/if}
								</Avatar.Root>
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="end" sideOffset={8}>
						<DropdownMenu.Label class="flex flex-col gap-0.5">
							<span class="truncate font-semibold">{data.user.name}</span>
							<span class="text-muted-foreground truncate text-xs font-normal"
								>{data.user.email}</span
							>
							<Badge variant="outline" class="mt-1 w-fit text-xs capitalize">{data.user.role}</Badge
							>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={resolve("/settings")} {...props}>
									<UserIcon class="mr-2 size-4" />
									{ui.profile}
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={resolve("/settings")} {...props}>
									<SettingsIcon class="mr-2 size-4" />
									{ui.settings}
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={resolve("/account/change-request")} {...props}>
									<FilePenLineIcon class="mr-2 size-4" />
									{data.locale === "th" ? "คำขอแก้ไขข้อมูล" : "Change request"}
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							variant="destructive"
							onclick={() =>
								(
									document.getElementById("app-header-logout-form") as HTMLFormElement | null
								)?.requestSubmit()}
						>
							<LogOutIcon class="mr-2 size-4" />
							{ui.logOut}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
					<form
						id="app-header-logout-form"
						method="POST"
						action={resolve("/logout")}
						class="hidden"
					></form>
				</DropdownMenu.Root>
			</div>
		</header>

		<main class="page-content flex flex-1 flex-col gap-4 p-4 md:p-6">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<Toaster />
