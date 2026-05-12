<script lang="ts">
	import { enhance } from "$app/forms";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { localizedDualField, localizedLookupLabel } from "$lib/i18n/display.js";
	import type { SubmitFunction } from "@sveltejs/kit";
	import type { ActionData, PageData } from "./$types.js";

	type Locale = PageData["locale"];
	type LookupRow = { id: string; code: string; label_th: string; label_en?: string | null };
	type OrgUnitRow = { id: string; code?: string | null; name: string; name_en?: string | null; sort_order?: number | null };
	type NamedRow = { id?: string; code?: string | null; name: string; name_en?: string | null };
	type MaterialRow = NamedRow & {
		id: string;
		specification?: string | null;
		reorder_level: number;
		is_active: boolean;
		category: LookupRow;
		unit: LookupRow;
	};
	type LocationRow = NamedRow & { id: string; org_unit_id?: string | null; is_active?: boolean | null; sort_order?: number | null };
	type BalanceRow = {
		item_id: string;
		location_id: string;
		quantity_on_hand: number;
		material_items: (NamedRow & { reorder_level?: number | null }) | null;
		stock_locations: NamedRow | null;
	};
	type ViewData = {
		locale: Locale;
		items: MaterialRow[];
		balances: BalanceRow[];
		categories: LookupRow[];
		units: LookupRow[];
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
					pageTitle: "ทะเบียนวัสดุ - ONE-IL",
					title: "ทะเบียนวัสดุ",
					description: "จัดการรายการวัสดุ หน่วยนับ หมวดหมู่ และยอดคงเหลือตามสถานที่",
					loadError: "ข้อมูลอ้างอิงบางส่วนโหลดไม่สำเร็จ",
					createMaterial: "เพิ่มวัสดุ",
					createLocation: "เพิ่มคลัง/สถานที่",
					code: "รหัส",
					nameTh: "ชื่อไทย",
					nameEn: "ชื่ออังกฤษ",
					category: "หมวดหมู่",
					unit: "หน่วยนับ",
					specification: "รายละเอียด",
					reorderLevel: "จุดสั่งซื้อ",
					active: "ใช้งาน",
					orgUnit: "หน่วยงาน",
					descriptionLabel: "คำอธิบาย",
					saveMaterial: "บันทึกวัสดุ",
					saveLocation: "บันทึกสถานที่",
					materials: "รายการวัสดุ",
					balances: "ยอดคงเหลือ",
					locations: "คลัง/สถานที่",
					noMaterials: "ยังไม่มีวัสดุ",
					noBalances: "ยังไม่มียอดคงเหลือ",
					success: "บันทึกสำเร็จ",
				}
			: {
					pageTitle: "Material Master - ONE-IL",
					title: "Material master",
					description: "Manage material items, units, categories, and stock balances by location.",
					loadError: "Some reference data failed to load.",
					createMaterial: "Create material",
					createLocation: "Create location",
					code: "Code",
					nameTh: "Thai name",
					nameEn: "English name",
					category: "Category",
					unit: "Unit",
					specification: "Specification",
					reorderLevel: "Reorder level",
					active: "Active",
					orgUnit: "Org unit",
					descriptionLabel: "Description",
					saveMaterial: "Save material",
					saveLocation: "Save location",
					materials: "Materials",
					balances: "Balances",
					locations: "Locations",
					noMaterials: "No materials yet.",
					noBalances: "No balances yet.",
					success: "Saved successfully",
				}
	);

	const hasErrors = $derived(Object.values(data.errors).some(Boolean));

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}

	function materialLabel(item: { code?: string | null; name?: string | null; name_en?: string | null } | null | undefined): string {
		if (!item) return "—";
		return `${item.code ?? ""} ${localizedDualField(data.locale, item.name ?? "", item.name_en)}`.trim();
	}

	function locationLabel(location: { code?: string | null; name?: string | null; name_en?: string | null } | null | undefined): string {
		if (!location) return "—";
		return `${location.code ?? ""} ${localizedDualField(data.locale, location.name ?? "", location.name_en)}`.trim();
	}

	function orgUnitLabelById(orgUnitId: string | null | undefined): string {
		const unit = data.orgUnits.find((row) => row.id === orgUnitId);
		return unit ? localizedDualField(data.locale, unit.name, unit.name_en) : "—";
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<section class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground text-sm">{copy.description}</p>
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

	<div class="grid gap-4 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.createMaterial}</Card.Title>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/createMaterial" use:enhance={keepForm} class="grid gap-3 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="material-code">{copy.code}</Label>
						<Input id="material-code" name="code" required />
					</div>
					<div class="space-y-1.5">
						<Label for="material-reorder">{copy.reorderLevel}</Label>
						<Input id="material-reorder" name="reorderLevel" type="number" min="0" value="0" required />
					</div>
					<div class="space-y-1.5">
						<Label for="material-name">{copy.nameTh}</Label>
						<Input id="material-name" name="name" required />
					</div>
					<div class="space-y-1.5">
						<Label for="material-name-en">{copy.nameEn}</Label>
						<Input id="material-name-en" name="nameEn" />
					</div>
					<div class="space-y-1.5">
						<Label for="material-category">{copy.category}</Label>
						<select id="material-category" name="categoryId" required class={selectClass()}>
							{#each data.categories as category, i (category.id)}
								<option value={category.id}>{localizedLookupLabel(data.locale, category)}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1.5">
						<Label for="material-unit">{copy.unit}</Label>
						<select id="material-unit" name="unitId" required class={selectClass()}>
							{#each data.units as unit, i (unit.id)}
								<option value={unit.id}>{localizedLookupLabel(data.locale, unit)}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1.5 sm:col-span-2">
						<Label for="material-specification">{copy.specification}</Label>
						<Textarea id="material-specification" name="specification" rows={3} />
					</div>
					<input type="hidden" name="isActive" value="true" />
					<div class="sm:col-span-2">
						<Button type="submit">{copy.saveMaterial}</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.createLocation}</Card.Title>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/createLocation" use:enhance={keepForm} class="grid gap-3 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="location-code">{copy.code}</Label>
						<Input id="location-code" name="code" required />
					</div>
					<div class="space-y-1.5">
						<Label for="location-org">{copy.orgUnit}</Label>
						<select id="location-org" name="orgUnitId" class={selectClass()}>
							<option value="">—</option>
							{#each data.orgUnits as unit, i (unit.id)}
								<option value={unit.id}>{localizedDualField(data.locale, unit.name, unit.name_en)}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1.5">
						<Label for="location-name">{copy.nameTh}</Label>
						<Input id="location-name" name="name" required />
					</div>
					<div class="space-y-1.5">
						<Label for="location-name-en">{copy.nameEn}</Label>
						<Input id="location-name-en" name="nameEn" />
					</div>
					<div class="space-y-1.5 sm:col-span-2">
						<Label for="location-description">{copy.descriptionLabel}</Label>
						<Textarea id="location-description" name="description" rows={3} />
					</div>
					<div class="sm:col-span-2">
						<Button type="submit">{copy.saveLocation}</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.materials}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.items.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noMaterials}</p>
				{:else}
					{#each data.items as item, i (item.id)}
						<div class="rounded-lg border p-3">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div>
									<div class="font-medium">{materialLabel(item)}</div>
									<div class="text-muted-foreground text-xs">{item.specification ?? ""}</div>
								</div>
								<Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? copy.active : "—"}</Badge>
							</div>
							<div class="mt-2 flex flex-wrap gap-2 text-xs">
								<Badge variant="secondary">{localizedLookupLabel(data.locale, item.category)}</Badge>
								<Badge variant="outline">{localizedLookupLabel(data.locale, item.unit)}</Badge>
								<Badge variant="outline">{copy.reorderLevel}: {item.reorder_level}</Badge>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.balances}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.balances.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noBalances}</p>
				{:else}
					{#each data.balances as balance, i (`${balance.item_id}-${balance.location_id}`)}
						<div class="rounded-lg border p-3">
							<div class="flex items-center justify-between gap-3">
								<div>
									<div class="font-medium">{materialLabel(balance.material_items)}</div>
									<div class="text-muted-foreground text-xs">{locationLabel(balance.stock_locations)}</div>
								</div>
								<Badge>{balance.quantity_on_hand}</Badge>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.locations}</Card.Title>
		</Card.Header>
		<Card.Content class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each data.locations as location, i (location.id)}
				<div class="rounded-lg border p-3">
					<div class="font-medium">{locationLabel(location)}</div>
					<div class="text-muted-foreground text-xs">
						{orgUnitLabelById(location.org_unit_id)}
					</div>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
