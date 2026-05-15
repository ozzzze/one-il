<script lang="ts">
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import UserIcon from "@lucide/svelte/icons/user";
	import BellRingIcon from "@lucide/svelte/icons/bell-ring";
	import LockIcon from "@lucide/svelte/icons/lock";
	import KeyboardIcon from "@lucide/svelte/icons/keyboard";
	import HelpCircleIcon from "@lucide/svelte/icons/help-circle";
	import ilLogo from "$lib/assets/layout/il-logo.png";

	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { afterNavigate } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import type { Role } from "$lib/auth/roles.js";
	import { getMenuItemLabels, getUiLabels } from "$lib/content/labels.js";
	import type { Locale } from "$lib/i18n/locales.js";
	import type { NavMenuGroup, NavMenuItem } from "$lib/navigation/catalog.js";
	import { menuIconFor } from "$lib/navigation/icons.js";
	import { cn } from "$lib/utils.js";
	import {
		isEmployeesPath,
		isLeavePath,
		isOrgPath,
	} from "$lib/navigation/sidebar-expand.js";
	import {
		expandMenuBranch,
		openHrHub,
		OFFICE_LEAVE_ID as LEAVE_BRANCH_ID,
		sidebarMenuExpand,
		toggleHrHub,
		toggleMenuBranch,
		isMenuBranchExpanded,
	} from "$lib/navigation/sidebar-menu-expand.svelte.js";

	type Props = {
		user: {
			name: string;
			email: string;
			username: string;
			role: Role;
			avatarUrl: string | null;
		};
		navMenuGroups: NavMenuGroup[];
		locale: Locale;
		notificationCount?: number;
	};

	let { user, navMenuGroups, locale, notificationCount = 0 }: Props = $props();

	const OFFICE_HR_ID = "office-hr";
	const OFFICE_ORG_ID = "office-organization";
	const menuItemLabels = $derived(getMenuItemLabels(locale));

	function autoExpandForPath(pathname: string) {
		if (isEmployeesPath(pathname) || isOrgPath(pathname)) {
			openHrHub();
		}
		if (isLeavePath(pathname)) {
			expandMenuBranch(LEAVE_BRANCH_ID);
		}
	}

	afterNavigate(({ to }) => {
		const pathname = to?.url.pathname;
		if (pathname) {
			autoExpandForPath(pathname);
		}
	});

	function isPathActive(href: string | null): boolean {
		if (!href) return false;
		const p = page.url.pathname;
		if (href === "/") return p === "/";
		return p === href || p.startsWith(`${href}/`);
	}

	function isBranchActive(item: NavMenuItem): boolean {
		if (item.href && isPathActive(item.href)) return true;
		return item.children.some((c) => isPathActive(c.href));
	}

	function officeItemsWithoutMergedOrg(items: readonly NavMenuItem[]): NavMenuItem[] {
		return items.filter((i) => i.id !== OFFICE_ORG_ID);
	}

	function getInitials(name: string) {
		return name
			.split(" ")
			.filter(Boolean)
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	const ui = $derived(getUiLabels(locale));

	function menuBadge(id: string) {
		return id === "sys-notifications" && notificationCount > 0 ? String(notificationCount) : undefined;
	}

	function lockHint(item: NavMenuItem): string {
		if (item.lockReason === "planned") return ui.menuComingSoonHint;
		if (item.lockReason === "no_permission") return ui.menuNoAccessHint;
		return "";
	}
</script>

{#snippet menuLeaf(item: NavMenuItem)}
	{@const Icon = menuIconFor(item.iconKey)}
	{@const badge = menuBadge(item.id)}
	<Sidebar.MenuItem>
		{#if item.accessible && item.href}
			<Sidebar.MenuButton>
				{#snippet child({ props })}
					<a href={resolve(item.href as "/")} {...props}>
						<Icon class="size-4" />
						<span>{item.label}</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
			{#if badge}
				<Sidebar.MenuBadge>{badge}</Sidebar.MenuBadge>
			{/if}
		{:else}
			<Sidebar.MenuButton type="button" disabled class="cursor-not-allowed">
				<Icon class="size-4" />
				<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
					<span>{item.label}</span>
					<span class="text-muted-foreground max-w-full truncate text-[10px] font-normal leading-tight">
						{lockHint(item)}
					</span>
				</span>
			</Sidebar.MenuButton>
		{/if}
	</Sidebar.MenuItem>
{/snippet}

{#snippet menuSubLeaf(menuChild: NavMenuItem)}
	<Sidebar.MenuSubItem>
		{#if menuChild.accessible && menuChild.href}
			<Sidebar.MenuSubButton
				href={resolve(menuChild.href as "/")}
				isActive={isPathActive(menuChild.href)}
				size="sm"
			>
				{menuChild.label}
			</Sidebar.MenuSubButton>
		{:else}
			<Sidebar.MenuSubButton size="sm">
				{#snippet child({ props })}
					<button type="button" disabled class="w-full cursor-not-allowed opacity-60" {...props}>
						<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
							<span class="truncate">{menuChild.label}</span>
							<span
								class="text-muted-foreground max-w-24 truncate text-[10px] font-normal leading-tight"
							>
								{lockHint(menuChild)}
							</span>
						</span>
					</button>
				{/snippet}
			</Sidebar.MenuSubButton>
		{/if}
	</Sidebar.MenuSubItem>
{/snippet}

{#snippet menuBranch(item: NavMenuItem)}
	{@const BranchIcon = menuIconFor(item.iconKey)}
	{@const expanded = isMenuBranchExpanded(item.id)}
	{@const branchActive = isBranchActive(item)}
	<Sidebar.MenuItem class="group-data-[collapsible=icon]:hidden">
		{#if item.accessible}
			<Sidebar.MenuButton
				type="button"
				data-testid="sidebar-branch-toggle-{item.id}"
				aria-expanded={expanded}
				isActive={branchActive}
				onclick={() => toggleMenuBranch(item.id)}
			>
				<BranchIcon class="size-4" />
				<span class="flex-1 truncate text-start">{item.label}</span>
				<ChevronDownIcon
					class={cn(
						"ml-auto size-4 shrink-0 transition-transform duration-200",
						expanded ? "rotate-180" : "",
					)}
				/>
			</Sidebar.MenuButton>
		{:else}
			<Sidebar.MenuButton
				type="button"
				class="w-full cursor-not-allowed"
				disabled
				isActive={branchActive}
			>
				<BranchIcon class="size-4" />
				<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
					<span class="truncate">{item.label}</span>
					<span class="text-muted-foreground max-w-full truncate text-[10px] font-normal leading-tight">
						{lockHint(item)}
					</span>
				</span>
			</Sidebar.MenuButton>
		{/if}
		<Sidebar.MenuSub
			data-testid="sidebar-branch-submenu-{item.id}"
			class={cn(!expanded && "hidden")}
		>
			{#each item.children as menuChild (menuChild.id)}
				{@render menuSubLeaf(menuChild)}
			{/each}
		</Sidebar.MenuSub>
	</Sidebar.MenuItem>
	{#each item.children as menuChild (menuChild.id)}
		{@const ChildIcon = menuIconFor(menuChild.iconKey)}
		<Sidebar.MenuItem class="hidden group-data-[collapsible=icon]:block">
			{#if menuChild.accessible && menuChild.href}
				<Sidebar.MenuButton tooltipContent={menuChild.label} isActive={isPathActive(menuChild.href)}>
					{#snippet child({ props })}
						<a href={resolve(menuChild.href as "/")} {...props}>
							<ChildIcon class="size-4" />
							<span>{menuChild.label}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			{:else}
				<Sidebar.MenuButton type="button" disabled class="cursor-not-allowed">
					<ChildIcon class="size-4" />
					<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
						<span>{menuChild.label}</span>
						<span
							class="text-muted-foreground max-w-full truncate text-[10px] font-normal leading-tight"
						>
							{lockHint(menuChild)}
						</span>
					</span>
				</Sidebar.MenuButton>
			{/if}
		</Sidebar.MenuItem>
	{/each}
{/snippet}

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href={resolve("/")} {...props}>
							<img
								src={ilLogo}
								alt="Innovative Learning logo"
								class="size-8 rounded-lg object-contain"
							/>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-semibold">ONE-IL</span>
								<span class="text-xs">Innovative Learning</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		{#each navMenuGroups as group (group.code)}
			{@const orgMenuItem =
				group.code === "office" ? group.items.find((i) => i.id === OFFICE_ORG_ID) ?? null : null}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each (group.code === "office" && orgMenuItem ? officeItemsWithoutMergedOrg(group.items) : group.items) as item (item.id)}
							{#if group.code === "office" && item.id === OFFICE_HR_ID && orgMenuItem}
								{@const EmployeesIcon = menuIconFor(item.iconKey)}
								{@const OrganizationIcon = menuIconFor(orgMenuItem.iconKey)}
								<Sidebar.MenuItem class="group-data-[collapsible=icon]:hidden">
									{#if item.accessible || orgMenuItem.accessible}
										<Sidebar.MenuButton
											type="button"
											data-testid="sidebar-hr-toggle"
											aria-expanded={sidebarMenuExpand.hrHubExpanded}
											isActive={isEmployeesPath(page.url.pathname) || isOrgPath(page.url.pathname)}
											onclick={() => toggleHrHub()}
										>
											<EmployeesIcon class="size-4" />
											<span class="flex-1 truncate text-start">{menuItemLabels.employees}</span>
											<ChevronDownIcon
												class={cn(
													"ml-auto size-4 shrink-0 transition-transform duration-200",
													sidebarMenuExpand.hrHubExpanded ? "rotate-180" : "",
												)}
											/>
										</Sidebar.MenuButton>
									{:else}
										<Sidebar.MenuButton
											type="button"
											class="w-full cursor-not-allowed"
											disabled
											isActive={isEmployeesPath(page.url.pathname) || isOrgPath(page.url.pathname)}
										>
											<EmployeesIcon class="size-4" />
											<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
												<span class="truncate">{menuItemLabels.employees}</span>
												<span
													class="text-muted-foreground max-w-full truncate text-[10px] font-normal leading-tight"
												>
													{lockHint(item)}
												</span>
											</span>
										</Sidebar.MenuButton>
									{/if}
									<Sidebar.MenuSub
										data-testid="sidebar-hr-submenu"
										class={cn(!sidebarMenuExpand.hrHubExpanded && "hidden")}
									>
											<Sidebar.MenuSubItem>
												{#if item.accessible && item.href}
													<Sidebar.MenuSubButton
														href={resolve(item.href as "/")}
														isActive={isEmployeesPath(page.url.pathname)}
														size="sm"
													>
														{ui.employeeFallback}
													</Sidebar.MenuSubButton>
												{:else}
													<Sidebar.MenuSubButton size="sm">
														{#snippet child({ props })}
															<button type="button" disabled {...props}>
																<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
																	<span class="truncate">{ui.employeeFallback}</span>
																	<span
																		class="text-muted-foreground max-w-24 truncate text-[10px] font-normal leading-tight"
																	>
																		{lockHint(item)}
																	</span>
																</span>
															</button>
														{/snippet}
													</Sidebar.MenuSubButton>
												{/if}
											</Sidebar.MenuSubItem>
											<Sidebar.MenuSubItem>
												{#if orgMenuItem.accessible && orgMenuItem.href}
													<Sidebar.MenuSubButton
														href={resolve(orgMenuItem.href as "/")}
														isActive={isOrgPath(page.url.pathname)}
														size="sm"
													>
														{menuItemLabels.organization}
													</Sidebar.MenuSubButton>
												{:else}
													<Sidebar.MenuSubButton size="sm">
														{#snippet child({ props })}
															<button type="button" disabled {...props}>
																<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
																	<span class="truncate">{menuItemLabels.organization}</span>
																	<span
																		class="text-muted-foreground max-w-24 truncate text-[10px] font-normal leading-tight"
																	>
																		{lockHint(orgMenuItem)}
																	</span>
																</span>
															</button>
														{/snippet}
													</Sidebar.MenuSubButton>
												{/if}
											</Sidebar.MenuSubItem>
									</Sidebar.MenuSub>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem class="hidden group-data-[collapsible=icon]:block">
									{#if item.accessible && item.href}
										<Sidebar.MenuButton
											tooltipContent={menuItemLabels.employees}
											isActive={isEmployeesPath(page.url.pathname)}
										>
											{#snippet child({ props })}
												<a href={resolve(item.href as "/")} {...props}>
													<EmployeesIcon class="size-4" />
													<span>{menuItemLabels.employees}</span>
												</a>
											{/snippet}
										</Sidebar.MenuButton>
									{:else}
										<Sidebar.MenuButton type="button" disabled class="cursor-not-allowed">
											<EmployeesIcon class="size-4" />
											<span>{menuItemLabels.employees}</span>
										</Sidebar.MenuButton>
									{/if}
								</Sidebar.MenuItem>
								<Sidebar.MenuItem class="hidden group-data-[collapsible=icon]:block">
									{#if orgMenuItem.accessible && orgMenuItem.href}
										<Sidebar.MenuButton
											tooltipContent={menuItemLabels.organization}
											isActive={isOrgPath(page.url.pathname)}
										>
											{#snippet child({ props })}
												<a href={resolve(orgMenuItem.href as "/")} {...props}>
													<OrganizationIcon class="size-4" />
													<span>{menuItemLabels.organization}</span>
												</a>
											{/snippet}
										</Sidebar.MenuButton>
									{:else}
										<Sidebar.MenuButton type="button" disabled class="cursor-not-allowed">
											<OrganizationIcon class="size-4" />
											<span class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
												<span>{menuItemLabels.organization}</span>
												<span
													class="text-muted-foreground max-w-full truncate text-[10px] font-normal leading-tight"
												>
													{lockHint(orgMenuItem)}
												</span>
											</span>
										</Sidebar.MenuButton>
									{/if}
								</Sidebar.MenuItem>
							{:else if item.children.length > 0}
								{@render menuBranch(item)}
							{:else}
								{@render menuLeaf(item)}
							{/if}
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="size-8 rounded-lg">
									{#if user.avatarUrl}
										<Avatar.Image src={user.avatarUrl} alt="" class="rounded-lg object-cover" />
									{/if}
									<Avatar.Fallback class="rounded-lg">{getInitials(user.name)}</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-semibold">{user.name}</span>
									<span class="text-muted-foreground truncate text-xs">{user.email}</span>
								</div>
								<ChevronDownIcon class="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="end" side="top">
						<DropdownMenu.Label class="flex items-center gap-2">
							{ui.myAccount}
							<Badge variant="outline" class="text-xs capitalize">{user.role}</Badge>
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
								<a href={resolve("/notifications")} {...props}>
									<BellRingIcon class="mr-2 size-4" />
									{ui.notifications}
									{#if notificationCount > 0}
										<Badge variant="secondary" class="ml-auto h-5 px-1.5 text-[10px]">{notificationCount}</Badge>
									{/if}
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
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={resolve("/lock")} {...props}>
									<LockIcon class="mr-2 size-4" />
									{ui.lockScreen}
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={resolve("/settings")} {...props}>
									<KeyboardIcon class="mr-2 size-4" />
									{ui.keyboardShortcuts}
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={resolve("/")} {...props}>
									<HelpCircleIcon class="mr-2 size-4" />
									{ui.helpSupport}
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							variant="destructive"
							onclick={() =>
								(document.getElementById("logout-form") as HTMLFormElement | null)?.requestSubmit()}
						>
							<LogOutIcon class="mr-2 size-4" />
							{ui.logOut}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
					<form id="logout-form" method="POST" action={resolve("/logout")} class="hidden"></form>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
