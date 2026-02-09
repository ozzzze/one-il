<script lang="ts">
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import UsersIcon from "@lucide/svelte/icons/users";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import BarChart3Icon from "@lucide/svelte/icons/bar-chart-3";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import BellIcon from "@lucide/svelte/icons/bell";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import ZapIcon from "@lucide/svelte/icons/zap";

	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";

	type NavItem = {
		title: string;
		url: string;
		icon: typeof LayoutDashboardIcon;
		badge?: string;
	};

	type NavGroup = {
		label: string;
		items: NavItem[];
	};

	const navigation: NavGroup[] = [
		{
			label: "Overview",
			items: [
				{ title: "Dashboard", url: "/", icon: LayoutDashboardIcon },
				{ title: "Analytics", url: "/analytics", icon: BarChart3Icon },
			],
		},
		{
			label: "Management",
			items: [
				{ title: "Users", url: "/users", icon: UsersIcon, badge: "12" },
				{ title: "Content", url: "/content", icon: FileTextIcon },
				{ title: "Roles", url: "/roles", icon: ShieldIcon },
			],
		},
		{
			label: "System",
			items: [
				{ title: "Notifications", url: "/notifications", icon: BellIcon, badge: "3" },
				{ title: "Database", url: "/database", icon: DatabaseIcon },
				{ title: "Settings", url: "/settings", icon: SettingsIcon },
			],
		},
	];
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div
								class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								<ZapIcon class="size-4" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-semibold">SvelteForge</span>
								<span class="text-xs">Admin Dashboard</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		{#each navigation as group (group.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props })}
										<a href={item.url} {...props}>
											<item.icon class="size-4" />
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
								{#if item.badge}
									<Sidebar.MenuBadge>{item.badge}</Sidebar.MenuBadge>
								{/if}
							</Sidebar.MenuItem>
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
									<Avatar.Fallback class="rounded-lg">AD</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-semibold">Admin User</span>
									<span class="text-muted-foreground truncate text-xs">admin@svelteforge.dev</span>
								</div>
								<ChevronDownIcon class="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="end" side="top">
						<DropdownMenu.Label>My Account</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/settings" {...props}>
									<SettingsIcon class="mr-2 size-4" />
									Settings
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<form method="POST" action="/logout" class="w-full">
									<button type="submit" {...props} class="flex w-full items-center">
										<LogOutIcon class="mr-2 size-4" />
										Log out
									</button>
								</form>
							{/snippet}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
