<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import XIcon from "@lucide/svelte/icons/x";
	import SearchIcon from "@lucide/svelte/icons/search";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import type { SubmitFunction } from "@sveltejs/kit";
	import { leaveRoleLabel, assignableLeaveRoles } from "$lib/auth/leave-role-labels.js";
	import type { LeaveRoleCode } from "$lib/server/one-leave/types.js";

	let { data, form } = $props();

	const t = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "กำหนดบทบาทผู้ใช้ - ONE-IL",
					title: "กำหนดบทบาทผู้ใช้",
					description: "มอบและถอนบทบาท one-leave; บทบาท admin มอบได้เฉพาะผู้ดูแลระบบ",
					search: "ค้นหาผู้ใช้...",
					user: "ผู้ใช้",
					currentRoles: "บทบาทปัจจุบัน",
					addRole: "เพิ่มบทบาท",
					add: "เพิ่ม",
					none: "ไม่มีบทบาท",
					noUsers: "ไม่พบผู้ใช้",
					self: "(บัญชีคุณ)",
					updated: "อัปเดตบทบาทสำเร็จ",
					selectRole: "เลือกบทบาท",
					showingRows: "แสดง {start}-{end} จาก {total} ผู้ใช้",
					prev: "ก่อนหน้า",
					next: "ถัดไป",
				}
			: {
					pageTitle: "User role assignment - ONE-IL",
					title: "User role assignment",
					description: "Assign and revoke one-leave roles; admin role is gated to system admins.",
					search: "Search users...",
					user: "User",
					currentRoles: "Current roles",
					addRole: "Add role",
					add: "Add",
					none: "No roles",
					noUsers: "No users found",
					self: "(your account)",
					updated: "Roles updated",
					selectRole: "Select role",
					showingRows: "Showing {start}-{end} of {total} users",
					prev: "Previous",
					next: "Next",
				}
	);

	let search = $state("");
	let currentPage = $state(1);
	const itemsPerPage = 10;

	$effect(() => {
		search;
		currentPage = 1;
	});

	const addPick = $state<Record<number, string>>({});

	const assignable = $derived(assignableLeaveRoles(data.canGrantAdmin));

	const filtered = $derived(
		data.users.filter((u) => {
			const q = search.toLowerCase();
			return (
				u.username.toLowerCase().includes(q) || (u.fullName ?? "").toLowerCase().includes(q)
			);
		})
	);

	const paginated = $derived(
		filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) toast.success(t.updated);
	});

	function availableToAdd(roles: LeaveRoleCode[]): LeaveRoleCode[] {
		return assignable.filter((r) => !roles.includes(r));
	}

	function pickValue(userId: number, roles: LeaveRoleCode[]): string {
		const current = addPick[userId];
		const avail = availableToAdd(roles);
		if (current && avail.includes(current as LeaveRoleCode)) return current;
		return avail[0] ?? "";
	}

	const refreshEnhance: SubmitFunction = () => async ({ update }) => {
		await update({ reset: false, invalidateAll: true });
	};
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">{t.title}</h1>
		<p class="text-muted-foreground">{t.description}</p>
	</div>

	<div class="relative max-w-sm">
		<SearchIcon class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
		<Input placeholder={t.search} class="pl-9" bind:value={search} />
	</div>

	<div class="rounded-lg border bg-card shadow-sm overflow-hidden">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-65">{t.user}</Table.Head>
					<Table.Head>{t.currentRoles}</Table.Head>
					<Table.Head class="w-80">{t.addRole}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each paginated as u (u.id)}
					{@const isSelf = data.currentLeaveUserId === u.id}
					{@const avail = availableToAdd(u.roles)}
					<Table.Row>
						<Table.Cell>
							<div class="font-medium">{u.username}</div>
							<div class="text-muted-foreground text-sm">
								{u.fullName ?? "—"}
								{#if isSelf}<span class="ml-1">{t.self}</span>{/if}
							</div>
						</Table.Cell>
						<Table.Cell>
							<div class="flex flex-wrap items-center gap-1">
								{#each u.roles as role (role)}
									<span class="inline-flex items-center">
										<Badge variant={role === "admin" ? "default" : "secondary"} class="gap-1">
											{leaveRoleLabel(role, data.locale)}
											<form method="POST" action="?/revoke" use:enhance={refreshEnhance} class="inline">
												<input type="hidden" name="userId" value={u.id} />
												<input type="hidden" name="roleCode" value={role} />
												<button
													type="submit"
													class="hover:text-destructive ml-1 cursor-pointer"
													aria-label="revoke {role}"
												>
													<XIcon class="size-3" />
												</button>
											</form>
										</Badge>
									</span>
								{:else}
									<span class="text-muted-foreground text-sm">{t.none}</span>
								{/each}
							</div>
						</Table.Cell>
						<Table.Cell>
							{#if avail.length > 0}
								<form
									method="POST"
									action="?/assign"
									use:enhance={refreshEnhance}
									class="flex items-center gap-2"
								>
									<input type="hidden" name="userId" value={u.id} />
									<Select.Root
										type="single"
										name="roleCode"
										value={pickValue(u.id, u.roles)}
										onValueChange={(v) => (addPick[u.id] = v)}
									>
										<Select.Trigger class="w-50">
											<span>{leaveRoleLabel(pickValue(u.id, u.roles) as LeaveRoleCode, data.locale)}</span>
										</Select.Trigger>
										<Select.Content>
											{#each avail as role (role)}
												<Select.Item value={role}>{leaveRoleLabel(role, data.locale)}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
									<Button type="submit" size="sm" variant="outline">
										<PlusIcon class="mr-1 size-4" />
										{t.add}
									</Button>
								</form>
							{:else}
								<span class="text-muted-foreground text-sm">—</span>
							{/if}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">{t.noUsers}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		<DataTablePagination
			totalItems={filtered.length}
			locale={data.locale}
			pageSize={itemsPerPage}
			bind:currentPage
		/>
	</div>
</div>
