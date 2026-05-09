<script lang="ts">
	import { enhance } from "$app/forms";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { toast } from "svelte-sonner";
	import { getRoleOptions } from "$lib/auth/roles.js";
	import type { ActionData, PageData } from "./$types.js";

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const uiLabels = $derived(getUiLabels(data.locale));
	const roleOptions = $derived(getRoleOptions(data.locale));
	let savePendingCreateEmployee = $state(false);
	let savePendingAssignPrimary = $state(false);
	let savePendingSetSupervisor = $state(false);
	let savePendingAssignProgramChair = $state(false);
	let savePendingUpdateEmployeeAccount = $state(false);
	let savePendingLinkEmployeeUser = $state(false);

	type Employee = PageData["employees"][number];
	type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

	let search = $state("");
	let statusFilter = $state<StatusFilter>("ALL");
const copy = $derived.by(() =>
	data.locale === "th"
		? {
				pageTitle: "บุคลากร - ONE-IL",
				title: "บุคลากร",
				description: "จัดการโปรไฟล์บุคลากร ตำแหน่งหลัก ลำดับหัวหน้างาน และหัวหน้าหลักสูตร",
				loadError: "ข้อมูลอ้างอิงบางส่วนโหลดไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่",
				searchPlaceholder: "ค้นหารหัสพนักงาน ชื่อ หรืออีเมล",
				allStatuses: "ทุกสถานะ",
				employee: "บุคลากร",
				noMatch: "ไม่พบข้อมูลบุคลากรตามเงื่อนไขที่เลือก",
				createEmployee: "สร้างข้อมูลบุคลากร",
				createEmployeeDesc: "เพิ่มโปรไฟล์บุคลากรใหม่",
				firstName: "ชื่อ",
				lastName: "นามสกุล",
				email: "อีเมล",
				employeeNo: "รหัสพนักงาน",
				assignPrimary: "กำหนดตำแหน่งหลัก",
				assignPrimaryDesc: "กำหนดบทบาทหลักและหน่วยงานหลักของบุคลากร",
				selectEmployee: "เลือกบุคลากร",
				selectPosition: "เลือกตำแหน่ง",
				selectOrgUnit: "เลือกหน่วยงาน",
				assignPrimaryBtn: "กำหนดตำแหน่งหลัก",
				setSupervisor: "กำหนดหัวหน้างาน",
				setSupervisorDesc: "กำหนดหัวหน้างานสายบังคับบัญชา",
				selectSupervisor: "เลือกหัวหน้างาน",
				setSupervisorBtn: "บันทึกหัวหน้างาน",
				assignProgramChair: "กำหนดหัวหน้าหลักสูตร",
				assignProgramChairDesc: "กำหนดหัวหน้าหลักสูตรตามวันที่เริ่มต้น",
				selectProgram: "เลือกหลักสูตร",
				assignProgramChairBtn: "กำหนดหัวหน้าหลักสูตร",
				appRoleLabel: "บทบาทในแอป",
				appRoleHint: "ใช้เมื่อผูกบัญชีแล้ว — ระบบจะซิงก์ไปที่ผู้ใช้",
				linkedAccount: "บัญชีที่ผูก",
				notLinked: "ยังไม่ผูก",
				updateEmployeeAccount: "โปรไฟล์บัญชี (HR)",
				updateEmployeeAccountDesc:
					"อีเมลว่าง = ไม่เปลี่ยน • บทบาท \"ไม่เปลี่ยน\" = คงค่าเดิม • ว่าง = ลบบทบาทที่ตั้งล่วงหน้า",
				linkEmployeeUser: "ผูกบัญชีด้วยตนเอง",
				linkEmployeeUserDesc: "เลือกพนักงานที่ยังไม่มีบัญชี และผู้ใช้ที่ยังไม่ถูกผูก",
				selectUser: "เลือกผู้ใช้",
				saveAccountBtn: "บันทึกโปรไฟล์บัญชี",
				linkAccountBtn: "ผูกบัญชี",
			}
		: {
				pageTitle: "Employees - ONE-IL",
				title: "Employees",
				description:
					"Manage employee profiles, primary positions, supervisor hierarchy, and program chairs.",
				loadError: "Some employee reference data failed to load. Please refresh and try again.",
				searchPlaceholder: "Search employee no, name, or email",
				allStatuses: "All Statuses",
				employee: "employee",
				noMatch: "No employee records match current filters.",
				createEmployee: "Create Employee",
				createEmployeeDesc: "Create a new employee profile.",
				firstName: "First name",
				lastName: "Last name",
				email: "Email",
				employeeNo: "Employee No",
				assignPrimary: "Assign Primary Position",
				assignPrimaryDesc: "Assign employee primary role and org unit.",
				selectEmployee: "Select employee",
				selectPosition: "Select position",
				selectOrgUnit: "Select org unit",
				assignPrimaryBtn: "Assign Primary",
				setSupervisor: "Set Supervisor",
				setSupervisorDesc: "Set line supervisor for an employee.",
				selectSupervisor: "Select supervisor",
				setSupervisorBtn: "Set Supervisor",
				assignProgramChair: "Assign Program Chair",
				assignProgramChairDesc: "Assign program chair by start date.",
				selectProgram: "Select program",
				assignProgramChairBtn: "Assign Program Chair",
				appRoleLabel: "App role",
				appRoleHint: "Applied when the account links — synced to the user profile",
				linkedAccount: "Linked account",
				notLinked: "Not linked",
				updateEmployeeAccount: "Account profile (HR)",
				updateEmployeeAccountDesc:
					"Leave email blank to keep • \"No change\" for role keeps current • Empty role clears provisioning role",
				linkEmployeeUser: "Manual account link",
				linkEmployeeUserDesc: "Pick an unlinked employee and a user not linked to anyone else",
				selectUser: "Select user",
				saveAccountBtn: "Save account profile",
				linkAccountBtn: "Link account",
			}
);

	const filteredEmployees = $derived.by(() => {
		const normalizedSearch = search.trim().toLowerCase();
		return data.employees.filter((employee) => {
			const fullName = employee.fullName.toLowerCase();
			const employeeNo = (employee.employeeNo ?? "").toLowerCase();
			const email = (employee.email ?? "").toLowerCase();
			const status = employee.status.toUpperCase();
			const matchesSearch =
				normalizedSearch.length === 0 ||
				fullName.includes(normalizedSearch) ||
				employeeNo.includes(normalizedSearch) ||
				email.includes(normalizedSearch);
			const matchesStatus = statusFilter === "ALL" || status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	});

const successMessageByAction = $derived.by<Record<string, string>>(() => ({
	createEmployee: data.locale === "th" ? "สร้างข้อมูลบุคลากรสำเร็จ" : "Employee created successfully",
	assignPrimary: data.locale === "th" ? "กำหนดตำแหน่งหลักสำเร็จ" : "Primary position assigned successfully",
	setSupervisor: data.locale === "th" ? "อัปเดตหัวหน้างานสำเร็จ" : "Supervisor updated successfully",
	assignProgramChair:
		data.locale === "th" ? "กำหนดหัวหน้าหลักสูตรสำเร็จ" : "Program chair assigned successfully",
	updateEmployeeAccount:
		data.locale === "th" ? "อัปเดตโปรไฟล์บัญชีสำเร็จ" : "Account profile updated successfully",
	linkEmployeeUser:
		data.locale === "th" ? "ผูกบัญชีผู้ใช้สำเร็จ" : "Account linked successfully",
}));

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) {
			const message = form.action ? successMessageByAction[form.action] : "Employees updated successfully";
			toast.success(message ?? "Employees updated successfully");
		}
	});

	function statusBadgeVariant(status: string) {
		return status.toUpperCase() === "ACTIVE" ? "default" : "secondary";
	}

	function supervisorName(employee: Employee): string {
		const supervisor = employee.activeSupervisor?.supervisor;
		if (!supervisor) return "—";
		return `${supervisor.first_name} ${supervisor.last_name}`;
	}

	function localizedDisplayName(name: string, nameEn: string | null | undefined): string {
		if (data.locale === "th") return name;
		const en = nameEn?.trim();
		return en && en.length > 0 ? en : name;
	}

	function positionLabel(assignment: Employee["primaryAssignment"]): string {
		if (!assignment?.positions) return "—";
		const p = assignment.positions;
		return `${p.code} - ${localizedDisplayName(p.name, p.name_en)}`;
	}

	function orgUnitLabel(assignment: Employee["primaryAssignment"]): string {
		if (!assignment?.org_units) return "—";
		const u = assignment.org_units;
		return `${u.code} - ${localizedDisplayName(u.name, u.name_en)}`;
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-4">
	<div class="space-y-1">
		<h1 class="text-2xl font-semibold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground text-sm">
			{copy.description}
		</p>
	</div>

	{#if data.errors.employees || data.errors.positions || data.errors.orgUnits || data.errors.programs || data.errors.users}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs">
			{copy.loadError}
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-2">
		<div class="min-w-[240px] flex-1">
			<Input placeholder={copy.searchPlaceholder} bind:value={search} />
		</div>
		<select
			class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring inline-flex h-9 min-w-[160px] rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={statusFilter}
		>
			<option value="ALL">{copy.allStatuses}</option>
			<option value="ACTIVE">ACTIVE</option>
			<option value="INACTIVE">INACTIVE</option>
		</select>
		<p class="text-muted-foreground text-xs">
			{filteredEmployees.length} {copy.employee}{filteredEmployees.length !== 1 && data.locale !== "th" ? "s" : ""}
		</p>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row class="h-9">
					<Table.Head class="h-9 px-3 text-xs">employee_no</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">full name</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">email</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">{copy.linkedAccount}</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">{copy.appRoleLabel}</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">status</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">primary position</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">org unit</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">supervisor</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredEmployees as employee, i (employee.id)}
					<Table.Row class="h-9">
						<Table.Cell class="px-3 py-1.5 text-xs">{employee.employeeNo ?? "—"}</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs font-medium">{employee.fullName}</Table.Cell>
						<Table.Cell class="text-muted-foreground px-3 py-1.5 text-xs">{employee.email ?? "—"}</Table.Cell>
						<Table.Cell class="text-muted-foreground px-3 py-1.5 text-xs">
							{#if employee.linkedAccountEmail}
								<span class="text-foreground">{employee.linkedAccountEmail}</span>
							{:else}
								{copy.notLinked}
							{/if}
						</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">
							{#if employee.appRole}
								<Badge variant="outline">{employee.appRole}</Badge>
							{:else}
								<span class="text-muted-foreground">—</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">
							<Badge variant={statusBadgeVariant(employee.status)}>{employee.status.toUpperCase()}</Badge>
						</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">{positionLabel(employee.primaryAssignment)}</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">{orgUnitLabel(employee.primaryAssignment)}</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">{supervisorName(employee)}</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={9} class="h-16 text-center text-sm">
							{copy.noMatch}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="grid gap-3 lg:grid-cols-2">
		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">{copy.createEmployee}</Card.Title>
				<Card.Description class="text-xs">{copy.createEmployeeDesc}</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form
					method="POST"
					action="?/createEmployee"
					use:enhance={pendingEnhance((v) => (savePendingCreateEmployee = v))}
					class="grid gap-2"
				>
					<div class="grid gap-2 sm:grid-cols-2">
						<Input name="firstName" placeholder={copy.firstName} required />
						<Input name="lastName" placeholder={copy.lastName} required />
					</div>
					<div class="grid gap-2 sm:grid-cols-2">
						<Input type="email" name="email" placeholder={copy.email} />
						<Input name="employeeNo" placeholder={copy.employeeNo} />
					</div>
					<div class="grid gap-1">
						<label class="text-muted-foreground text-xs" for="create-app-role">{copy.appRoleLabel}</label>
						<select
							id="create-app-role"
							name="appRole"
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">—</option>
							{#each roleOptions as opt, i (opt.value)}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<p class="text-muted-foreground text-[11px]">{copy.appRoleHint}</p>
					</div>
					<div class="flex justify-end">
						<SaveSubmitButton
							size="sm"
							pending={savePendingCreateEmployee}
							idleLabel={copy.createEmployee}
							savingLabel={uiLabels.formSaving}
						/>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">{copy.assignPrimary}</Card.Title>
				<Card.Description class="text-xs">{copy.assignPrimaryDesc}</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form
					method="POST"
					action="?/assignPrimary"
					use:enhance={pendingEnhance((v) => (savePendingAssignPrimary = v))}
					class="grid gap-2"
				>
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="employeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">{copy.selectEmployee}</option>
							{#each data.employees as employee, i (employee.id)}
								<option value={employee.id}>{employee.fullName}</option>
							{/each}
						</select>
						<select
							name="positionId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">{copy.selectPosition}</option>
							{#each data.positions as position, i (position.id)}
								<option value={position.id}>
									{localizedDisplayName(position.name, position.name_en)}
								</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="orgUnitId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">{copy.selectOrgUnit}</option>
							{#each data.orgUnits as orgUnit, i (orgUnit.id)}
								<option value={orgUnit.id}>
									{localizedDisplayName(orgUnit.name, orgUnit.name_en)}
								</option>
							{/each}
						</select>
						<Input type="date" name="startsAt" required />
					</div>
					<input type="hidden" name="isPrimary" value="true" />
					<div class="flex justify-end">
						<SaveSubmitButton
							size="sm"
							pending={savePendingAssignPrimary}
							idleLabel={copy.assignPrimaryBtn}
							savingLabel={uiLabels.formSaving}
						/>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">{copy.setSupervisor}</Card.Title>
				<Card.Description class="text-xs">{copy.setSupervisorDesc}</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form
					method="POST"
					action="?/setSupervisor"
					use:enhance={pendingEnhance((v) => (savePendingSetSupervisor = v))}
					class="grid gap-2"
				>
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="employeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">{copy.selectEmployee}</option>
							{#each data.employees as employee, i (employee.id)}
								<option value={employee.id}>{employee.fullName}</option>
							{/each}
						</select>
						<select
							name="supervisorEmployeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">{copy.selectSupervisor}</option>
							{#each data.employees as supervisor, i (supervisor.id)}
								<option value={supervisor.id}>{supervisor.fullName}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Input type="date" name="startsAt" required />
					</div>
					<div class="flex justify-end">
						<SaveSubmitButton
							size="sm"
							pending={savePendingSetSupervisor}
							idleLabel={copy.setSupervisorBtn}
							savingLabel={uiLabels.formSaving}
						/>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">{copy.updateEmployeeAccount}</Card.Title>
				<Card.Description class="text-xs">{copy.updateEmployeeAccountDesc}</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form
					method="POST"
					action="?/updateEmployeeAccount"
					use:enhance={pendingEnhance((v) => (savePendingUpdateEmployeeAccount = v))}
					class="grid gap-2"
				>
					<select
						name="employeeId"
						required
						class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<option value="">{copy.selectEmployee}</option>
						{#each data.employees as employee, i (employee.id)}
							<option value={employee.id}>{employee.fullName}</option>
						{/each}
					</select>
					<Input type="email" name="email" placeholder={`${copy.email} (${data.locale === "th" ? "ว่าง = ไม่เปลี่ยน" : "blank = keep"})`} />
					<select
						name="appRole"
						required
						class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<option value="__keep__">{data.locale === "th" ? "ไม่เปลี่ยนบทบาท" : "No role change"}</option>
						<option value="">{data.locale === "th" ? "ลบบทบาทที่ตั้งไว้" : "Clear provisioned role"}</option>
						{#each roleOptions as opt, i (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
					<div class="flex justify-end">
						<SaveSubmitButton
							size="sm"
							pending={savePendingUpdateEmployeeAccount}
							idleLabel={copy.saveAccountBtn}
							savingLabel={uiLabels.formSaving}
						/>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">{copy.linkEmployeeUser}</Card.Title>
				<Card.Description class="text-xs">{copy.linkEmployeeUserDesc}</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form
					method="POST"
					action="?/linkEmployeeUser"
					use:enhance={pendingEnhance((v) => (savePendingLinkEmployeeUser = v))}
					class="grid gap-2"
				>
					<select
						name="employeeId"
						required
						class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<option value="">{copy.selectEmployee}</option>
						{#each data.employees.filter((e) => !e.userId) as employee, i (employee.id)}
							<option value={employee.id}>{employee.fullName}</option>
						{/each}
					</select>
					<select
						name="userId"
						required
						class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<option value="">{copy.selectUser}</option>
						{#each data.usersAvailableForLink as user, i (user.id)}
							<option value={user.id}>{user.email} ({user.name})</option>
						{/each}
					</select>
					<div class="flex justify-end">
						<SaveSubmitButton
							size="sm"
							pending={savePendingLinkEmployeeUser}
							idleLabel={copy.linkAccountBtn}
							savingLabel={uiLabels.formSaving}
						/>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">{copy.assignProgramChair}</Card.Title>
				<Card.Description class="text-xs">{copy.assignProgramChairDesc}</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form
					method="POST"
					action="?/assignProgramChair"
					use:enhance={pendingEnhance((v) => (savePendingAssignProgramChair = v))}
					class="grid gap-2"
				>
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="programId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">{copy.selectProgram}</option>
							{#each data.programs as program, i (program.id)}
								<option value={program.id}>{program.code} - {program.name}</option>
							{/each}
						</select>
						<select
							name="employeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">{copy.selectEmployee}</option>
							{#each data.employees as employee, i (employee.id)}
								<option value={employee.id}>{employee.fullName}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Input type="date" name="startsAt" required />
					</div>
					<div class="flex justify-end">
						<SaveSubmitButton
							size="sm"
							pending={savePendingAssignProgramChair}
							idleLabel={copy.assignProgramChairBtn}
							savingLabel={uiLabels.formSaving}
						/>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>

