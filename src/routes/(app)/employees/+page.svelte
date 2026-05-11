<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { toast } from "svelte-sonner";
	import { getRoleOptions } from "$lib/auth/roles.js";
	import { localizedDualField, localizedLookupLabel } from "$lib/i18n/display.js";
	import type { ActionData, PageData } from "./$types.js";

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const uiLabels = $derived(getUiLabels(data.locale));
	const roleOptions = $derived(getRoleOptions(data.locale));
	let savePendingCreateEmployee = $state(false);
	let createEmployeeDialogOpen = $state(false);
	let createEmployeeFormKey = $state(0);

	function openCreateEmployeeDialog() {
		createEmployeeFormKey += 1;
		createEmployeeDialogOpen = true;
	}

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}

	type Employee = PageData["employees"][number];

	let search = $state("");
	let orgUnitFilter = $state<string>("ALL");
	let hrStatusFilter = $state<string>("ALL");
	let contractFilter = $state<string>("ALL");
	let pageSize = $state(10);
	let currentPage = $state(1);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "บุคลากร - ONE-IL",
					title: "บุคลากร",
					description:
						"ค้นหาและกรองรายชื่อ เปิดแถวเพื่อแก้ไขโปรไฟล์ HR ตำแหน่ง หัวหน้า และบัญชี",
					loadError: "ข้อมูลอ้างอิงบางส่วนโหลดไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่",
					searchPlaceholder: "ค้นหารหัสพนักงาน ชื่อ หรืออีเมล",
					allOrgUnits: "ทุกหน่วยงาน",
					allHrStatuses: "ทุกสถานะ HR",
					allContracts: "ทุกประเภทสัญญา",
					employee: "บุคลากร",
					noMatch: "ไม่พบข้อมูลบุคลากรตามเงื่อนไขที่เลือก",
					newEmployee: "บุคลากรใหม่",
					createEmployee: "สร้างข้อมูลบุคลากร",
					createEmployeeDesc: "เพิ่มโปรไฟล์บุคลากรใหม่ — รายละเอียดอื่นแก้ในหน้าโปรไฟล์",
					firstName: "ชื่อ",
					lastName: "นามสกุล",
					email: "อีเมล",
					employeeNo: "รหัสพนักงาน",
					appRoleLabel: "บทบาทในแอป",
					appRoleHint: "ใช้เมื่อผูกบัญชีแล้ว — ระบบจะซิงก์ไปที่ผู้ใช้",
					colNo: "รหัส",
					colName: "ชื่อ",
					colEmail: "อีเมล",
					colHrStatus: "สถานะ HR",
					colContract: "สัญญาจ้าง",
					colAppStatus: "สถานะแอป",
					colPosition: "ตำแหน่งหลัก",
					linkedShort: "ผูกบัญชีแล้ว",
				}
			: {
					pageTitle: "Employees - ONE-IL",
					title: "Employees",
					description: "Search and filter the directory. Open a row to edit HR profile, org, supervisor, and account.",
					loadError: "Some employee reference data failed to load. Please refresh and try again.",
					searchPlaceholder: "Search employee no, name, or email",
					allOrgUnits: "All org units",
					allHrStatuses: "All HR statuses",
					allContracts: "All contract types",
					employee: "employee",
					noMatch: "No employee records match current filters.",
					newEmployee: "New employee",
					createEmployee: "Create employee",
					createEmployeeDesc: "Add a new profile — edit further on the employee profile page.",
					firstName: "First name",
					lastName: "Last name",
					email: "Email",
					employeeNo: "Employee No",
					appRoleLabel: "App role",
					appRoleHint: "Applied when the account links — synced to the user profile",
					colNo: "No.",
					colName: "Name",
					colEmail: "Email",
					colHrStatus: "HR status",
					colContract: "Contract",
					colAppStatus: "App status",
					colPosition: "Primary position",
					linkedShort: "Linked",
				},
	);

	const filteredEmployees = $derived.by(() => {
		const normalizedSearch = search.trim().toLowerCase();
		return data.employees.filter((employee) => {
			const fullName = employee.fullName.toLowerCase();
			const employeeNo = (employee.employeeNo ?? "").toLowerCase();
			const email = (employee.email ?? "").toLowerCase();
			const matchesSearch =
				normalizedSearch.length === 0 ||
				fullName.includes(normalizedSearch) ||
				employeeNo.includes(normalizedSearch) ||
				email.includes(normalizedSearch);
			const primaryOrgId = employee.primaryAssignment?.org_units?.id ?? "";
			const matchesOrgUnit =
				orgUnitFilter === "ALL" || (primaryOrgId.length > 0 && primaryOrgId === orgUnitFilter);
			const hrId = employee.hrProfile.hrEmploymentStatus?.id ?? "";
			const matchesHr = hrStatusFilter === "ALL" || hrId === hrStatusFilter;
			const contractId = employee.hrProfile.employmentContractType?.id ?? "";
			const matchesContract = contractFilter === "ALL" || contractId === contractFilter;
			return matchesSearch && matchesOrgUnit && matchesHr && matchesContract;
		});
	});

	const paginatedEmployees = $derived(
		filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize),
	);

	$effect(() => {
		search;
		orgUnitFilter;
		hrStatusFilter;
		contractFilter;
		currentPage = 1;
	});

	$effect(() => {
		const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
		if (currentPage > totalPages) currentPage = totalPages;
	});

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) {
			toast.success(data.locale === "th" ? "อัปเดตข้อมูลสำเร็จ" : "Updated successfully");
		}
	});

	function statusBadgeVariant(status: string) {
		return status.toUpperCase() === "ACTIVE" ? "default" : "secondary";
	}

	function positionLabel(assignment: Employee["primaryAssignment"]): string {
		if (!assignment?.positions) return "—";
		const p = assignment.positions;
		return `${p.code} — ${localizedDualField(data.locale, p.name, p.name_en)}`;
	}

	function openRow(employeeId: string) {
		void goto(`/employees/${employeeId}`);
	}

	function rowKeydown(e: KeyboardEvent, employeeId: string) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			openRow(employeeId);
		}
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

	{#if data.errors.employees || data.errors.positions || data.errors.orgUnits || data.errors.programs || data.errors.users || data.errors.employmentContractTypes || data.errors.personnelCategories || data.errors.hrEmploymentStatuses || data.errors.deductionTypes}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs">
			{copy.loadError}
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-2">
		<div class="relative min-w-[200px] max-w-sm flex-1">
			<SearchIcon class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
			<Input placeholder={copy.searchPlaceholder} class="pl-9" bind:value={search} />
		</div>
		<select
			class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 min-w-[160px] max-w-[240px] rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={orgUnitFilter}
		>
			<option value="ALL">{copy.allOrgUnits}</option>
			{#each data.orgUnits as unit, i (unit.id)}
				<option value={unit.id}>{localizedDualField(data.locale, unit.name, unit.name_en)}</option>
			{/each}
		</select>
		<select
			class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 min-w-[140px] rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={hrStatusFilter}
		>
			<option value="ALL">{copy.allHrStatuses}</option>
			{#each data.hrLookups.hrEmploymentStatuses as hs, i (hs.id)}
				<option value={hs.id}>{localizedLookupLabel(data.locale, hs)}</option>
			{/each}
		</select>
		<select
			class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 min-w-[140px] rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={contractFilter}
		>
			<option value="ALL">{copy.allContracts}</option>
			{#each data.hrLookups.employmentContractTypes as ct, i (ct.id)}
				<option value={ct.id}>{localizedLookupLabel(data.locale, ct)}</option>
			{/each}
		</select>
		<Button type="button" onclick={openCreateEmployeeDialog}>
			<PlusIcon class="mr-2 size-4" />
			{copy.newEmployee}
		</Button>
		<p class="text-muted-foreground text-sm">
			{filteredEmployees.length}
			{copy.employee}{filteredEmployees.length !== 1 && data.locale !== "th" ? "s" : ""}
		</p>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{copy.colNo}</Table.Head>
					<Table.Head>{copy.colName}</Table.Head>
					<Table.Head>{copy.colEmail}</Table.Head>
					<Table.Head>{copy.colHrStatus}</Table.Head>
					<Table.Head>{copy.colContract}</Table.Head>
					<Table.Head>{copy.colAppStatus}</Table.Head>
					<Table.Head>{copy.colPosition}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each paginatedEmployees as employee, i (employee.id)}
					<Table.Row
						class="hover:bg-muted/50 cursor-pointer"
						tabindex={0}
						role="button"
						onclick={() => openRow(employee.id)}
						onkeydown={(e) => rowKeydown(e, employee.id)}
					>
						<Table.Cell>{employee.employeeNo ?? "—"}</Table.Cell>
						<Table.Cell class="font-medium">
							<span class="text-primary underline-offset-2 hover:underline">{employee.fullName}</span>
							{#if employee.linkedAccountEmail}
								<Badge variant="secondary" class="ml-1 align-middle">{copy.linkedShort}</Badge>
							{/if}
						</Table.Cell>
						<Table.Cell class="text-muted-foreground">{employee.email ?? "—"}</Table.Cell>
						<Table.Cell>
							{#if employee.hrProfile.hrEmploymentStatus}
								<Badge variant="outline">
									{localizedDualField(
										data.locale,
										employee.hrProfile.hrEmploymentStatus.labelTh,
										employee.hrProfile.hrEmploymentStatus.labelEn,
									)}
								</Badge>
							{:else}
								<span class="text-muted-foreground">—</span>
							{/if}
						</Table.Cell>
						<Table.Cell>
							{#if employee.hrProfile.employmentContractType}
								<span class="text-muted-foreground">
									{localizedDualField(
										data.locale,
										employee.hrProfile.employmentContractType.labelTh,
										employee.hrProfile.employmentContractType.labelEn,
									)}
								</span>
							{:else}
								<span class="text-muted-foreground">—</span>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<Badge variant={statusBadgeVariant(employee.status)}>{employee.status.toUpperCase()}</Badge>
						</Table.Cell>
						<Table.Cell class="text-muted-foreground">{positionLabel(employee.primaryAssignment)}</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center">
							{copy.noMatch}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		<DataTablePagination
			totalItems={filteredEmployees.length}
			locale={data.locale}
			bind:pageSize
			bind:currentPage
		/>
	</div>
</div>

<Dialog.Root bind:open={createEmployeeDialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{copy.createEmployee}</Dialog.Title>
			<Dialog.Description>{copy.createEmployeeDesc}</Dialog.Description>
		</Dialog.Header>
		{#key createEmployeeFormKey}
			<form
				method="POST"
				action="?/createEmployee"
				use:enhance={pendingEnhance((v) => (savePendingCreateEmployee = v), () => async ({ result, update }) => {
					if (result.type === "success" || result.type === "redirect") {
						createEmployeeDialogOpen = false;
					}
					await update();
				})}
				class="grid gap-4"
			>
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="create-employee-first">{copy.firstName}</Label>
						<Input id="create-employee-first" name="firstName" autocomplete="given-name" required />
					</div>
					<div class="grid gap-2">
						<Label for="create-employee-last">{copy.lastName}</Label>
						<Input id="create-employee-last" name="lastName" autocomplete="family-name" required />
					</div>
				</div>
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="create-employee-email">{copy.email}</Label>
						<Input id="create-employee-email" type="email" name="email" autocomplete="email" />
					</div>
					<div class="grid gap-2">
						<Label for="create-employee-no">{copy.employeeNo}</Label>
						<Input id="create-employee-no" name="employeeNo" autocomplete="off" />
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="create-app-role">{copy.appRoleLabel}</Label>
					<select id="create-app-role" name="appRole" class={selectClass()}>
						<option value="">—</option>
						{#each roleOptions as opt, i (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
					<p class="text-muted-foreground text-xs">{copy.appRoleHint}</p>
				</div>
				<Dialog.Footer>
					<SaveSubmitButton
						pending={savePendingCreateEmployee}
						idleLabel={copy.createEmployee}
						savingLabel={uiLabels.formSaving}
					/>
				</Dialog.Footer>
			</form>
		{/key}
	</Dialog.Content>
</Dialog.Root>
