<script lang="ts">
	import FormRequiredNote from '$lib/components/form-required-note.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		CHANGE_CATEGORY_LABELS
	} from '$lib/change-request/labels.js';
	import type {
		ChangeCategory,
		ChangeRequestDetail,
		ExceptionTypeOption,
		ItSystemOption
	} from '$lib/server/one-leave/change-request/types.js';
	import NotepadTextDashedIcon from '@lucide/svelte/icons/notepad-text-dashed';
	import SaveIcon from '@lucide/svelte/icons/save';

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
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	let itSystemId = $state(record?.itSystemId ? String(record.itSystemId) : '');
	let exceptionTypeId = $state(record?.exceptionTypeId ? String(record.exceptionTypeId) : '');
	let changeCategory = $state<ChangeCategory | ''>(record?.changeCategory ?? '');
	let title = $state(record?.title ?? '');
	let description = $state(record?.description ?? '');
	let businessJustification = $state(record?.businessJustification ?? '');
	let riskAssessment = $state(record?.riskAssessment ?? '');
	let compensatingControls = $state(record?.compensatingControls ?? '');
	let impactDescription = $state(record?.impactDescription ?? '');
	let exceptionStartDate = $state(record?.exceptionStartDate ?? defaultToday);
	let exceptionEndDate = $state(record?.exceptionEndDate ?? defaultToday);
	let rollbackPlan = $state(record?.rollbackPlan ?? '');
	let plannedImplementationAt = $state(toDatetimeLocalValue(record?.plannedImplementationAt));

	const categoryOptions = Object.entries(CHANGE_CATEGORY_LABELS) as [ChangeCategory, string][];
</script>

<div class="flex flex-col gap-4 rounded-xl border bg-card p-4 text-sm shadow-sm">
	<p class="text-muted-foreground text-xs font-medium">รายละเอียดคำขอเปลี่ยนแปลงระบบ</p>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="flex flex-col gap-1.5">
			<Label for="itSystemId" required>ระบบที่เกี่ยวข้อง</Label>
			<select
				id="itSystemId"
				name="itSystemId"
				required
				disabled={readonly}
				class="border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm disabled:opacity-60"
				bind:value={itSystemId}
			>
				<option value="" disabled selected={!itSystemId}>— เลือกระบบ —</option>
				{#each itSystems as sys, i (sys.id)}
					<option value={String(sys.id)}>{sys.nameTh}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="exceptionTypeId" required>ประเภทข้อยกเว้น</Label>
			<select
				id="exceptionTypeId"
				name="exceptionTypeId"
				required
				disabled={readonly}
				class="border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm disabled:opacity-60"
				bind:value={exceptionTypeId}
			>
				<option value="" disabled selected={!exceptionTypeId}>— เลือกประเภท —</option>
				{#each exceptionTypes as et, i (et.id)}
					<option value={String(et.id)}>{et.nameTh}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="flex flex-col gap-1.5">
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

	<div class="flex flex-col gap-1.5">
		<Label for="changeCategory" required>ประเภทการดำเนินการ (CIS)</Label>
		<select
			id="changeCategory"
			name="changeCategory"
			required
			disabled={readonly}
			class="border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm disabled:opacity-60"
			bind:value={changeCategory}
		>
			<option value="" disabled selected={!changeCategory}>— เลือกหมวด —</option>
			{#each categoryOptions as [code, label], i (code)}
				<option value={code}>{label}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-1.5">
		<Label for="description" required>รายละเอียดข้อยกเว้น</Label>
		<textarea
			id="description"
			name="description"
			rows="4"
			required
			disabled={readonly}
			class="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
			bind:value={description}
		></textarea>
	</div>

	<div class="flex flex-col gap-1.5">
		<Label for="businessJustification" required>เหตุผลในการขอยกเว้น</Label>
		<textarea
			id="businessJustification"
			name="businessJustification"
			rows="3"
			required
			disabled={readonly}
			class="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
			bind:value={businessJustification}
		></textarea>
	</div>

	<div class="flex flex-col gap-1.5">
		<Label for="riskAssessment" required>ความเสี่ยงที่อาจเกิดขึ้น</Label>
		<textarea
			id="riskAssessment"
			name="riskAssessment"
			rows="3"
			required
			disabled={readonly}
			class="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
			bind:value={riskAssessment}
		></textarea>
	</div>

	<div class="flex flex-col gap-1.5">
		<Label for="compensatingControls">มาตรการควบคุมชดเชย (ถ้ามี)</Label>
		<textarea
			id="compensatingControls"
			name="compensatingControls"
			rows="2"
			disabled={readonly}
			class="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
			placeholder="ไม่บังคับ"
			bind:value={compensatingControls}
		></textarea>
	</div>

	<div class="flex flex-col gap-1.5">
		<Label for="impactDescription">ผลกระทบ</Label>
		<textarea
			id="impactDescription"
			name="impactDescription"
			rows="2"
			disabled={readonly}
			class="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
			placeholder="ไม่บังคับ"
			bind:value={impactDescription}
		></textarea>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
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
	</div>

	<div class="flex flex-col gap-1.5">
		<Label for="rollbackPlan" required>Rollback</Label>
		<textarea
			id="rollbackPlan"
			name="rollbackPlan"
			rows="3"
			required
			disabled={readonly}
			class="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
			bind:value={rollbackPlan}
		></textarea>
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

	{#if !readonly}
		<div class="rounded-lg border p-4">
			<div class="flex flex-col gap-1.5">
				<Label for="request_supporting">เอกสารประกอบคำขอ (PDF/PNG/JPEG · สูงสุด 10 MB)</Label>
				<input
					id="request_supporting"
					name="request_supporting"
					type="file"
					accept=".pdf,.png,.jpg,.jpeg,.webp"
					class="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
				/>
			</div>
		</div>
	{/if}
</div>

{#if !readonly}
	<FormRequiredNote
		details="กรอกครบก่อนส่งเรื่อง · วันสิ้นสุดต้องไม่ก่อนวันเริ่ม · แนบเอกสารประกอบได้ (ไม่บังคับ)"
	/>

	<div class="flex flex-wrap justify-end gap-2 pt-2">
		<Button type="submit" formaction="?/saveDraft" variant="secondary">
			<NotepadTextDashedIcon data-icon="inline-start" />
			บันทึกร่าง
		</Button>
		<Button type="submit" formaction="?/submit">
			<SaveIcon data-icon="inline-start" />
			ส่งเรื่อง
		</Button>
	</div>
{/if}
