<script lang="ts">
	import { enhance } from "$app/forms";
	import { base } from "$app/paths";
	import { toast } from "svelte-sonner";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import {
		formatReservationDateTime,
		formatReservationWindow,
		getFacultyRequestStatusLabel,
		type FacultyRequestStatus,
	} from "$lib/requests/faculty-request.js";
	import { getRequestKindMeta } from "$lib/requests/request-meta.js";
	import type { FacultyRequestKind } from "$lib/requests/request-schema.js";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

	let { data, form } = $props();

	const request = $derived(data.requestDetail);
	const requestKindMeta = $derived(getRequestKindMeta(data.locale));
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					backToRequests: "กลับไปหน้าคำขอ",
					requestNo: "เลขที่คำขอ",
					requestType: "ประเภทคำขอ",
					status: "สถานะ",
					requestedAt: "วันที่ส่งคำขอ",
					updatedAt: "อัปเดตล่าสุด",
					requester: "ผู้ขอ",
					roomSummary: "สรุปการจองห้อง",
					room: "ห้อง",
					schedule: "ช่วงเวลาใช้งาน",
					attendeeCount: "จำนวนผู้เข้าร่วม",
					purpose: "วัตถุประสงค์",
					setupBuffer: "เวลาเตรียมห้อง",
					cleanupBuffer: "เวลาเก็บห้อง",
					contact: "ข้อมูลติดต่อ",
					roomAssets: "อุปกรณ์ประจำห้อง",
					requestedAssets: "อุปกรณ์ที่ร้องขอเพิ่ม",
					noRequestedAssets: "ไม่มีการขออุปกรณ์เพิ่มเติม",
					noRoomAssets: "ไม่มีการกำหนดอุปกรณ์ประจำห้อง",
					approvalSteps: "ลำดับการอนุมัติ",
					auditTimeline: "ประวัติการดำเนินการ",
					actedAt: "ดำเนินการเมื่อ",
					remark: "หมายเหตุ",
					cancelRequest: "ยกเลิกคำขอ",
					cancelReason: "เหตุผลการยกเลิก",
					cancelReasonPlaceholder: "เหตุผลการยกเลิก (ถ้ามี)",
					cancelling: "กำลังยกเลิก...",
					cancelSuccess: "ยกเลิกคำขอเรียบร้อยแล้ว",
					managerAction: "การพิจารณาของผู้อนุมัติ",
					managerHint: "บันทึกผลการพิจารณาพร้อมหมายเหตุเพื่อให้ผู้ขอเห็นเหตุผล",
					decisionRemark: "หมายเหตุการพิจารณา",
					decisionRemarkPlaceholder: "เช่น อนุมัติตามตารางห้อง หรือขอแก้ไขช่วงเวลา",
					approve: "อนุมัติ",
					reject: "ไม่อนุมัติ",
					processing: "กำลังบันทึก...",
					decisionSaved: "บันทึกผลการพิจารณาแล้ว",
					notAvailable: "ไม่มีข้อมูล",
					minutes: "นาที",
					noRemark: "ไม่มีหมายเหตุ",
				}
			: {
					backToRequests: "Back to Requests",
					requestNo: "Request no.",
					requestType: "Request type",
					status: "Status",
					requestedAt: "Requested",
					updatedAt: "Updated",
					requester: "Requester",
					roomSummary: "Room booking summary",
					room: "Room",
					schedule: "Schedule",
					attendeeCount: "Attendee count",
					purpose: "Purpose",
					setupBuffer: "Setup buffer",
					cleanupBuffer: "Cleanup buffer",
					contact: "Contact",
					roomAssets: "Default room equipment",
					requestedAssets: "Additional requested equipment",
					noRequestedAssets: "No additional equipment requested.",
					noRoomAssets: "No default room equipment configured.",
					approvalSteps: "Approval steps",
					auditTimeline: "Audit timeline",
					actedAt: "Acted at",
					remark: "Remark",
					cancelRequest: "Cancel request",
					cancelReason: "Cancellation reason",
					cancelReasonPlaceholder: "Cancellation reason (optional)",
					cancelling: "Cancelling...",
					cancelSuccess: "Request cancelled.",
					managerAction: "Manager decision",
					managerHint: "Save a decision with an audit remark for the requester.",
					decisionRemark: "Decision remark",
					decisionRemarkPlaceholder: "For example: approved as scheduled or please revise the timeslot",
					approve: "Approve",
					reject: "Reject",
					processing: "Saving...",
					decisionSaved: "Decision saved.",
					notAvailable: "Not available",
					minutes: "minutes",
					noRemark: "No remark",
				},
	);

	let cancelPending = $state(false);
	let decisionPending = $state(false);

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}
		if (form?.success && form?.action === "cancelRequest") {
			toast.success(copy.cancelSuccess);
		}
		if (form?.success && form?.action === "decideRequest") {
			toast.success(copy.decisionSaved);
		}
	});

	function withBase(path: string) {
		return `${base}${path}`;
	}

	function cancelEnhance() {
		return pendingEnhance((pending) => {
			cancelPending = pending;
		}, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: true });
		});
	}

	function decisionEnhance() {
		return pendingEnhance((pending) => {
			decisionPending = pending;
		}, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: true });
		});
	}

	function statusLabel(status: string) {
		return getFacultyRequestStatusLabel(data.locale, status as FacultyRequestStatus);
	}

	function requestKindLabel(kind: string) {
		if (kind in requestKindMeta) {
			return requestKindMeta[kind as FacultyRequestKind].label;
		}
		return kind;
	}

	function roomLabel() {
		if (!request.roomName) return copy.notAvailable;
		const localized = localizedDualField(data.locale, request.roomName, request.roomNameEn);
		return request.roomCode ? `${request.roomCode} - ${localized}` : localized;
	}

	function reservationWindow() {
		if (request.startAt && request.endAt) {
			return formatReservationWindow(data.locale, request.startAt, request.endAt);
		}
		return copy.notAvailable;
	}

	function dateTimeOrFallback(value: string | null) {
		return value ? formatReservationDateTime(data.locale, value) : copy.notAvailable;
	}

	function assetLabel(asset: { assetNo: string; name: string; nameEn: string | null }) {
		return `${asset.assetNo} - ${localizedDualField(data.locale, asset.name, asset.nameEn)}`;
	}

	function stepStatusLabel(status: string) {
		if (data.locale === "th") {
			switch (status) {
				case "pending":
					return "รอดำเนินการ";
				case "approved":
					return "อนุมัติแล้ว";
				case "rejected":
					return "ไม่อนุมัติ";
				case "cancelled":
					return "ยกเลิกแล้ว";
				default:
					return status;
			}
		}
		switch (status) {
			case "pending":
				return "Pending";
			case "approved":
				return "Approved";
			case "rejected":
				return "Rejected";
			case "cancelled":
				return "Cancelled";
			default:
				return status;
		}
	}

	function statusClass(status: string) {
		switch (status) {
			case "approved":
				return "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300";
			case "rejected":
			case "cancelled":
				return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
			case "pending_approval":
			case "pending":
				return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
			default:
				return "";
		}
	}
