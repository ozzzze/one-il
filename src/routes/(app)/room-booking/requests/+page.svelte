<script lang="ts">
	import { resolve } from "$app/paths";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import CalendarCheckIcon from "@lucide/svelte/icons/calendar-check";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import {
		formatReservationDateTime,
		formatReservationWindow,
		getFacultyRequestStatusLabel,
		type FacultyRequestStatus,
	} from "$lib/requests/faculty-request.js";
	import type { PageData } from "./$types.js";

	type RequestItem = PageData["items"][number];

	let { data, form } = $props();

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "คำขอจองห้องของฉัน - ONE-IL",
					title: "คำขอของฉัน",
					description: "รายการคำขอจองห้องที่คุณส่ง ตรวจสอบสถานะและยกเลิกได้ตามเงื่อนไขของห้อง",
					newBooking: "จองห้องใหม่",
					requestNo: "เลขที่คำขอ",
					requestedAt: "วันที่ส่งคำขอ",
					updatedAt: "อัปเดตล่าสุด",
					roomSchedule: "ห้องและช่วงเวลา",
					viewDetail: "ดูรายละเอียด",
					cancel: "ยกเลิก",
					cancelling: "กำลังยกเลิก...",
					cancelReasonPlaceholder: "เหตุผลการยกเลิก (ถ้ามี)",
					cancelHint: "ยกเลิกได้ก่อนถึงเวลาตัดสิทธิ์ของห้อง",
					cancelSuccess: "ยกเลิกคำขอเรียบร้อยแล้ว",
					notScheduled: "ยังไม่มีข้อมูลห้องหรือช่วงเวลา",
					emptyTitle: "ยังไม่มีคำขอจองห้อง",
					emptyHint: "เปิดปฏิทินจองห้องเพื่อเลือกช่วงเวลาว่างและส่งคำขอ",
				}
			: {
					pageTitle: "My room booking requests - ONE-IL",
					title: "My requests",
					description:
						"Your room booking requests. Review status and cancel when the room policy allows.",
					newBooking: "Book a room",
					requestNo: "Request no.",
					requestedAt: "Requested",
					updatedAt: "Updated",
					roomSchedule: "Room and schedule",
					viewDetail: "View detail",
					cancel: "Cancel",
					cancelling: "Cancelling...",
					cancelReasonPlaceholder: "Cancellation reason (optional)",
					cancelHint: "Available until the room cancellation cutoff.",
					cancelSuccess: "Request cancelled.",
					notScheduled: "Room or schedule is not available yet.",
					emptyTitle: "No room booking requests yet",
					emptyHint: "Open the room calendar to pick an open slot and submit a request.",
				},
	);

	let cancelPendingId = $state<string | null>(null);

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}
		if (form?.success && form?.action === "cancelRequest") {
			toast.success(copy.cancelSuccess);
		}
	});

	function requestDetailHref(requestId: string) {
		return resolve(`/requests/${requestId}` as `/requests/${string}`);
	}

	function samePageEnhance(requestId: string) {
		return pendingEnhance((pending) => {
			cancelPendingId = pending ? requestId : null;
		}, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: true });
		});
	}

	function roomLabel(item: RequestItem): string {
		if (!item.roomName) return "—";
		const localized = localizedDualField(data.locale, item.roomName, item.roomNameEn);
		return item.roomCode ? `${item.roomCode} · ${localized}` : localized;
	}

	function scheduleLabel(item: RequestItem): string {
		if (item.startAt && item.endAt) {
			return formatReservationWindow(data.locale, item.startAt, item.endAt);
		}
		if (item.startAt) {
			return formatReservationDateTime(data.locale, item.startAt);
		}
		return copy.notScheduled;
	}

	function requestStatusVariant(status: FacultyRequestStatus): BadgeVariant {
		switch (status) {
			case "approved":
				return "default";
			case "pending_approval":
				return "secondary";
			default:
				return "outline";
		}
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<section class="space-y-6">
	<header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground max-w-3xl text-sm">{copy.description}</p>
		</div>
		<Button href={resolve("/room-booking")} size="sm">
			<CalendarCheckIcon class="size-4" aria-hidden="true" />
			<span>{copy.newBooking}</span>
		</Button>
	</header>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-lg">
				<InboxIcon class="text-muted-foreground size-5" />
				{copy.title}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if data.items.length === 0}
				<div
					class="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center text-sm"
				>
					<InboxIcon class="size-8 opacity-50" />
					<p class="font-medium">{copy.emptyTitle}</p>
					<p class="max-w-md">{copy.emptyHint}</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each data.items as item (item.id)}
						<article class="rounded-xl border p-4">
							<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
								<div class="min-w-0 flex-1 space-y-3">
									<div class="flex flex-wrap items-center gap-2">
										<Badge variant={requestStatusVariant(item.status as FacultyRequestStatus)}>
											{getFacultyRequestStatusLabel(data.locale, item.status as FacultyRequestStatus)}
										</Badge>
										<span class="text-muted-foreground font-mono text-xs"
											>{copy.requestNo}: {item.requestNo}</span
										>
									</div>

									<div class="space-y-1">
										<a href={requestDetailHref(item.id)} class="block text-base font-semibold hover:underline">
											{item.title}
										</a>
										<p class="text-muted-foreground text-sm">
											{copy.roomSchedule}: {roomLabel(item)} • {scheduleLabel(item)}
										</p>
									</div>

									<div class="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
										<p>{copy.requestedAt}: {formatReservationDateTime(data.locale, item.requestedAt)}</p>
										<p>{copy.updatedAt}: {formatReservationDateTime(data.locale, item.updatedAt)}</p>
									</div>
								</div>

								<Button variant="outline" size="sm" href={requestDetailHref(item.id)}>
									{copy.viewDetail}
								</Button>
							</div>

							{#if item.canCancel}
								<form
									method="POST"
									action="?/cancelRequest"
									use:enhance={samePageEnhance(item.id)}
									class="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-[1fr_auto]"
								>
									<input type="hidden" name="requestId" value={item.id} />
									<div class="space-y-2">
										<Input
											name="cancelReason"
											placeholder={copy.cancelReasonPlaceholder}
											disabled={cancelPendingId === item.id}
										/>
										<p class="text-muted-foreground text-xs">{copy.cancelHint}</p>
									</div>
									<Button
										type="submit"
										size="sm"
										variant="destructive"
										class="sm:self-start"
										disabled={cancelPendingId === item.id}
									>
										{cancelPendingId === item.id ? copy.cancelling : copy.cancel}
									</Button>
								</form>
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</section>
