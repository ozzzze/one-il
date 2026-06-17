<script lang="ts">
	import { enhance } from "$app/forms";
	import ChangeRequestForm from "$lib/components/change-request-form.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import ScrApprovalStepper from "$lib/components/scr-approval-stepper.svelte";
	import { buildScrApprovalStepper } from "$lib/change-request/scr-stepper.js";
	import {
		labelAttachmentType,
		labelChangeCategory,
		labelScrApprovalAction,
		labelScrStatus,
	} from "$lib/change-request/labels.js";
	import type { PageData } from "./$types";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import HistoryIcon from "@lucide/svelte/icons/history";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import XIcon from "@lucide/svelte/icons/x";
	import { toast } from "svelte-sonner";

	let { data, form }: { data: PageData; form: import("./$types").ActionData } = $props();

	const approvalSteps = $derived(
		buildScrApprovalStepper({
			status: data.record.status,
			submittedAt: data.record.submittedAt,
			history: data.approvalHistory.map((h) => ({
				toStatus: h.toStatus,
				actedAt: h.actedAt,
			})),
		})
	);

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDateTime(iso: string | null): string {
		if (!iso) return "—";
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString("th-TH");
	}

	function confirmWithdraw(): boolean {
		return confirm("ถอนคำขอนี้? ไม่สามารถกู้คืนได้");
	}

	function makeActionEnhance() {
		return () => {
			return async ({
				result,
				update,
			}: {
				result: import("@sveltejs/kit").ActionResult;
				update: () => Promise<void>;
			}) => {
				if (result.type === "success" && result.data && "message" in result.data) {
					toast.success(String(result.data.message));
				} else if (result.type === "failure" && result.data?.error) {
					toast.error(String(result.data.error));
				}
				await update();
			};
		};
	}
</script>

<svelte:head>
	<title>{data.record.requestNumber} — ONE-IL</title>
</svelte:head>

