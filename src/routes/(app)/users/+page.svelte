<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import UserFormDialog from "$lib/components/user-form-dialog.svelte";
	import DeleteConfirmDialog from "$lib/components/delete-confirm-dialog.svelte";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import TrashIcon from "@lucide/svelte/icons/trash-2";
	import SearchIcon from "@lucide/svelte/icons/search";
	import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { exportToCSV, exportToJSON } from "$lib/utils/export.js";
	import type { Role } from "$lib/auth/roles.js";

	let { data, form } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					userUpdated: "อัปเดตผู้ใช้สำเร็จ",
					pageTitle: "ผู้ใช้ - ONE-IL",
					title: "ผู้ใช้",
					description: "จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง",
					addUser: "เพิ่มผู้ใช้",
					searchUsers: "ค้นหาผู้ใช้...",
					user: "ผู้ใช้",
					delete: "ลบ",
					export: "ส่งออก",
					exportCsv: "ส่งออกเป็น CSV",
					exportJson: "ส่งออกเป็น JSON",
					columns: {
						name: "ชื่อ",
						username: "ชื่อผู้ใช้",
						email: "อีเมล",
						role: "บทบาท",
						joined: "วันที่เข้าร่วม",
						actions: "การกระทำ",
					},
					noSearch: "ไม่พบผู้ใช้ที่ตรงกับคำค้น",
					noUsers: "ไม่พบผู้ใช้",
				}
			: {
					userUpdated: "User updated successfully",
					pageTitle: "Users - ONE-IL",
					title: "Users",
					description: "Manage user accounts and permissions.",
					addUser: "Add User",
					searchUsers: "Search users...",
					user: "user",
					delete: "Delete",
					export: "Export",
					exportCsv: "Export as CSV",
					exportJson: "Export as JSON",
					columns: {
						name: "Name",
						username: "Username",
						email: "Email",
						role: "Role",
						joined: "Joined",
						actions: "Actions",
					},
					noSearch: "No users match your search.",
					noUsers: "No users found.",
				}
	);

	let search = $state("");
	let createOpen = $state(false);
	let editOpen = $state(false);
	let deleteOpen = $state(false);
	let sortKey = $state<string>("name");
	let sortDir = $state<"asc" | "desc">("asc");
	let pageSize = $state(10);
	let currentPage = $state(1);
	let selectedIds = $state(new Set<string>());

	let editUser = $state<{ id: string; name: string; email: string; username: string; role: Role } | null>(null);
	let deleteId = $state("");

	const filtered = $derived(
		data.users.filter(
			(u) =>
				u.name.toLowerCase().includes(search.toLowerCase()) ||
				u.email.toLowerCase().includes(search.toLowerCase()) ||
				u.username.toLowerCase().includes(search.toLowerCase())
		)
	);

	const sorted = $derived(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			const aVal = String((a as Record<string, unknown>)[sortKey] ?? "");
			const bVal = String((b as Record<string, unknown>)[sortKey] ?? "");
			const cmp = aVal.localeCompare(bVal);
			return sortDir === "asc" ? cmp : -cmp;
		});
		return arr;
	});

	const paginated = $derived(sorted().slice((currentPage - 1) * pageSize, currentPage * pageSize));

	$effect(() => {
		// Reset page when search changes
		search;
		currentPage = 1;
	});

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) {
			toast.success(copy.userUpdated);
			selectedIds = new Set();
		}
	});

	function toggleSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === "asc" ? "desc" : "asc";
		} else {
			sortKey = key;
			sortDir = "asc";
		}
	}

	function sortIcon(key: string) {
		if (sortKey !== key) return ArrowUpDownIcon;
		return sortDir === "asc" ? ArrowUpIcon : ArrowDownIcon;
	}

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleSelectAll() {
		if (selectedIds.size === paginated.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(paginated.map((u) => u.id));
		}
	}

	function roleBadgeVariant(role: Role) {
		switch (role) {
			case "admin": return "default" as const;
			case "editor": return "secondary" as const;
			case "user": return "outline" as const;
			default: return "outline" as const;
		}
	}

	function formatDate(date: Date | string | null) {
		if (!date) return "—";
		return new Intl.DateTimeFormat(data.locale === "th" ? "th-TH" : "en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	}

	function openEdit(user: typeof data.users[0]) {
		editUser = { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role };
		editOpen = true;
	}

	function openDelete(id: string) {
		deleteId = id;
		deleteOpen = true;
	}

	function handleExport(format: "csv" | "json") {
		const exportData = filtered.map((u) => ({
			name: u.name,
			username: u.username,
			email: u.email,
			role: u.role,
			joined: formatDate(u.createdAt),
		}));
		if (format === "csv") exportToCSV(exportData, "users");
		else exportToJSON(exportData, "users");
	}

	const columns = $derived.by(() => [
		{ key: "name", label: copy.columns.name },
		{ key: "username", label: copy.columns.username },
		{ key: "email", label: copy.columns.email },
		{ key: "role", label: copy.columns.role },
		{ key: "createdAt", label: copy.columns.joined },
	]);
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground">{copy.description}</p>
		</div>
		<Button onclick={() => (createOpen = true)}>
			<PlusIcon class="mr-2 size-4" />
			{copy.addUser}
		</Button>
	</div>

	<!-- Toolbar -->
	<div class="flex items-center gap-2">
		<div class="relative max-w-sm flex-1">
			<SearchIcon class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
			<Input placeholder={copy.searchUsers} class="pl-9" bind:value={search} />
		</div>
		<p class="text-muted-foreground text-sm">
			{filtered.length} {copy.user}{filtered.length !== 1 && data.locale !== "th" ? "s" : ""}
		</p>
		<div class="ml-auto flex items-center gap-2">
			{#if selectedIds.size > 0}
				<form method="POST" action="?/bulkDelete" use:enhance>
					<input type="hidden" name="ids" value={[...selectedIds].join(",")} />
					<Button variant="destructive" size="sm" type="submit">
						<TrashIcon class="mr-2 size-4" />
						{copy.delete} {selectedIds.size}
					</Button>
				</form>
			{/if}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" {...props}>
							<DownloadIcon class="mr-2 size-4" />
							{copy.export}
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item onclick={() => handleExport("csv")}>{copy.exportCsv}</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => handleExport("json")}>{copy.exportJson}</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<!-- Table -->
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[40px]">
						<input
							type="checkbox"
							checked={paginated.length > 0 && selectedIds.size === paginated.length}
							onchange={toggleSelectAll}
							class="accent-primary size-4"
						/>
					</Table.Head>
					{#each columns as col (col.key)}
						{@const SortIcon = sortIcon(col.key)}
						<Table.Head>
							<button class="flex items-center gap-1 text-left font-medium" onclick={() => toggleSort(col.key)}>
								{col.label}
								<SortIcon class="text-muted-foreground size-3" />
							</button>
						</Table.Head>
					{/each}
					<Table.Head class="w-[100px]">{copy.columns.actions}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each paginated as user (user.id)}
					<Table.Row class={selectedIds.has(user.id) ? "bg-muted/50" : ""}>
						<Table.Cell>
							<input
								type="checkbox"
								checked={selectedIds.has(user.id)}
								onchange={() => toggleSelect(user.id)}
								class="accent-primary size-4"
							/>
						</Table.Cell>
						<Table.Cell class="font-medium">{user.name}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{user.username}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{user.email}</Table.Cell>
						<Table.Cell>
							<Badge variant={roleBadgeVariant(user.role)} class="capitalize">{user.role}</Badge>
						</Table.Cell>
						<Table.Cell class="text-muted-foreground">{formatDate(user.createdAt)}</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-1">
								<Button variant="ghost" size="icon" class="size-8" onclick={() => openEdit(user)}>
									<PencilIcon class="size-4" />
								</Button>
								{#if user.id !== data.currentUserId}
									<Button variant="ghost" size="icon" class="size-8 text-destructive" onclick={() => openDelete(user.id)}>
										<TrashIcon class="size-4" />
									</Button>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center">
							{search ? copy.noSearch : copy.noUsers}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		<DataTablePagination
			totalItems={filtered.length}
			locale={data.locale}
			bind:pageSize
			bind:currentPage
		/>
	</div>
</div>

<UserFormDialog bind:open={createOpen} mode="create" locale={data.locale} />
<UserFormDialog bind:open={editOpen} mode="edit" user={editUser} locale={data.locale} />
<DeleteConfirmDialog bind:open={deleteOpen} action="?/delete" id={deleteId} itemName={copy.user} locale={data.locale} />
