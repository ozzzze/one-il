<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { localizedDualField, localizedLookupLabel } from "$lib/i18n/display.js";
	import { exportToCSV, exportToJSON } from "$lib/utils/export.js";
	import type { PageData } from "./$types.js";

	type Locale = PageData["locale"];
	type NamedRow = { code?: string | null; name: string; name_en?: string | null };
	type LookupRow = { code: string; label_th: string; label_en?: string | null };
	type EmployeeRow = { employee_no?: string | null; first_name?: string | null; last_name?: string | null };
	type BalanceRow = {
		quantity_on_hand: number;
		updated_at?: string | null;
		material_items: (NamedRow & { reorder_level?: number | null }) | null;
		stock_locations: NamedRow | null;
	};
	type AssetRow = {
		asset_no: string;
		name: string;
		name_en?: string | null;
		acquired_at?: string | null;
		acquisition_cost?: number | null;
		brand?: string | null;
		model?: string | null;
		serial_no?: string | null;
		category: LookupRow | null;
		status: LookupRow | null;
		responsible: EmployeeRow | null;
		org_units: NamedRow | null;
		stock_locations: NamedRow | null;
	};
	type InspectionRow = {
		found_status?: string | null;
		recommendation?: string | null;
		remark?: string | null;
		inspected_at?: string | null;
		asset_registers: Pick<AssetRow, "asset_no" | "name" | "name_en"> | null;
		condition: LookupRow | null;
		inspection: { fiscal_year?: number | null; inspection_no?: string | null; status?: string | null } | null;
	};
	type AuditEventRow = {
		entity_type: string;
		event_type: string;
		summary?: string | null;
		created_at?: string | null;
		actor: EmployeeRow | null;
	};
	type ViewData = {
		locale: Locale;
		balances: BalanceRow[];
		assets: AssetRow[];
		inspections: InspectionRow[];
		auditEvents: AuditEventRow[];
		errors: Record<string, string | null>;
	};

	let { data: pageData }: { data: PageData } = $props();
	const data = $derived(pageData as unknown as ViewData);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "รายงานพัสดุและครุภัณฑ์ - ONE-IL",
					title: "รายงานพัสดุและครุภัณฑ์",
					description: "สรุปยอดคงเหลือ ทะเบียนครุภัณฑ์ การตรวจนับ และประวัติการเปลี่ยนแปลง",
					loadError: "ข้อมูลรายงานบางส่วนโหลดไม่สำเร็จ",
					balances: "ยอดคงเหลือวัสดุ",
					assets: "ทะเบียนครุภัณฑ์",
					inspections: "ผลการตรวจนับ",
					auditEvents: "ประวัติการทำรายการ",
					csv: "CSV",
					json: "JSON",
					preview: "ตัวอย่างข้อมูล",
					noRows: "ยังไม่มีข้อมูล",
					quantity: "จำนวน",
					reorder: "จุดสั่งซื้อ",
					location: "สถานที่",
					status: "สถานะ",
					category: "หมวดหมู่",
					responsible: "ผู้รับผิดชอบ",
					condition: "สภาพ",
					fiscalYear: "ปีงบประมาณ",
					actor: "ผู้ทำรายการ",
				}
			: {
					pageTitle: "Supply Reports - ONE-IL",
					title: "Supply Reports",
					description: "Summaries for stock balances, asset register, inspections, and audit activity.",
					loadError: "Some report data failed to load.",
					balances: "Material balances",
					assets: "Asset register",
					inspections: "Inspection results",
					auditEvents: "Audit events",
					csv: "CSV",
					json: "JSON",
					preview: "Preview rows",
					noRows: "No data yet.",
					quantity: "Qty",
					reorder: "Reorder",
					location: "Location",
					status: "Status",
					category: "Category",
					responsible: "Responsible",
					condition: "Condition",
					fiscalYear: "Fiscal year",
					actor: "Actor",
				}
	);

	const hasErrors = $derived(Object.values(data.errors).some(Boolean));
	const balanceReport = $derived(data.balances.map((row) => balanceExportRow(row)));
	const assetReport = $derived(data.assets.map((row) => assetExportRow(row)));
	const inspectionReport = $derived(data.inspections.map((row) => inspectionExportRow(row)));
	const auditEventReport = $derived(data.auditEvents.map((row) => auditEventExportRow(row)));
	const previewBalances = $derived(data.balances.slice(0, 5));
	const previewAssets = $derived(data.assets.slice(0, 5));
	const previewInspections = $derived(data.inspections.slice(0, 5));
	const previewAuditEvents = $derived(data.auditEvents.slice(0, 5));

	function asOne<T>(value: T | T[] | null | undefined): T | null {
		return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
	}

	function namedLabel(row: NamedRow | null | undefined): string {
		if (!row) return "—";
		return `${row.code ?? ""} ${localizedDualField(data.locale, row.name, row.name_en)}`.trim();
	}

	function lookupLabel(row: LookupRow | LookupRow[] | null | undefined): string {
		const lookup = asOne(row);
		return lookup ? localizedLookupLabel(data.locale, lookup) : "—";
	}

	function employeeLabel(row: EmployeeRow | EmployeeRow[] | null | undefined): string {
		const employee = asOne(row);
		if (!employee) return "—";
		return `${employee.employee_no ?? ""} ${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "—";
	}

	function assetLabel(row: Pick<AssetRow, "asset_no" | "name" | "name_en"> | null | undefined): string {
		if (!row) return "—";
		return `${row.asset_no} ${localizedDualField(data.locale, row.name, row.name_en)}`.trim();
	}

	function formatDate(value: string | null | undefined): string {
		return value ? new Date(value).toLocaleDateString(data.locale === "th" ? "th-TH" : "en-US") : "—";
	}

	function exportButtons(rows: Record<string, unknown>[], filename: string) {
		return {
			csv: () => exportToCSV(rows, filename),
			json: () => exportToJSON(rows, filename),
		};
	}

	function balanceExportRow(row: BalanceRow): Record<string, unknown> {
		const item = asOne(row.material_items);
		const location = asOne(row.stock_locations);
		return {
			material: namedLabel(item),
			location: namedLabel(location),
			quantity_on_hand: row.quantity_on_hand,
			reorder_level: item?.reorder_level ?? null,
			updated_at: row.updated_at ?? null,
		};
	}

	function assetExportRow(row: AssetRow): Record<string, unknown> {
		return {
			asset_no: row.asset_no,
			name: localizedDualField(data.locale, row.name, row.name_en),
			category: lookupLabel(row.category),
			status: lookupLabel(row.status),
			responsible: employeeLabel(row.responsible),
			org_unit: namedLabel(asOne(row.org_units)),
			location: namedLabel(asOne(row.stock_locations)),
			brand: row.brand ?? null,
			model: row.model ?? null,
			serial_no: row.serial_no ?? null,
			acquired_at: row.acquired_at ?? null,
			acquisition_cost: row.acquisition_cost ?? null,
		};
	}

	function inspectionExportRow(row: InspectionRow): Record<string, unknown> {
		const inspection = asOne(row.inspection);
		return {
			asset: assetLabel(asOne(row.asset_registers)),
			inspection_no: inspection?.inspection_no ?? null,
			fiscal_year: inspection?.fiscal_year ?? null,
			status: inspection?.status ?? null,
			condition: lookupLabel(row.condition),
			found_status: row.found_status ?? null,
			recommendation: row.recommendation ?? null,
			remark: row.remark ?? null,
			inspected_at: row.inspected_at ?? null,
		};
	}

	function auditEventExportRow(row: AuditEventRow): Record<string, unknown> {
		return {
			entity_type: row.entity_type,
			event_type: row.event_type,
			summary: row.summary ?? null,
			actor: employeeLabel(row.actor),
			created_at: row.created_at ?? null,
		};
	}

	function balanceKey(row: BalanceRow): string {
		const item = asOne(row.material_items);
		const location = asOne(row.stock_locations);
		return `${item?.code ?? "material"}-${location?.code ?? "location"}-${row.updated_at ?? "latest"}`;
	}

	function inspectionKey(row: InspectionRow): string {
		const asset = asOne(row.asset_registers);
		const inspection = asOne(row.inspection);
		return `${asset?.asset_no ?? "asset"}-${inspection?.inspection_no ?? "inspection"}-${row.inspected_at ?? "latest"}`;
	}

	function auditEventKey(row: AuditEventRow): string {
		return `${row.created_at ?? "created"}-${row.entity_type}-${row.event_type}-${row.summary ?? ""}`;
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

	{#if hasErrors}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
			{copy.loadError}
		</div>
	{/if}

	<div class="grid gap-4 xl:grid-cols-2">
		{@render reportCard(copy.balances, data.balances.length, balanceReport, "supply-material-balances")}
		{@render reportCard(copy.assets, data.assets.length, assetReport, "supply-assets")}
		{@render reportCard(copy.inspections, data.inspections.length, inspectionReport, "supply-asset-inspections")}
		{@render reportCard(copy.auditEvents, data.auditEvents.length, auditEventReport, "supply-audit-events")}
	</div>

	<div class="grid gap-4 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.balances}</Card.Title>
				<Card.Description>{copy.preview}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if previewBalances.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noRows}</p>
				{:else}
					{#each previewBalances as balance, i (balanceKey(balance))}
						<div class="rounded-lg border p-3">
							<div class="font-medium">{namedLabel(asOne(balance.material_items))}</div>
							<div class="text-muted-foreground text-xs">{copy.location}: {namedLabel(asOne(balance.stock_locations))}</div>
							<div class="mt-2 flex flex-wrap gap-2 text-xs">
								<Badge variant="secondary">{copy.quantity}: {balance.quantity_on_hand}</Badge>
								<Badge variant="outline">{copy.reorder}: {asOne(balance.material_items)?.reorder_level ?? 0}</Badge>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.assets}</Card.Title>
				<Card.Description>{copy.preview}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if previewAssets.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noRows}</p>
				{:else}
					{#each previewAssets as asset, i (asset.asset_no)}
						<div class="rounded-lg border p-3">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div>
									<div class="font-medium">{assetLabel(asset)}</div>
									<div class="text-muted-foreground text-xs">{copy.location}: {namedLabel(asOne(asset.stock_locations))}</div>
								</div>
								<Badge variant="outline">{lookupLabel(asset.status)}</Badge>
							</div>
							<div class="mt-2 flex flex-wrap gap-2 text-xs">
								<Badge variant="secondary">{copy.category}: {lookupLabel(asset.category)}</Badge>
								<Badge variant="outline">{copy.responsible}: {employeeLabel(asset.responsible)}</Badge>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.inspections}</Card.Title>
				<Card.Description>{copy.preview}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if previewInspections.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noRows}</p>
				{:else}
					{#each previewInspections as inspection, i (inspectionKey(inspection))}
						<div class="rounded-lg border p-3">
							<div class="font-medium">{assetLabel(asOne(inspection.asset_registers))}</div>
							<div class="text-muted-foreground text-xs">
								{copy.fiscalYear}: {asOne(inspection.inspection)?.fiscal_year ?? "—"} · {formatDate(inspection.inspected_at)}
							</div>
							<div class="mt-2 flex flex-wrap gap-2 text-xs">
								<Badge variant="secondary">{copy.condition}: {lookupLabel(inspection.condition)}</Badge>
								<Badge variant="outline">{copy.status}: {inspection.found_status ?? asOne(inspection.inspection)?.status ?? "—"}</Badge>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.auditEvents}</Card.Title>
				<Card.Description>{copy.preview}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if previewAuditEvents.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noRows}</p>
				{:else}
					{#each previewAuditEvents as event, i (auditEventKey(event))}
						<div class="rounded-lg border p-3">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="font-medium">{event.event_type}</div>
								<Badge variant="outline">{event.entity_type}</Badge>
							</div>
							<p class="text-muted-foreground mt-1 line-clamp-2 text-sm">{event.summary ?? "—"}</p>
							<div class="text-muted-foreground mt-2 text-xs">
								{copy.actor}: {employeeLabel(event.actor)} · {formatDate(event.created_at)}
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

{#snippet reportCard(title: string, count: number, rows: Record<string, unknown>[], filename: string)}
	{@const actions = exportButtons(rows, filename)}
	<Card.Root>
		<Card.Header>
			<Card.Title>{title}</Card.Title>
			<Card.Description>{count}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-wrap gap-2">
			<Button type="button" variant="secondary" size="sm" disabled={rows.length === 0} onclick={actions.csv}>{copy.csv}</Button>
			<Button type="button" variant="outline" size="sm" disabled={rows.length === 0} onclick={actions.json}>{copy.json}</Button>
		</Card.Content>
	</Card.Root>
{/snippet}
