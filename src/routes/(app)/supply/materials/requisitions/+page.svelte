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
	type EmployeeRow = { id?: string; first_name?: string | null; last_name?: string | null };
	type RequisitionLine = {
		id: string;
		item_id: string;
		requested_quantity: number;
		approved_quantity?: number | null;
		issued_quantity: number;
		material_items: NamedRow | null;
	};
	type ViewData = {
		locale: Locale;
		requisitions: {
			id: string;
			requisition_no: string;
			purpose: string;
			status: string;
			org_units: NamedRow | null;
			requester: EmployeeRow | null;
			material_requisition_lines: RequisitionLine[];
		}[];
		items: (NamedRow & { id: string; is_active?: boolean | null })[];
		locations: (NamedRow & { id: string; is_active?: boolean | null })[];
		orgUnits: (NamedRow & { id: string; sort_order?: number | null })[];
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
					pageTitle: "ใบเบิกวัสดุ - ONE-IL",
					title: "ใบเบิกวัสดุ",
					description: "สร้างใบเบิก อนุมัติจำนวน และจ่ายวัสดุจากคลัง",
					loadError: "ข้อมูลใบเบิกหรือรายการอ้างอิงโหลดไม่สำเร็จ",
					create: "สร้างใบเบิก",
					purpose: "วัตถุประสงค์",
					orgUnit: "หน่วยงาน",
					item: "วัสดุ",
					requestedQuantity: "จำนวนขอเบิก",
					save: "ส่งใบเบิก",
					requisitions: "รายการใบเบิก",
					requested: "ขอ",
					approved: "อนุมัติ",
					issued: "จ่ายแล้ว",
					approve: "อนุมัติ",
					issue: "จ่าย",
					location: "คลัง/สถานที่",
					noRows: "ยังไม่มีใบเบิก",
					success: "บันทึกสำเร็จ",
				}
			: {
					pageTitle: "Material Requisitions - ONE-IL",
					title: "Material requisitions",
					description: "Create requisitions, approve line quantities, and issue stock from locations.",
					loadError: "Requisitions or reference data failed to load.",
					create: "Create requisition",
					purpose: "Purpose",
					orgUnit: "Org unit",
					item: "Material",
					requestedQuantity: "Requested quantity",
					save: "Submit requisition",
					requisitions: "Requisitions",
					requested: "Requested",
					approved: "Approved",
					issued: "Issued",
					approve: "Approve",
					issue: "Issue",
					location: "Location",
					noRows: "No requisitions yet.",
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

	function employeeName(employee: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
		if (!employee) return "—";
		return `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "—";
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
			<Card.Title>{copy.create}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/createRequisition" use:enhance={keepForm} class="grid gap-3 md:grid-cols-2">
				<div class="space-y-1.5 md:col-span-2">
					<Label for="purpose">{copy.purpose}</Label>
					<Textarea id="purpose" name="purpose" rows={3} required />
				</div>
				<div class="space-y-1.5">
					<Label for="orgUnitId">{copy.orgUnit}</Label>
					<select id="orgUnitId" name="orgUnitId" class={selectClass()}>
						<option value="">—</option>
						{#each data.orgUnits as unit, i (unit.id)}
							<option value={unit.id}>{localizedDualField(data.locale, unit.name, unit.name_en)}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="itemId">{copy.item}</Label>
					<select id="itemId" name="itemId" required class={selectClass()}>
						{#each data.items as item, i (item.id)}
							<option value={item.id}>{materialLabel(item)}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="requestedQuantity">{copy.requestedQuantity}</Label>
					<Input id="requestedQuantity" name="requestedQuantity" type="number" min="0.01" step="0.01" required />
				</div>
				<div class="flex items-end">
					<Button type="submit">{copy.save}</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.requisitions}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if data.requisitions.length === 0}
				<p class="text-muted-foreground text-sm">{copy.noRows}</p>
			{:else}
				{#each data.requisitions as requisition, i (requisition.id)}
					<div class="rounded-lg border p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<div class="font-semibold">{requisition.requisition_no}</div>
								<div class="text-muted-foreground text-xs">
									{employeeName(requisition.requester)} · {requisition.org_units ? localizedDualField(data.locale, requisition.org_units.name, requisition.org_units.name_en) : "—"}
								</div>
								<p class="mt-2 text-sm">{requisition.purpose}</p>
							</div>
							<Badge variant="outline">{requisition.status}</Badge>
						</div>

						<div class="mt-4 space-y-3">
							{#each requisition.material_requisition_lines as line, lineIndex (line.id)}
								<div class="grid gap-3 rounded-md bg-muted/40 p-3 lg:grid-cols-[1fr_auto_auto]">
									<div>
										<div class="font-medium">{materialLabel(line.material_items)}</div>
										<div class="text-muted-foreground text-xs">
											{copy.requested}: {line.requested_quantity} · {copy.approved}: {line.approved_quantity ?? 0} · {copy.issued}: {line.issued_quantity}
										</div>
									</div>
									<form method="POST" action="?/approveLine" use:enhance={keepForm} class="flex flex-wrap items-end gap-2">
										<input type="hidden" name="requisitionId" value={requisition.id} />
										<input type="hidden" name="lineId" value={line.id} />
										<div class="w-28 space-y-1">
											<Label for={`approve-${line.id}`} class="text-xs">{copy.approved}</Label>
											<Input id={`approve-${line.id}`} name="approvedQuantity" type="number" min="0" step="0.01" value={line.approved_quantity ?? line.requested_quantity} />
										</div>
										<Button type="submit" size="sm" variant="secondary">{copy.approve}</Button>
									</form>
									<form method="POST" action="?/issueLine" use:enhance={keepForm} class="flex flex-wrap items-end gap-2">
										<input type="hidden" name="requisitionId" value={requisition.id} />
										<input type="hidden" name="lineId" value={line.id} />
										<input type="hidden" name="itemId" value={line.item_id} />
										<div class="w-40 space-y-1">
											<Label for={`location-${line.id}`} class="text-xs">{copy.location}</Label>
											<select id={`location-${line.id}`} name="locationId" required class={selectClass()}>
												{#each data.locations as location, locationIndex (location.id)}
													<option value={location.id}>{locationLabel(location)}</option>
												{/each}
											</select>
										</div>
										<div class="w-28 space-y-1">
											<Label for={`issue-${line.id}`} class="text-xs">{copy.issue}</Label>
											<Input id={`issue-${line.id}`} name="issueQuantity" type="number" min="0.01" step="0.01" />
										</div>
										<Button type="submit" size="sm">{copy.issue}</Button>
									</form>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</Card.Content>
	</Card.Root>
</div>
