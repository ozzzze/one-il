<script lang="ts">
	import { resolve } from "$app/paths";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { getRequestsPageCopy } from "$lib/content/page-copy.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import {
		formatReservationDateTime,
		formatReservationWindow,
		getFacultyRequestStatusLabel,
		type FacultyRequestStatus,
	} from "$lib/requests/faculty-request.js";
	import { getRequestKindMeta, requestCenterKinds } from "$lib/requests/request-meta.js";
	import type { FacultyRequestKind } from "$lib/requests/request-schema.js";
	import type { Component } from "svelte";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import CalendarCheckIcon from "@lucide/svelte/icons/calendar-check";
	import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
	import GraduationCapIcon from "@lucide/svelte/icons/graduation-cap";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import PackageIcon from "@lucide/svelte/icons/package";
	import roomCardImage from "$lib/assets/room-booking/card-room.jpg";
	import equipmentCardImage from "$lib/assets/equipment-borrowing/card-borrow.jpg";

	let { data, form } = $props();

	const pageCopy = $derived(getRequestsPageCopy(data.locale));
	const requestKindMeta = $derived(getRequestKindMeta(data.locale));
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					requestNo: "เลขที่คำขอ",
					requestType: "ประเภท",
					requestedAt: "วันที่ส่งคำขอ",
					updatedAt: "อัปเดตล่าสุด",
					roomSchedule: "ห้องและช่วงเวลา",
					viewDetail: "ดูรายละเอียด",
					cancel: "ยกเลิก",
					cancelling: "กำลังยกเลิก...",
					manageRequests: "จัดการคำขอ",
					cancelReasonPlaceholder: "เหตุผลการยกเลิก (ถ้ามี)",
					cancelHint: "ยกเลิกได้ก่อนถึงเวลาตัดสิทธิ์ของห้อง",
					cancelSuccess: "ยกเลิกคำขอเรียบร้อยแล้ว",
					notScheduled: "ยังไม่มีข้อมูลห้องหรือช่วงเวลา",
					unknownKind: "คำขอทั่วไป",
				}
			: {
					requestNo: "Request no.",
					requestType: "Type",
					requestedAt: "Requested",
					updatedAt: "Updated",
					roomSchedule: "Room and schedule",
					viewDetail: "View detail",
					cancel: "Cancel",
					cancelling: "Cancelling...",
					manageRequests: "Manage requests",
					cancelReasonPlaceholder: "Cancellation reason (optional)",
					cancelHint: "Available until the room cancellation cutoff.",
					cancelSuccess: "Request cancelled.",
					notScheduled: "Room or schedule is not available yet.",
					unknownKind: "General request",
				},
	);

	const kindIcons: Record<FacultyRequestKind, Component> = {
		leave: CalendarDaysIcon,
		room_booking: CalendarCheckIcon,
		equipment_borrow: PackageIcon,
		academic_service: GraduationCapIcon,
	};

	const requestCardBackgroundImages: Partial<Record<FacultyRequestKind, string>> = {
		room_booking: roomCardImage,
		equipment_borrow: equipmentCardImage,
	};

	let cancelPendingId = $state<string | null>(null);

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}
		if (form?.success && form?.action === "cancelRequest") {
			toast.success(copy.cancelSuccess);
		}
	});

	function requestPath(id: string) {
		return resolve(`/requests/${id}` as `/requests/${string}`);
	}

	function newRequestPath(kind: FacultyRequestKind) {
		return `${resolve("/requests/new")}?kind=${kind}`;
	}

	function samePageEnhance(requestId: string) {
		return pendingEnhance((pending) => {
			cancelPendingId = pending ? requestId : null;
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
		return copy.unknownKind;
	}

	function roomLabel(item: {
		roomName: string | null;
		roomNameEn: string | null;
		roomCode: string | null;
	}) {
		if (!item.roomName) return "—";
		const localized = localizedDualField(data.locale, item.roomName, item.roomNameEn);
		return item.roomCode ? `${item.roomCode} · ${localized}` : localized;
	}

	function scheduleLabel(item: { startAt: string | null; endAt: string | null }) {
		if (item.startAt && item.endAt) {
			return formatReservationWindow(data.locale, item.startAt, item.endAt);
		}
		if (item.startAt) {
			return formatReservationDateTime(data.locale, item.startAt);
		}
		return copy.notScheduled;
	}

	function statusClass(status: string) {
		switch (status) {
			case "approved":
				return "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300";
			case "rejected":
			case "cancelled":
				return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
			case "pending_approval":
				return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
			default:
				return "";
		}
	}
</script>

<svelte:head>
	<title>{pageCopy.title}</title>
</svelte:head>

<div class="space-y-8">
	<section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight">{pageCopy.heading}</h1>
			<p class="text-muted-foreground max-w-2xl text-base">{pageCopy.description}</p>
		</div>
		{#if data.canManage}
			<Button href={resolve("/requests/manage")} variant="outline">
				{copy.manageRequests}
			</Button>
		{/if}
	</section>

	<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		{#each requestCenterKinds as kind (kind)}
			{@const Icon = kindIcons[kind]}
			{@const meta = requestKindMeta[kind]}
			{@const backgroundImage = requestCardBackgroundImages[kind]}
			<Card.Root class="relative overflow-hidden transition-colors hover:bg-muted/40">
				{#if backgroundImage}
					<div class="absolute inset-0">
						<img
							src={backgroundImage}
							alt={`${meta.label} background`}
							class="size-full scale-110 object-cover blur-[1px]"
						/>
						<div class="bg-background/75 absolute inset-0 backdrop-blur-xs"></div>
					</div>
				{/if}
				<Card.Header class="relative z-10 space-y-3">
					<div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
						<Icon class="size-5" />
					</div>
					<div>
						<Card.Title class="text-lg">{meta.label}</Card.Title>
						<Card.Description>{meta.description}</Card.Description>
					</div>
				</Card.Header>
				<Card.Content class="relative z-10">
					<Button href={newRequestPath(kind)} class="w-full sm:w-auto">
						{pageCopy.startRequestCta}
						<ArrowRightIcon class="size-4" />
					</Button>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section>
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-lg">
					<InboxIcon class="text-muted-foreground size-5" />
					{pageCopy.yourRequestsHeading}
				</Card.Title>
				<Card.Description>{pageCopy.yourRequestsDescription}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.items.length === 0}
					<div class="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center text-sm">
						<InboxIcon class="size-8 opacity-50" />
						<p>{pageCopy.noSavedRequests}</p>
						<p class="max-w-md">{pageCopy.noSavedRequestsHint}</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.items as item (item.id)}
							<article class="rounded-xl border p-4">
								<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div class="min-w-0 flex-1 space-y-3">
										<div class="flex flex-wrap items-center gap-2">
											<Badge variant="outline" class={statusClass(item.status)}>
												{statusLabel(item.status)}
											</Badge>
											<Badge variant="secondary">{requestKindLabel(item.kind)}</Badge>
											<span class="text-muted-foreground font-mono text-xs">{copy.requestNo}: {item.requestNo}</span>
										</div>

										<div class="space-y-1">
											<a
												href={resolve(`/requests/${item.id}` as `/requests/${string}`)}
												class="block text-base font-semibold hover:underline"
											>
												{item.title}
											</a>
											<p class="text-muted-foreground text-sm">
												{copy.roomSchedule}: {roomLabel(item)}{item.startAt ? ` • ${scheduleLabel(item)}` : ""}
											</p>
										</div>

										<div class="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
											<p>{copy.requestedAt}: {formatReservationDateTime(data.locale, item.requestedAt)}</p>
											<p>{copy.updatedAt}: {formatReservationDateTime(data.locale, item.updatedAt)}</p>
										</div>
									</div>

									<div class="flex flex-col gap-2 lg:items-end">
										<Button variant="outline" size="sm" href={requestPath(item.id)}>
											{copy.viewDetail}
										</Button>
									</div>
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
</div>