<div class="flex flex-col gap-6 p-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<Button variant="outline" size="sm" href="/change-requests">
			<ArrowLeftIcon class="mr-2 size-4" />
			กลับรายการ
		</Button>
		<div class="flex items-center gap-2">
			<span class="text-muted-foreground font-mono text-xs">{data.record.requestNumber}</span>
			<Badge variant="secondary" class="font-normal">
				{labelScrStatus(data.record.status)}
			</Badge>
			<Badge variant="outline" class="font-normal">
				{labelChangeCategory(data.record.changeCategory)}
			</Badge>
		</div>
	</div>

	{#if data.authMock}
		<Alert.Root>
			<Alert.Title>โหมด mock</Alert.Title>
			<Alert.Description
				>ดูหน้าได้ แต่บันทึกต้องตั้ง DATABASE_URL และปิด AUTH_MOCK</Alert.Description
			>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">ขั้นตอนการดำเนินการ</Card.Title>
		</Card.Header>
		<Card.Content>
			<ScrApprovalStepper steps={approvalSteps} embedded moduleLabel="คำขอเปลี่ยนแปลงระบบ" />
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<FileTextIcon class="size-4 shrink-0" />
				ข้อมูลผู้ยื่นคำขอ
			</Card.Title>
		</Card.Header>
		<Card.Content class="grid gap-2 text-sm sm:grid-cols-2">
			<div>
				<p class="text-muted-foreground text-xs">ผู้ยื่น</p>
				<p class="font-medium">{data.record.requesterName}</p>
				{#if data.record.requesterEmployeeCode}
					<p class="text-muted-foreground text-xs">{data.record.requesterEmployeeCode}</p>
				{/if}
			</div>
			<div>
				<p class="text-muted-foreground text-xs">หน่วยงาน</p>
				<p>{data.record.orgUnitName ?? "—"}</p>
			</div>
			<div>
				<p class="text-muted-foreground text-xs">วันที่ขอ</p>
				<p>{formatDateTime(data.record.submittedAt ?? data.record.createdAt)}</p>
				{#if !data.record.submittedAt}
					<p class="text-muted-foreground text-xs">(ร่าง — ยังไม่ส่งเรื่อง)</p>
				{/if}
			</div>
			<div>
				<p class="text-muted-foreground text-xs">ผู้อนุมัติ (หัวหน้างาน)</p>
				<p>{data.record.supervisorName ?? "—"}</p>
				{#if data.record.supervisorEmployeeCode}
					<p class="text-muted-foreground text-xs">{data.record.supervisorEmployeeCode}</p>
				{/if}
			</div>
			<div>
				<p class="text-muted-foreground text-xs">วันที่ส่ง / อนุมัติ / ดำเนินการ</p>
				<p class="text-xs leading-relaxed">
					ส่ง: {formatDateTime(data.record.submittedAt)}<br />
					หัวหน้า: {formatDateTime(data.record.supervisorApprovedAt)}<br />
					IT: {formatDateTime(data.record.implementedAt)} · ปิด: {formatDateTime(
						data.record.closedAt
					)}
				</p>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<HistoryIcon class="size-4 shrink-0" />
				ประวัติการอนุมัติ
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if data.approvalHistory.length === 0}
				<p class="text-muted-foreground text-sm">ยังไม่มีประวัติการดำเนินการ</p>
			{:else}
				<ol class="relative border-s ps-4">
					{#each data.approvalHistory as step, i (step.id)}
						<li class="ms-2 mb-4">
							<span
								class="bg-primary border-background absolute -inset-s-1.5 mt-1.5 size-3 rounded-full border"
							></span>
							<p class="text-sm font-medium">
								{labelScrApprovalAction(step.actionType)}
								<span class="text-muted-foreground font-normal">
									{step.fromStatusLabel} → {step.toStatusLabel}
								</span>
							</p>
							<p class="text-muted-foreground text-xs">
								{step.actorDisplayName ?? step.actorRole} · {formatDateTime(step.actedAt)}
							</p>
							{#if step.comment}
								<p class="mt-1 text-xs">{step.comment}</p>
							{/if}
						</li>
					{/each}
				</ol>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">
				{data.editable ? "แก้ไขคำขอ (ร่าง)" : "รายละเอียดคำขอ"}
			</Card.Title>
			<Card.Description>
				{data.record.itSystemName} · {data.record.exceptionTypeName}
			</Card.Description>
			{#if data.canWithdraw || data.canSupervisorApprove || data.canSupervisorDeny || data.canClose}
				<Card.Action>
					<div class="flex flex-wrap gap-2">
						{#if data.canWithdraw}
							<form
								method="POST"
								action="?/withdraw"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === "redirect") toast.success("ถอนคำขอแล้ว");
										else if (result.type === "failure" && result.data?.error) {
											toast.error(String(result.data.error));
										}
										await update();
									};
								}}
								onsubmit={confirmWithdraw}
							>
								<Button type="submit" variant="outline">
									<Trash2Icon class="mr-2 size-4" />
									ถอนคำขอ
								</Button>
							</form>
						{/if}
						{#if data.canClose}
							<form method="POST" action="?/close" use:enhance={makeActionEnhance()}>
								<Button
									type="submit"
									class="bg-emerald-600 text-white shadow-xs hover:bg-emerald-600/90"
								>
									<CheckIcon class="mr-2 size-4" />
									ปิดเรื่อง
								</Button>
							</form>
						{/if}
					</div>
				</Card.Action>
			{/if}
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				enctype="multipart/form-data"
				class="flex flex-col gap-4"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === "redirect") {
							const path = result.location.split("?")[0];
							if (path === "/change-requests") toast.success("ส่งเรื่องแล้ว");
							else toast.success("บันทึกแล้ว");
							await update();
							return;
						}
						await update();
						if (result.type === "failure" && result.data?.error) {
							toast.error(String(result.data.error));
						}
					};
				}}
			>
				<ChangeRequestForm
					itSystems={data.itSystems}
					exceptionTypes={data.exceptionTypes}
					record={data.record}
					readonly={data.readonly}
				/>
				{#if form && "error" in form && form.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	{#if data.attachments.length > 0 || data.editable || data.canUploadTestEvidence}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">เอกสารแนบ</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-4">
				{#if data.attachments.length > 0}
					<ul class="divide-y rounded-lg border text-sm">
						{#each data.attachments as att, i (att.id)}
							<li class="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
								<div>
									<p class="font-medium">{att.fileName}</p>
									<p class="text-muted-foreground text-xs">
										{labelAttachmentType(att.attachmentType)} · {formatBytes(att.fileSizeBytes)} ·
										{formatDateTime(att.uploadedAt)}
									</p>
								</div>
								<div class="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										href="/change-requests/attachments/{att.id}?scrId={data.record.id}"
									>
										ดาวน์โหลด
									</Button>
									{#if data.editable}
										<form
											method="POST"
											action="?/deleteAttachment"
											use:enhance={makeActionEnhance()}
										>
											<input type="hidden" name="attachmentId" value={att.id} />
											<Button type="submit" variant="ghost" size="icon">
												<Trash2Icon class="size-4" />
											</Button>
										</form>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-muted-foreground text-sm">ยังไม่มีเอกสารแนบ</p>
				{/if}

				{#if data.editable}
					<form
						method="POST"
						action="?/uploadAttachment"
						enctype="multipart/form-data"
						class="flex flex-wrap items-end gap-2"
						use:enhance={makeActionEnhance()}
					>
						<input type="hidden" name="attachmentType" value="request_supporting" />
						<div class="flex min-w-48 flex-1 flex-col gap-1.5">
							<Label for="file-draft">แนบเอกสารประกอบ</Label>
							<input
								id="file-draft"
								name="file"
								type="file"
								accept=".pdf,.png,.jpg,.jpeg,.webp"
								class="text-sm"
								required
							/>
						</div>
						<Button type="submit" variant="outline">อัปโหลด</Button>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	{#if data.canSupervisorApprove || data.canSupervisorDeny}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">การอนุมัติ (หัวหน้างาน)</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				<form
					method="POST"
					action="?/supervisorApprove"
					class="flex flex-wrap items-end gap-2"
					use:enhance={makeActionEnhance()}
				>
					<div class="flex min-w-48 flex-1 flex-col gap-1.5">
						<Label for="comment">ความเห็น (ไม่บังคับ)</Label>
						<Input id="comment" name="comment" placeholder="ความเห็นเพิ่มเติม" />
					</div>
					<Button type="submit" class="bg-emerald-600 text-white shadow-xs hover:bg-emerald-600/90">
						<CheckIcon class="mr-2 size-4" />
						อนุมัติ
					</Button>
				</form>
				<form
					method="POST"
					action="?/supervisorDeny"
					class="flex flex-wrap items-end gap-2"
					use:enhance={makeActionEnhance()}
				>
					<div class="flex min-w-48 flex-1 flex-col gap-1.5">
						<Label for="supervisor-reason" required>เหตุผลที่ไม่อนุมัติ</Label>
						<Input id="supervisor-reason" name="reason" required placeholder="ระบุเหตุผล" />
					</div>
					<Button type="submit" variant="outline">
						<XIcon class="mr-2 size-4" />
						ไม่อนุมัติ
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if data.showItSection}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<ClockIcon class="size-4 shrink-0" />
					ส่วน IT
				</Card.Title>
				{#if data.record.postReviewRequired}
					<Card.Description class="text-amber-600 dark:text-amber-400">
						ดำเนินการฉุกเฉิน — ต้องทบทวนหลังดำเนินการ
					</Card.Description>
				{/if}
			</Card.Header>
			<Card.Content class="flex flex-col gap-4">
				{#if data.record.testEnvironment || data.record.testResultSummary || data.record.implementationNotes}
					<div class="grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<p class="text-muted-foreground text-xs">สภาพแวดล้อมทดสอบ</p>
							<p class="whitespace-pre-wrap">{data.record.testEnvironment ?? "—"}</p>
						</div>
						<div>
							<p class="text-muted-foreground text-xs">สรุปผลการทดสอบ</p>
							<p class="whitespace-pre-wrap">{data.record.testResultSummary ?? "—"}</p>
						</div>
						<div class="sm:col-span-2">
							<p class="text-muted-foreground text-xs">บันทึกการดำเนินการ</p>
							<p class="whitespace-pre-wrap">{data.record.implementationNotes ?? "—"}</p>
						</div>
					</div>
				{/if}

				{#if data.canUploadTestEvidence}
					<form
						method="POST"
						action="?/uploadAttachment"
						enctype="multipart/form-data"
						class="flex flex-wrap items-end gap-2 rounded-lg border p-3"
						use:enhance={makeActionEnhance()}
					>
						<input type="hidden" name="attachmentType" value="test_evidence" />
						<div class="flex min-w-48 flex-1 flex-col gap-1.5">
							<Label for="test-evidence" required>หลักฐานการทดสอบ (บังคับก่อนดำเนินการ)</Label>
							<input
								id="test-evidence"
								name="file"
								type="file"
								accept=".pdf,.png,.jpg,.jpeg,.webp"
								class="text-sm"
								required
							/>
						</div>
						<Button type="submit" variant="outline">อัปโหลด</Button>
					</form>
				{/if}

				{#if data.canItImplement || data.canItDeny}
					<form
						method="POST"
						action="?/itImplement"
						class="flex flex-col gap-3 rounded-lg border p-4"
						use:enhance={makeActionEnhance()}
					>
						<p class="text-muted-foreground text-xs font-medium">
							ดำเนินการ IT (หลังหัวหน้าอนุมัติ)
						</p>
						<div class="flex flex-col gap-1.5">
							<Label for="testEnvironment" required>สภาพแวดล้อมทดสอบ</Label>
							<Input id="testEnvironment" name="testEnvironment" required />
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="testResultSummary" required>สรุปผลการทดสอบ</Label>
							<Textarea
								id="testResultSummary"
								name="testResultSummary"
								rows={3}
								required
							/>
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="implementationNotes" required>บันทึกการดำเนินการ</Label>
							<Textarea
								id="implementationNotes"
								name="implementationNotes"
								rows={3}
								required
							/>
						</div>
						<div class="flex flex-wrap gap-2">
							<Button
								type="submit"
								class="bg-emerald-600 text-white shadow-xs hover:bg-emerald-600/90"
							>
								<CheckIcon class="mr-2 size-4" />
								ดำเนินการ
							</Button>
						</div>
					</form>
					<form
						method="POST"
						action="?/itDeny"
						class="mt-2 flex flex-wrap items-end gap-2"
						use:enhance={makeActionEnhance()}
					>
						<div class="flex min-w-48 flex-1 flex-col gap-1.5">
							<Label for="it-reason" required>เหตุผลที่ IT ไม่อนุมัติ</Label>
							<Input id="it-reason" name="reason" required placeholder="ระบุเหตุผล" />
						</div>
						<Button type="submit" variant="outline">
							<XIcon class="mr-2 size-4" />
							IT ไม่อนุมัติ
						</Button>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	{#if data.canEmergencyImplement}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">ดำเนินการฉุกเฉิน (Emergency)</Card.Title>
				<Card.Description>คำขอหมวด emergency ที่ส่งแล้ว — ข้ามขั้นหัวหน้า</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.canUploadTestEvidence}
					<form
						method="POST"
						action="?/uploadAttachment"
						enctype="multipart/form-data"
						class="mb-4 flex flex-wrap items-end gap-2 rounded-lg border p-3"
						use:enhance={makeActionEnhance()}
					>
						<input type="hidden" name="attachmentType" value="test_evidence" />
						<div class="flex min-w-48 flex-1 flex-col gap-1.5">
							<Label for="em-test-evidence" required>หลักฐานการทดสอบ (บังคับก่อนดำเนินการ)</Label>
							<input
								id="em-test-evidence"
								name="file"
								type="file"
								accept=".pdf,.png,.jpg,.jpeg,.webp"
								class="text-sm"
								required
							/>
						</div>
						<Button type="submit" variant="outline">อัปโหลด</Button>
					</form>
				{/if}
				<form
					method="POST"
					action="?/emergencyImplement"
					class="flex flex-col gap-3"
					use:enhance={makeActionEnhance()}
				>
					<div class="flex flex-col gap-1.5">
						<Label for="em-testEnvironment" required>สภาพแวดล้อมทดสอบ</Label>
						<Input id="em-testEnvironment" name="testEnvironment" required />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="em-testResultSummary" required>สรุปผลการทดสอบ</Label>
						<Textarea
							id="em-testResultSummary"
							name="em-testResultSummary"
							rows={3}
							required
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="em-implementationNotes" required>บันทึกการดำเนินการ</Label>
						<Textarea
							id="em-implementationNotes"
							name="em-implementationNotes"
							rows={3}
							required
						/>
					</div>
					<Button type="submit" class="bg-emerald-600 text-white shadow-xs hover:bg-emerald-600/90">
						<CheckIcon class="mr-2 size-4" />
						ดำเนินการฉุกเฉิน
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
