<script lang="ts">
	import { resolve } from "$app/paths";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import CalendarCheckIcon from "@lucide/svelte/icons/calendar-check";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import XIcon from "@lucide/svelte/icons/x";
	import BookingDrawer from "$lib/components/room-booking/booking-drawer.svelte";
	import ResourceCalendar from "$lib/components/room-booking/resource-calendar.svelte";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import {
		formatReservationWindow,
		getFacultyRequestStatusLabel,
		getRoomTypeLabel,
		roomTypes,
		type FacultyRequestStatus,
	} from "$lib/requests/faculty-request.js";
	import { shiftAcrossWeekdays } from "$lib/requests/room-booking-dates.js";
	import type { ActionData, PageData } from "./$types.js";

	type RecentRequestEntry = PageData["recentRequests"][number];
	type SlotSelection = {
		roomId: string;
		date: string;
		startTime: string;
		endTime: string;
	};

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const roomBookingPath = resolve("/room-booking");
	const requestsPath = resolve("/requests");

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ปฏิทินการจองห้อง - ONE-IL",
					title: "ปฏิทินการจองห้อง",
					description:
						"ตรวจสอบความพร้อมใช้งานรายวัน (จันทร์–ศุกร์) แล้วเปิดคำขอจองห้องจากช่วงเวลาว่างได้ทันที",
					dateLabel: "วันที่",
					roomTypeLabel: "ประเภทห้อง",
					allRoomTypes: "ทุกประเภทห้อง",
					applyFilters: "ใช้ตัวกรอง",
					clearFilters: "ล้างตัวกรอง",
					previousRange: "ก่อนหน้า",
					nextRange: "ถัดไป",
					manageBookings: "จัดการการจองห้อง",
					calendarTitle: "ปฏิทินทรัพยากรห้อง",
					calendarDescription:
						"คลิกช่วงเวลาว่างเพื่อเปิด drawer สำหรับส่งคำขอจองห้องแบบย่อ โดยยังคงใช้ข้อมูลจากเซิร์ฟเวอร์ชุดเดียวกับหน้านี้",
					filterHint: "ตัวกรองจะ reload ข้อมูลผ่าน query params ของหน้านี้",
					noRooms: "ไม่พบห้องที่ตรงกับตัวกรองนี้",
					recentRequests: "คำขอล่าสุดของฉัน",
					viewAllRequests: "ดูคำขอทั้งหมด",
					noRecentRequests: "ยังไม่มีคำขอจองห้องล่าสุด",
					selectedDateLabel: (date: string) => `วันที่ ${date}`,
					openRequest: "เปิดคำขอ",
					none: "ไม่มี",
				}
			: {
					pageTitle: "Room Booking Availability - ONE-IL",
					title: "Room booking availability",
					description:
						"Review daily room availability (Monday–Friday) and open a booking request from any valid open slot.",
					dateLabel: "Date",
					roomTypeLabel: "Room type",
					allRoomTypes: "All room types",
					applyFilters: "Apply filters",
					clearFilters: "Clear filters",
					previousRange: "Previous",
					nextRange: "Next",
					manageBookings: "Manage bookings",
					calendarTitle: "Room resource calendar",
					calendarDescription:
						"Click an open slot to launch a streamlined booking drawer while staying on the same page.",
					filterHint: "Filters reload the data through this page's query params.",
					noRooms: "No rooms match the current filter.",
					recentRequests: "My recent requests",
					viewAllRequests: "View all requests",
					noRecentRequests: "No recent room booking requests yet.",
					selectedDateLabel: (date: string) => date,
					openRequest: "Open request",
					none: "None",
				},
	);

	function parseDateParts(dateValue: string) {
		const normalized = dateValue.length >= 10 ? dateValue.slice(0, 10) : dateValue;
		const [year, month, day] = normalized.split("-").map(Number);
		return { year, month, day };
	}

	function dateFromKey(dateValue: string): Date {
		const { year, month, day } = parseDateParts(dateValue);
		return new Date(year, month - 1, day);
	}

	function setParam(params: URLSearchParams, key: string, value: string | null | undefined) {
		if (value == null || value.length === 0) {
			params.delete(key);
			return;
		}
		params.set(key, value);
	}

	function buildPageHref(overrides?: { date?: string; roomType?: string | null }) {
		const params = new URLSearchParams();
		setParam(params, "date", overrides?.date ?? data.selectedDate);
		setParam(params, "roomType", overrides?.roomType ?? data.roomType ?? null);
		const query = params.toString();
		return query.length > 0 ? `${roomBookingPath}?${query}` : roomBookingPath;
	}

	function requestDetailHref(requestId: string) {
		return resolve(`/requests/${requestId}` as `/requests/${string}`);
	}

	function formatDateLabel(dateValue: string, options: Intl.DateTimeFormatOptions): string {
		return new Intl.DateTimeFormat(data.locale === "th" ? "th-TH" : "en-US", options).format(
			dateFromKey(dateValue),
		);
	}

	function selectionFromFormData(actionForm?: ActionData): SlotSelection | null {
		if (!actionForm || actionForm.action !== "createBooking" || !("values" in actionForm) || !actionForm.values) {
			return null;
		}

		const values = actionForm.values as Record<string, unknown>;
		const roomId = typeof values.roomId === "string" ? values.roomId : "";
		const date = typeof values.bookingDate === "string" ? values.bookingDate : "";
		const startTime = typeof values.startTime === "string" ? values.startTime : "";
		const endTime = typeof values.endTime === "string" ? values.endTime : "";

		if (!roomId || !date || !startTime || !endTime) return null;
		return { roomId, date, startTime, endTime };
	}

	function requestRoomLabel(request: RecentRequestEntry): string {
		if (!request.roomName) return copy.none;
		return localizedDualField(data.locale, request.roomName, request.roomNameEn);
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

	let selectedSlot = $state<SlotSelection | null>(null);
	let drawerOpen = $state(false);
	let lastRestoredFormSelection = $state("");

	const previousDate = $derived(shiftAcrossWeekdays(data.selectedDate, -1));
	const nextDate = $derived(shiftAcrossWeekdays(data.selectedDate, 1));
	const selectedRoom = $derived.by(() => {
		const slot = selectedSlot;
		return slot ? data.rooms.find((room) => room.id === slot.roomId) ?? null : null;
	});
	const rangeLabel = $derived(
		copy.selectedDateLabel(
			formatDateLabel(data.selectedDate, {
				weekday: "long",
				day: "numeric",
				month: "short",
				year: "numeric",
			}),
		),
	);

	function openDrawer(slot: SlotSelection) {
		selectedSlot = slot;
		drawerOpen = true;
	}

	$effect(() => {
		const formSelection = selectionFromFormData(form);
		const serialized = formSelection ? JSON.stringify(formSelection) : "";
		if (!serialized || serialized === lastRestoredFormSelection) return;

		selectedSlot = formSelection;
		drawerOpen = true;
		lastRestoredFormSelection = serialized;
	});
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
		{#if data.canManage}
			<Button href={resolve("/room-booking/manage")} variant="outline" size="sm">
				<CalendarCheckIcon class="size-4" aria-hidden="true" />
				<span>{copy.manageBookings}</span>
			</Button>
		{/if}
	</header>

	<Card.Root>
		<Card.Header class="gap-4">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-1">
					<Card.Title>{copy.calendarTitle}</Card.Title>
					<Card.Description>{copy.filterHint}</Card.Description>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button href={buildPageHref({ date: previousDate })} variant="outline" size="sm">
						<ChevronLeftIcon class="size-4" aria-hidden="true" />
						<span>{copy.previousRange}</span>
					</Button>
					<Button href={buildPageHref({ date: nextDate })} variant="outline" size="sm">
						<span>{copy.nextRange}</span>
						<ChevronRightIcon class="size-4" aria-hidden="true" />
					</Button>
				</div>
			</div>
		</Card.Header>

		<Card.Content class="space-y-5">
			<form
				method="GET"
				action={roomBookingPath}
				class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
			>
				<div class="grid gap-2">
					<Label for="room-booking-date">{copy.dateLabel}</Label>
					<Input id="room-booking-date" type="date" name="date" value={data.selectedDate} />
				</div>

				<div class="grid gap-2">
					<Label for="room-booking-type">{copy.roomTypeLabel}</Label>
					<select
						id="room-booking-type"
						name="roomType"
						class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<option value="">{copy.allRoomTypes}</option>
						{#each roomTypes as roomType, i (roomType)}
							<option value={roomType} selected={data.roomType === roomType}>
								{getRoomTypeLabel(data.locale, roomType)}
							</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-wrap items-end gap-2">
					<Button type="submit" size="sm">
						<CalendarCheckIcon class="size-4" aria-hidden="true" />
						<span>{copy.applyFilters}</span>
					</Button>
					<Button href={buildPageHref({ roomType: null })} variant="outline" size="sm">
						<XIcon class="size-4" aria-hidden="true" />
						<span>{copy.clearFilters}</span>
					</Button>
				</div>
			</form>

			<div class="rounded-lg border bg-muted/20 px-4 py-3">
				<p class="text-sm font-medium">{rangeLabel}</p>
				<p class="text-muted-foreground text-xs">{copy.calendarDescription}</p>
			</div>

			{#if data.rooms.length === 0}
				<div class="rounded-lg border border-dashed px-4 py-8">
					<p class="text-muted-foreground text-sm">{copy.noRooms}</p>
				</div>
			{:else}
				<ResourceCalendar
					locale={data.locale}
					selectedDate={data.selectedDate}
					rooms={data.rooms}
					bookings={data.bookings}
					blocks={data.blocks}
					selectedSlot={selectedSlot}
					onSelectSlot={openDrawer}
				/>
			{/if}
		</Card.Content>
	</Card.Root>

	<BookingDrawer
		locale={data.locale}
		room={selectedRoom}
		equipmentCatalog={data.equipmentCatalog}
		form={form ?? undefined}
		bind:open={drawerOpen}
		bind:selection={selectedSlot}
	/>

	<Card.Root>
		<Card.Header class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-1">
				<Card.Title>{copy.recentRequests}</Card.Title>
				<Card.Description>{rangeLabel}</Card.Description>
			</div>
			<Button href={requestsPath} variant="outline" size="sm">
				<span>{copy.viewAllRequests}</span>
				<ArrowRightIcon class="size-4" aria-hidden="true" />
			</Button>
		</Card.Header>
		<Card.Content>
			<div class="space-y-3">
				{#each data.recentRequests as request, i (request.id)}
					<Button
						href={requestDetailHref(request.id)}
						variant="ghost"
						class="hover:bg-muted/40 h-auto w-full justify-start rounded-lg border p-3 transition-colors"
					>
						<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
							<div class="space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-medium">{request.title}</p>
									<Badge variant={requestStatusVariant(request.status)}>
										{getFacultyRequestStatusLabel(data.locale, request.status)}
									</Badge>
								</div>
								<p class="text-muted-foreground text-xs">
									{request.requestNo} • {requestRoomLabel(request)}
								</p>
								{#if request.startAt && request.endAt}
									<p class="text-muted-foreground text-xs">
										{formatReservationWindow(data.locale, request.startAt, request.endAt)}
									</p>
								{/if}
							</div>
							{#if request.canCancel}
								<Badge variant="outline">{copy.openRequest}</Badge>
							{/if}
						</div>
					</Button>
				{:else}
					<p class="text-muted-foreground text-sm">{copy.noRecentRequests}</p>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</section>
