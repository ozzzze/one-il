<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import KeyIcon from "@lucide/svelte/icons/key-round";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { leaveRoleLabel, assignableLeaveRoles } from "$lib/auth/leave-role-labels.js";
	import type { LeaveRoleCode } from "$lib/server/one-leave/types.js";

	let { data, form } = $props();

	const t = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "จัดการผู้ใช้ - ONE-IL",
					title: "จัดการผู้ใช้",
					description: "สร้างและแก้ไขผู้ใช้ one-leave รีเซ็ตรหัสผ่าน และเปิด/ปิดบัญชี",
					add: "เพิ่มผู้ใช้",
					search: "ค้นหาผู้ใช้...",
					username: "ชื่อผู้ใช้",
					name: "ชื่อ-สกุล",
					employeeCode: "รหัสพนักงาน",
					roles: "บทบาท",
					status: "สถานะ",
					actions: "การกระทำ",
					active: "ใช้งาน",
					inactive: "ปิดใช้งาน",
					noUsers: "ไม่พบผู้ใช้",
					create: "สร้าง",
					save: "บันทึก",
					saving: "กำลังบันทึก...",
					password: "รหัสผ่าน",
					passwordHint: "อย่างน้อย 8 ตัวอักษร",
					linkEmployee: "ผูกกับพนักงาน",
					none: "— ไม่ผูก —",
					mustChange: "บังคับเปลี่ยนรหัสผ่านครั้งแรก",
					createTitle: "เพิ่มผู้ใช้ใหม่",
					createDesc: "สร้างบัญชีผู้ใช้ใน one_leave.users",
					editTitle: "แก้ไขผู้ใช้",
					editDesc: "อัปเดตชื่อผู้ใช้และการผูกพนักงาน",
					resetTitle: "รีเซ็ตรหัสผ่าน",
					resetDesc: "ตั้งรหัสผ่านใหม่และบังคับเปลี่ยนเมื่อเข้าสู่ระบบ",
					newPassword: "รหัสผ่านใหม่",
					updated: "บันทึกสำเร็จ",
					showingRows: "แสดง {start}-{end} จาก {total} ผู้ใช้",
					prev: "ก่อนหน้า",
					next: "ถัดไป",
				}
			: {
					pageTitle: "User administration - ONE-IL",
					title: "User administration",
					description: "Create and edit one-leave users, reset passwords, toggle active.",
					add: "Add user",
					search: "Search users...",
					username: "Username",
					name: "Name",
					employeeCode: "Employee code",
					roles: "Roles",
					status: "Status",
					actions: "Actions",
					active: "Active",
					inactive: "Inactive",
					noUsers: "No users found",
					create: "Create",
					save: "Save",
					saving: "Saving...",
					password: "Password",
					passwordHint: "At least 8 characters",
					linkEmployee: "Link to employee",
					none: "— Not linked —",
					mustChange: "Require password change on first login",
					createTitle: "Add new user",
					createDesc: "Create an account in one_leave.users",
					editTitle: "Edit user",
					editDesc: "Update username and employee link",
					resetTitle: "Reset password",
					resetDesc: "Set a new password and require change on next login",
					newPassword: "New password",
					updated: "Saved successfully",
					showingRows: "Showing {start}-{end} of {total} users",
					prev: "Previous",
					next: "Next",
				}
	);

	let search = $state("");
	let createOpen = $state(false);
	let editOpen = $state(false);
	let resetOpen = $state(false);
	let savePending = $state(false);

	let currentPage = $state(1);
	const itemsPerPage = 10;

	$effect(() => {
		search;
		currentPage = 1;
	});

	let editId = $state(0);
	let editUsername = $state("");
	let editEmployeeId = $state("0");
	let resetId = $state(0);

	let createEmployeeId = $state("0");
	let createRoles = $state<LeaveRoleCode[]>([]);

	const roleOptions = $derived(assignableLeaveRoles(data.canGrantAdmin));
	const employeeOptions = $derived([{ id: 0, label: t.none }, ...data.employees]);

	const filtered = $derived(
		data.users.filter((u) => {
			const q = search.toLowerCase();
			return (
				u.username.toLowerCase().includes(q) ||
				(u.fullName ?? "").toLowerCase().includes(q) ||
				(u.employeeCode ?? "").toLowerCase().includes(q)
			);
		})
	);

	const sorted = $derived(
		[...filtered].sort((a, b) => {
			if (a.isActive !== b.isActive) {
				return a.isActive ? -1 : 1;
			}
			const aThai =
				/^[\u0e00-\u0e7f]/.test(a.username) || /^[\u0e00-\u0e7f]/.test(a.fullName ?? "");
			const bThai =
				/^[\u0e00-\u0e7f]/.test(b.username) || /^[\u0e00-\u0e7f]/.test(b.fullName ?? "");
			if (aThai !== bThai) {
				return aThai ? -1 : 1;
			}
			return a.username.localeCompare(b.username, data.locale);
		})
	);

	const paginated = $derived(
		sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) toast.success(t.updated);
	});

	function employeeLabel(id: string): string {
		return employeeOptions.find((e) => String(e.id) === id)?.label ?? t.none;
	}

	function openCreate() {
		createEmployeeId = "0";
		createRoles = [];
		createOpen = true;
	}

	function openEdit(u: (typeof data.users)[number]) {
		editId = u.id;
		editUsername = u.username;
		editEmployeeId = String(u.employeeId ?? 0);
		editOpen = true;
	}

	function openReset(u: (typeof data.users)[number]) {
		resetId = u.id;
		resetOpen = true;
	}

	function toggleCreateRole(role: LeaveRoleCode, on: boolean) {
		createRoles = on ? [...createRoles, role] : createRoles.filter((r) => r !== role);
	}

	const enhanceClose = (close: () => void) =>
		pendingEnhance(
			(v) => (savePending = v),
			() =>
				async ({ result, update }) => {
					if (result.type === "success") close();
					await update({ reset: false, invalidateAll: true });
				}
		);
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{t.title}</h1>
			<p class="text-muted-foreground">{t.description}</p>
		</div>
		<Button onclick={openCreate}>
			<PlusIcon class="mr-2 size-4" />
			{t.add}
		</Button>
	</div>

	<div class="relative max-w-sm">
		<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
		<Input placeholder={t.search} class="pl-9" bind:value={search} />
	</div>

	<div class="bg-card overflow-hidden rounded-lg border shadow-sm">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{t.username}</Table.Head>
					<Table.Head>{t.name}</Table.Head>
					<Table.Head>{t.roles}</Table.Head>
					<Table.Head>{t.status}</Table.Head>
					<Table.Head class="w-30">{t.actions}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each paginated as u (u.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{u.username}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{u.fullName ?? "—"}</Table.Cell>
						<Table.Cell>
							<div class="flex flex-wrap gap-1">
								{#each u.roles as role (role)}
									<Badge variant={role === "admin" ? "default" : "secondary"}>
										{leaveRoleLabel(role, data.locale)}
									</Badge>
								{:else}
									<span class="text-muted-foreground text-sm">—</span>
								{/each}
							</div>
						</Table.Cell>
						<Table.Cell>
							<form
								method="POST"
								action="?/setActive"
								use:enhance={enhanceClose(() => {})}
								class="flex items-center"
							>
								<input type="hidden" name="id" value={u.id} />
								<input type="hidden" name="isActive" value={(!u.isActive).toString()} />
								<button type="submit" class="cursor-pointer">
									<Badge variant={u.isActive ? "outline" : "destructive"}>
										{u.isActive ? t.active : t.inactive}
									</Badge>
								</button>
							</form>
						</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-1">
								<Button variant="ghost" size="icon" class="size-8" onclick={() => openEdit(u)}>
									<PencilIcon class="size-4" />
								</Button>
								<Button variant="ghost" size="icon" class="size-8" onclick={() => openReset(u)}>
									<KeyIcon class="size-4" />
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="h-24 text-center">{t.noUsers}</Table.Cell>
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

<!-- Create -->
<Dialog.Root bind:open={createOpen}>
	<Dialog.Content class="sm:max-w-120">
		<Dialog.Header>
			<Dialog.Title>{t.createTitle}</Dialog.Title>
			<Dialog.Description>{t.createDesc}</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance={enhanceClose(() => (createOpen = false))}>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="c-username">{t.username}</Label>
					<Input id="c-username" name="username" required />
				</div>
				<div class="grid gap-2">
					<Label for="c-password">{t.password}</Label>
					<Input
						id="c-password"
						name="password"
						type="password"
						placeholder={t.passwordHint}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label>{t.linkEmployee}</Label>
					<Select.Root name="employeeId" type="single" bind:value={createEmployeeId}>
						<Select.Trigger><span>{employeeLabel(createEmployeeId)}</span></Select.Trigger>
						<Select.Content>
							{#each employeeOptions as e (e.id)}
								<Select.Item value={String(e.id)}>{e.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label>{t.roles}</Label>
					<div class="flex flex-col gap-2">
						{#each roleOptions as role (role)}
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									name="roles"
									value={role}
									checked={createRoles.includes(role)}
									onchange={(e) => toggleCreateRole(role, e.currentTarget.checked)}
									class="accent-primary size-4"
								/>
								{leaveRoleLabel(role, data.locale)}
							</label>
						{/each}
					</div>
				</div>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="mustChangePassword" checked class="accent-primary size-4" />
					{t.mustChange}
				</label>
				<input type="hidden" name="isActive" value="true" />
			</div>
			<Dialog.Footer>
				<SaveSubmitButton pending={savePending} idleLabel={t.create} savingLabel={t.saving} />
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit -->
<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="sm:max-w-120">
		<Dialog.Header>
			<Dialog.Title>{t.editTitle}</Dialog.Title>
			<Dialog.Description>{t.editDesc}</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/update" use:enhance={enhanceClose(() => (editOpen = false))}>
			<input type="hidden" name="id" value={editId} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="e-username">{t.username}</Label>
					<Input id="e-username" name="username" bind:value={editUsername} required />
				</div>
				<div class="grid gap-2">
					<Label>{t.linkEmployee}</Label>
					<Select.Root name="employeeId" type="single" bind:value={editEmployeeId}>
						<Select.Trigger><span>{employeeLabel(editEmployeeId)}</span></Select.Trigger>
						<Select.Content>
							{#each employeeOptions as e (e.id)}
								<Select.Item value={String(e.id)}>{e.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<Dialog.Footer>
				<SaveSubmitButton pending={savePending} idleLabel={t.save} savingLabel={t.saving} />
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Reset password -->
<Dialog.Root bind:open={resetOpen}>
	<Dialog.Content class="sm:max-w-105">
		<Dialog.Header>
			<Dialog.Title>{t.resetTitle}</Dialog.Title>
			<Dialog.Description>{t.resetDesc}</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/resetPassword"
			use:enhance={enhanceClose(() => (resetOpen = false))}
		>
			<input type="hidden" name="id" value={resetId} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="r-password">{t.newPassword}</Label>
					<Input
						id="r-password"
						name="password"
						type="password"
						placeholder={t.passwordHint}
						required
					/>
				</div>
			</div>
			<Dialog.Footer>
				<SaveSubmitButton pending={savePending} idleLabel={t.save} savingLabel={t.saving} />
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
