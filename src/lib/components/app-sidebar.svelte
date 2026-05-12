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
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import type { Role } from "$lib/auth/roles.js";
	import { getUiLabels } from "$lib/content/labels.js";
	import type { Locale } from "$lib/i18n/locales.js";
	import { getVisibleMenuGroups } from "$lib/navigation/menu.js";
	import { menuIcons } from "$lib/navigation/icons.js";

	type Props = {
		user: {
			name: string;
			email: string;
			username: string;
			role: Role;
			avatarUrl: string | null;
		};
		allowedMenuIds: string[];
		locale: Locale;
		notificationCount?: number;
	};

	let { user, allowedMenuIds, locale, notificationCount = 0 }: Props = $props();

	function getInitials(name: string) {
		return name
			.split(" ")
			.filter(Boolean)
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	const visibleMenuGroups = $derived(getVisibleMenuGroups(allowedMenuIds, locale));
	const ui = $derived(getUiLabels(locale));

	function menuBadge(id: string) {
		return id === "notifications" && notificationCount > 0 ? String(notificationCount) : undefined;
	}

</script>

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
		{#each visibleMenuGroups as group, groupIndex (group.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item, itemIndex (item.id)}
							{@const Icon = menuIcons[item.iconKey]}
							{@const badge = menuBadge(item.id)}
							<Sidebar.MenuItem>
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
										<Badge variant="secondary" class="ml-auto text-[10px] h-5 px-1.5">{notificationCount}</Badge>
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
