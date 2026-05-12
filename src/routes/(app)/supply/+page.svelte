<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { localizedDualField, localizedLookupLabel } from "$lib/i18n/display.js";
	import type { PageData } from "./$types.js";

	type Locale = PageData["locale"];
	type NamedRow = { id?: string; code?: string | null; name: string; name_en?: string | null };
	type LookupRow = { code: string; label_th: string; label_en?: string | null };
	type ViewData = {
		locale: Locale;
		lowStock: {
			quantity_on_hand: number;
			material_items: (NamedRow & { reorder_level: number }) | null;
			stock_locations: NamedRow | null;
		}[];
		pendingRequisitions: { id: string; requisition_no: string; purpose: string; status: string }[];
		assetsByStatus: { id: string; status: LookupRow | null }[];
		recentMovements: {
			id: string;
			movement_type: string;
			quantity: number;
			material_items: NamedRow | null;
			stock_locations: NamedRow | null;
		}[];
		errors: Record<string, string | null>;
	};

	let { data: pageData }: { data: PageData } = $props();
	const data = $derived(pageData as unknown as ViewData);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "พัสดุและครุภัณฑ์ - ONE-IL",
					title: "พัสดุและครุภัณฑ์",
					description: "ภาพรวมวัสดุคงคลัง ใบเบิกที่รอดำเนินการ และสถานะครุภัณฑ์",
					loadError: "ข้อมูลบางส่วนโหลดไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่",
					lowStock: "วัสดุใกล้หมด",
					pendingRequisitions: "ใบเบิกค้างดำเนินการ",
					assetStatuses: "สถานะครุภัณฑ์",
					recentMovements: "ความเคลื่อนไหวล่าสุด",
					materials: "ทะเบียนวัสดุ",
					requisitions: "ใบเบิกวัสดุ",
					receipts: "รับเข้าวัสดุ",
					assets: "ทะเบียนครุภัณฑ์",
					reports: "รายงาน",
					open: "เปิด",
					noLowStock: "ยังไม่มีรายการต่ำกว่าจุดสั่งซื้อ",
					noRequisitions: "ยังไม่มีใบเบิกที่ค้างดำเนินการ",
					noMovements: "ยังไม่มีความเคลื่อนไหว",
					quantity: "จำนวน",
					reorder: "จุดสั่งซื้อ",
				}
			: {
					pageTitle: "Supply & Assets - ONE-IL",
					title: "Supply & Assets",
					description: "Overview of material stock, pending requisitions, and asset register status.",
					loadError: "Some dashboard data failed to load. Please refresh and try again.",
					lowStock: "Low stock",
					pendingRequisitions: "Pending requisitions",
					assetStatuses: "Asset statuses",
					recentMovements: "Recent movements",
					materials: "Material master",
					requisitions: "Material requisitions",
					receipts: "Material receipts",
					assets: "Asset register",
					reports: "Reports",
					open: "Open",
					noLowStock: "No items are below reorder level.",
					noRequisitions: "No pending requisitions.",
					noMovements: "No stock movements yet.",
					quantity: "Qty",
					reorder: "Reorder",
				}
	);

	const hasErrors = $derived(Object.values(data.errors).some(Boolean));
	const assetStatusSummary = $derived.by(() => {
		const summary: Record<string, { label: string; count: number }> = {};
		for (const row of data.assetsByStatus) {
			const status = asOne(row.status);
			const key = status?.code ?? "unknown";
			summary[key] ??= {
				label: status ? localizedLookupLabel(data.locale, status) : key,
				count: 0,
			};
			summary[key].count += 1;
		}
		return Object.values(summary);
	});

	function asOne<T>(value: T | T[] | null | undefined): T | null {
		return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
	}

	function materialLabel(item: { code?: string | null; name?: string | null; name_en?: string | null } | null | undefined): string {
		if (!item) return "—";
		return `${item.code ?? ""} ${localizedDualField(data.locale, item.name ?? "", item.name_en)}`.trim();
	}

	function locationLabel(location: { name?: string | null; name_en?: string | null } | null | undefined): string {
		return location ? localizedDualField(data.locale, location.name ?? "", location.name_en) : "—";
	}

	function lowStockKey(row: ViewData["lowStock"][number]): string {
		return `${row.material_items?.id ?? row.material_items?.code ?? "material"}-${row.stock_locations?.id ?? row.stock_locations?.code ?? "location"}`;
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<section class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground text-sm">{copy.description}</p>
		</div>
	</section>

	{#if hasErrors}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
			{copy.loadError}
		</div>
	{/if}

	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
		{@render navCard(copy.materials, "/supply/materials", String(data.lowStock.length))}
		{@render navCard(copy.requisitions, "/supply/materials/requisitions", String(data.pendingRequisitions.length))}
		{@render navCard(copy.receipts, "/supply/materials/receipts", String(data.recentMovements.length))}
		{@render navCard(copy.assets, "/assets", String(data.assetsByStatus.length))}
		{@render navCard(copy.reports, "/supply/reports", String(data.lowStock.length + data.assetsByStatus.length))}
	</div>

	<div class="grid gap-4 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.lowStock}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.lowStock.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noLowStock}</p>
				{:else}
					{#each data.lowStock as row, i (lowStockKey(row))}
						<div class="rounded-lg border p-3">
							<div class="font-medium">{materialLabel(row.material_items)}</div>
							<div class="text-muted-foreground text-xs">{locationLabel(row.stock_locations)}</div>
							<div class="mt-2 flex gap-2 text-xs">
								<Badge variant="secondary">{copy.quantity}: {row.quantity_on_hand}</Badge>
								<Badge variant="outline">{copy.reorder}: {row.material_items?.reorder_level ?? 0}</Badge>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.pendingRequisitions}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.pendingRequisitions.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noRequisitions}</p>
				{:else}
					{#each data.pendingRequisitions as requisition, i (requisition.id)}
						<div class="rounded-lg border p-3">
							<div class="flex items-center justify-between gap-2">
								<div class="font-medium">{requisition.requisition_no}</div>
								<Badge variant="outline">{requisition.status}</Badge>
							</div>
							<p class="text-muted-foreground mt-1 line-clamp-2 text-sm">{requisition.purpose}</p>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.assetStatuses}</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-wrap gap-2">
				{#each assetStatusSummary as status, i (status.label)}
					<Badge variant="secondary">{status.label}: {status.count}</Badge>
				{/each}
				{#if assetStatusSummary.length === 0}
					<p class="text-muted-foreground text-sm">—</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.recentMovements}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.recentMovements.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noMovements}</p>
				{:else}
					{#each data.recentMovements as movement, i (movement.id)}
						<div class="rounded-lg border p-3">
							<div class="flex items-center justify-between gap-2">
								<div class="font-medium">{materialLabel(movement.material_items)}</div>
								<Badge variant="outline">{movement.movement_type}</Badge>
							</div>
							<div class="text-muted-foreground text-xs">
								{locationLabel(movement.stock_locations)} · {movement.quantity}
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

{#snippet navCard(title: string, href: string, count: string)}
	<Card.Root>
		<Card.Header>
			<Card.Title>{title}</Card.Title>
			<Card.Description>{count}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button href={href} variant="secondary" size="sm">{copy.open}</Button>
		</Card.Content>
	</Card.Root>
{/snippet}
