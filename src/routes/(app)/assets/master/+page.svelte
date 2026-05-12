<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import type { SubmitFunction } from "@sveltejs/kit";
	import type { ActionData, PageData } from "./$types.js";

	type Locale = PageData["locale"];
	type LookupRow = {
		id: string;
		code: string;
		label_th: string;
		label_en?: string | null;
		sort_order: number;
		is_active: boolean;
	};
	type OrgUnitRow = { id: string; code?: string | null; name: string; name_en?: string | null };
	type LocationRow = {
		id: string;
		code: string;
		name: string;
		name_en?: string | null;
		org_unit_id?: string | null;
		description?: string | null;
		sort_order: number;
		is_active: boolean;
	};
	type LookupSectionDef = {
		id: string;
		title: string;
		blurb: string;
		createAction: string;
		updateAction: string;
		rows: LookupRow[];
	};
	type ViewData = {
		locale: Locale;
		categories: LookupRow[];
		statuses: LookupRow[];
		conditions: LookupRow[];
		locations: LocationRow[];
		orgUnits: OrgUnitRow[];
		errors: Record<string, string | null>;
	};

	let { data: pageData, form }: { data: PageData; form?: ActionData } = $props();
	const data = $derived(pageData as unknown as ViewData);

	const keepForm: SubmitFunction = () => async ({ update }) => {
		await update({ reset: false, invalidateAll: true });
	};

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ข้อมูลอ้างอิงครุภัณฑ์ - ONE-IL",
					title: "ข้อมูลอ้างอิงครุภัณฑ์",
					description:
						"จัดการประเภทครุภัณฑ์ สถานะ สภาพ และสถานที่เก็บ/ใช้งาน (คำศัพท์ให้สอดคล้องการบันทึกทะเบียนทรัพย์สินภาครัฐ) — สถานที่ใช้ร่วมกับโมดูลพัสดุ",
					back: "กลับทะเบียนครุภัณฑ์",
					loadError: "โหลดข้อมูลไม่สำเร็จ",
					success: "บันทึกสำเร็จ",
					code: "รหัสภายใน",
					labelTh: "ชื่อ (ไทย)",
					labelEn: "ชื่อ (อังกฤษ)",
					sortOrder: "ลำดับ",
					active: "ใช้งาน",
					inactive: "ปิดใช้",
					saveRow: "บันทึกแถว",
					addRow: "เพิ่มรายการ",
					nameTh: "ชื่อสถานที่ (ไทย)",
					nameEn: "ชื่อสถานที่ (อังกฤษ)",
					orgUnit: "หน่วยงานเจ้าของพื้นที่",
					descriptionLabel: "คำอธิบาย",
					categoriesTitle: "ประเภทครุภัณฑ์",
					categoriesBlurb: "จัดกลุ่มทะเบียนครุภัณฑ์ตามประเภทที่หน่วยงานใช้ควบคุม",
					statusesTitle: "สถานะครุภัณฑ์",
					statusesBlurb: "สถานะการใช้งานในทะเบียน (แยกจากสภาพทางกายภาพ)",
					conditionsTitle: "สภาพ (ตรวจนับ)",
					conditionsBlurb: "ใช้ระบุผลตรวจสภาพ เช่น ดี / พอใช้ / ชำรุด",
					locationsTitle: "สถานที่ / ที่เก็บ",
					locationsBlurb: "ห้อง ชั้น อาคาร หรือคลัง — ใช้ร่วมกับคลังวัสดุ",
				}
			: {
					pageTitle: "Asset reference data - ONE-IL",
					title: "Asset reference data",
					description:
						"Manage asset categories, statuses, physical condition scales, and storage/use locations (aligned with typical Thai government register wording). Locations are shared with the supply (stock) module.",
					back: "Back to assets",
					loadError: "Failed to load data.",
					success: "Saved successfully",
					code: "Internal code",
					labelTh: "Label (Thai)",
					labelEn: "Label (English)",
					sortOrder: "Sort",
					active: "Active",
					inactive: "Inactive",
					saveRow: "Save row",
					addRow: "Add record",
					nameTh: "Location name (Thai)",
					nameEn: "Location name (English)",
					orgUnit: "Custodian org unit",
					descriptionLabel: "Description",
					categoriesTitle: "Asset categories",
					categoriesBlurb: "Group assets for reporting and custody controls.",
					statusesTitle: "Asset statuses",
					statusesBlurb: "Operational status on the register (separate from physical condition).",
					conditionsTitle: "Condition (inspection)",
					conditionsBlurb: "Used for annual inspection lines and maintenance context.",
					locationsTitle: "Locations",
					locationsBlurb: "Rooms, floors, buildings, or storerooms — shared with material stock.",
				}
	);

	const lookupSections = $derived.by((): LookupSectionDef[] => [
		{
			id: "categories",
			title: copy.categoriesTitle,
			blurb: copy.categoriesBlurb,
			createAction: "?/createAssetCategory",
			updateAction: "?/updateAssetCategory",
			rows: data.categories,
		},
		{
			id: "statuses",
			title: copy.statusesTitle,
			blurb: copy.statusesBlurb,
			createAction: "?/createAssetStatus",
			updateAction: "?/updateAssetStatus",
			rows: data.statuses,
		},
		{
			id: "conditions",
			title: copy.conditionsTitle,
			blurb: copy.conditionsBlurb,
			createAction: "?/createAssetCondition",
			updateAction: "?/updateAssetCondition",
			rows: data.conditions,
		},
	]);

	const hasErrors = $derived(Object.values(data.errors).some(Boolean));

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}

