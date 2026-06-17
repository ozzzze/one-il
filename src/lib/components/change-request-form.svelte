<script lang="ts">
	import FormRequiredNote from "$lib/components/form-required-note.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import NativeSelect from "$lib/components/native-select.svelte";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { CHANGE_CATEGORY_LABELS } from "$lib/change-request/labels.js";
	import type {
		ChangeCategory,
		ChangeRequestDetail,
		ExceptionTypeOption,
		ItSystemOption,
	} from "$lib/server/one-leave/change-request/types.js";
	import NotepadTextDashedIcon from "@lucide/svelte/icons/notepad-text-dashed";
	import SaveIcon from "@lucide/svelte/icons/save";

	interface Props {
		itSystems: ItSystemOption[];
		exceptionTypes: ExceptionTypeOption[];
		record?: Partial<ChangeRequestDetail>;
		readonly?: boolean;
	}

	let { itSystems, exceptionTypes, record, readonly = false }: Props = $props();

	const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
	const defaultToday = toIsoDate(new Date());

	function toDatetimeLocalValue(iso: string | null | undefined): string {
		if (!iso) return "";
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	let itSystemId = $state(record?.itSystemId ? String(record.itSystemId) : "");
	let exceptionTypeId = $state(record?.exceptionTypeId ? String(record.exceptionTypeId) : "");
	let changeCategory = $state<ChangeCategory | "">(record?.changeCategory ?? "");
	let title = $state(record?.title ?? "");
	let description = $state(record?.description ?? "");
	let businessJustification = $state(record?.businessJustification ?? "");
	let riskAssessment = $state(record?.riskAssessment ?? "");
	let compensatingControls = $state(record?.compensatingControls ?? "");
	let impactDescription = $state(record?.impactDescription ?? "");
	let exceptionStartDate = $state(record?.exceptionStartDate ?? defaultToday);
	let exceptionEndDate = $state(record?.exceptionEndDate ?? defaultToday);
	let rollbackPlan = $state(record?.rollbackPlan ?? "");
	let plannedImplementationAt = $state(toDatetimeLocalValue(record?.plannedImplementationAt));

	const categoryOptions = Object.entries(CHANGE_CATEGORY_LABELS) as [ChangeCategory, string][];

	function itSystemLabel(id: string): string {
		if (!id) return "— เลือกระบบ —";
		return itSystems.find((s) => String(s.id) === id)?.nameTh ?? "— เลือกระบบ —";
	}

	function exceptionTypeLabel(id: string): string {
		if (!id) return "— เลือกประเภท —";
		return exceptionTypes.find((e) => String(e.id) === id)?.nameTh ?? "— เลือกประเภท —";
	}

	function changeCategoryLabel(code: ChangeCategory | ""): string {
		if (!code) return "— เลือกหมวด —";
		return CHANGE_CATEGORY_LABELS[code] ?? "— เลือกหมวด —";
	}
</script>

<Card.Root>
	<Card.Content class="grid gap-4 lg:grid-cols-3 md:grid-cols-2 text-sm pt-6">
		<div class="flex flex-col gap-1.5">
			<Label for="itSystemId" required>ระบบที่เกี่ยวข้อง</Label>
			{#if readonly}
				<Input id="itSystemId" value={itSystemLabel(itSystemId)} disabled />
				<input type="hidden" name="itSystemId" value={itSystemId} />
			{:else}
				<NativeSelect id="itSystemId" name="itSystemId" bind:value={itSystemId} required selectSize="default">
					<option value="">— เลือกระบบ —</option>
					{#each itSystems as sys (sys.id)}
						<option value={String(sys.id)}>{sys.nameTh}</option>
					{/each}
				</NativeSelect>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="exceptionTypeId" required>ประเภทข้อยกเว้น</Label>
			{#if readonly}
				<Input id="exceptionTypeId" value={exceptionTypeLabel(exceptionTypeId)} disabled />
				<input type="hidden" name="exceptionTypeId" value={exceptionTypeId} />
			{:else}
				<NativeSelect id="exceptionTypeId" name="exceptionTypeId" bind:value={exceptionTypeId} required selectSize="default">
					<option value="">— เลือกประเภท —</option>
					{#each exceptionTypes as et (et.id)}
						<option value={String(et.id)}>{et.nameTh}</option>
					{/each}
				</NativeSelect>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="changeCategory" required>ประเภทการดำเนินการ (CIS)</Label>
			{#if readonly}
				<Input id="changeCategory" value={changeCategoryLabel(changeCategory)} disabled />
				<input type="hidden" name="changeCategory" value={changeCategory} />
			{:else}
				<NativeSelect id="changeCategory" name="changeCategory" bind:value={changeCategory} required selectSize="default">
					<option value="">— เลือกหมวด —</option>
					{#each categoryOptions as [code, label] (code)}
						<option value={code}>{label}</option>
					{/each}
				</NativeSelect>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5 lg:col-span-3 md:col-span-2">
			<Label for="title" required>หัวข้อข้อยกเว้น</Label>
			<Input
				id="title"
				name="title"
				required
				disabled={readonly}
				maxlength={300}
				bind:value={title}
			/>
		</div>

		<div class="flex flex-col gap-1.5 lg:col-span-3 md:col-span-2">
			<Label for="description" required>รายละเอียดข้อยกเว้น</Label>
			<Textarea
				id="description"
				name="description"
				rows={4}
				required
				disabled={readonly}
				bind:value={description}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="businessJustification" required>เหตุผลในการขอยกเว้น</Label>
			<Textarea
				id="businessJustification"
				name="businessJustification"
				rows={3}
				required
				disabled={readonly}
				bind:value={businessJustification}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="riskAssessment" required>ความเสี่ยงที่อาจเกิดขึ้น</Label>
			<Textarea
				id="riskAssessment"
				name="riskAssessment"
				rows={3}
				required
				disabled={readonly}
				bind:value={riskAssessment}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="compensatingControls">มาตรการควบคุมชดเชย (ถ้ามี)</Label>
			<Textarea
				id="compensatingControls"
				name="compensatingControls"
				rows={3}
				disabled={readonly}
				placeholder="ไม่บังคับ"
				bind:value={compensatingControls}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="impactDescription">ผลกระทบ</Label>
			<Textarea
				id="impactDescription"
				name="impactDescription"
				rows={3}
				disabled={readonly}
				placeholder="ไม่บังคับ"
				bind:value={impactDescription}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="exceptionStartDate" required>เริ่มข้อยกเว้น</Label>
			<Input
				id="exceptionStartDate"
				name="exceptionStartDate"
				type="date"
				required
				disabled={readonly}
				bind:value={exceptionStartDate}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="exceptionEndDate" required>สิ้นสุดข้อยกเว้น</Label>
			<Input
				id="exceptionEndDate"
				name="exceptionEndDate"
				type="date"
				required
				disabled={readonly}
				bind:value={exceptionEndDate}
			/>
		</div>

		<div class="flex flex-col gap-1.5 lg:col-span-3 md:col-span-2">
			<Label for="rollbackPlan" required>Rollback</Label>
			<Textarea
				id="rollbackPlan"
				name="rollbackPlan"
				rows={3}
				required
				disabled={readonly}
				bind:value={rollbackPlan}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="plannedImplementationAt">วันเวลาที่วางแผนดำเนินการ</Label>
			<Input
				id="plannedImplementationAt"
				name="plannedImplementationAt"
				type="datetime-local"
				disabled={readonly}
				bind:value={plannedImplementationAt}
			/>
		</div>

		<div class="flex flex-col gap-1.5 lg:col-span-2 md:col-span-1">
			<Label for="request_supporting">เอกสารประกอบคำขอ (PDF/PNG/JPEG · สูงสุด 10 MB)</Label>
			<input
				id="request_supporting"
				name="request_supporting"
				type="file"
				accept=".pdf,.png,.jpg,.jpeg,.webp"
				class="file:bg-muted text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm w-full"
			/>
		</div>

			<div class="lg:col-span-3 md:col-span-2">
				<FormRequiredNote
					details="กรอกครบก่อนส่งเรื่อง · วันสิ้นสุดต้องไม่ก่อนวันเริ่ม · แนบเอกสารประกอบได้ (ไม่บังคับ)"
				/>
			</div>

			<div class="flex flex-wrap justify-end gap-2 pt-2 lg:col-span-3 md:col-span-2">
				<Button type="submit" formaction="?/saveDraft" variant="outline">
					<NotepadTextDashedIcon data-icon="inline-start" />
					บันทึกร่าง
				</Button>
				<Button type="submit" formaction="?/submit" variant="default">
					<SaveIcon data-icon="inline-start" />
					ส่งเรื่อง
				</Button>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
