<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { localizedDualField, localizedLookupLabel } from "$lib/i18n/display.js";
	import type { SubmitFunction } from "@sveltejs/kit";
	import type { ActionData, PageData } from "./$types.js";

	type Locale = PageData["locale"];
	type LookupRow = { id?: string; code?: string | null; label_th: string; label_en?: string | null };
	type NamedRow = { id?: string; code?: string | null; name: string; name_en?: string | null };
	type EmployeeRow = { id?: string; employee_no?: string | null; first_name?: string | null; last_name?: string | null };
	type AssetRow = {
		id: string;
		assetNo: string;
		name: string;
		nameEn: string | null;
		acquiredAt: string | null;
		acquisitionCost: number | null;
		budgetSource: string | null;
		brand?: string | null;
		model?: string | null;
		serialNo?: string | null;
		documentRef: string | null;
		note: string | null;
		category: LookupRow;
		status: LookupRow;
		condition: LookupRow | null;
		responsible: EmployeeRow | null;
		orgUnit: NamedRow | null;
		location: NamedRow | null;
	};
	type AssignmentRow = {
		id: string;
		startsAt: string;
		endsAt: string | null;
		note?: string | null;
		responsible: EmployeeRow | null;
		orgUnit: NamedRow | null;
		location: NamedRow | null;
	};
	type MaintenanceRow = {
		id: string;
		maintenanceNo: string;
		status: string;
		issue: string;
		actionTaken?: string | null;
		cost?: number | null;
		vendor?: string | null;
		reportedAt: string | null;
		completedAt: string | null;
		reporter: EmployeeRow | null;
	};
	type ViewData = {
		locale: Locale;
		canManageAssets?: boolean;
		asset: AssetRow;
		assignments: AssignmentRow[];
		maintenance: MaintenanceRow[];
		categories: (LookupRow & { id: string })[];
		statuses: (LookupRow & { id: string })[];
		conditions: (LookupRow & { id: string })[];
		employees: (EmployeeRow & { id: string })[];
		orgUnits: (NamedRow & { id: string })[];
		locations: (NamedRow & { id: string })[];
		errors: Record<string, string | null>;
	};

	let { data: pageData, form }: { data: PageData; form?: ActionData } = $props();
	const data = $derived(pageData as unknown as ViewData);

	const uiLabels = $derived(getUiLabels(data.locale));
	let tab = $state("register");
	let registerPending = $state(false);
	let assignPending = $state(false);
	let maintenancePending = $state(false);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: `ครุภัณฑ์ ${data.asset.assetNo} - ONE-IL`,
					back: "กลับทะเบียนครุภัณฑ์",
					loadError: "ข้อมูลประวัติหรือรายการอ้างอิงโหลดไม่สำเร็จ",
					tabs: { register: "ทะเบียน", custody: "ผู้รับผิดชอบ", maintenance: "ซ่อมบำรุง", history: "ประวัติ" },
					register: "ข้อมูลทะเบียนครุภัณฑ์",
					assetNo: "เลขครุภัณฑ์",
					nameTh: "ชื่อไทย",
					nameEn: "ชื่ออังกฤษ",
					category: "ประเภท",
					condition: "สภาพ",
					acquiredAt: "วันที่ได้มา",
					acquisitionCost: "มูลค่า",
					budgetSource: "แหล่งงบประมาณ",
					brand: "ยี่ห้อ",
					model: "รุ่น",
					serialNo: "เลขซีเรียล",
					documentRef: "เอกสารอ้างอิง",
					assign: "กำหนดผู้รับผิดชอบ/สถานที่",
					currentCustody: "ผู้รับผิดชอบปัจจุบัน",
					maintenance: "บันทึกซ่อมบำรุง",
					responsible: "ผู้รับผิดชอบ",
					orgUnit: "หน่วยงาน",
					location: "สถานที่",
					note: "หมายเหตุ",
					saveAssign: "บันทึกการมอบหมาย",
					issue: "ปัญหา",
					actionTaken: "การดำเนินการ",
					cost: "ค่าใช้จ่าย",
					vendor: "ผู้ขาย/ผู้ซ่อม",
					status: "สถานะ",
					saveMaintenance: "บันทึกซ่อมบำรุง",
					assignments: "ประวัติการมอบหมาย",
					maintenanceHistory: "ประวัติซ่อมบำรุง",
					noAssignments: "ยังไม่มีประวัติการมอบหมาย",
					noMaintenance: "ยังไม่มีประวัติซ่อมบำรุง",
					history: "สรุปความเคลื่อนไหว",
					historySummary: "ข้อมูลปัจจุบัน",
					noAuditItems: "ยังไม่มีรายการมอบหมายหรือซ่อมบำรุง",
					auditAssignment: "มอบหมาย",
					auditMaintenance: "ซ่อมบำรุง",
					reportedAt: "แจ้งเมื่อ",
					completedAt: "เสร็จเมื่อ",
					reporter: "ผู้แจ้ง",
					save: "บันทึก",
					success: "บันทึกสำเร็จ",
				}
			: {
					pageTitle: `Asset ${data.asset.assetNo} - ONE-IL`,
					back: "Back to assets",
					loadError: "History or reference data failed to load.",
					tabs: { register: "Register", custody: "Custody", maintenance: "Maintenance", history: "History" },
					register: "Asset register",
					assetNo: "Asset no.",
					nameTh: "Thai name",
					nameEn: "English name",
					category: "Category",
					condition: "Condition",
					acquiredAt: "Acquired date",
					acquisitionCost: "Acquisition cost",
					budgetSource: "Budget source",
					brand: "Brand",
					model: "Model",
					serialNo: "Serial no.",
					documentRef: "Document ref",
					assign: "Assign responsibility/location",
					currentCustody: "Current custody",
					maintenance: "Create maintenance",
					responsible: "Responsible",
					orgUnit: "Org unit",
					location: "Location",
					note: "Note",
					saveAssign: "Save assignment",
					issue: "Issue",
					actionTaken: "Action taken",
					cost: "Cost",
					vendor: "Vendor",
					status: "Status",
					saveMaintenance: "Save maintenance",
					assignments: "Assignment history",
					maintenanceHistory: "Maintenance history",
					noAssignments: "No assignment history yet.",
					noMaintenance: "No maintenance history yet.",
					history: "Activity summary",
					historySummary: "Current metadata",
					noAuditItems: "No assignment or maintenance activity yet.",
					auditAssignment: "Assignment",
					auditMaintenance: "Maintenance",
					reportedAt: "Reported at",
					completedAt: "Completed at",
					reporter: "Reporter",
					save: "Save",
					success: "Saved successfully",
				}
	);

	const hasErrors = $derived(Object.values(data.errors).some(Boolean));
	const maintenanceStatuses = [
		{ value: "reported", labelTh: "แจ้งซ่อม", labelEn: "Reported" },
		{ value: "in_progress", labelTh: "กำลังดำเนินการ", labelEn: "In progress" },
		{ value: "completed", labelTh: "เสร็จสิ้น", labelEn: "Completed" },
		{ value: "cancelled", labelTh: "ยกเลิก", labelEn: "Cancelled" },
	] as const;

	const registerFields = $derived.by(() => [
		{ label: copy.category, value: localizedLookupLabel(data.locale, data.asset.category) },
		{ label: copy.status, value: localizedLookupLabel(data.locale, data.asset.status) },
		{ label: copy.condition, value: data.asset.condition ? localizedLookupLabel(data.locale, data.asset.condition) : "—" },
		{ label: copy.acquiredAt, value: dateLabel(data.asset.acquiredAt) },
		{ label: copy.acquisitionCost, value: currencyLabel(data.asset.acquisitionCost) },
		{ label: copy.budgetSource, value: valueOrDash(data.asset.budgetSource) },
		{ label: copy.brand, value: valueOrDash(data.asset.brand) },
		{ label: copy.model, value: valueOrDash(data.asset.model) },
		{ label: copy.serialNo, value: valueOrDash(data.asset.serialNo) },
		{ label: copy.documentRef, value: valueOrDash(data.asset.documentRef) },
		{ label: copy.note, value: valueOrDash(data.asset.note) },
	]);

	const auditItems = $derived.by(() => {
		const assignmentItems = data.assignments.map((assignment) => ({
			id: `assignment-${assignment.id}`,
			happenedAt: assignment.startsAt,
			type: copy.auditAssignment,
			title: employeeName(assignment.responsible),
			description: `${orgUnitLabel(assignment.orgUnit)} · ${locationLabel(assignment.location)}`,
		}));
		const maintenanceItems = data.maintenance.map((item) => ({
			id: `maintenance-${item.id}`,
			happenedAt: item.reportedAt ?? "",
			type: copy.auditMaintenance,
			title: item.maintenanceNo,
			description: `${maintenanceStatusLabel(item.status)} · ${employeeName(item.reporter)}`,
		}));

		return [...assignmentItems, ...maintenanceItems]
			.sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))
			.slice(0, 10);
	});

	function keepForm(setPending: (pending: boolean) => void): SubmitFunction {
		return pendingEnhance(setPending, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: true });
		});
	}

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}

	function employeeName(employee: { employee_no?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined): string {
		if (!employee) return "—";
		const name = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
		return employee.employee_no ? `${employee.employee_no} ${name}`.trim() : name || "—";
	}

	function valueOrDash(value: string | number | null | undefined): string {
		if (value === null || value === undefined || value === "") return "—";
		return String(value);
	}

	function localeCode(locale: Locale): string {
		return locale === "th" ? "th-TH" : "en-US";
	}

	function dateLabel(value: string | null | undefined): string {
		return value ? value.slice(0, 10) : "—";
	}

	function dateTimeLabel(value: string | null | undefined): string {
		if (!value) return "—";
		return new Intl.DateTimeFormat(localeCode(data.locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
	}

	function currencyLabel(value: number | null | undefined): string {
		if (value === null || value === undefined) return "—";
		return new Intl.NumberFormat(localeCode(data.locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
	}

	function maintenanceStatusLabel(status: string): string {
		const option = maintenanceStatuses.find((item) => item.value === status);
		if (!option) return status;
		return data.locale === "th" ? option.labelTh : option.labelEn;
	}

	function orgUnitLabel(unit: { name?: string | null; name_en?: string | null } | null | undefined): string {
		return unit ? localizedDualField(data.locale, unit.name ?? "", unit.name_en) : "—";
	}

	function locationLabel(location: { code?: string | null; name?: string | null; name_en?: string | null } | null | undefined): string {
		if (!location) return "—";
		return `${location.code ?? ""} ${localizedDualField(data.locale, location.name ?? "", location.name_en)}`.trim();
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<a href={resolve("/assets")} class="text-muted-foreground hover:text-foreground text-sm">{copy.back}</a>

	<section class="space-y-3">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">
					{data.asset.assetNo} · {localizedDualField(data.locale, data.asset.name, data.asset.nameEn)}
				</h1>
				<p class="text-muted-foreground text-sm">
					{data.asset.brand ?? ""} {data.asset.model ?? ""} {data.asset.serialNo ? `· ${data.asset.serialNo}` : ""}
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary">{localizedLookupLabel(data.locale, data.asset.category)}</Badge>
				<Badge variant="outline">{localizedLookupLabel(data.locale, data.asset.status)}</Badge>
				{#if data.asset.condition}
					<Badge variant="outline">{localizedLookupLabel(data.locale, data.asset.condition)}</Badge>
				{/if}
			</div>
		</div>
	</section>

	{#if hasErrors || form?.message}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
			{form?.message ?? copy.loadError}
		</div>
	{:else if form?.success}
		<div class="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">
			{copy.success}
		</div>
	{/if}

	<Tabs.Root bind:value={tab} class="w-full">
		<Tabs.List class="flex h-auto flex-wrap gap-1">
			<Tabs.Trigger value="register" class="text-xs">{copy.tabs.register}</Tabs.Trigger>
			<Tabs.Trigger value="custody" class="text-xs">{copy.tabs.custody}</Tabs.Trigger>
			<Tabs.Trigger value="maintenance" class="text-xs">{copy.tabs.maintenance}</Tabs.Trigger>
			<Tabs.Trigger value="history" class="text-xs">{copy.tabs.history}</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="register" class="mt-3">
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.register}</Card.Title>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/updateAsset"
						use:enhance={keepForm((v) => (registerPending = v))}
						class="grid gap-3"
					>
						<input type="hidden" name="assetId" value={data.asset.id} />
						<div class="grid gap-3 sm:grid-cols-2">
							<div class="space-y-1.5">
								<Label for="assetNo">{copy.assetNo}</Label>
								<Input id="assetNo" name="assetNo" value={data.asset.assetNo} required disabled={!data.canManageAssets} />
							</div>
							<div class="space-y-1.5">
								<Label for="asset-name">{copy.nameTh}</Label>
								<Input id="asset-name" name="name" value={data.asset.name} required disabled={!data.canManageAssets} />
							</div>
						</div>
						<div class="space-y-1.5">
							<Label for="asset-name-en">{copy.nameEn}</Label>
							<Input id="asset-name-en" name="nameEn" value={data.asset.nameEn ?? ""} disabled={!data.canManageAssets} />
						</div>
						<div class="grid gap-3 sm:grid-cols-3">
							<div class="space-y-1.5">
								<Label for="categoryId">{copy.category}</Label>
								<select id="categoryId" name="categoryId" required disabled={!data.canManageAssets} class={selectClass()}>
									{#each data.categories as category, i (category.id)}
										<option value={category.id} selected={data.asset.category.id === category.id}>
											{localizedLookupLabel(data.locale, category)}
										</option>
									{/each}
								</select>
							</div>
							<div class="space-y-1.5">
								<Label for="statusId">{copy.status}</Label>
								<select id="statusId" name="statusId" required disabled={!data.canManageAssets} class={selectClass()}>
									{#each data.statuses as status, i (status.id)}
										<option value={status.id} selected={data.asset.status.id === status.id}>
											{localizedLookupLabel(data.locale, status)}
										</option>
									{/each}
								</select>
							</div>
							<div class="space-y-1.5">
								<Label for="conditionId">{copy.condition}</Label>
								<select id="conditionId" name="conditionId" disabled={!data.canManageAssets} class={selectClass()}>
									<option value="">—</option>
									{#each data.conditions as condition, i (condition.id)}
										<option value={condition.id} selected={data.asset.condition?.id === condition.id}>
											{localizedLookupLabel(data.locale, condition)}
										</option>
									{/each}
								</select>
							</div>
						</div>
						<div class="grid gap-3 sm:grid-cols-3">
							<div class="space-y-1.5">
								<Label for="acquiredAt">{copy.acquiredAt}</Label>
								<Input id="acquiredAt" name="acquiredAt" type="date" value={data.asset.acquiredAt ?? ""} disabled={!data.canManageAssets} />
							</div>
							<div class="space-y-1.5">
								<Label for="acquisitionCost">{copy.acquisitionCost}</Label>
								<Input
									id="acquisitionCost"
									name="acquisitionCost"
									type="number"
									min="0"
									step="0.01"
									value={data.asset.acquisitionCost ?? ""}
									disabled={!data.canManageAssets}
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="budgetSource">{copy.budgetSource}</Label>
								<Input id="budgetSource" name="budgetSource" value={data.asset.budgetSource ?? ""} disabled={!data.canManageAssets} />
							</div>
						</div>
						<div class="grid gap-3 sm:grid-cols-3">
							<div class="space-y-1.5">
								<Label for="brand">{copy.brand}</Label>
								<Input id="brand" name="brand" value={data.asset.brand ?? ""} disabled={!data.canManageAssets} />
							</div>
							<div class="space-y-1.5">
								<Label for="model">{copy.model}</Label>
								<Input id="model" name="model" value={data.asset.model ?? ""} disabled={!data.canManageAssets} />
							</div>
							<div class="space-y-1.5">
								<Label for="serialNo">{copy.serialNo}</Label>
								<Input id="serialNo" name="serialNo" value={data.asset.serialNo ?? ""} disabled={!data.canManageAssets} />
							</div>
						</div>
						<div class="space-y-1.5">
							<Label for="documentRef">{copy.documentRef}</Label>
							<Input id="documentRef" name="documentRef" value={data.asset.documentRef ?? ""} disabled={!data.canManageAssets} />
						</div>
						<div class="space-y-1.5">
							<Label for="asset-note">{copy.note}</Label>
							<Textarea id="asset-note" name="note" rows={3} value={data.asset.note ?? ""} disabled={!data.canManageAssets} />
						</div>
						{#if data.canManageAssets}
							<div class="flex justify-end">
								<SaveSubmitButton pending={registerPending} idleLabel={copy.save} savingLabel={uiLabels.formSaving} />
							</div>
						{/if}
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="custody" class="mt-3 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.currentCustody}</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 sm:grid-cols-3">
					<div class="space-y-1">
						<div class="text-muted-foreground text-xs">{copy.responsible}</div>
						<div class="text-sm font-medium">{employeeName(data.asset.responsible)}</div>
					</div>
					<div class="space-y-1">
						<div class="text-muted-foreground text-xs">{copy.orgUnit}</div>
						<div class="text-sm font-medium">{orgUnitLabel(data.asset.orgUnit)}</div>
					</div>
					<div class="space-y-1">
						<div class="text-muted-foreground text-xs">{copy.location}</div>
						<div class="text-sm font-medium">{locationLabel(data.asset.location)}</div>
					</div>
				</Card.Content>
			</Card.Root>

			{#if data.canManageAssets}
				<Card.Root>
					<Card.Header>
						<Card.Title>{copy.assign}</Card.Title>
					</Card.Header>
					<Card.Content>
						<form
						method="POST"
						action="?/assignAsset"
						use:enhance={keepForm((v) => (assignPending = v))}
						class="grid gap-3 sm:grid-cols-2"
					>
						<input type="hidden" name="assetId" value={data.asset.id} />
						<div class="space-y-1.5">
							<Label for="responsibleEmployeeId">{copy.responsible}</Label>
							<select id="responsibleEmployeeId" name="responsibleEmployeeId" class={selectClass()}>
								<option value="">—</option>
								{#each data.employees as employee, i (employee.id)}
									<option value={employee.id}>{employeeName(employee)}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-1.5">
							<Label for="orgUnitId">{copy.orgUnit}</Label>
							<select id="orgUnitId" name="orgUnitId" class={selectClass()}>
								<option value="">—</option>
								{#each data.orgUnits as unit, i (unit.id)}
									<option value={unit.id}>{orgUnitLabel(unit)}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-1.5">
							<Label for="locationId">{copy.location}</Label>
							<select id="locationId" name="locationId" class={selectClass()}>
								<option value="">—</option>
								{#each data.locations as location, i (location.id)}
									<option value={location.id}>{locationLabel(location)}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-1.5">
							<Label for="assignment-note">{copy.note}</Label>
							<Input id="assignment-note" name="note" />
						</div>
						<div class="sm:col-span-2">
							<SaveSubmitButton pending={assignPending} idleLabel={copy.saveAssign} savingLabel={uiLabels.formSaving} />
						</div>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.assignments}</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if data.assignments.length === 0}
						<p class="text-muted-foreground text-sm">{copy.noAssignments}</p>
					{:else}
						{#each data.assignments as assignment, i (assignment.id)}
							<div class="rounded-lg border p-3">
								<div class="font-medium">{employeeName(assignment.responsible)}</div>
								<div class="text-muted-foreground text-xs">
									{orgUnitLabel(assignment.orgUnit)} · {locationLabel(assignment.location)}
								</div>
								<div class="text-muted-foreground mt-1 text-xs">{dateLabel(assignment.startsAt)} - {dateLabel(assignment.endsAt)}</div>
								{#if assignment.note}
									<p class="mt-2 text-sm">{assignment.note}</p>
								{/if}
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="maintenance" class="mt-3 space-y-4">
			{#if data.canManageAssets}
				<Card.Root>
					<Card.Header>
						<Card.Title>{copy.maintenance}</Card.Title>
					</Card.Header>
					<Card.Content>
						<form
						method="POST"
						action="?/createMaintenance"
						use:enhance={keepForm((v) => (maintenancePending = v))}
						class="grid gap-3 sm:grid-cols-2"
					>
						<input type="hidden" name="assetId" value={data.asset.id} />
						<div class="space-y-1.5 sm:col-span-2">
							<Label for="issue">{copy.issue}</Label>
							<Textarea id="issue" name="issue" rows={3} required />
						</div>
						<div class="space-y-1.5 sm:col-span-2">
							<Label for="actionTaken">{copy.actionTaken}</Label>
							<Textarea id="actionTaken" name="actionTaken" rows={2} />
						</div>
						<div class="space-y-1.5">
							<Label for="cost">{copy.cost}</Label>
							<Input id="cost" name="cost" type="number" min="0" step="0.01" />
						</div>
						<div class="space-y-1.5">
							<Label for="vendor">{copy.vendor}</Label>
							<Input id="vendor" name="vendor" />
						</div>
						<div class="space-y-1.5">
							<Label for="status">{copy.status}</Label>
							<select id="status" name="status" class={selectClass()}>
								{#each maintenanceStatuses as status, i (status.value)}
									<option value={status.value}>{data.locale === "th" ? status.labelTh : status.labelEn}</option>
								{/each}
							</select>
						</div>
						<div class="flex items-end">
							<SaveSubmitButton pending={maintenancePending} idleLabel={copy.saveMaintenance} savingLabel={uiLabels.formSaving} />
						</div>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.maintenanceHistory}</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if data.maintenance.length === 0}
						<p class="text-muted-foreground text-sm">{copy.noMaintenance}</p>
					{:else}
						{#each data.maintenance as item, i (item.id)}
							<div class="rounded-lg border p-3">
								<div class="flex items-center justify-between gap-2">
									<div class="font-medium">{item.maintenanceNo}</div>
									<Badge variant="outline">{maintenanceStatusLabel(item.status)}</Badge>
								</div>
								<p class="mt-2 text-sm">{item.issue}</p>
								{#if item.actionTaken}
									<p class="text-muted-foreground mt-1 text-sm">{item.actionTaken}</p>
								{/if}
								<div class="text-muted-foreground mt-2 text-xs">
									{copy.reportedAt}: {dateTimeLabel(item.reportedAt)} · {copy.completedAt}: {dateTimeLabel(item.completedAt)}
								</div>
								<div class="text-muted-foreground mt-1 text-xs">
									{copy.reporter}: {employeeName(item.reporter)} · {item.vendor ?? "—"} · {currencyLabel(item.cost)}
								</div>
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="history" class="mt-3 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.historySummary}</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<div class="space-y-1">
						<div class="text-muted-foreground text-xs">{copy.status}</div>
						<div class="text-sm font-medium">{localizedLookupLabel(data.locale, data.asset.status)}</div>
					</div>
					<div class="space-y-1">
						<div class="text-muted-foreground text-xs">{copy.responsible}</div>
						<div class="text-sm font-medium">{employeeName(data.asset.responsible)}</div>
					</div>
					<div class="space-y-1">
						<div class="text-muted-foreground text-xs">{copy.orgUnit}</div>
						<div class="text-sm font-medium">{orgUnitLabel(data.asset.orgUnit)}</div>
					</div>
					<div class="space-y-1">
						<div class="text-muted-foreground text-xs">{copy.location}</div>
						<div class="text-sm font-medium">{locationLabel(data.asset.location)}</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.history}</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if auditItems.length === 0}
						<p class="text-muted-foreground text-sm">{copy.noAuditItems}</p>
					{:else}
						{#each auditItems as item, i (item.id)}
							<div class="flex gap-3 rounded-lg border p-3">
								<Badge variant="secondary" class="h-fit shrink-0">{item.type}</Badge>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center justify-between gap-2">
										<div class="font-medium">{item.title}</div>
										<div class="text-muted-foreground text-xs">{dateTimeLabel(item.happenedAt)}</div>
									</div>
									<div class="text-muted-foreground text-xs">{item.description}</div>
								</div>
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
