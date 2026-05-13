<script lang="ts">
	import { resolve } from "$app/paths";
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
	import { cn } from "$lib/utils.js";
	import type { PageData } from "./$types.js";

	type RoomEntry = PageData["rooms"][number];
	type RecentRequestEntry = PageData["recentRequests"][number];
	type CalendarEvent = {
		id: string;
		kind: "booking" | "block";
		roomId: string;
		startAt: string;
		endAt: string;
		title: string;
		detail: string;
		badgeLabel: string;
		badgeVariant: BadgeVariant;
		href: string | null;
	};
	type DayColumn = {
		value: string;
		title: string;
		subtitle: string;
		isToday: boolean;
	};

	let { data }: { data: PageData } = $props();

	const roomBookingPath = resolve("/room-booking");
	const newRequestPath = resolve("/requests/new");
	const requestsPath = resolve("/requests");

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ปฏิทินการจองห้อง - ONE-IL",
					title: "ปฏิทินการจองห้อง",
					description:
						"ตรวจสอบความพร้อมใช้งานของห้องตามวันหรือสัปดาห์ แล้วเปิดคำขอจองห้องจากช่วงเวลาที่ต้องการได้ทันที",
					viewLabel: "มุมมอง",
					dayView: "รายวัน",
					weekView: "รายสัปดาห์",
					dateLabel: "วันที่อ้างอิง",
					roomTypeLabel: "ประเภทห้อง",
					allRoomTypes: "ทุกประเภทห้อง",
					applyFilters: "ใช้ตัวกรอง",
					clearFilters: "ล้างตัวกรอง",
					previousRange: "ก่อนหน้า",
					nextRange: "ถัดไป",
					manageBookings: "จัดการการจองห้อง",
					requestRoom: "สร้างคำขอจองห้อง",
					requestForDay: "จองวันนี้",
					allClear: "ว่างทั้งช่วง",
					hasReservations: (count: number) => `มี ${count} รายการในช่วงนี้`,
					noSchedule: "ยังไม่มีรายการจองหรือช่วงปิดห้อง",
					recentRequests: "คำขอล่าสุดของฉัน",
					viewAllRequests: "ดูคำขอทั้งหมด",
					noRecentRequests: "ยังไม่มีคำขอจองห้องล่าสุด",
					noRooms: "ไม่พบห้องที่ตรงกับตัวกรองนี้",
					capacity: "ความจุ",
					approver: "ผู้อนุมัติ",
					bookingWindow: "เปิดให้จองล่วงหน้า",
					minAdvance: "ต้องจองล่วงหน้าอย่างน้อย",
					hours: "ชั่วโมง",
					days: "วัน",
					defaultEquipment: "อุปกรณ์ประจำห้อง",
					none: "ไม่มี",
					openRequest: "เปิดคำขอ",
					requestSummary: "สรุปคำขอ",
					dateRange: "ช่วงวันที่",
					filterHint: "ตัวกรองจะ reload ข้อมูลผ่าน query params ของหน้านี้",
					bookingDetail: (requester: string | null, attendees: number) =>
						`${requester ?? "ผู้ขอไม่ระบุชื่อ"} • ${attendees} คน`,
					blockDetail: "ปิดใช้งานห้องตามช่วงเวลานี้",
				}
			: {
					pageTitle: "Room Booking Availability - ONE-IL",
					title: "Room booking availability",
					description:
						"Review room availability by day or week and open a room booking request directly from the selected period.",
					viewLabel: "View",
					dayView: "Day",
					weekView: "Week",
					dateLabel: "Reference date",
					roomTypeLabel: "Room type",
					allRoomTypes: "All room types",
					applyFilters: "Apply filters",
					clearFilters: "Clear filters",
					previousRange: "Previous",
					nextRange: "Next",
					manageBookings: "Manage bookings",
					requestRoom: "New room request",
					requestForDay: "Book this day",
					allClear: "Available for the full range",
					hasReservations: (count: number) => `${count} item${count === 1 ? "" : "s"} in this range`,
					noSchedule: "No bookings or blackout blocks in this period",
					recentRequests: "My recent requests",
					viewAllRequests: "View all requests",
					noRecentRequests: "No recent room booking requests yet.",
					noRooms: "No rooms match the current filter.",
					capacity: "Capacity",
					approver: "Approver",
					bookingWindow: "Book ahead",
					minAdvance: "Minimum notice",
					hours: "hours",
					days: "days",
					defaultEquipment: "Default equipment",
					none: "None",
					openRequest: "Open request",
					requestSummary: "Request summary",
					dateRange: "Date range",
					filterHint: "Filters reload the data through this page's query params.",
					bookingDetail: (requester: string | null, attendees: number) =>
						`${requester ?? "Unassigned requester"} • ${attendees} attendee${attendees === 1 ? "" : "s"}`,
					blockDetail: "Room is blocked during this window.",
				}
	);

	function todayLocalKey(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	function shiftDate(dateValue: string, days: number): string {
		const baseDateMs = new Date(`${dateValue}T00:00:00Z`).getTime();
		return new Date(baseDateMs + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
	}

	function setParam(params: URLSearchParams, key: string, value: string | null | undefined) {
		if (value == null || value.length === 0) {
			params.delete(key);
			return;
		}
		params.set(key, value);
	}

	function buildPageHref(overrides?: { view?: "day" | "week"; date?: string; roomType?: string | null }) {
		const params = new URLSearchParams();
		setParam(params, "view", overrides?.view ?? data.view);
		setParam(params, "date", overrides?.date ?? data.selectedDate);
		setParam(params, "roomType", overrides?.roomType ?? data.roomType ?? null);
		const query = params.toString();
		return query.length > 0 ? `${roomBookingPath}?${query}` : roomBookingPath;
	}

	function buildRequestHref(roomId: string, dateValue: string, startTime = "09:00", endTime = "10:00") {
		const params = new URLSearchParams({
			kind: "room_booking",
			roomId,
			date: dateValue,
			startTime,
			endTime,
		});
		return `${newRequestPath}?${params.toString()}`;
	}

	function requestDetailHref(requestId: string) {
		return resolve(`/requests/${requestId}` as `/requests/${string}`);
	}

	function formatDateLabel(dateValue: string, options: Intl.DateTimeFormatOptions): string {
		return new Intl.DateTimeFormat(data.locale === "th" ? "th-TH" : "en-US", options).format(
			new Date(`${dateValue}T00:00:00`),
		);
	}

	function roomName(room: RoomEntry): string {
		return localizedDualField(data.locale, room.name, room.nameEn);
	}

	function requestRoomLabel(request: RecentRequestEntry): string {
		if (!request.roomName) return copy.none;
		return localizedDualField(data.locale, request.roomName, request.roomNameEn);
	}

	function roomLocationLabel(room: RoomEntry): string {
		if (!room.stockLocationCode && !room.stockLocationName) return copy.none;
		const name = room.stockLocationName
			? localizedDualField(data.locale, room.stockLocationName, room.stockLocationNameEn)
			: "";
		return `${room.stockLocationCode ?? ""} ${name}`.trim();
	}

	function eventOverlapsDate(startAt: string, endAt: string, dateValue: string): boolean {
		const startMs = new Date(startAt).getTime();
		const endMs = new Date(endAt).getTime();
		const dayStartMs = new Date(`${dateValue}T00:00:00+07:00`).getTime();
		const dayEndMs = new Date(`${shiftDate(dateValue, 1)}T00:00:00+07:00`).getTime();
		return startMs < dayEndMs && endMs > dayStartMs;
	}

	function bookingStatusVariant(status: FacultyRequestStatus): BadgeVariant {
		switch (status) {
			case "approved":
				return "default";
			case "pending_approval":
				return "secondary";
			case "rejected":
			case "cancelled":
				return "outline";
			default:
				return "outline";
		}
	}

	function blockVariant(blockType: string): BadgeVariant {
		return blockType === "closed" || blockType === "maintenance" ? "destructive" : "outline";
	}

	function blockLabel(blockType: string): string {
		if (data.locale === "th") {
			switch (blockType) {
				case "maintenance":
					return "ปิดซ่อมบำรุง";
				case "event":
					return "กันห้องสำหรับกิจกรรม";
				case "exam":
					return "กันห้องสำหรับสอบ";
				case "closed":
					return "ปิดใช้งาน";
				default:
					return "ปิดใช้งานห้อง";
			}
		}

		switch (blockType) {
			case "maintenance":
				return "Maintenance";
			case "event":
				return "Reserved event";
			case "exam":
				return "Exam block";
			case "closed":
				return "Closed";
			default:
				return "Room block";
		}
	}

	const previousDate = $derived(shiftDate(data.selectedDate, data.view === "week" ? -7 : -1));
	const nextDate = $derived(shiftDate(data.selectedDate, data.view === "week" ? 7 : 1));
	const todayKey = todayLocalKey();

	const dayColumns = $derived.by<DayColumn[]>(() => {
		const count = data.view === "week" ? 7 : 1;
		return Array.from({ length: count }, (_, offset) => {
			const value = shiftDate(data.selectedDate, offset);
			return {
				value,
				title: formatDateLabel(value, { weekday: "short", day: "numeric", month: "short" }),
				subtitle: formatDateLabel(value, { year: "numeric" }),
				isToday: value === todayKey,
			};
		});
	});

	const eventsByRoom = $derived.by<Record<string, CalendarEvent[]>>(() => {
		const record: Record<string, CalendarEvent[]> = {};
		for (const room of data.rooms) {
			record[room.id] = [];
		}

		for (const booking of data.bookings) {
			(record[booking.roomId] ??= []).push({
				id: booking.requestId,
				kind: "booking",
				roomId: booking.roomId,
				startAt: booking.startAt,
				endAt: booking.endAt,
				title: booking.title,
				detail: copy.bookingDetail(booking.requesterName, booking.attendeeCount),
				badgeLabel: getFacultyRequestStatusLabel(data.locale, booking.status),
				badgeVariant: bookingStatusVariant(booking.status),
				href: requestDetailHref(booking.requestId),
			});
		}

		for (const block of data.blocks) {
			(record[block.roomId] ??= []).push({
				id: block.id,
				kind: "block",
				roomId: block.roomId,
				startAt: block.startAt,
				endAt: block.endAt,
				title: block.reason,
				detail: copy.blockDetail,
				badgeLabel: blockLabel(block.blockType),
				badgeVariant: blockVariant(block.blockType),
				href: null,
			});
		}

		for (const room of data.rooms) {
			record[room.id]?.sort((left, right) => left.startAt.localeCompare(right.startAt));
		}

		return record;
	});

	const roomBoards = $derived.by(() =>
		data.rooms.map((room) => {
			const events = eventsByRoom[room.id] ?? [];
			const days = dayColumns.map((day) => ({
				...day,
				events: events.filter((event) => eventOverlapsDate(event.startAt, event.endAt, day.value)),
			}));
			return { room, events, days };
		}),
	);

	function requestStatusVariant(status: FacultyRequestStatus): BadgeVariant {
		return bookingStatusVariant(status);
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
		<div class="flex flex-wrap gap-2">
			{#if data.canManage}
				<Button href={resolve("/room-booking/manage")} variant="outline" size="sm">
					{copy.manageBookings}
				</Button>
			{/if}
			<Button
				href={buildPageHref({ view: "day" })}
				variant={data.view === "day" ? "default" : "outline"}
				size="sm"
			>
				{copy.dayView}
			</Button>
			<Button
				href={buildPageHref({ view: "week" })}
				variant={data.view === "week" ? "default" : "outline"}
				size="sm"
			>
				{copy.weekView}
			</Button>
		</div>
	</header>

	<Card.Root>
		<Card.Header class="gap-4">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-1">
					<Card.Title>{copy.requestSummary}</Card.Title>
					<Card.Description>
						{copy.filterHint}
					</Card.Description>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button href={buildPageHref({ date: previousDate })} variant="outline" size="sm">
						{copy.previousRange}
					</Button>
					<Button href={buildPageHref({ date: nextDate })} variant="outline" size="sm">
						{copy.nextRange}
					</Button>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="space-y-4">
			<form method="GET" action={roomBookingPath} class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
				<input type="hidden" name="view" value={data.view} />
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
					<Button type="submit" size="sm">{copy.applyFilters}</Button>
					<Button href={buildPageHref({ roomType: null })} variant="outline" size="sm">
						{copy.clearFilters}
					</Button>
				</div>
			</form>

			<div class={cn("grid gap-3", data.view === "week" ? "md:grid-cols-4 xl:grid-cols-7" : "sm:grid-cols-2")}>
				{#each dayColumns as day, i (day.value)}
					<div class={cn("rounded-lg border p-3", day.isToday ? "border-primary/40 bg-primary/5" : "bg-muted/20")}>
						<p class="text-sm font-semibold">{day.title}</p>
						<p class="text-muted-foreground text-xs">{day.subtitle}</p>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	{#if roomBoards.length === 0}
		<Card.Root>
			<Card.Content class="py-8">
				<p class="text-muted-foreground text-sm">{copy.noRooms}</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each roomBoards as board, i (board.room.id)}
				<Card.Root>
					<Card.Header class="gap-4">
						<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
							<div class="space-y-3">
								<div class="flex flex-wrap items-center gap-2">
									<Card.Title>{roomName(board.room)}</Card.Title>
									<Badge variant="outline">{board.room.roomCode}</Badge>
									<Badge variant="secondary">
										{getRoomTypeLabel(data.locale, board.room.roomType)}
									</Badge>
									<Badge variant={board.events.length === 0 ? "default" : "outline"}>
										{board.events.length === 0 ? copy.allClear : copy.hasReservations(board.events.length)}
									</Badge>
								</div>
								<Card.Description class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
									<span>{copy.capacity}: {board.room.capacity}</span>
									<span>{copy.approver}: {board.room.approverName ?? copy.none}</span>
									<span>{copy.bookingWindow}: {board.room.bookingWindowDays} {copy.days}</span>
									<span>{copy.minAdvance}: {board.room.minAdvanceHours} {copy.hours}</span>
									<span>{roomLocationLabel(board.room)}</span>
								</Card.Description>
								<p class="text-muted-foreground text-xs">
									{copy.defaultEquipment}:
									{#if board.room.fixedAssets.length > 0}
										{board.room.fixedAssets
											.map((asset) => localizedDualField(data.locale, asset.name, asset.nameEn))
											.join(", ")}
									{:else}
										{copy.none}
									{/if}
								</p>
							</div>
							<Button href={buildRequestHref(board.room.id, data.selectedDate)} size="sm">
								{copy.requestRoom}
							</Button>
						</div>
					</Card.Header>
					<Card.Content>
						<div class={cn("grid gap-3", data.view === "week" ? "md:grid-cols-2 xl:grid-cols-7" : "grid-cols-1")}>
							{#each board.days as day, dayIndex (day.value)}
								<div
									class={cn(
										"rounded-lg border p-3",
										day.events.length === 0 ? "border-emerald-500/20 bg-emerald-500/5" : "bg-muted/20",
									)}
								>
									<div class="flex flex-wrap items-start justify-between gap-2">
										<div>
											<p class="text-sm font-medium">{day.title}</p>
											<p class="text-muted-foreground text-xs">
												{day.events.length === 0 ? copy.noSchedule : copy.hasReservations(day.events.length)}
											</p>
										</div>
										<Button href={buildRequestHref(board.room.id, day.value)} variant="outline" size="sm">
											{copy.requestForDay}
										</Button>
									</div>

									<div class="mt-3 space-y-2">
										{#each day.events as event, eventIndex (`${event.kind}-${event.id}`)}
											<div
												class={cn(
													"rounded-md border px-3 py-2",
													event.kind === "block" ? "border-destructive/20 bg-destructive/5" : "bg-background",
												)}
											>
												<div class="flex flex-wrap items-center gap-2">
													<Badge variant={event.badgeVariant}>{event.badgeLabel}</Badge>
													<p class="text-sm font-medium">{event.title}</p>
												</div>
												<p class="text-muted-foreground mt-1 text-xs">
													{formatReservationWindow(data.locale, event.startAt, event.endAt)}
												</p>
												<p class="mt-1 text-xs">{event.detail}</p>
												{#if event.href}
													<Button
														href={event.href}
														variant="link"
														size="sm"
														class="text-primary mt-2 h-auto px-0 py-0 text-xs"
													>
														{copy.openRequest}
													</Button>
												{/if}
											</div>
										{:else}
											<p class="text-muted-foreground text-xs">{copy.noSchedule}</p>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}

	<Card.Root>
		<Card.Header class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-1">
				<Card.Title>{copy.recentRequests}</Card.Title>
				<Card.Description>{copy.dateRange}</Card.Description>
			</div>
			<Button href={requestsPath} variant="outline" size="sm">
				{copy.viewAllRequests}
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
