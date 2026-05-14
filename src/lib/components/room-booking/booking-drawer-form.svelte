<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import type { Locale } from "$lib/i18n/locales.js";
	import {
		formatReservationWindow,
		getRoomTypeLabel,
		toFacultyDateTimeIso,
		type RoomType,
	} from "$lib/requests/faculty-request.js";

	type FixedAsset = {
		id: string;
		assetNo: string;
		name: string;
		nameEn: string | null;
		brand: string | null;
		model: string | null;
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
		allowEquipmentRequest: boolean;
		note: string | null;
		fixedAssets: FixedAsset[];
	};

	type EquipmentEntry = {
		id: string;
		assetNo: string;
		name: string;
		nameEn: string | null;
		brand: string | null;
		model: string | null;
	};

	type FieldErrors = Record<string, string[] | undefined>;

	type ActionForm = {
		action?: string;
		message?: string;
		fieldErrors?: FieldErrors;
		values?: Record<string, unknown>;
	};

	type BookingSeed = {
		title: string;
		purpose: string;
		attendeeCount: string;
		bookingDate: string;
		startTime: string;
		endTime: string;
		setupBufferMinutes: string;
		cleanupBufferMinutes: string;
		details: string;
		contactName: string;
		contactEmail: string;
		contactPhone: string;
		equipmentAssetIds: string[];
	};

	type Props = {
		locale: Locale;
		room: RoomEntry;
		equipmentCatalog: EquipmentEntry[];
		form?: ActionForm;
		seed: BookingSeed;
		selectionKey: string;
		onClose?: () => void;
		onDraftChange?: (draft: BookingSeed) => void;
		onSubmittingSelection?: (selectionKey: string) => void;
	};

	let {
		locale,
		room,
		equipmentCatalog,
		form,
		seed,
		selectionKey,
		onClose,
		onDraftChange,
		onSubmittingSelection,
	}: Props = $props();

	const copy = $derived.by(() =>
		locale === "th"
			? {
					roomSummary: "สรุปห้อง",
					roomRules: "กติกาการจอง",
					selectedWindow: "ช่วงเวลาที่เลือก",
					titleLabel: "หัวข้อ",
					titlePlaceholder: "สรุปสั้น ๆ เพื่อให้ผู้อนุมัติเห็นภาพรวม",
					purposeLabel: "วัตถุประสงค์",
					purposePlaceholder: "เช่น ประชุมคณะทำงาน อบรม หรือกิจกรรมบริการวิชาการ",
					attendeeCount: "จำนวนผู้เข้าร่วม",
					bookingDate: "วันที่ใช้งาน",
					startTime: "เวลาเริ่ม",
					endTime: "เวลาสิ้นสุด",
					setupBuffer: "เวลาเตรียมห้อง (นาที)",
					cleanupBuffer: "เวลาเก็บห้อง (นาที)",
					details: "รายละเอียดเพิ่มเติม (ไม่บังคับ)",
					detailsPlaceholder: "ข้อมูลประกอบสำหรับผู้อนุมัติหรือผู้ประสานงาน",
					contactSection: "ข้อมูลผู้ประสานงาน",
					contactName: "ชื่อผู้ประสานงาน",
					contactEmail: "อีเมลผู้ประสานงาน",
					contactPhone: "เบอร์โทรผู้ประสานงาน",
					requestEquipment: "อุปกรณ์เพิ่มเติม",
					roomEquipment: "อุปกรณ์ประจำห้อง",
					noRoomEquipment: "ยังไม่ได้กำหนดอุปกรณ์ประจำห้อง",
					noCatalogEquipment: "ยังไม่มีรายการอุปกรณ์เพิ่มเติมให้เลือก",
					equipmentNotAllowed: "ห้องนี้ไม่เปิดให้แนบคำขออุปกรณ์เพิ่มเติม",
					bookAhead: "จองล่วงหน้า",
					minAdvance: "แจ้งล่วงหน้าอย่างน้อย",
					days: "วัน",
					hours: "ชั่วโมง",
					capacity: "ความจุ",
					approver: "ผู้อนุมัติ",
					notAssigned: "ยังไม่ระบุ",
					roomNote: "หมายเหตุห้อง",
					noRoomNote: "ไม่มีหมายเหตุสำหรับห้องนี้",
					none: "ไม่มี",
					submit: "ส่งคำขอจองห้อง",
					submitting: "กำลังส่งคำขอ...",
					advancedFlow: "ไปยังฟอร์มขั้นสูง",
					advancedHint: "หากต้องการกรอกรายละเอียดมากขึ้นหรือปรับข้อมูลเพิ่มเติม ใช้ flow ขั้นสูงแทนได้",
					close: "ปิด",
				}
			: {
					roomSummary: "Room summary",
					roomRules: "Booking rules",
					selectedWindow: "Selected window",
					titleLabel: "Title",
					titlePlaceholder: "Short summary for approvers",
					purposeLabel: "Purpose",
					purposePlaceholder: "For example: committee meeting, workshop, or academic service event",
					attendeeCount: "Attendee count",
					bookingDate: "Booking date",
					startTime: "Start time",
					endTime: "End time",
					setupBuffer: "Setup buffer (minutes)",
					cleanupBuffer: "Cleanup buffer (minutes)",
					details: "Additional details (optional)",
					detailsPlaceholder: "Extra notes for approvers or the on-site coordinator",
					contactSection: "Contact details",
					contactName: "Contact name",
					contactEmail: "Contact email",
					contactPhone: "Contact phone",
					requestEquipment: "Additional equipment",
					roomEquipment: "Default room equipment",
					noRoomEquipment: "No default room equipment is configured.",
					noCatalogEquipment: "No additional equipment is currently available.",
					equipmentNotAllowed: "This room does not allow additional equipment requests.",
					bookAhead: "Book ahead",
					minAdvance: "Minimum notice",
					days: "days",
					hours: "hours",
					capacity: "Capacity",
					approver: "Approver",
					notAssigned: "Not assigned",
					roomNote: "Room note",
					noRoomNote: "No room note is available.",
					none: "None",
					submit: "Submit room booking",
					submitting: "Submitting...",
					advancedFlow: "Open advanced flow",
					advancedHint: "Use the advanced flow if you need more room-request context or additional edits.",
					close: "Close",
				},
	);

	function roomLabel(entry: RoomEntry): string {
		return `${entry.roomCode} - ${localizedDualField(locale, entry.name, entry.nameEn)}`;
	}

	function assetLabel(asset: EquipmentEntry | FixedAsset): string {
		return `${asset.assetNo} - ${localizedDualField(locale, asset.name, asset.nameEn)}`;
	}

	function fieldError(name: string): string | null {
		if (form?.action !== "createBooking") return null;
		return form.fieldErrors?.[name]?.[0] ?? null;
	}

	function samePageEnhance() {
		return pendingEnhance(
			(pending) => {
				savePending = pending;
			},
			() => {
				onSubmittingSelection?.(selectionKey);
				return async ({ update }) => {
					await update({ reset: false, invalidateAll: true });
				};
			},
		);
	}

	const newRequestPath = resolve("/requests/new");
	function cloneDraft(source: BookingSeed): BookingSeed {
		return {
			...source,
			equipmentAssetIds: [...source.equipmentAssetIds],
		};
	}

	function createDraft(): BookingSeed {
		return cloneDraft(seed);
	}

	function setQueryParam(params: URLSearchParams, key: string, value: string) {
		if (value.length === 0) return;
		params.set(key, value);
	}

	const advancedFlowHref = $derived.by(() => {
		const params = new URLSearchParams();
		params.set("kind", "room_booking");
		params.set("roomId", room.id);
		setQueryParam(params, "date", draft.bookingDate);
		setQueryParam(params, "startTime", draft.startTime);
		setQueryParam(params, "endTime", draft.endTime);
		setQueryParam(params, "title", draft.title);
		setQueryParam(params, "purpose", draft.purpose);
		setQueryParam(params, "attendeeCount", draft.attendeeCount);
		setQueryParam(params, "setupBufferMinutes", draft.setupBufferMinutes);
		setQueryParam(params, "cleanupBufferMinutes", draft.cleanupBufferMinutes);
		setQueryParam(params, "details", draft.details);
		setQueryParam(params, "contactName", draft.contactName);
		setQueryParam(params, "contactEmail", draft.contactEmail);
		setQueryParam(params, "contactPhone", draft.contactPhone);
		for (const equipmentAssetId of draft.equipmentAssetIds) {
			if (equipmentAssetId.length === 0) continue;
			params.append("equipmentAssetIds", equipmentAssetId);
		}
		return `${newRequestPath}?${params.toString()}`;
	});

	const summaryWindowLabel = $derived.by(() => {
		if (!draft.bookingDate || !draft.startTime || !draft.endTime) return copy.none;
		return formatReservationWindow(
			locale,
			toFacultyDateTimeIso(draft.bookingDate, draft.startTime),
			toFacultyDateTimeIso(draft.bookingDate, draft.endTime),
		);
	});

	let savePending = $state(false);
	let draft = $state(createDraft());

	$effect(() => {
		onDraftChange?.(cloneDraft(draft));
	});
