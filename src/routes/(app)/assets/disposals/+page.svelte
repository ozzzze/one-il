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
	type LookupRow = { code?: string | null; label_th: string; label_en?: string | null };
	type AssetRow = { id: string; asset_no?: string | null; name: string; name_en?: string | null; status?: LookupRow | null };
	type EmployeeRow = { first_name?: string | null; last_name?: string | null };
	type DisposalLine = {
		id: string;
		estimated_value?: number | null;
		final_value?: number | null;
		asset_registers: AssetRow | null;
	};
	type ViewData = {
		locale: Locale;
		disposals: {
			id: string;
			disposal_no: string;
			method: string;
			reason: string;
			status: string;
			requested_at: string;
			proceeds_amount?: number | null;
			requester: EmployeeRow | null;
			asset_disposal_lines: DisposalLine[];
		}[];
		assets: AssetRow[];
		errors: Record<string, string | null>;
	};

	let { data: pageData, form }: { data: PageData; form?: ActionData } = $props();
	const data = $derived(pageData as unknown as ViewData);

	const keepForm: SubmitFunction = () => async ({ update }) => {
		await update({ reset: false, invalidateAll: true });
	};

	const methods = ["sale", "transfer", "convert", "destroy", "write_off_lost"] as const;
	const statuses = ["approved", "completed", "rejected", "cancelled"] as const;
	type MethodKey = (typeof methods)[number];
	function disposalMethodLabel(method: string): string {
		const th: Record<MethodKey, string> = {
			sale: "ขาย",
			transfer: "โอน",
			convert: "แปลงสภาพ",
			destroy: "ทำลาย",
			write_off_lost: "ตัดจากบัญชี/สูญหาย",
		};
		const en: Record<MethodKey, string> = {
			sale: "Sale",
			transfer: "Transfer",
			convert: "Convert",
			destroy: "Destroy",
			write_off_lost: "Write-off / lost",
		};
		const map = data.locale === "th" ? th : en;
		return method in map ? map[method as MethodKey] : method;
	}

	function disposalStatusLabel(status: string): string {
		const th: Record<string, string> = {
			submitted: "ส่งคำขอแล้ว",
			approved: "อนุมัติ",
			completed: "เสร็จสิ้น",
			rejected: "ปฏิเสธ",
			cancelled: "ยกเลิก",
		};
		const en: Record<string, string> = {
			submitted: "Submitted",
			approved: "Approved",
			completed: "Completed",
			rejected: "Rejected",
			cancelled: "Cancelled",
		};
		const map = data.locale === "th" ? th : en;
		return map[status] ?? status;
	}

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "จำหน่ายครุภัณฑ์ - ONE-IL",
					title: "จำหน่ายครุภัณฑ์",
					description: "สร้างคำขอจำหน่ายและอัปเดตสถานะการดำเนินการ",
					loadError: "ข้อมูลจำหน่ายหรือรายการครุภัณฑ์โหลดไม่สำเร็จ",
					create: "สร้างคำขอจำหน่าย",
					asset: "ครุภัณฑ์",
					method: "วิธีจำหน่าย",
					reason: "เหตุผล",
					estimatedValue: "มูลค่าประเมิน",
					save: "ส่งคำขอ",
					requests: "คำขอจำหน่าย",
					status: "สถานะ",
					proceeds: "เงินรับจริง",
					update: "อัปเดต",
					noRows: "ยังไม่มีคำขอจำหน่าย",
					success: "บันทึกสำเร็จ",
					back: "กลับทะเบียนครุภัณฑ์",
				}
			: {
					pageTitle: "Asset Disposals - ONE-IL",
					title: "Asset disposals",
					description: "Create disposal requests and update their workflow status.",
					loadError: "Disposal or asset data failed to load.",
					create: "Create disposal request",
					asset: "Asset",
					method: "Method",
					reason: "Reason",
					estimatedValue: "Estimated value",
					save: "Submit request",
					requests: "Disposal requests",
					status: "Status",
					proceeds: "Proceeds",
					update: "Update",
					noRows: "No disposal requests yet.",
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

	function employeeName(employee: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
		if (!employee) return "—";
		return `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "—";
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
			<form method="POST" action="?/createDisposal" use:enhance={keepForm} class="grid gap-3 md:grid-cols-3">
				<div class="space-y-1.5">
					<Label for="assetId">{copy.asset}</Label>
					<select id="assetId" name="assetId" class={selectClass()} required>
						{#each data.assets as asset, i (asset.id)}
							<option value={asset.id}>
								{assetLabel(asset)} · {asset.status ? localizedLookupLabel(data.locale, asset.status) : "—"}
							</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="method">{copy.method}</Label>
					<select id="method" name="method" class={selectClass()} required>
						{#each methods as method, i (method)}
							<option value={method}>{disposalMethodLabel(method)}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="estimatedValue">{copy.estimatedValue}</Label>
					<Input id="estimatedValue" name="estimatedValue" type="number" min="0" step="0.01" />
				</div>
				<div class="space-y-1.5 md:col-span-3">
					<Label for="reason">{copy.reason}</Label>
					<Textarea id="reason" name="reason" rows={3} required />
				</div>
				<div class="md:col-span-3">
					<Button type="submit">{copy.save}</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.requests}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if data.disposals.length === 0}
				<p class="text-muted-foreground text-sm">{copy.noRows}</p>
			{:else}
				{#each data.disposals as disposal, i (disposal.id)}
					<div class="rounded-lg border p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<div class="font-semibold">{disposal.disposal_no}</div>
								<div class="text-muted-foreground text-xs">
									{disposalMethodLabel(disposal.method)} · {employeeName(disposal.requester)} · {disposal.requested_at}
								</div>
								<p class="mt-2 text-sm">{disposal.reason}</p>
							</div>
							<Badge variant="outline">{disposalStatusLabel(disposal.status)}</Badge>
						</div>

						<div class="mt-3 grid gap-2">
							{#each disposal.asset_disposal_lines as line, lineIndex (line.id)}
								<div class="rounded-md bg-muted/40 p-3 text-sm">
									<div class="font-medium">{assetLabel(line.asset_registers)}</div>
									<div class="text-muted-foreground text-xs">
										{copy.estimatedValue}: {line.estimated_value ?? 0} · {copy.proceeds}: {line.final_value ?? disposal.proceeds_amount ?? 0}
									</div>
								</div>
							{/each}
						</div>

						<form method="POST" action="?/updateStatus" use:enhance={keepForm} class="mt-3 flex flex-wrap items-end gap-2">
							<input type="hidden" name="disposalId" value={disposal.id} />
							<div class="w-44 space-y-1">
								<Label for={`status-${disposal.id}`} class="text-xs">{copy.status}</Label>
								<select id={`status-${disposal.id}`} name="status" class={selectClass()} required>
									{#each statuses as status, statusIndex (status)}
										<option value={status}>{disposalStatusLabel(status)}</option>
									{/each}
								</select>
							</div>
							<div class="w-36 space-y-1">
								<Label for={`proceeds-${disposal.id}`} class="text-xs">{copy.proceeds}</Label>
								<Input id={`proceeds-${disposal.id}`} name="proceedsAmount" type="number" min="0" step="0.01" value={disposal.proceeds_amount ?? ""} />
							</div>
							<Button type="submit" size="sm">{copy.update}</Button>
						</form>
					</div>
				{/each}
			{/if}
		</Card.Content>
	</Card.Root>
</div>
