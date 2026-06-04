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
	import SearchIcon from "@lucide/svelte/icons/search";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { localizedDualField } from "$lib/i18n/display.js";

	let { data, form } = $props();

	const t = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "จัดการพนักงาน - ONE-IL",
					title: "จัดการพนักงาน",
					description: "ข้อมูลพนักงานและการสังกัดหน่วยงานใน one_leave.employees",
					add: "เพิ่มพนักงาน",
					search: "ค้นหาพนักงาน...",
					code: "รหัสพนักงาน",
					name: "ชื่อ-สกุล",
					orgUnit: "หน่วยงาน",
					position: "ตำแหน่ง",
					line: "สายงาน",
					category: "ประเภทการจ้าง",
					email: "อีเมล",
					status: "สถานะ",
					actions: "การกระทำ",
					active: "ใช้งาน",
					inactive: "ปิดใช้งาน",
					none: "—",
					noRows: "ไม่พบพนักงาน",
					title_th: "คำนำหน้า",
					firstName: "ชื่อ",
					lastName: "นามสกุล",
					hireDate: "วันที่เริ่มงาน",
					create: "สร้าง",
					save: "บันทึก",
					saving: "กำลังบันทึก...",
					createTitle: "เพิ่มพนักงานใหม่",
					editTitle: "แก้ไขพนักงาน",
					updated: "บันทึกสำเร็จ",
					isActive: "เปิดใช้งาน",
					showingRows: "แสดง {start}-{end} จาก {total} คน",
					prev: "ก่อนหน้า",
					next: "ถัดไป",
				}
			: {
					pageTitle: "Employee administration - ONE-IL",
					title: "Employee administration",
					description: "Employee records and org unit assignment in one_leave.employees",
					add: "Add employee",
					search: "Search employees...",
					code: "Code",
					name: "Name",
					orgUnit: "Org unit",
					position: "Position",
					line: "Line",
					category: "Employment",
					email: "Email",
					status: "Status",
					actions: "Actions",
					active: "Active",
					inactive: "Inactive",
					none: "—",
					noRows: "No employees found",
					title_th: "Title",
					firstName: "First name",
					lastName: "Last name",
					hireDate: "Hire date",
					create: "Create",
					save: "Save",
					saving: "Saving...",
					createTitle: "Add new employee",
					editTitle: "Edit employee",
					updated: "Saved successfully",
					isActive: "Active",
					showingRows: "Showing {start}-{end} of {total} employees",
					prev: "Previous",
					next: "Next",
				}
	);

	const lineLabels: Record<string, { th: string; en: string }> = {
		staff: { th: "เจ้าหน้าที่", en: "Staff" },
		lecturer: { th: "อาจารย์", en: "Lecturer" },
		head_support: { th: "หัวหน้าฝ่ายสนับสนุน", en: "Head (support)" },
		director: { th: "ผู้อำนวยการ", en: "Director" },
	};
	const categoryLabels: Record<string, { th: string; en: string }> = {
		government_official: { th: "ข้าราชการ", en: "Government official" },
		university_employee: { th: "พนักงานมหาวิทยาลัย", en: "University employee" },
		permanent_employee: { th: "ลูกจ้างประจำ", en: "Permanent employee" },
		temporary_income: { th: "ลูกจ้างชั่วคราว (เงินรายได้)", en: "Temporary (income)" },
	};
	const lineText = (v: string) =>
		data.locale === "th" ? (lineLabels[v]?.th ?? v) : (lineLabels[v]?.en ?? v);
	const categoryText = (v: string) =>
		data.locale === "th" ? (categoryLabels[v]?.th ?? v) : (categoryLabels[v]?.en ?? v);

	const lineOptions = Object.keys(lineLabels);
	const categoryOptions = Object.keys(categoryLabels);

	let search = $state("");
	let createOpen = $state(false);
	let editOpen = $state(false);
	let savePending = $state(false);

	let currentPage = $state(1);
	const itemsPerPage = 10;

	$effect(() => {
		search;
		currentPage = 1;
	});

	const orgOptions = $derived(
		data.orgUnits.map((o) => ({
			value: String(o.id),
			label: localizedDualField(data.locale, o.name ?? String(o.id), o.nameEn),
		}))
	);

	// Edit form state
	let editId = $state(0);
	let editTitleTh = $state("");
	let editFirst = $state("");
	let editLast = $state("");
	let editOrg = $state("");
	let editPosition = $state("");
	let editLine = $state("staff");
	let editCategory = $state("university_employee");
	let editEmail = $state("");
	let editActive = $state(true);

	// Create form selects
	let createOrg = $state("");
	let createLine = $state("staff");
	let createCategory = $state("university_employee");

	const filtered = $derived(
		data.employees.filter((e) => {
			const q = search.toLowerCase();
			return (
				e.employeeCode.toLowerCase().includes(q) ||
				`${e.firstNameTh} ${e.lastNameTh}`.toLowerCase().includes(q) ||
				(e.orgUnitName ?? "").toLowerCase().includes(q)
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

	function orgLabel(value: string): string {
		return orgOptions.find((o) => o.value === value)?.label ?? t.none;
	}

	function openCreate() {
		createOrg = orgOptions[0]?.value ?? "";
		createLine = "staff";
		createCategory = "university_employee";
		createOpen = true;
	}

	function openEdit(e: (typeof data.employees)[number]) {
		editId = e.id;
		editTitleTh = e.titleTh ?? "";
		editFirst = e.firstNameTh;
		editLast = e.lastNameTh;
		editOrg = String(e.orgUnitId ?? orgOptions[0]?.value ?? "");
		editPosition = e.positionTitle ?? "";
		editLine = e.employeeLine;
		editCategory = e.employmentCategory;
		editEmail = e.email ?? "";
		editActive = e.isActive;
		editOpen = true;
	}

	const enhanceClose = (close: () => void) =>
		pendingEnhance(
			(v) => (savePending = v),
			() => async ({ result, update }) => {
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
		<SearchIcon class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
		<Input placeholder={t.search} class="pl-9" bind:value={search} />
	</div>

	<div class="rounded-lg border bg-card shadow-sm overflow-hidden">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{t.code}</Table.Head>
					<Table.Head>{t.name}</Table.Head>
					<Table.Head>{t.orgUnit}</Table.Head>
					<Table.Head>{t.position}</Table.Head>
					<Table.Head>{t.line}</Table.Head>
					<Table.Head>{t.status}</Table.Head>
					<Table.Head class="w-20">{t.actions}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each paginated as e (e.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{e.employeeCode}</Table.Cell>
						<Table.Cell>{e.titleTh ?? ""}{e.firstNameTh} {e.lastNameTh}</Table.Cell>
						<Table.Cell class="text-muted-foreground">
							{e.orgUnitName ? localizedDualField(data.locale, e.orgUnitName, e.orgUnitNameEn) : t.none}
						</Table.Cell>
						<Table.Cell class="text-muted-foreground">{e.positionTitle ?? t.none}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{lineText(e.employeeLine)}</Table.Cell>
						<Table.Cell>
							<Badge variant={e.isActive ? "outline" : "destructive"}>
								{e.isActive ? t.active : t.inactive}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							<Button variant="ghost" size="icon" class="size-8" onclick={() => openEdit(e)}>
								<PencilIcon class="size-4" />
							</Button>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center">{t.noRows}</Table.Cell>
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
	<Dialog.Content class="sm:max-w-140">
		<Dialog.Header>
			<Dialog.Title>{t.createTitle}</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance={enhanceClose(() => (createOpen = false))}>
			<div class="grid grid-cols-2 gap-4 py-4">
				<div class="grid gap-2">
					<Label for="c-code">{t.code}</Label>
					<Input id="c-code" name="employeeCode" required />
				</div>
				<div class="grid gap-2">
					<Label for="c-title">{t.title_th}</Label>
					<Input id="c-title" name="titleTh" />
				</div>
				<div class="grid gap-2">
					<Label for="c-first">{t.firstName}</Label>
					<Input id="c-first" name="firstNameTh" required />
				</div>
				<div class="grid gap-2">
					<Label for="c-last">{t.lastName}</Label>
					<Input id="c-last" name="lastNameTh" required />
				</div>
				<div class="grid gap-2 col-span-2">
					<Label>{t.orgUnit}</Label>
					<Select.Root name="orgUnitId" type="single" bind:value={createOrg}>
						<Select.Trigger><span>{orgLabel(createOrg)}</span></Select.Trigger>
						<Select.Content>
							{#each orgOptions as o (o.value)}
								<Select.Item value={o.value}>{o.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label for="c-position">{t.position}</Label>
					<Input id="c-position" name="positionTitle" />
				</div>
				<div class="grid gap-2">
					<Label for="c-hire">{t.hireDate}</Label>
					<Input id="c-hire" name="hireDate" type="date" required />
				</div>
				<div class="grid gap-2">
					<Label>{t.line}</Label>
					<Select.Root name="employeeLine" type="single" bind:value={createLine}>
						<Select.Trigger><span>{lineText(createLine)}</span></Select.Trigger>
						<Select.Content>
							{#each lineOptions as v (v)}
								<Select.Item value={v}>{lineText(v)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label>{t.category}</Label>
					<Select.Root name="employmentCategory" type="single" bind:value={createCategory}>
						<Select.Trigger><span>{categoryText(createCategory)}</span></Select.Trigger>
						<Select.Content>
							{#each categoryOptions as v (v)}
								<Select.Item value={v}>{categoryText(v)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2 col-span-2">
					<Label for="c-email">{t.email}</Label>
					<Input id="c-email" name="email" type="email" />
				</div>
			</div>
			<Dialog.Footer>
				<SaveSubmitButton pending={savePending} idleLabel={t.create} savingLabel={t.saving} />
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit -->
<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="sm:max-w-140">
		<Dialog.Header>
			<Dialog.Title>{t.editTitle}</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/update" use:enhance={enhanceClose(() => (editOpen = false))}>
			<input type="hidden" name="id" value={editId} />
			<div class="grid grid-cols-2 gap-4 py-4">
				<div class="grid gap-2">
					<Label for="e-title">{t.title_th}</Label>
					<Input id="e-title" name="titleTh" bind:value={editTitleTh} />
				</div>
				<div class="grid gap-2">
					<Label for="e-position">{t.position}</Label>
					<Input id="e-position" name="positionTitle" bind:value={editPosition} />
				</div>
				<div class="grid gap-2">
					<Label for="e-first">{t.firstName}</Label>
					<Input id="e-first" name="firstNameTh" bind:value={editFirst} required />
				</div>
				<div class="grid gap-2">
					<Label for="e-last">{t.lastName}</Label>
					<Input id="e-last" name="lastNameTh" bind:value={editLast} required />
				</div>
				<div class="grid gap-2 col-span-2">
					<Label>{t.orgUnit}</Label>
					<Select.Root name="orgUnitId" type="single" bind:value={editOrg}>
						<Select.Trigger><span>{orgLabel(editOrg)}</span></Select.Trigger>
						<Select.Content>
							{#each orgOptions as o (o.value)}
								<Select.Item value={o.value}>{o.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label>{t.line}</Label>
					<Select.Root name="employeeLine" type="single" bind:value={editLine}>
						<Select.Trigger><span>{lineText(editLine)}</span></Select.Trigger>
						<Select.Content>
							{#each lineOptions as v (v)}
								<Select.Item value={v}>{lineText(v)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label>{t.category}</Label>
					<Select.Root name="employmentCategory" type="single" bind:value={editCategory}>
						<Select.Trigger><span>{categoryText(editCategory)}</span></Select.Trigger>
						<Select.Content>
							{#each categoryOptions as v (v)}
								<Select.Item value={v}>{categoryText(v)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2 col-span-2">
					<Label for="e-email">{t.email}</Label>
					<Input id="e-email" name="email" type="email" bind:value={editEmail} />
				</div>
				<input type="hidden" name="isActive" value={String(editActive)} />
				<label class="flex items-center gap-2 text-sm col-span-2">
					<input type="checkbox" bind:checked={editActive} class="accent-primary size-4" />
					{t.isActive}
				</label>
			</div>
			<Dialog.Footer>
				<SaveSubmitButton pending={savePending} idleLabel={t.save} savingLabel={t.saving} />
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