</script>

<svelte:head>
	<title>{request.title} - ONE-IL</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<div class="flex items-start gap-4">
		<Button variant="ghost" size="icon" href={withBase("/requests")}>
			<ArrowLeftIcon class="size-4" />
			<span class="sr-only">{copy.backToRequests}</span>
		</Button>
		<div class="min-w-0 flex-1 space-y-2">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline" class={statusClass(request.status)}>
					{statusLabel(request.status)}
				</Badge>
				<Badge variant="secondary">{requestKindLabel(request.kind)}</Badge>
				<span class="text-muted-foreground font-mono text-xs">{copy.requestNo}: {request.requestNo}</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tight">{request.title}</h1>
			{#if request.details}
				<p class="text-muted-foreground max-w-3xl">{request.details}</p>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.roomSummary}</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 md:grid-cols-2">
					<div>
						<p class="text-muted-foreground text-sm">{copy.room}</p>
						<p class="font-medium">{roomLabel()}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-sm">{copy.schedule}</p>
						<p class="font-medium">{reservationWindow()}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-sm">{copy.requester}</p>
						<p class="font-medium">{request.requesterName ?? copy.notAvailable}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-sm">{copy.attendeeCount}</p>
						<p class="font-medium">{request.attendeeCount ?? copy.notAvailable}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-sm">{copy.requestedAt}</p>
						<p class="font-medium">{dateTimeOrFallback(request.requestedAt)}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-sm">{copy.updatedAt}</p>
						<p class="font-medium">{dateTimeOrFallback(request.updatedAt)}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-sm">{copy.setupBuffer}</p>
						<p class="font-medium">{request.setupBufferMinutes} {copy.minutes}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-sm">{copy.cleanupBuffer}</p>
						<p class="font-medium">{request.cleanupBufferMinutes} {copy.minutes}</p>
					</div>
					<div class="md:col-span-2">
						<p class="text-muted-foreground text-sm">{copy.purpose}</p>
						<p class="font-medium">{request.purpose ?? copy.notAvailable}</p>
					</div>
					<div class="md:col-span-2">
						<p class="text-muted-foreground text-sm">{copy.contact}</p>
						<p class="font-medium">
							{request.contactName ?? copy.notAvailable}
							{#if request.contactEmail || request.contactPhone}
								<span class="text-muted-foreground font-normal">
									{#if request.contactEmail} · {request.contactEmail}{/if}
									{#if request.contactPhone} · {request.contactPhone}{/if}
								</span>
							{/if}
						</p>
					</div>
				</Card.Content>
			</Card.Root>

			<div class="grid gap-6 lg:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>{copy.roomAssets}</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if request.fixedAssets.length === 0}
							<p class="text-muted-foreground text-sm">{copy.noRoomAssets}</p>
						{:else}
							<ul class="space-y-3">
								{#each request.fixedAssets as asset, i (asset.id)}
									<li class="rounded-lg border p-3">
										<p class="font-medium">{assetLabel(asset)}</p>
										<p class="text-muted-foreground text-xs">{asset.brand ?? "—"} / {asset.model ?? "—"}</p>
									</li>
								{/each}
							</ul>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>{copy.requestedAssets}</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if request.requestedAssets.length === 0}
							<p class="text-muted-foreground text-sm">{copy.noRequestedAssets}</p>
						{:else}
							<ul class="space-y-3">
								{#each request.requestedAssets as asset, i (asset.id)}
									<li class="rounded-lg border p-3">
										<p class="font-medium">{assetLabel(asset)}</p>
										<p class="text-muted-foreground text-xs">{asset.brand ?? "—"} / {asset.model ?? "—"}</p>
									</li>
								{/each}
							</ul>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.approvalSteps}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each request.steps as step, i (step.id)}
							<div class="rounded-lg border p-4">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div>
										<p class="font-medium">#{step.stepOrder} · {step.approverName}</p>
										<p class="text-muted-foreground text-sm">{step.actionType}</p>
									</div>
									<Badge variant="outline" class={statusClass(step.stepStatus)}>
										{stepStatusLabel(step.stepStatus)}
									</Badge>
								</div>
								<div class="text-muted-foreground mt-3 grid gap-2 text-sm sm:grid-cols-2">
									<p>{copy.actedAt}: {dateTimeOrFallback(step.actedAt)}</p>
									<p>{copy.remark}: {step.remark ?? copy.noRemark}</p>
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.auditTimeline}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each request.events as event, i (event.id)}
							<div class="rounded-lg border p-4">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div>
										<p class="font-medium">{event.summary}</p>
										<p class="text-muted-foreground text-sm">{event.actorName ?? copy.notAvailable}</p>
									</div>
									<p class="text-muted-foreground text-sm">{dateTimeOrFallback(event.createdAt)}</p>
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="space-y-6">
			{#if data.canCancelOwn && request.canCancel}
				<Card.Root>
					<Card.Header>
						<Card.Title>{copy.cancelRequest}</Card.Title>
					</Card.Header>
					<Card.Content>
						<form
							method="POST"
							action="?/cancelRequest"
							class="space-y-4"
							use:enhance={cancelEnhance()}
						>
							<input type="hidden" name="requestId" value={request.id} />
							<div class="space-y-2">
								<Label for="cancelReason">{copy.cancelReason}</Label>
								<Textarea
									id="cancelReason"
									name="cancelReason"
									rows={4}
									maxlength={1000}
									placeholder={copy.cancelReasonPlaceholder}
									disabled={cancelPending}
								/>
							</div>
							<Button type="submit" variant="destructive" disabled={cancelPending}>
								{cancelPending ? copy.cancelling : copy.cancelRequest}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}

			{#if data.canManage && request.status === "pending_approval"}
				<Card.Root>
					<Card.Header>
						<Card.Title>{copy.managerAction}</Card.Title>
						<Card.Description>{copy.managerHint}</Card.Description>
					</Card.Header>
					<Card.Content>
						<form
							method="POST"
							action="?/decideRequest"
							class="space-y-4"
							use:enhance={decisionEnhance()}
						>
							<input type="hidden" name="requestId" value={request.id} />
							<div class="space-y-2">
								<Label for="remark">{copy.decisionRemark}</Label>
								<Textarea
									id="remark"
									name="remark"
									rows={5}
									maxlength={1000}
									placeholder={copy.decisionRemarkPlaceholder}
									disabled={decisionPending}
								/>
							</div>
							<div class="flex flex-wrap gap-3">
								<Button type="submit" name="decision" value="approved" disabled={decisionPending}>
									{decisionPending ? copy.processing : copy.approve}
								</Button>
								<Button
									type="submit"
									name="decision"
									value="rejected"
									variant="destructive"
									disabled={decisionPending}
								>
									{decisionPending ? copy.processing : copy.reject}
								</Button>
							</div>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
</div>
