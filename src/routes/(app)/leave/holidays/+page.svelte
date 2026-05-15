<script lang="ts">
	import { applyAction, enhance } from "$app/forms";

	import { goto, invalidate } from "$app/navigation";

	import DeleteConfirmDialog from "$lib/components/delete-confirm-dialog.svelte";

	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";

	import { pendingEnhance } from "$lib/forms/pending-enhance.js";

	import { Button } from "$lib/components/ui/button/index.js";

	import * as Dialog from "$lib/components/ui/dialog/index.js";

	import { Input } from "$lib/components/ui/input/index.js";

	import { Label } from "$lib/components/ui/label/index.js";

	import * as Table from "$lib/components/ui/table/index.js";

	import PlusIcon from "@lucide/svelte/icons/plus";

	import PencilIcon from "@lucide/svelte/icons/pencil";

	import TrashIcon from "@lucide/svelte/icons/trash-2";

	import { toast } from "svelte-sonner";

	import type { ActionData, PageData } from "./$types.js";

	type Holiday = PageData["holidays"][number];

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	let dialogOpen = $state(false);

	let mode = $state<"create" | "edit">("create");

	let selected = $state<Holiday | null>(null);

	let deleteOpen = $state(false);

	let deleteId = $state("");

	let savePending = $state(false);

	function normalizeDateInput(value: string): string {
		return value.length >= 10 ? value.slice(0, 10) : value;
	}

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "วันหยุด - ONE-IL",

					heading: "ปฏิทินวันหยุด",

					readOnlyHint: "ดูวันหยุดของคณะได้อย่างเดียว — การแก้ไขสำหรับ HR / ผู้ดูแลระบบ",

					year: "ปี",

					add: "เพิ่มวันหยุด",

					addDesc: "กำหนดวันหยุดของคณะสำหรับปีที่เลือก",

					edit: "แก้ไขวันหยุด",

					editDesc: "อัปเดตวันที่ ชื่อ หรือหมายเหตุของวันหยุด",

					empty: "ยังไม่มีวันหยุดในปีนี้",

					columns: { date: "วันที่", name: "ชื่อ", notes: "หมายเหตุ", actions: "การกระทำ" },

					date: "วันที่",

					nameTh: "ชื่อ (ไทย)",

					nameEn: "ชื่อ (อังกฤษ)",

					notes: "หมายเหตุ",

					prevYear: "ปีก่อน",

					nextYear: "ปีถัดไป",

					cancel: "ยกเลิก",
				}
			: {
					pageTitle: "Holidays - ONE-IL",

					heading: "Holiday calendar",

					readOnlyHint: "View-only for staff — edits are limited to HR / administrators.",

					year: "Year",

					add: "Add holiday",

					addDesc: "Add a faculty holiday for the selected year.",

					edit: "Edit holiday",

					editDesc: "Update the date, names, or notes for this holiday.",

					empty: "No holidays recorded for this year.",

					columns: { date: "Date", name: "Name", notes: "Notes", actions: "Actions" },

					date: "Date",

					nameTh: "Name (Thai)",

					nameEn: "Name (English)",

					notes: "Notes",

					prevYear: "Previous year",

					nextYear: "Next year",

					cancel: "Cancel",
				}
	);

	function formatDisplayDate(isoDate: string): string {
		const [y, m, d] = isoDate.split("-").map(Number);

		const dt = new Date(y, m - 1, d);

		return dt.toLocaleDateString(data.locale === "th" ? "th-TH" : "en-US", {
			weekday: "short",

			year: "numeric",

			month: "short",

			day: "numeric",
		});
	}

	function openCreate() {
		mode = "create";

		selected = null;

		dialogOpen = true;
	}

	function openEdit(row: Holiday) {
		mode = "edit";

		selected = row;

		dialogOpen = true;
	}

	function openDelete(id: string) {
		deleteId = id;

		deleteOpen = true;
	}

	let lastFormFeedback = $state("");

	$effect(() => {
		if (!form) return;

		const snapshot = JSON.stringify({
			action: form.action,

			message: form.message,

			success: form.success,
		});

		if (snapshot === lastFormFeedback) return;

		lastFormFeedback = snapshot;

		if (form.message) {
			toast.error(form.message);
		}

		if (form.success && form.action === "deleteHoliday") {
			toast.success(data.locale === "th" ? "ลบวันหยุดแล้ว" : "Holiday deleted");
		}
	});

	function isSaveHolidaySuccess(result: { type: string; data?: unknown }): boolean {
		if (result.type !== "success") return false;

		const payload = result.data as { action?: string } | undefined;

		return payload?.action === "saveHoliday";
	}

	function holidayFormEnhance() {
		return pendingEnhance(
			(v) => (savePending = v),
			() =>
				async ({ formData, result, update }) => {
					await applyAction(result);

					if (result.type === "failure") {
						await update({ reset: false });

						return;
					}

					if (isSaveHolidaySuccess(result)) {
						toast.success(data.locale === "th" ? "บันทึกวันหยุดสำเร็จ" : "Holiday saved");

						dialogOpen = false;

						const holidayDate = String(formData.get("holidayDate") ?? "");

						const savedYear = Number(holidayDate.slice(0, 4));

						if (Number.isFinite(savedYear) && savedYear !== data.year) {
							await goto(`/leave/holidays?year=${savedYear}`, {
								invalidateAll: true,
								keepFocus: true,
							});
						} else {
							await invalidate("leave:holidays");
						}

						await update({ reset: false });

						return;
					}

					await update({ reset: false });
				}
		);
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold">{copy.heading}</h2>

			{#if !data.canManage}
				<p class="text-muted-foreground text-xs">{copy.readOnlyHint}</p>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-muted-foreground text-sm">{copy.year}</span>

			<div class="flex items-center gap-1">
				<Button variant="outline" size="sm" href="/leave/holidays?year={data.year - 1}">
					{copy.prevYear}
				</Button>

				<span class="min-w-12 text-center text-sm font-medium tabular-nums">{data.year}</span>

				<Button variant="outline" size="sm" href="/leave/holidays?year={data.year + 1}">
					{copy.nextYear}
				</Button>
			</div>

			{#if data.canManage}
				<Button type="button" size="sm" onclick={openCreate}>
					<PlusIcon class="size-4" />

					{copy.add}
				</Button>
			{/if}
		</div>
	</div>

	<div class="border-border overflow-hidden rounded-xl border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{copy.columns.date}</Table.Head>

					<Table.Head>{copy.columns.name}</Table.Head>

					<Table.Head class="hidden md:table-cell">{copy.columns.notes}</Table.Head>

					{#if data.canManage}
						<Table.Head class="w-28 text-end">{copy.columns.actions}</Table.Head>
					{/if}
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#if data.holidays.length === 0}
					<Table.Row>
						<Table.Cell
							colspan={data.canManage ? 4 : 3}
							class="text-muted-foreground h-24 text-center"
						>
							{copy.empty}
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each data.holidays as row (row.id)}
						<Table.Row>
							<Table.Cell class="whitespace-nowrap tabular-nums">
								{formatDisplayDate(row.holidayDate)}
							</Table.Cell>

							<Table.Cell>{row.name}</Table.Cell>

							<Table.Cell class="text-muted-foreground hidden max-w-md truncate md:table-cell">
								{row.notes || "—"}
							</Table.Cell>

							{#if data.canManage}
								<Table.Cell class="text-end">
									<div class="flex justify-end gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onclick={() => openEdit(row)}
											aria-label={copy.edit}
										>
											<PencilIcon class="size-4" />
										</Button>

										<Button
											type="button"
											variant="ghost"
											size="icon"
											class="text-destructive"
											onclick={() => openDelete(row.id)}
											aria-label="Delete"
										>
											<TrashIcon class="size-4" />
										</Button>
									</div>
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</div>

{#if data.canManage}
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>{mode === "create" ? copy.add : copy.edit}</Dialog.Title>

				<Dialog.Description>
					{mode === "create" ? copy.addDesc : copy.editDesc}
				</Dialog.Description>
			</Dialog.Header>

			{#key selected?.id ?? "create"}
				<form
					method="POST"
					action="?/saveHoliday"
					use:enhance={holidayFormEnhance()}
					class="space-y-4"
				>
					{#if mode === "edit" && selected}
						<input type="hidden" name="id" value={selected.id} />
					{/if}

					<div class="space-y-2">
						<Label for="holidayDate">{copy.date}</Label>

						<Input
							id="holidayDate"
							name="holidayDate"
							type="date"
							required
							value={normalizeDateInput(selected?.holidayDate ?? "")}
						/>
					</div>

					<div class="space-y-2">
						<Label for="nameTh">{copy.nameTh}</Label>

						<Input id="nameTh" name="nameTh" required value={selected?.nameTh ?? ""} />
					</div>

					<div class="space-y-2">
						<Label for="nameEn">{copy.nameEn}</Label>

						<Input id="nameEn" name="nameEn" value={selected?.nameEn ?? ""} />
					</div>

					<div class="space-y-2">
						<Label for="notes">{copy.notes}</Label>

						<Input id="notes" name="notes" value={selected?.notes ?? ""} />
					</div>

					<Dialog.Footer class="gap-3">
						<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>
							{copy.cancel}
						</Button>

						<SaveSubmitButton
							pending={savePending}
							idleLabel={data.locale === "th" ? "บันทึก" : "Save"}
							savingLabel={data.locale === "th" ? "กำลังบันทึก..." : "Saving..."}
						/>
					</Dialog.Footer>
				</form>
			{/key}
		</Dialog.Content>
	</Dialog.Root>

	<DeleteConfirmDialog
		bind:open={deleteOpen}
		action="?/deleteHoliday"
		id={deleteId}
		itemName={data.locale === "th" ? "วันหยุด" : "holiday"}
		locale={data.locale}
		reloadKey="leave:holidays"
	/>
{/if}