</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<a href={resolve("/assets")} class="text-muted-foreground hover:text-foreground text-sm">{copy.back}</a>

	<section class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground text-sm">{copy.description}</p>
	</section>

	{#if hasErrors}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
			{copy.loadError}
		</div>
	{/if}

	{#if form?.message}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
			{form.message}
		</div>
	{:else if form?.success}
		<div class="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">
			{copy.success}
		</div>
	{/if}

	{#each lookupSections as section (section.id)}
		<Card.Root>
			<Card.Header>
				<Card.Title>{section.title}</Card.Title>
				<p class="text-muted-foreground text-sm">{section.blurb}</p>
			</Card.Header>
			<Card.Content class="space-y-6">
				<form method="POST" action={section.createAction} use:enhance={keepForm} class="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
					<div class="space-y-1.5">
						<Label for={`${section.id}-new-code`}>{copy.code}</Label>
						<Input id={`${section.id}-new-code`} name="code" required autocomplete="off" />
					</div>
					<div class="space-y-1.5">
						<Label for={`${section.id}-new-sort`}>{copy.sortOrder}</Label>
						<Input id={`${section.id}-new-sort`} name="sortOrder" type="number" min="0" max="99999" value="0" />
					</div>
					<div class="space-y-1.5">
						<Label for={`${section.id}-new-th`}>{copy.labelTh}</Label>
						<Input id={`${section.id}-new-th`} name="labelTh" required />
					</div>
					<div class="space-y-1.5">
						<Label for={`${section.id}-new-en`}>{copy.labelEn}</Label>
						<Input id={`${section.id}-new-en`} name="labelEn" />
					</div>
					<div class="flex items-end">
						<Button type="submit">{copy.addRow}</Button>
					</div>
				</form>

				<div class="overflow-x-auto rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="whitespace-nowrap">{copy.code}</Table.Head>
								<Table.Head>{copy.labelTh}</Table.Head>
								<Table.Head class="hidden md:table-cell">{copy.labelEn}</Table.Head>
								<Table.Head class="w-[88px]">{copy.sortOrder}</Table.Head>
								<Table.Head class="w-[120px]">{copy.active}</Table.Head>
								<Table.Head class="w-[100px]"></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each section.rows as row, i (row.id)}
								<Table.Row>
									<Table.Cell colspan={6} class="p-3">
										<form
											method="POST"
											action={section.updateAction}
											use:enhance={keepForm}
											class="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
										>
											<input type="hidden" name="id" value={row.id} />
											<div class="font-mono text-xs text-muted-foreground md:w-[100px] md:shrink-0">{row.code}</div>
											<div class="min-w-[140px] flex-1 space-y-1">
												<Label class="text-xs text-muted-foreground md:hidden">{copy.labelTh}</Label>
												<Input name="labelTh" value={row.label_th} class="h-8" />
											</div>
											<div class="min-w-[140px] flex-1 space-y-1">
												<Label class="text-xs text-muted-foreground md:hidden">{copy.labelEn}</Label>
												<Input name="labelEn" value={row.label_en ?? ""} class="h-8" />
											</div>
											<div class="w-24 space-y-1">
												<Label class="text-xs text-muted-foreground md:hidden">{copy.sortOrder}</Label>
												<Input name="sortOrder" type="number" min="0" max="99999" value={row.sort_order} class="h-8" />
											</div>
											<div class="w-[140px] space-y-1">
												<Label class="text-xs text-muted-foreground md:hidden">{copy.active}</Label>
												<select name="isActive" class={selectClass()}>
													<option value="true" selected={row.is_active}>{copy.active}</option>
													<option value="false" selected={!row.is_active}>{copy.inactive}</option>
												</select>
											</div>
											<Button type="submit" variant="secondary" size="sm">{copy.saveRow}</Button>
										</form>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</Card.Content>
		</Card.Root>
	{/each}

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.locationsTitle}</Card.Title>
			<p class="text-muted-foreground text-sm">{copy.locationsBlurb}</p>
		</Card.Header>
		<Card.Content class="space-y-6">
			<form method="POST" action="?/createStockLocation" use:enhance={keepForm} class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
				<div class="space-y-1.5">
					<Label for="loc-new-code">{copy.code}</Label>
					<Input id="loc-new-code" name="code" required autocomplete="off" />
				</div>
				<div class="space-y-1.5">
					<Label for="loc-new-sort">{copy.sortOrder}</Label>
					<Input id="loc-new-sort" name="sortOrder" type="number" min="0" max="99999" value="0" />
				</div>
				<div class="space-y-1.5">
					<Label for="loc-org">{copy.orgUnit}</Label>
					<select id="loc-org" name="orgUnitId" class={selectClass()}>
						<option value="">—</option>
						{#each data.orgUnits as unit, i (unit.id)}
							<option value={unit.id}>{localizedDualField(data.locale, unit.name, unit.name_en)}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="loc-name-th">{copy.nameTh}</Label>
					<Input id="loc-name-th" name="name" required />
				</div>
				<div class="space-y-1.5">
					<Label for="loc-name-en">{copy.nameEn}</Label>
					<Input id="loc-name-en" name="nameEn" />
				</div>
				<div class="space-y-1.5 md:col-span-2 lg:col-span-3">
					<Label for="loc-desc">{copy.descriptionLabel}</Label>
					<Textarea id="loc-desc" name="description" rows={2} />
				</div>
				<div class="flex items-end">
					<Button type="submit">{copy.addRow}</Button>
				</div>
			</form>

			<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each data.locations as loc, i (loc.id)}
					<div class="space-y-3 rounded-lg border p-3">
						<div class="font-mono text-xs text-muted-foreground">{loc.code}</div>
						<form method="POST" action="?/updateStockLocation" use:enhance={keepForm} class="grid gap-3">
							<input type="hidden" name="id" value={loc.id} />
							<div class="space-y-1.5">
								<Label for={`loc-name-${loc.id}`}>{copy.nameTh}</Label>
								<Input id={`loc-name-${loc.id}`} name="name" value={loc.name} required />
							</div>
							<div class="space-y-1.5">
								<Label for={`loc-name-en-${loc.id}`}>{copy.nameEn}</Label>
								<Input id={`loc-name-en-${loc.id}`} name="nameEn" value={loc.name_en ?? ""} />
							</div>
							<div class="space-y-1.5">
								<Label for={`loc-org-${loc.id}`}>{copy.orgUnit}</Label>
								<select id={`loc-org-${loc.id}`} name="orgUnitId" class={selectClass()}>
									<option value="">—</option>
									{#each data.orgUnits as unit, j (unit.id)}
										<option value={unit.id} selected={unit.id === loc.org_unit_id}>
											{localizedDualField(data.locale, unit.name, unit.name_en)}
										</option>
									{/each}
								</select>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1.5">
									<Label for={`loc-sort-${loc.id}`}>{copy.sortOrder}</Label>
									<Input id={`loc-sort-${loc.id}`} name="sortOrder" type="number" min="0" max="99999" value={loc.sort_order} />
								</div>
								<div class="space-y-1.5">
									<Label for={`loc-active-${loc.id}`}>{copy.active}</Label>
									<select id={`loc-active-${loc.id}`} name="isActive" class={selectClass()}>
										<option value="true" selected={loc.is_active}>{copy.active}</option>
										<option value="false" selected={!loc.is_active}>{copy.inactive}</option>
									</select>
								</div>
							</div>
							<div class="space-y-1.5">
								<Label for={`loc-desc-${loc.id}`}>{copy.descriptionLabel}</Label>
								<Textarea id={`loc-desc-${loc.id}`} name="description" rows={2} value={loc.description ?? ""} />
							</div>
							<div>
								<Button type="submit" variant="secondary" size="sm">{copy.saveRow}</Button>
							</div>
						</form>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
