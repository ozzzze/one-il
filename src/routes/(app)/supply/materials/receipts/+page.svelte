<script lang="ts">
	import { enhance } from "$app/forms";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import type { SubmitFunction } from "@sveltejs/kit";
	import type { ActionData, PageData } from "./$types.js";

	type Locale = PageData["locale"];
	type NamedRow = { id?: string; code?: string | null; name: string; name_en?: string | null };
	type ViewData = {
		locale: Locale;
		receipts: {
			id: string;
			receipt_no: string;
			source_type: string;
			document_ref?: string | null;
			note?: string | null;
			stock_locations: NamedRow | null;
		}[];
		movements: {
			id: string;
			quantity: number;
			unit_cost?: number | null;
			material_items: NamedRow | null;
		}[];
		items: (NamedRow & { id: string; is_active?: boolean | null })[];
		locations: (NamedRow & { id: string; is_active?: boolean | null })[];
		errors: Record<string, string | null>;
	};

	let { data: pageData, form }: { data: PageData; form?: ActionData } = $props();
	const data = $derived(pageData as unknown as ViewData);

	const keepForm: SubmitFunction = () => async ({ update }) => {
		await update({ reset: false, invalidateAll: true });
	};

	const sourceTypes = ["purchase", "transfer", "return", "opening", "manual"] as const;

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "รับเข้าวัสดุ - ONE-IL",
					title: "รับเข้าวัสดุ",
					description: "บันทึกรับเข้าและดูความเคลื่อนไหววัสดุที่เกิดจากใบรับเข้า",
					loadError: "ข้อมูลรับเข้าหรือรายการอ้างอิงโหลดไม่สำเร็จ",
					createReceipt: "บันทึกรับเข้า",
					item: "วัสดุ",
					location: "สถานที่",
					quantity: "จำนวน",
					unitCost: "ราคาต่อหน่วย",
					sourceType: "แหล่งที่มา",
					documentRef: "เลขอ้างอิงเอกสาร",
					note: "หมายเหตุ",
					save: "บันทึกรับเข้า",
					receipts: "ใบรับเข้าล่าสุด",
					movements: "รายการเคลื่อนไหว",
					noReceipts: "ยังไม่มีใบรับเข้า",
					noMovements: "ยังไม่มีความเคลื่อนไหว",
					success: "บันทึกรับเข้าแล้ว",
				}
			: {
					pageTitle: "Material Receipts - ONE-IL",
					title: "Material receipts",
					description: "Record incoming stock and review receipt-linked material movements.",
					loadError: "Receipts or reference data failed to load.",
					createReceipt: "Create receipt",
					item: "Material",
					location: "Location",
					quantity: "Quantity",
					unitCost: "Unit cost",
					sourceType: "Source type",
					documentRef: "Document ref",
					note: "Note",
					save: "Save receipt",
					receipts: "Recent receipts",
					movements: "Movements",
					noReceipts: "No receipts yet.",
					noMovements: "No movements yet.",
					success: "Receipt saved",
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

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.createReceipt}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/createReceipt" use:enhance={keepForm} class="grid gap-3 md:grid-cols-3">
				<div class="space-y-1.5">
					<Label for="itemId">{copy.item}</Label>
					<select id="itemId" name="itemId" required class={selectClass()}>
						{#each data.items as item, i (item.id)}
							<option value={item.id}>{materialLabel(item)}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="locationId">{copy.location}</Label>
					<select id="locationId" name="locationId" required class={selectClass()}>
						{#each data.locations as location, i (location.id)}
							<option value={location.id}>{locationLabel(location)}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="quantity">{copy.quantity}</Label>
					<Input id="quantity" name="quantity" type="number" min="0.01" step="0.01" required />
				</div>
				<div class="space-y-1.5">
					<Label for="unitCost">{copy.unitCost}</Label>
					<Input id="unitCost" name="unitCost" type="number" min="0" step="0.01" />
				</div>
				<div class="space-y-1.5">
					<Label for="sourceType">{copy.sourceType}</Label>
					<select id="sourceType" name="sourceType" required class={selectClass()}>
						{#each sourceTypes as sourceType, i (sourceType)}
							<option value={sourceType}>{sourceType}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="documentRef">{copy.documentRef}</Label>
					<Input id="documentRef" name="documentRef" />
				</div>
				<div class="space-y-1.5 md:col-span-3">
					<Label for="note">{copy.note}</Label>
					<Textarea id="note" name="note" rows={3} />
				</div>
				<div class="md:col-span-3">
					<Button type="submit">{copy.save}</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<div class="grid gap-4 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.receipts}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.receipts.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noReceipts}</p>
				{:else}
					{#each data.receipts as receipt, i (receipt.id)}
						<div class="rounded-lg border p-3">
							<div class="flex items-center justify-between gap-2">
								<div class="font-medium">{receipt.receipt_no}</div>
								<Badge variant="outline">{receipt.source_type}</Badge>
							</div>
							<div class="text-muted-foreground text-xs">
								{locationLabel(receipt.stock_locations)} · {receipt.document_ref ?? "—"}
							</div>
							{#if receipt.note}
								<p class="mt-2 text-sm">{receipt.note}</p>
							{/if}
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.movements}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.movements.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noMovements}</p>
				{:else}
					{#each data.movements as movement, i (movement.id)}
						<div class="rounded-lg border p-3">
							<div class="flex items-center justify-between gap-2">
								<div class="font-medium">{materialLabel(movement.material_items)}</div>
								<Badge>{movement.quantity}</Badge>
							</div>
							<div class="text-muted-foreground text-xs">
								{movement.unit_cost ? `${copy.unitCost}: ${movement.unit_cost}` : copy.unitCost}
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
