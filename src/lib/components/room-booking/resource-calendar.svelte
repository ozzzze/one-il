<script lang="ts">
	import { resolve } from "$app/paths";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import type { Locale } from "$lib/i18n/locales.js";
	import {
		getFacultyRequestStatusLabel,
		getRoomTypeLabel,
		toFacultyDateTimeIso,
		type FacultyRequestStatus,
		type RoomType,
	} from "$lib/requests/faculty-request.js";
	import { cn } from "$lib/utils.js";

	const SLOT_MINUTES = 60;
	const DEFAULT_START_MINUTES = 7 * 60;
	const DEFAULT_END_MINUTES = 22 * 60;
	const HOUR_WIDTH = 84;

	type FixedAsset = {
		id: string;
		name: string;
		nameEn: string | null;
	};

	type RoomEntry = {
		id: string;
		roomCode: string;
		name: string;
		nameEn: string | null;
		roomType: RoomType;
		capacity: number;
		approverName: string | null;
		bookingWindowDays: number;
		minAdvanceHours: number;
		setupBufferMinutes: number;
		cleanupBufferMinutes: number;
		stockLocationCode: string | null;
		stockLocationName: string | null;
		stockLocationNameEn: string | null;
		fixedAssets: FixedAsset[];
	};

	type BookingEntry = {
		requestId: string;
		roomId: string;
		title: string;
		status: FacultyRequestStatus;
		startAt: string;
		endAt: string;
		setupBufferMinutes: number;
		cleanupBufferMinutes: number;
		attendeeCount: number;
		requesterName: string | null;
	};

	type BlockEntry = {
		id: string;
		roomId: string;
		blockType: string;
		startAt: string;
		endAt: string;
		reason: string;
	};

	type SlotSelection = {
		roomId: string;
		date: string;
		startTime: string;
		endTime: string;
	};

	type Props = {
		locale: Locale;
		view: "day" | "week";
		selectedDate: string;
		rooms: RoomEntry[];
		bookings: BookingEntry[];
		blocks: BlockEntry[];
		selectedSlot?: SlotSelection | null;
		onSelectSlot?: (slot: SlotSelection) => void;
	};

	type DayColumn = {
		value: string;
		title: string;
		subtitle: string;
		isToday: boolean;
	};

	type CalendarItem = {
		key: string;
		kind: "booking" | "block";
		roomId: string;
		title: string;
		detail: string;
		startAt: string;
		endAt: string;
		badgeLabel: string;
		badgeVariant: BadgeVariant;
		href: string | null;
		setupBufferMinutes: number;
		cleanupBufferMinutes: number;
	};

	type EventSegment = CalendarItem & {
		leftPct: number;
		widthPct: number;
		timeLabel: string;
	};

	type SlotState = {
		disabled: boolean;
		tone: "available" | "occupied" | "rule";
		reason: string;
	};

	let {
		locale,
		view,
		selectedDate,
		rooms,
		bookings,
		blocks,
		selectedSlot = null,
		onSelectSlot,
	}: Props = $props();

	const copy = $derived.by(() =>
		locale === "th"
			? {
					room: "ห้อง",
					capacity: "ความจุ",
					approver: "ผู้อนุมัติ",
					bookAhead: "จองล่วงหน้า",
					minAdvance: "แจ้งล่วงหน้า",
					days: "วัน",
					hours: "ชม.",
					notAssigned: "ยังไม่ระบุ",
					none: "ไม่มี",
					roomAvailable: "คลิกช่วงว่างเพื่อเริ่มจอง",
					roomBusy: "มีรายการในช่วงเวลานี้",
					available: "ว่าง",
					pending: "รออนุมัติ",
					approved: "อนุมัติแล้ว",
					blocked: "ปิดใช้งานห้อง",
					restricted: "นอกเงื่อนไขการจอง",
					occupiedReason: "ช่วงเวลานี้มีรายการจองหรือปิดห้องอยู่แล้ว",
					minAdvanceReason: "ช่วงเวลานี้เร็วเกินกว่ากฎจองล่วงหน้าของห้อง",
					bookingWindowReason: "ช่วงเวลานี้อยู่นอกช่วงวันที่ห้องเปิดให้จอง",
					defaultEquipment: "อุปกรณ์ประจำ",
					openRequest: "เปิดคำขอ",
					bookingDetail: (requester: string | null, attendees: number) =>
						`${requester ?? "ผู้ขอไม่ระบุชื่อ"} • ${attendees} คน`,
					locationLabel: "สถานที่",
					selectSlot: "เลือกช่วงเวลา",
				}
			: {
					room: "Room",
					capacity: "Capacity",
					approver: "Approver",
					bookAhead: "Book ahead",
					minAdvance: "Notice",
					days: "days",
					hours: "hrs",
					notAssigned: "Not assigned",
					none: "None",
					roomAvailable: "Click an open slot to start a booking",
					roomBusy: "This range has room activity",
					available: "Available",
					pending: "Pending approval",
					approved: "Approved",
					blocked: "Room block",
					restricted: "Outside booking rules",
					occupiedReason: "This slot already has a booking or room block.",
					minAdvanceReason: "This slot is earlier than the room's minimum advance rule.",
					bookingWindowReason: "This slot is outside the room booking window.",
					defaultEquipment: "Default equipment",
					openRequest: "Open request",
					bookingDetail: (requester: string | null, attendees: number) =>
						`${requester ?? "Unassigned requester"} • ${attendees} attendee${attendees === 1 ? "" : "s"}`,
					locationLabel: "Location",
					selectSlot: "Select slot",
				},
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

	function formatDateLabel(dateValue: string, options: Intl.DateTimeFormatOptions): string {
		return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", options).format(
			new Date(`${dateValue}T00:00:00`),
		);
	}

	function roomName(room: RoomEntry): string {
		return localizedDualField(locale, room.name, room.nameEn);
	}

	function roomLocation(room: RoomEntry): string {
		if (!room.stockLocationCode && !room.stockLocationName) return copy.none;
		const locationName = room.stockLocationName
			? localizedDualField(locale, room.stockLocationName, room.stockLocationNameEn)
			: "";
		return `${room.stockLocationCode ?? ""} ${locationName}`.trim();
	}

	function minutesFromIso(isoValue: string): number {
		const [hour, minute] = isoValue.slice(11, 16).split(":").map(Number);
		return hour * 60 + minute;
	}

	function timeValue(minutes: number): string {
		const safeMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
		const hour = Math.floor(safeMinutes / 60);
		const minute = safeMinutes % 60;
		return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
	}

	function addMinutesToTime(value: string, minutes: number): string {
		const [hour, minute] = value.split(":").map(Number);
		return timeValue(hour * 60 + minute + minutes);
	}

	function requestDetailHref(requestId: string) {
		return resolve(`/requests/${requestId}` as `/requests/${string}`);
	}

	function eventOverlapsDay(startAt: string, endAt: string, dateValue: string): boolean {
		const dayStart = toFacultyDateTimeIso(dateValue, "00:00");
		const dayEnd = toFacultyDateTimeIso(shiftDate(dateValue, 1), "00:00");
		return startAt < dayEnd && endAt > dayStart;
	}

	function bookingStatusVariant(status: FacultyRequestStatus): BadgeVariant {
		switch (status) {
			case "approved":
				return "default";
			case "pending_approval":
				return "secondary";
			default:
				return "outline";
		}
	}

	function blockVariant(blockType: string): BadgeVariant {
		return blockType === "closed" || blockType === "maintenance" ? "destructive" : "outline";
	}

	function blockLabel(blockType: string): string {
		if (locale === "th") {
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

	function eventTone(item: CalendarItem): string {
		if (item.kind === "block") {
			return "border-destructive/30 bg-destructive/10 text-destructive-foreground";
		}
		return item.badgeVariant === "default"
			? "border-emerald-500/30 bg-emerald-500/10"
			: "border-amber-500/30 bg-amber-500/10";
	}

	function selectionKey(roomId: string, dateValue: string, startTime: string): string {
		return `${roomId}:${dateValue}:${startTime}`;
	}

	function handleSlotClick(roomId: string, dateValue: string, startTime: string) {
		onSelectSlot?.({
			roomId,
			date: dateValue,
			startTime,
			endTime: addMinutesToTime(startTime, SLOT_MINUTES),
		});
	}

	function segmentTimeLabel(dateValue: string, startAt: string, endAt: string): string {
		const start = startAt.slice(0, 10) === dateValue ? startAt.slice(11, 16) : "00:00";
		const end = endAt.slice(0, 10) === dateValue ? endAt.slice(11, 16) : "24:00";
		return `${start} - ${end}`;
	}

	const todayKey = todayLocalKey();

	const dayColumns = $derived.by<DayColumn[]>(() => {
		const count = view === "week" ? 7 : 1;
		return Array.from({ length: count }, (_, offset) => {
			const value = shiftDate(selectedDate, offset);
			return {
				value,
				title: formatDateLabel(value, { weekday: "short", day: "numeric", month: "short" }),
				subtitle: formatDateLabel(value, { year: "numeric" }),
				isToday: value === todayKey,
			};
		});
	});

	const calendarItemsByRoom = $derived.by<Record<string, CalendarItem[]>>(() => {
		const record: Record<string, CalendarItem[]> = {};
		for (const room of rooms) {
			record[room.id] = [];
		}

		for (const booking of bookings) {
			(record[booking.roomId] ??= []).push({
				key: `booking:${booking.requestId}`,
				kind: "booking",
				roomId: booking.roomId,
				title: booking.title,
				detail: copy.bookingDetail(booking.requesterName, booking.attendeeCount),
				startAt: booking.startAt,
				endAt: booking.endAt,
				badgeLabel: getFacultyRequestStatusLabel(locale, booking.status),
				badgeVariant: bookingStatusVariant(booking.status),
				href: requestDetailHref(booking.requestId),
				setupBufferMinutes: booking.setupBufferMinutes,
				cleanupBufferMinutes: booking.cleanupBufferMinutes,
			});
		}

		for (const block of blocks) {
			(record[block.roomId] ??= []).push({
				key: `block:${block.id}`,
				kind: "block",
				roomId: block.roomId,
				title: block.reason,
				detail: blockLabel(block.blockType),
				startAt: block.startAt,
				endAt: block.endAt,
				badgeLabel: blockLabel(block.blockType),
				badgeVariant: blockVariant(block.blockType),
				href: null,
				setupBufferMinutes: 0,
				cleanupBufferMinutes: 0,
			});
		}

		for (const room of rooms) {
			record[room.id]?.sort((left, right) => left.startAt.localeCompare(right.startAt));
		}

		return record;
	});

	const visibleRange = $derived.by(() => {
		let start = DEFAULT_START_MINUTES;
		let end = DEFAULT_END_MINUTES;

		for (const room of rooms) {
			for (const item of calendarItemsByRoom[room.id] ?? []) {
				for (const day of dayColumns) {
					if (!eventOverlapsDay(item.startAt, item.endAt, day.value)) continue;
					const segmentStart = item.startAt.slice(0, 10) === day.value ? minutesFromIso(item.startAt) : 0;
					const segmentEnd =
						item.endAt.slice(0, 10) === day.value ? minutesFromIso(item.endAt) : 24 * 60;

					start = Math.min(start, Math.floor(segmentStart / 60) * 60);
					end = Math.max(end, Math.ceil(segmentEnd / 60) * 60);
				}
			}
		}

		return {
			start: Math.max(0, start),
			end: Math.min(24 * 60, Math.max(start + SLOT_MINUTES, end)),
		};
	});

	const timeColumns = $derived.by(() => {
		const items: Array<{ value: string; label: string }> = [];
		for (let minutes = visibleRange.start; minutes < visibleRange.end; minutes += SLOT_MINUTES) {
			const value = timeValue(minutes);
			items.push({
				value,
				label: value,
			});
		}
		return items;
	});

	const dayWidth = $derived(timeColumns.length * HOUR_WIDTH);
	const totalVisibleMinutes = $derived(Math.max(visibleRange.end - visibleRange.start, SLOT_MINUTES));

	const segmentsByRoomDay = $derived.by<Record<string, Record<string, EventSegment[]>>>(() => {
		const record: Record<string, Record<string, EventSegment[]>> = {};

		for (const room of rooms) {
			const roomDays: Record<string, EventSegment[]> = {};
			const items = calendarItemsByRoom[room.id] ?? [];

			for (const day of dayColumns) {
				const segments = items
					.filter((item) => eventOverlapsDay(item.startAt, item.endAt, day.value))
					.map((item) => {
						const rawStart =
							item.startAt.slice(0, 10) === day.value ? minutesFromIso(item.startAt) : 0;
						const rawEnd =
							item.endAt.slice(0, 10) === day.value ? minutesFromIso(item.endAt) : 24 * 60;
						const clampedStart = Math.max(visibleRange.start, rawStart);
						const clampedEnd = Math.min(visibleRange.end, rawEnd);

						if (clampedEnd <= clampedStart) return null;

						return {
							...item,
							leftPct: ((clampedStart - visibleRange.start) / totalVisibleMinutes) * 100,
							widthPct: ((clampedEnd - clampedStart) / totalVisibleMinutes) * 100,
							timeLabel: segmentTimeLabel(day.value, item.startAt, item.endAt),
						};
					})
					.filter((item): item is EventSegment => item !== null)
					.sort((left, right) => left.startAt.localeCompare(right.startAt));

				roomDays[day.value] = segments;
			}

			record[room.id] = roomDays;
		}

		return record;
	});

	const slotStates = $derived.by<Record<string, SlotState>>(() => {
		const record: Record<string, SlotState> = {};
		const nowMs = Date.now();

		for (const room of rooms) {
			const items = calendarItemsByRoom[room.id] ?? [];
			const minAllowedMs = nowMs + room.minAdvanceHours * 60 * 60 * 1000;
			const maxAllowedMs = nowMs + room.bookingWindowDays * 24 * 60 * 60 * 1000;

			for (const day of dayColumns) {
				for (const column of timeColumns) {
					const slotStartAt = toFacultyDateTimeIso(day.value, column.value);
					const slotStartMs = new Date(slotStartAt).getTime();
					const slotEndMs = slotStartMs + SLOT_MINUTES * 60 * 1000;
					const candidateStartMs = slotStartMs - room.setupBufferMinutes * 60 * 1000;
					const candidateEndMs = slotEndMs + room.cleanupBufferMinutes * 60 * 1000;
					const key = selectionKey(room.id, day.value, column.value);

					if (slotStartMs < minAllowedMs) {
						record[key] = {
							disabled: true,
							tone: "rule",
							reason: copy.minAdvanceReason,
						};
						continue;
					}

					if (slotStartMs > maxAllowedMs) {
						record[key] = {
							disabled: true,
							tone: "rule",
							reason: copy.bookingWindowReason,
						};
						continue;
					}

					const overlaps = items.some((item) => {
						const occupiedStartMs =
							new Date(item.startAt).getTime() - item.setupBufferMinutes * 60 * 1000;
						const occupiedEndMs =
							new Date(item.endAt).getTime() + item.cleanupBufferMinutes * 60 * 1000;
						return occupiedStartMs < candidateEndMs && occupiedEndMs > candidateStartMs;
					});

					record[key] = overlaps
						? {
								disabled: true,
								tone: "occupied",
								reason: copy.occupiedReason,
							}
						: {
								disabled: false,
								tone: "available",
								reason: copy.selectSlot,
							};
				}
			}
		}

		return record;
	});
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-2">
		<Badge variant="outline" class="border-emerald-500/30 bg-emerald-500/10">
			{copy.available}
		</Badge>
		<Badge variant="secondary" class="border-amber-500/30 bg-amber-500/10">
			{copy.pending}
		</Badge>
		<Badge variant="default" class="border-emerald-600/20 bg-emerald-600/20">
			{copy.approved}
		</Badge>
		<Badge variant="destructive" class="border-destructive/30 bg-destructive/10">
			{copy.blocked}
		</Badge>
		<Badge variant="outline" class="bg-muted/60">
			{copy.restricted}
		</Badge>
	</div>

	<div class="overflow-hidden rounded-lg border">
		<div class="overflow-auto">
			<div class="min-w-max">
				<div class="sticky top-0 z-20 flex border-b bg-background/95 backdrop-blur">
					<div class="sticky left-0 z-30 w-72 shrink-0 border-r bg-background/95 px-4 py-3 backdrop-blur">
						<p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">{copy.room}</p>
					</div>
					<div class="flex">
						{#each dayColumns as day, i (day.value)}
							<div class="border-r last:border-r-0">
								<div
									class={cn(
										"border-b px-4 py-3",
										day.isToday ? "bg-primary/5" : "bg-muted/20",
									)}
									style={`width:${dayWidth}px;`}
								>
									<p class="text-sm font-semibold">{day.title}</p>
									<p class="text-muted-foreground text-xs">{day.subtitle}</p>
								</div>
								<div class="grid" style={`grid-template-columns: repeat(${timeColumns.length}, ${HOUR_WIDTH}px);`}>
									{#each timeColumns as column, columnIndex (`${day.value}:${column.value}`)}
										<div class="text-muted-foreground border-r px-2 py-2 text-center text-[11px] last:border-r-0">
											{column.label}
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>

				{#each rooms as room, i (room.id)}
					<div class="flex border-b last:border-b-0">
						<div class="sticky left-0 z-10 flex w-72 shrink-0 flex-col justify-between border-r bg-background/95 px-4 py-4 backdrop-blur">
							<div class="space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-semibold">{roomName(room)}</p>
									<Badge variant="outline">{room.roomCode}</Badge>
									<Badge variant="secondary">{getRoomTypeLabel(locale, room.roomType)}</Badge>
								</div>
								<div class="text-muted-foreground space-y-1 text-xs">
									<p>{copy.capacity}: {room.capacity}</p>
									<p>{copy.approver}: {room.approverName ?? copy.notAssigned}</p>
									<p>{copy.bookAhead}: {room.bookingWindowDays} {copy.days}</p>
									<p>{copy.minAdvance}: {room.minAdvanceHours} {copy.hours}</p>
									<p>{copy.locationLabel}: {roomLocation(room)}</p>
								</div>
							</div>
							<p class="text-muted-foreground mt-3 text-xs">
								{copy.defaultEquipment}:
								{#if room.fixedAssets.length > 0}
									{room.fixedAssets
										.map((asset) => localizedDualField(locale, asset.name, asset.nameEn))
										.join(", ")}
								{:else}
									{copy.none}
								{/if}
							</p>
						</div>

						<div class="flex">
							{#each dayColumns as day, dayIndex (day.value)}
								<div
									class={cn(
										"relative border-r last:border-r-0",
										day.isToday ? "bg-primary/[0.03]" : "bg-background",
									)}
									style={`width:${dayWidth}px;`}
								>
									<div
										class="absolute inset-0 grid"
										style={`grid-template-columns: repeat(${timeColumns.length}, ${HOUR_WIDTH}px);`}
									>
										{#each timeColumns as column, columnIndex (`${room.id}:${day.value}:${column.value}`)}
											{@const state = slotStates[selectionKey(room.id, day.value, column.value)]}
											{@const isSelected =
												selectedSlot != null &&
												selectionKey(room.id, day.value, column.value) ===
													selectionKey(selectedSlot.roomId, selectedSlot.date, selectedSlot.startTime)}
											<button
												type="button"
												class={cn(
													"border-r border-dashed transition last:border-r-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:outline-none",
													state?.tone === "occupied" && "bg-destructive/[0.05]",
													state?.tone === "rule" && "bg-muted/40",
													state?.tone === "available" &&
														"hover:bg-emerald-500/10 focus-visible:bg-emerald-500/10",
													isSelected && "bg-primary/10 ring-1 ring-primary/40",
												)}
												style="min-height: 144px;"
												title={state?.reason}
												aria-label={`${copy.selectSlot}: ${roomName(room)} ${day.title} ${column.value}`}
												disabled={state?.disabled}
												onclick={() => handleSlotClick(room.id, day.value, column.value)}
											>
												<span class="sr-only">{state?.reason}</span>
											</button>
										{/each}
									</div>

									<div class="pointer-events-none relative z-10 min-h-36 p-2">
										{#each segmentsByRoomDay[room.id]?.[day.value] ?? [] as segment, segmentIndex (segment.key)}
											{#if segment.href}
												<a
													href={segment.href}
													class={cn(
														"pointer-events-auto absolute top-2 bottom-2 overflow-hidden rounded-md border px-2 py-1 shadow-sm transition hover:shadow-md",
														eventTone(segment),
													)}
													style={`left:${segment.leftPct}%; width:max(${segment.widthPct}%, 5rem); max-width:calc(100% - ${segment.leftPct}%);`}
													title={`${segment.title} • ${segment.timeLabel}`}
												>
													<p class="truncate text-[11px] font-semibold">{segment.badgeLabel}</p>
													<p class="truncate text-xs font-medium">{segment.title}</p>
													<p class="truncate text-[11px] opacity-80">{segment.timeLabel}</p>
												</a>
											{:else}
												<div
													class={cn(
														"pointer-events-auto absolute top-2 bottom-2 overflow-hidden rounded-md border px-2 py-1 shadow-sm",
														eventTone(segment),
													)}
													style={`left:${segment.leftPct}%; width:max(${segment.widthPct}%, 5rem); max-width:calc(100% - ${segment.leftPct}%);`}
													title={`${segment.title} • ${segment.timeLabel}`}
												>
													<p class="truncate text-[11px] font-semibold">{segment.badgeLabel}</p>
													<p class="truncate text-xs font-medium">{segment.title}</p>
													<p class="truncate text-[11px] opacity-80">{segment.timeLabel}</p>
												</div>
											{/if}
										{/each}

										{#if (segmentsByRoomDay[room.id]?.[day.value] ?? []).length === 0}
											<p class="text-muted-foreground pointer-events-none absolute inset-x-2 bottom-2 text-[11px]">
												{copy.roomAvailable}
											</p>
										{:else}
											<p class="text-muted-foreground pointer-events-none absolute inset-x-2 bottom-2 text-[11px]">
												{copy.roomBusy}
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