</script>

<form method="POST" action="?/createBooking" class="space-y-6" use:enhance={samePageEnhance()}>
	<input type="hidden" name="roomId" value={room.id} />

	{#if form?.action === "createBooking" && form.message}
		<div class="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<div class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
		<div class="space-y-5">
			<div class="space-y-2">
				<Label for="calendar-booking-title">{copy.titleLabel}</Label>
				<Input
					id="calendar-booking-title"
					name="title"
					required
					minlength={3}
					maxlength={200}
					placeholder={copy.titlePlaceholder}
					aria-invalid={Boolean(fieldError("title"))}
					bind:value={draft.title}
				/>
				{#if fieldError("title")}
					<p class="text-destructive text-sm">{fieldError("title")}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="calendar-booking-purpose">{copy.purposeLabel}</Label>
				<Textarea
					id="calendar-booking-purpose"
					name="purpose"
					required
					rows={4}
					maxlength={1000}
					placeholder={copy.purposePlaceholder}
					aria-invalid={Boolean(fieldError("purpose"))}
					bind:value={draft.purpose}
				/>
				{#if fieldError("purpose")}
					<p class="text-destructive text-sm">{fieldError("purpose")}</p>
				{/if}
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="calendar-booking-date">{copy.bookingDate}</Label>
					<Input
						id="calendar-booking-date"
						name="bookingDate"
						type="date"
						required
						aria-invalid={Boolean(fieldError("bookingDate"))}
						bind:value={draft.bookingDate}
					/>
					{#if fieldError("bookingDate")}
						<p class="text-destructive text-sm">{fieldError("bookingDate")}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="calendar-attendee-count">{copy.attendeeCount}</Label>
					<Input
						id="calendar-attendee-count"
						name="attendeeCount"
						type="number"
						min="1"
						max="2000"
						required
						aria-invalid={Boolean(fieldError("attendeeCount"))}
						bind:value={draft.attendeeCount}
					/>
					{#if fieldError("attendeeCount")}
						<p class="text-destructive text-sm">{fieldError("attendeeCount")}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="calendar-start-time">{copy.startTime}</Label>
					<Input
						id="calendar-start-time"
						name="startTime"
						type="time"
						required
						aria-invalid={Boolean(fieldError("startTime"))}
						bind:value={draft.startTime}
					/>
					{#if fieldError("startTime")}
						<p class="text-destructive text-sm">{fieldError("startTime")}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="calendar-end-time">{copy.endTime}</Label>
					<Input
						id="calendar-end-time"
						name="endTime"
						type="time"
						required
						aria-invalid={Boolean(fieldError("endTime"))}
						bind:value={draft.endTime}
					/>
					{#if fieldError("endTime")}
						<p class="text-destructive text-sm">{fieldError("endTime")}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="calendar-setup-buffer">{copy.setupBuffer}</Label>
					<Input
						id="calendar-setup-buffer"
						name="setupBufferMinutes"
						type="number"
						min="0"
						max="240"
						required
						aria-invalid={Boolean(fieldError("setupBufferMinutes"))}
						bind:value={draft.setupBufferMinutes}
					/>
					{#if fieldError("setupBufferMinutes")}
						<p class="text-destructive text-sm">{fieldError("setupBufferMinutes")}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="calendar-cleanup-buffer">{copy.cleanupBuffer}</Label>
					<Input
						id="calendar-cleanup-buffer"
						name="cleanupBufferMinutes"
						type="number"
						min="0"
						max="240"
						required
						aria-invalid={Boolean(fieldError("cleanupBufferMinutes"))}
						bind:value={draft.cleanupBufferMinutes}
					/>
					{#if fieldError("cleanupBufferMinutes")}
						<p class="text-destructive text-sm">{fieldError("cleanupBufferMinutes")}</p>
					{/if}
				</div>
			</div>

			<div class="space-y-2">
				<Label for="calendar-booking-details">{copy.details}</Label>
				<Textarea
					id="calendar-booking-details"
					name="details"
					rows={4}
					maxlength={4000}
					placeholder={copy.detailsPlaceholder}
					aria-invalid={Boolean(fieldError("details"))}
					bind:value={draft.details}
				/>
				{#if fieldError("details")}
					<p class="text-destructive text-sm">{fieldError("details")}</p>
				{/if}
			</div>

			<div class="space-y-4">
				<div>
					<h3 class="text-base font-semibold">{copy.contactSection}</h3>
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2 md:col-span-2">
						<Label for="calendar-contact-name">{copy.contactName}</Label>
						<Input
							id="calendar-contact-name"
							name="contactName"
							maxlength={200}
							aria-invalid={Boolean(fieldError("contactName"))}
							bind:value={draft.contactName}
						/>
						{#if fieldError("contactName")}
							<p class="text-destructive text-sm">{fieldError("contactName")}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="calendar-contact-email">{copy.contactEmail}</Label>
						<Input
							id="calendar-contact-email"
							name="contactEmail"
							type="email"
							maxlength={320}
							aria-invalid={Boolean(fieldError("contactEmail"))}
							bind:value={draft.contactEmail}
						/>
						{#if fieldError("contactEmail")}
							<p class="text-destructive text-sm">{fieldError("contactEmail")}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="calendar-contact-phone">{copy.contactPhone}</Label>
						<Input
							id="calendar-contact-phone"
							name="contactPhone"
							maxlength={50}
							aria-invalid={Boolean(fieldError("contactPhone"))}
							bind:value={draft.contactPhone}
						/>
						{#if fieldError("contactPhone")}
							<p class="text-destructive text-sm">{fieldError("contactPhone")}</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="space-y-3">
				<div class="flex items-center justify-between gap-3">
					<div>
						<h3 class="text-base font-semibold">{copy.requestEquipment}</h3>
						<p class="text-muted-foreground text-sm">{copy.advancedHint}</p>
					</div>
					<Button href={advancedFlowHref} variant="outline" size="sm">
						{copy.advancedFlow}
					</Button>
				</div>

				{#if room.allowEquipmentRequest}
					{#if equipmentCatalog.length === 0}
						<div class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
							{copy.noCatalogEquipment}
						</div>
					{:else}
						<div class="grid gap-3 md:grid-cols-2">
							{#each equipmentCatalog as asset, i (asset.id)}
								<label class="flex items-start gap-3 rounded-lg border p-3 text-sm">
									<input
										type="checkbox"
										name="equipmentAssetIds"
										value={asset.id}
										class="mt-1 size-4 rounded border"
										bind:group={draft.equipmentAssetIds}
									/>
									<span class="space-y-1">
										<span class="block font-medium">{assetLabel(asset)}</span>
										<span class="text-muted-foreground block text-xs">
											{asset.brand ?? "—"} / {asset.model ?? "—"}
										</span>
									</span>
								</label>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
						{copy.equipmentNotAllowed}
					</div>
				{/if}
			</div>
		</div>

		<div class="space-y-4">
			<Card.Root class="bg-muted/20">
				<Card.Header class="pb-3">
					<Card.Title class="text-base">{copy.roomSummary}</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4 text-sm">
					<div class="space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<p class="font-semibold">{roomLabel(room)}</p>
							<Badge variant="secondary">{getRoomTypeLabel(locale, room.roomType)}</Badge>
						</div>
						<p class="text-muted-foreground">{copy.capacity}: {room.capacity}</p>
						<p class="text-muted-foreground">
							{copy.approver}: {room.approverName ?? copy.notAssigned}
						</p>
					</div>

					<div class="space-y-2">
						<p class="font-medium">{copy.selectedWindow}</p>
						<p class="text-muted-foreground">{summaryWindowLabel}</p>
					</div>

					<div class="space-y-2">
						<p class="font-medium">{copy.roomRules}</p>
						<p class="text-muted-foreground">{copy.bookAhead}: {room.bookingWindowDays} {copy.days}</p>
						<p class="text-muted-foreground">
							{copy.minAdvance}: {room.minAdvanceHours} {copy.hours}
						</p>
					</div>

					<div class="space-y-2">
						<p class="font-medium">{copy.roomNote}</p>
						<p class="text-muted-foreground">{room.note?.trim() || copy.noRoomNote}</p>
					</div>

					<div class="space-y-2">
						<p class="font-medium">{copy.roomEquipment}</p>
						{#if room.fixedAssets.length === 0}
							<p class="text-muted-foreground">{copy.noRoomEquipment}</p>
						{:else}
							<ul class="space-y-2">
								{#each room.fixedAssets as asset, i (asset.id)}
									<li class="rounded-md border bg-background px-3 py-2">
										<p class="font-medium">{assetLabel(asset)}</p>
										<p class="text-muted-foreground text-xs">
											{asset.brand ?? "—"} / {asset.model ?? "—"}
										</p>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	<div class="flex flex-wrap justify-end gap-2 border-t pt-4">
		<Button type="button" variant="outline" onclick={() => onClose?.()}>
			{copy.close}
		</Button>
		<SaveSubmitButton pending={savePending} idleLabel={copy.submit} savingLabel={copy.submitting} />
	</div>
</form>
