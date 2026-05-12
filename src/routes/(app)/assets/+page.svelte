<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { localizedDualField, localizedLookupLabel } from "$lib/i18n/display.js";
	import { cn } from "$lib/utils.js";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { toast } from "svelte-sonner";
	import type { ActionData, PageData } from "./$types.js";

	type Locale = PageData["locale"];
	type LookupRow = { id?: string; code?: string | null; label_th: string; label_en?: string | null };
	type NamedRow = { id?: string; code?: string | null; name: string; name_en?: string | null };
	type EmployeeRow = { id: string; employee_no?: string | null; first_name?: string | null; last_name?: string | null };
	type AssetRow = {
		id: string;
		assetNo: string;
		name: string;
		nameEn: string | null;
		acquiredAt: string | null;
		acquisitionCost: number | null;
		brand: string | null;
		model: string | null;
		serialNo: string | null;
		category: LookupRow;
		status: LookupRow;
		condition: LookupRow | null;
		responsible: EmployeeRow | null;
		orgUnit: NamedRow | null;
		location: NamedRow | null;
	};
	type AssetRouteHref = "/assets/master" | "/assets/inspections" | "/assets/disposals";
	type ViewData = PageData & {
		canManageAssets?: boolean;
		assets: AssetRow[];
		categories: (LookupRow & { id: string })[];
		statuses: (LookupRow & { id: string })[];
		conditions: (LookupRow & { id: string })[];
		employees: EmployeeRow[];
		orgUnits: (NamedRow & { id: string })[];
		locations: (NamedRow & { id: string; is_active?: boolean | null })[];
		errors: Record<string, string | null>;
	};

	let { data: pageData, form }: { data: PageData; form?: ActionData } = $props();
	const data = $derived(pageData as ViewData);

	const uiLabels = $derived(getUiLabels(data.locale));
	let savePendingCreateAsset = $state(false);
	let createAssetDialogOpen = $state(false);
	let createAssetFormKey = $state(0);
	let search = $state("");
	let categoryFilter = $state<string>("ALL");
	let statusFilter = $state<string>("ALL");
	let pageSize = $state(10);
	let currentPage = $state(1);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ทะเบียนครุภัณฑ์ - ONE-IL",
					title: "ทะเบียนครุภัณฑ์",
					description: "เพิ่มและค้นดูครุภัณฑ์ พร้อมหมวดหมู่ สถานะ ผู้รับผิดชอบ และสถานที่",
					loadError: "ข้อมูลครุภัณฑ์หรือรายการอ้างอิงโหลดไม่สำเร็จ",
					create: "เพิ่มครุภัณฑ์",
					createTitle: "สร้างครุภัณฑ์",
					createDescription: "เพิ่มข้อมูลหลักก่อน แล้วแก้รายละเอียดอื่นในหน้าครุภัณฑ์",
					searchPlaceholder: "ค้นหาเลขครุภัณฑ์ ชื่อ Serial หรือผู้รับผิดชอบ",
					allCategories: "ทุกหมวดหมู่",
					allStatuses: "ทุกสถานะ",
					assetNo: "เลขครุภัณฑ์",
					nameTh: "ชื่อไทย",
					nameEn: "ชื่ออังกฤษ",
					category: "หมวดหมู่",
					status: "สถานะ",
					condition: "สภาพ",
					responsible: "ผู้รับผิดชอบ",
					orgUnit: "หน่วยงาน",
					location: "สถานที่",
					acquiredAt: "วันที่ได้มา",
					acquisitionCost: "มูลค่า",
					budgetSource: "แหล่งงบประมาณ",
					brand: "ยี่ห้อ",
					model: "รุ่น",
					serialNo: "Serial No.",
					documentRef: "เอกสารอ้างอิง",
					save: "บันทึกครุภัณฑ์",
					list: "รายการครุภัณฑ์",
					noRows: "ยังไม่มีครุภัณฑ์",
					noMatch: "ไม่พบครุภัณฑ์ตามเงื่อนไขที่เลือก",
					countLabel: "รายการ",
					colAsset: "ครุภัณฑ์",
					colCategory: "หมวดหมู่",
					colStatus: "สถานะ",
					colResponsible: "ผู้รับผิดชอบ",
					colOrgUnit: "หน่วยงาน",
					colLocation: "สถานที่",
					colSerial: "Serial No.",
					createSuccess: "บันทึกครุภัณฑ์สำเร็จ",
					masterData: "ข้อมูลอ้างอิง",
					inspections: "ตรวจนับ",
					disposals: "จำหน่าย",
				}
			: {
					pageTitle: "Asset Register - ONE-IL",
					title: "Asset register",
					description: "Create and review assets with category, status, responsible person, and location.",
					loadError: "Assets or reference data failed to load.",
					create: "Create asset",
					createTitle: "Create asset",
					createDescription: "Add the primary fields first. Edit other details on the asset page.",
					searchPlaceholder: "Search asset no, name, serial, or responsible",
					allCategories: "All categories",
					allStatuses: "All statuses",
					assetNo: "Asset no.",
					nameTh: "Thai name",
					nameEn: "English name",
					category: "Category",
					status: "Status",
					condition: "Condition",
					responsible: "Responsible",
					orgUnit: "Org unit",
					location: "Location",
					acquiredAt: "Acquired at",
					acquisitionCost: "Cost",
					budgetSource: "Budget source",
					brand: "Brand",
					model: "Model",
					serialNo: "Serial No.",
					documentRef: "Document ref",
					save: "Save asset",
					list: "Assets",
					noRows: "No assets yet.",
					noMatch: "No assets match current filters.",
					countLabel: "asset",
					colAsset: "Asset",
					colCategory: "Category",
					colStatus: "Status",
					colResponsible: "Responsible",
					colOrgUnit: "Org unit",
					colLocation: "Location",
					colSerial: "Serial No.",
					createSuccess: "Asset saved successfully",
					masterData: "Reference data",
					inspections: "Inspections",
					disposals: "Disposals",
				}
	);

	const hasErrors = $derived(Object.values(data.errors).some(Boolean));
	const routeLinks = $derived.by((): { href: AssetRouteHref; label: string }[] => {
		const links: { href: AssetRouteHref; label: string }[] = [];
		if (data.canManageAssets) links.push({ href: "/assets/master", label: copy.masterData });
		links.push({ href: "/assets/inspections", label: copy.inspections });
		links.push({ href: "/assets/disposals", label: copy.disposals });
		return links;
	});

	function routeActive(href: string): boolean {
		return page.url.pathname === href;
	}

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}

	function employeeName(employee: { employee_no?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined): string {
		if (!employee) return "—";
		const name = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
		return employee.employee_no ? `${employee.employee_no} ${name}`.trim() : name || "—";
	}

	function locationLabel(location: { code?: string | null; name?: string | null; name_en?: string | null } | null | undefined): string {
		if (!location) return "—";
		return `${location.code ?? ""} ${localizedDualField(data.locale, location.name ?? "", location.name_en)}`.trim();
	}

	function namedLabel(row: NamedRow | null | undefined): string {
		if (!row) return "—";
		const code = row.code ? `${row.code} ` : "";
		return `${code}${localizedDualField(data.locale, row.name, row.name_en)}`.trim();
	}

	function openCreateAssetDialog() {
		createAssetFormKey += 1;
		createAssetDialogOpen = true;
	}

	function openRow(assetId: string) {
		void goto(resolve(`/assets/${assetId}` as `/assets/${string}`));
	}

	function rowKeydown(e: KeyboardEvent, assetId: string) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			openRow(assetId);
		}
	}

	function resetPage() {
		currentPage = 1;
	}

	const filteredAssets = $derived.by(() => {
		const normalizedSearch = search.trim().toLowerCase();
		return data.assets.filter((asset) => {
			const responsible = employeeName(asset.responsible).toLowerCase();
			const matchesSearch =
				normalizedSearch.length === 0 ||
				asset.assetNo.toLowerCase().includes(normalizedSearch) ||
				asset.name.toLowerCase().includes(normalizedSearch) ||
				(asset.nameEn ?? "").toLowerCase().includes(normalizedSearch) ||
				(asset.serialNo ?? "").toLowerCase().includes(normalizedSearch) ||
				responsible.includes(normalizedSearch);
			const matchesCategory = categoryFilter === "ALL" || asset.category.id === categoryFilter;
			const matchesStatus = statusFilter === "ALL" || asset.status.id === statusFilter;
			return matchesSearch && matchesCategory && matchesStatus;
		});
	});

	const paginatedAssets = $derived(filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize));
	const formSuccess = $derived(
		typeof form === "object" && form !== null && "success" in form && form.success === true,
	);

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (formSuccess) toast.success(copy.createSuccess);
	});
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<section class="flex flex-col justify-between gap-3 md:flex-row md:items-end">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground text-sm">{copy.description}</p>
		</div>
		<nav
			class={cn(
				"bg-muted text-muted-foreground inline-flex h-auto w-fit flex-wrap gap-1 items-center justify-center rounded-lg p-[3px]",
			)}
			aria-label={copy.title}
		>
			{#each routeLinks as routeLink, i (routeLink.href)}
				<a
					href={resolve(routeLink.href)}
					aria-current={routeActive(routeLink.href) ? "page" : undefined}
					class={cn(
						"inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap transition-[color,box-shadow]",
						"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1 outline-none",
						routeActive(routeLink.href)
							? "border-transparent bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground"
							: "border-transparent text-foreground hover:bg-background/60 hover:text-foreground dark:text-muted-foreground dark:hover:bg-input/20 dark:hover:text-foreground",
					)}
				>
					{routeLink.label}
				</a>
			{/each}
		</nav>
	</section>

	{#if hasErrors || form?.message}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
			{form?.message ?? copy.loadError}
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-2">
		<div class="relative min-w-[220px] max-w-sm flex-1">
			<SearchIcon class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
			<Input placeholder={copy.searchPlaceholder} class="pl-9" bind:value={search} oninput={resetPage} />
		</div>
		<select
			class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 min-w-[160px] max-w-[240px] rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={categoryFilter}
			onchange={resetPage}
		>
			<option value="ALL">{copy.allCategories}</option>
			{#each data.categories as category, i (category.id)}
				<option value={category.id}>{localizedLookupLabel(data.locale, category)}</option>
			{/each}
		</select>
		<select
			class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 min-w-[140px] rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={statusFilter}
			onchange={resetPage}
		>
			<option value="ALL">{copy.allStatuses}</option>
			{#each data.statuses as status, i (status.id)}
				<option value={status.id}>{localizedLookupLabel(data.locale, status)}</option>
			{/each}
		</select>
		{#if data.canManageAssets}
			<Button type="button" onclick={openCreateAssetDialog}>
				<PlusIcon class="mr-2 size-4" />
				{copy.create}
			</Button>
		{/if}
		<p class="text-muted-foreground text-sm">
			{filteredAssets.length}
			{copy.countLabel}{filteredAssets.length !== 1 && data.locale !== "th" ? "s" : ""}
		</p>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{copy.colAsset}</Table.Head>
					<Table.Head>{copy.colCategory}</Table.Head>
					<Table.Head>{copy.colStatus}</Table.Head>
					<Table.Head>{copy.colResponsible}</Table.Head>
					<Table.Head>{copy.colOrgUnit}</Table.Head>
					<Table.Head>{copy.colLocation}</Table.Head>
					<Table.Head>{copy.colSerial}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each paginatedAssets as asset, i (asset.id)}
					<Table.Row
						class="hover:bg-muted/50 cursor-pointer"
						tabindex={0}
						role="button"
						onclick={() => openRow(asset.id)}
						onkeydown={(e) => rowKeydown(e, asset.id)}
					>
						<Table.Cell class="font-medium">
							<span class="text-primary underline-offset-2 hover:underline">{asset.assetNo}</span>
							<div class="text-muted-foreground text-xs">
								{localizedDualField(data.locale, asset.name, asset.nameEn)}
							</div>
						</Table.Cell>
						<Table.Cell>
							<Badge variant="secondary">{localizedLookupLabel(data.locale, asset.category)}</Badge>
						</Table.Cell>
						<Table.Cell>
							<div class="flex flex-wrap gap-1">
								<Badge variant="outline">{localizedLookupLabel(data.locale, asset.status)}</Badge>
								{#if asset.condition}
									<Badge variant="outline">{localizedLookupLabel(data.locale, asset.condition)}</Badge>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="text-muted-foreground">{employeeName(asset.responsible)}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{namedLabel(asset.orgUnit)}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{locationLabel(asset.location)}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{asset.serialNo ?? "—"}</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center">
							{data.assets.length === 0 ? copy.noRows : copy.noMatch}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		<DataTablePagination
			totalItems={filteredAssets.length}
			locale={data.locale}
			bind:pageSize
			bind:currentPage
		/>
	</div>
</div>

{#if data.canManageAssets}
	<Dialog.Root bind:open={createAssetDialogOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>{copy.createTitle}</Dialog.Title>
				<Dialog.Description>{copy.createDescription}</Dialog.Description>
			</Dialog.Header>
			{#key createAssetFormKey}
				<form
					method="POST"
					action="?/createAsset"
					use:enhance={pendingEnhance((v) => (savePendingCreateAsset = v), () => async ({ result, update }) => {
						if (result.type === "success" || result.type === "redirect") {
							createAssetDialogOpen = false;
						}
						await update({ reset: false, invalidateAll: true });
					})}
					class="grid gap-4"
				>
					<div class="grid gap-2 sm:grid-cols-2">
						<div class="grid gap-2">
							<Label for="create-asset-no">{copy.assetNo}</Label>
							<Input id="create-asset-no" name="assetNo" autocomplete="off" />
						</div>
						<div class="grid gap-2">
							<Label for="create-asset-name">{copy.nameTh}</Label>
							<Input id="create-asset-name" name="name" required />
						</div>
					</div>
					<div class="grid gap-2">
						<Label for="create-asset-name-en">{copy.nameEn}</Label>
						<Input id="create-asset-name-en" name="nameEn" />
					</div>
					<div class="grid gap-2 sm:grid-cols-2">
						<div class="grid gap-2">
							<Label for="create-asset-category">{copy.category}</Label>
							<select id="create-asset-category" name="categoryId" required class={selectClass()}>
								{#each data.categories as category, i (category.id)}
									<option value={category.id}>{localizedLookupLabel(data.locale, category)}</option>
								{/each}
							</select>
						</div>
						<div class="grid gap-2">
							<Label for="create-asset-status">{copy.status}</Label>
							<select id="create-asset-status" name="statusId" required class={selectClass()}>
								{#each data.statuses as status, i (status.id)}
									<option value={status.id}>{localizedLookupLabel(data.locale, status)}</option>
								{/each}
							</select>
						</div>
					</div>
					<Dialog.Footer>
						<SaveSubmitButton
							pending={savePendingCreateAsset}
							idleLabel={copy.save}
							savingLabel={uiLabels.formSaving}
						/>
					</Dialog.Footer>
				</form>
			{/key}
		</Dialog.Content>
	</Dialog.Root>
{/if}
