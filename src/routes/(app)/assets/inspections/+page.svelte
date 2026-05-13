<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
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
	type LookupRow = { id: string; code?: string | null; label_th: string; label_en?: string | null };
	type AssetRow = { asset_no?: string | null; name: string; name_en?: string | null };
	type ViewData = {
		locale: Locale;
		inspections: {
			id: string;
			fiscal_year: number;
			inspection_no: string;
			status: string;
			starts_at: string;
			ends_at?: string | null;
		}[];
		lines: {
			id: string;
			asset_id: string;
			found_status?: string | null;
			remark?: string | null;
			asset_registers: AssetRow | null;
		}[];
		conditions: LookupRow[];
		errors: Record<string, string | null>;
	};

	let { data: pageData, form }: { data: PageData; form?: ActionData } = $props();
	const data = $derived(pageData as unknown as ViewData);

	const keepForm: SubmitFunction = () => async ({ update }) => {
		await update({ reset: false, invalidateAll: true });
	};

	const foundStatuses = ["found", "not_found"] as const;
	const recommendations = ["keep_using", "repair", "dispose", "investigate"] as const;

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ตรวจนับครุภัณฑ์ - ONE-IL",
					title: "ตรวจนับครุภัณฑ์",
					description: "สร้างรอบตรวจนับประจำปีและบันทึกผลตรวจนับรายครุภัณฑ์",
					loadError: "ข้อมูลตรวจนับหรือรายการอ้างอิงโหลดไม่สำเร็จ",
					create: "สร้างรอบตรวจนับ",
					fiscalYear: "ปีงบประมาณ",
					startsAt: "วันเริ่ม",
					endsAt: "วันสิ้นสุด",
					note: "หมายเหตุ",
					save: "สร้างรอบตรวจนับ",
					inspections: "รอบตรวจนับ",
					lines: "รายการตรวจนับล่าสุด",
					foundStatus: "ผลพบ",
					condition: "สภาพ",
					recommendation: "ข้อเสนอแนะ",
					remark: "หมายเหตุ",
					record: "บันทึกผล",
					noInspections: "ยังไม่มีรอบตรวจนับ",
					noLines: "ยังไม่มีรายการตรวจนับ",
					success: "บันทึกสำเร็จ",
					back: "กลับทะเบียนครุภัณฑ์",
				}
			: {
					pageTitle: "Asset Inspections - ONE-IL",
					title: "Asset inspections",
					description: "Create annual inspection cycles and record per-asset inspection results.",
					loadError: "Inspection or reference data failed to load.",
					create: "Create inspection",
					fiscalYear: "Fiscal year",
					startsAt: "Starts at",
					endsAt: "Ends at",
					note: "Note",
					save: "Create inspection",
					inspections: "Inspections",
					lines: "Recent lines",
					foundStatus: "Found status",
					condition: "Condition",
					recommendation: "Recommendation",
					remark: "Remark",
					record: "Record result",
					noInspections: "No inspections yet.",
					noLines: "No inspection lines yet.",
					success: "Saved successfully",
					back: "Back to asset register",
				}
	);

	const hasErrors = $derived(Object.values(data.errors).some(Boolean));

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}

	function assetLabel(asset: { asset_no?: string | null; name?: string | null; name_en?: string | null } | null | undefined): string {
		if (!asset) return "—";
		return `${asset.asset_no ?? ""} ${localizedDualField(data.locale, asset.name ?? "", asset.name_en)}`.trim();
	}

	type FoundStatusKey = "found" | "not_found" | "pending";
	type RecommendationKey = "keep_using" | "repair" | "dispose" | "investigate";

	function inspectionCycleStatusLabel(status: string): string {
		const th: Record<string, string> = {
			draft: "ร่าง",
			in_progress: "กำลังตรวจนับ",
			completed: "เสร็จสิ้น",
			closed: "ปิดงาน",
			cancelled: "ยกเลิก",
		};
		const en: Record<string, string> = {
			draft: "Draft",
			in_progress: "In progress",
			completed: "Completed",
			closed: "Closed",
			cancelled: "Cancelled",
		};
		const map = data.locale === "th" ? th : en;
		return map[status] ?? status;
	}

	function foundStatusLabel(found: string | null | undefined): string {
		const key = (found ?? "pending") as FoundStatusKey;
		if (data.locale === "th") {
			if (key === "found") return "พบ";
			if (key === "not_found") return "ไม่พบ";
			return "รอบันทึก";
		}
		if (key === "found") return "Found";
		if (key === "not_found") return "Not found";
		return "Pending";
	}

	function recommendationLabel(value: string): string {
		const th: Record<RecommendationKey, string> = {
			keep_using: "ใช้งานต่อ",
			repair: "ซ่อมแซม",
			dispose: "จำหน่าย",
			investigate: "สืบสวนเพิ่ม",
		};
		const en: Record<RecommendationKey, string> = {
			keep_using: "Keep using",
			repair: "Repair",
			dispose: "Dispose",
			investigate: "Investigate",
		};
		const map = data.locale === "th" ? th : en;
		return value in map ? map[value as RecommendationKey] : value;
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<section class="space-y-3">
		<a href={resolve("/assets")} class="text-muted-foreground hover:text-foreground text-sm">{copy.back}</a>
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground text-sm">{copy.description}</p>
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

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.create}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/createInspection" use:enhance={keepForm} class="grid gap-3 md:grid-cols-4">
				<div class="space-y-1.5">
					<Label for="fiscalYear">{copy.fiscalYear}</Label>
					<Input id="fiscalYear" name="fiscalYear" type="number" min="2500" max="2700" required />
				</div>
				<div class="space-y-1.5">
					<Label for="startsAt">{copy.startsAt}</Label>
					<Input id="startsAt" name="startsAt" type="date" required />
				</div>
				<div class="space-y-1.5">
					<Label for="endsAt">{copy.endsAt}</Label>
					<Input id="endsAt" name="endsAt" type="date" />
				</div>
				<div class="flex items-end">
					<Button type="submit">{copy.save}</Button>
				</div>
				<div class="space-y-1.5 md:col-span-4">
					<Label for="note">{copy.note}</Label>
					<Textarea id="note" name="note" rows={2} />
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<div class="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.inspections}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.inspections.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noInspections}</p>
				{:else}
					{#each data.inspections as inspection, i (inspection.id)}
						<div class="rounded-lg border p-3">
							<div class="flex items-center justify-between gap-2">
								<div class="font-medium">{inspection.inspection_no}</div>
								<Badge variant="outline">{inspectionCycleStatusLabel(inspection.status)}</Badge>
							</div>
							<div class="text-muted-foreground text-xs">
								{copy.fiscalYear}: {inspection.fiscal_year} · {inspection.starts_at} - {inspection.ends_at ?? "—"}
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.lines}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.lines.length === 0}
					<p class="text-muted-foreground text-sm">{copy.noLines}</p>
				{:else}
					{#each data.lines as line, i (line.id)}
						<div class="rounded-lg border p-3">
							<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
								<div class="font-medium">{assetLabel(line.asset_registers)}</div>
								<Badge variant="secondary">{foundStatusLabel(line.found_status)}</Badge>
							</div>
							<form method="POST" action="?/recordResult" use:enhance={keepForm} class="grid gap-2 md:grid-cols-4">
								<input type="hidden" name="lineId" value={line.id} />
								<input type="hidden" name="assetId" value={line.asset_id} />
								<div class="space-y-1">
									<Label for={`found-${line.id}`} class="text-xs">{copy.foundStatus}</Label>
									<select id={`found-${line.id}`} name="foundStatus" class={selectClass()} required>
										{#each foundStatuses as status, statusIndex (status)}
											<option value={status}>{foundStatusLabel(status)}</option>
										{/each}
									</select>
								</div>
								<div class="space-y-1">
									<Label for={`condition-${line.id}`} class="text-xs">{copy.condition}</Label>
									<select id={`condition-${line.id}`} name="conditionId" class={selectClass()}>
										<option value="">—</option>
										{#each data.conditions as condition, conditionIndex (condition.id)}
											<option value={condition.id}>{localizedLookupLabel(data.locale, condition)}</option>
										{/each}
									</select>
								</div>
								<div class="space-y-1">
									<Label for={`recommendation-${line.id}`} class="text-xs">{copy.recommendation}</Label>
									<select id={`recommendation-${line.id}`} name="recommendation" class={selectClass()}>
										<option value="">—</option>
										{#each recommendations as recommendation, recommendationIndex (recommendation)}
											<option value={recommendation}>{recommendationLabel(recommendation)}</option>
										{/each}
									</select>
								</div>
								<div class="flex items-end">
									<Button type="submit" size="sm">{copy.record}</Button>
								</div>
								<div class="space-y-1 md:col-span-4">
									<Label for={`remark-${line.id}`} class="text-xs">{copy.remark}</Label>
									<Input id={`remark-${line.id}`} name="remark" value={line.remark ?? ""} />
								</div>
							</form>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
