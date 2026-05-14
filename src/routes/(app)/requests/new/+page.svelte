<script lang="ts">
	import { enhance } from "$app/forms";
	import { base } from "$app/paths";
	import { page } from "$app/state";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import { getRoomTypeLabel } from "$lib/requests/faculty-request.js";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

	type FieldErrors = Record<string, string[] | undefined>;

	let { data, form } = $props();

	const uiLabels = $derived(getUiLabels(data.locale));
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					newEquipmentRequest: "สร้างคำขอยืมอุปกรณ์ใหม่",
					newRequest: (label: string) => `สร้างคำขอ${label}ใหม่`,
					requestEquipment: "ส่งคำขอยืมอุปกรณ์",
					validateRequest: "ตรวจสอบคำขอ",
					submitRoomBooking: "ส่งคำขอจองห้อง",
					backToRequests: "กลับไปหน้าคำขอ",
					details: "รายละเอียด",
					title: "หัวข้อ",
					titlePlaceholder: "สรุปสั้น ๆ เพื่อใช้ในการส่งต่อ",
					detailsOptional: "รายละเอียด (ไม่บังคับ)",
					detailsPlaceholder: "วันที่ สถานที่ รหัสอุปกรณ์ หรือบันทึกจากอาจารย์ที่ปรึกษา",
					validationPrefix:
						"การส่งฟอร์มนี้จะตรวจสอบข้อมูลบนเซิร์ฟเวอร์ด้วย Zod การบันทึกลงฐานข้อมูลจะใช้งานหลังมีโมเดล",
					validationSuffix: "กลาง",
					validated: (summary: string) => `ตรวจสอบ “${summary}” เรียบร้อย ขั้นตอนบันทึกฐานข้อมูลจะมาในลำดับถัดไป`,
					roomBookingTitle: "สร้างคำขอจองห้องใหม่",
					room: "ห้อง",
					roomPlaceholder: "เลือกห้อง",
					roomOverview: "ข้อมูลห้อง",
					roomSchedule: "กำหนดการใช้งาน",
					bookingDate: "วันที่ใช้งาน",
					startTime: "เวลาเริ่ม",
					endTime: "เวลาสิ้นสุด",
					attendeeCount: "จำนวนผู้เข้าร่วม",
					purpose: "วัตถุประสงค์การใช้งาน",
					purposePlaceholder: "เช่น ประชุมหลักสูตร สัมมนา หรือกิจกรรมบริการวิชาการ",
					contactSection: "ข้อมูลผู้ประสานงาน",
					contactName: "ชื่อผู้ประสานงาน",
					contactEmail: "อีเมลผู้ประสานงาน",
					contactPhone: "เบอร์โทรผู้ประสานงาน",
					setupBuffer: "เวลาเตรียมห้อง (นาที)",
					cleanupBuffer: "เวลาเก็บห้อง (นาที)",
					roomCapacity: "ความจุ",
					roomType: "ประเภทห้อง",
					roomApprover: "ผู้อนุมัติ",
					roomNote: "หมายเหตุห้อง",
					roomAssets: "อุปกรณ์ประจำห้อง",
					requestedEquipment: "อุปกรณ์ที่ต้องการเพิ่มเติม",
					roomDefaultBufferHint: "เมื่อเปลี่ยนห้อง ระบบจะตั้งค่าเวลาเตรียม/เก็บห้องตามค่ามาตรฐานของห้อง",
					noRoomAssets: "ห้องนี้ยังไม่ได้กำหนดอุปกรณ์ประจำ",
					noAdditionalEquipment: "ยังไม่มีรายการอุปกรณ์ให้เลือกเพิ่มเติม",
					equipmentNotAllowed: "ห้องนี้ไม่เปิดให้ขออุปกรณ์เพิ่มเติม",
					noRoomNote: "ไม่มีหมายเหตุสำหรับห้องนี้",
					notAssigned: "ยังไม่ระบุ",
				}
			: {
					newEquipmentRequest: "New Equipment Borrowing Request",
					newRequest: (label: string) => `New ${label} request`,
					requestEquipment: "Request Equipment",
					validateRequest: "Validate request",
					submitRoomBooking: "Submit room booking request",
					backToRequests: "Back to Requests",
					details: "Details",
					title: "Title",
					titlePlaceholder: "Short summary for routing",
					detailsOptional: "Details (optional)",
					detailsPlaceholder: "Dates, location, equipment tags, or advisor notes.",
					validationPrefix: "Submit validates on the server with Zod. Rows will be inserted after the shared",
					validationSuffix: "model exists.",
					validated: (summary: string) => `Validated “${summary}”. Database persistence comes next.`,
					roomBookingTitle: "New room booking request",
					room: "Room",
					roomPlaceholder: "Select room",
					roomOverview: "Room overview",
					roomSchedule: "Schedule",
					bookingDate: "Booking date",
					startTime: "Start time",
					endTime: "End time",
					attendeeCount: "Attendee count",
					purpose: "Purpose",
					purposePlaceholder: "For example: program meeting, workshop, or academic service event",
					contactSection: "Contact",
					contactName: "Contact name",
					contactEmail: "Contact email",
					contactPhone: "Contact phone",
					setupBuffer: "Setup buffer (minutes)",
					cleanupBuffer: "Cleanup buffer (minutes)",
					roomCapacity: "Capacity",
					roomType: "Room type",
					roomApprover: "Approver",
					roomNote: "Room note",
					roomAssets: "Default room equipment",
					requestedEquipment: "Additional requested equipment",
					roomDefaultBufferHint: "Changing the room resets setup and cleanup buffers to that room's defaults.",
					noRoomAssets: "No default room equipment is configured.",
					noAdditionalEquipment: "No additional equipment is currently available.",
					equipmentNotAllowed: "This room does not allow additional equipment requests.",
					noRoomNote: "No room note available.",
					notAssigned: "Not assigned",
				},
	);

	const formValues = $derived.by(() => {
		if (form && "values" in form && form.values) {
			return form.values as Record<string, unknown>;
		}
		return {};
	});

	const formFieldErrors = $derived.by(() => {
		if (form && "fieldErrors" in form && form.fieldErrors) {
			return form.fieldErrors as FieldErrors;
		}
		return {};
	});

	function readStringValue(values: Record<string, unknown>, key: string, fallback = "") {
		return typeof values[key] === "string" ? values[key] : fallback;
	}

	function readNumberishValue(values: Record<string, unknown>, key: string, fallback: number | string) {
		const value = values[key];
		if (typeof value === "string") return value;
		if (typeof value === "number" && Number.isFinite(value)) return String(value);
		return String(fallback);
	}

	function readStringArrayValue(values: Record<string, unknown>, key: string) {
		return Array.isArray(values[key])
			? values[key].filter((value: unknown): value is string => typeof value === "string")
			: [];
	}

	function sanitizeEquipmentAssetIds(roomId: string, equipmentAssetIds: string[]) {
		if (data.kind !== "room_booking") return [];
		const room = data.rooms.find((entry) => entry.id === roomId);
		if (!room?.allowEquipmentRequest) return [];
		const catalogIds = new Set(data.equipmentCatalog.map((asset) => asset.id));
		return equipmentAssetIds.filter((assetId) => catalogIds.has(assetId));
	}

	const genericValues = $derived.by(() => {
		const values = formValues;
		return {
			title: typeof values.title === "string" ? values.title : "",
			details: typeof values.details === "string" ? values.details : "",
		};
	});

	const roomBookingDefaults = $derived.by(() => {
		if (data.kind !== "room_booking") return null;
		const defaults = data.roomBookingDefaults as Record<string, unknown>;
		const params = page.url.searchParams;
		const queryDefaults: Record<string, unknown> = {
			title: params.get("title") ?? undefined,
			details: params.get("details") ?? undefined,
			roomId: params.get("roomId") ?? undefined,
			bookingDate: params.get("date") ?? undefined,
			startTime: params.get("startTime") ?? undefined,
			endTime: params.get("endTime") ?? undefined,
			attendeeCount: params.get("attendeeCount") ?? undefined,
			purpose: params.get("purpose") ?? undefined,
			contactName: params.get("contactName") ?? undefined,
			contactEmail: params.get("contactEmail") ?? undefined,
			contactPhone: params.get("contactPhone") ?? undefined,
			setupBufferMinutes: params.get("setupBufferMinutes") ?? undefined,
			cleanupBufferMinutes: params.get("cleanupBufferMinutes") ?? undefined,
			equipmentAssetIds: params.getAll("equipmentAssetIds"),
		};
		const mergedDefaults = { ...defaults, ...queryDefaults };
		const roomId = readStringValue(mergedDefaults, "roomId", data.roomBookingDefaults.roomId);

		return {
			title: readStringValue(mergedDefaults, "title"),
			details: readStringValue(mergedDefaults, "details"),
			roomId,
			bookingDate: readStringValue(
				mergedDefaults,
				"bookingDate",
				data.roomBookingDefaults.bookingDate,
			),
			startTime: readStringValue(mergedDefaults, "startTime", data.roomBookingDefaults.startTime),
			endTime: readStringValue(mergedDefaults, "endTime", data.roomBookingDefaults.endTime),
			attendeeCount: readNumberishValue(
				mergedDefaults,
				"attendeeCount",
				data.roomBookingDefaults.attendeeCount,
			),
			purpose: readStringValue(mergedDefaults, "purpose"),
			contactName: readStringValue(mergedDefaults, "contactName"),
			contactEmail: readStringValue(mergedDefaults, "contactEmail"),
			contactPhone: readStringValue(mergedDefaults, "contactPhone"),
			setupBufferMinutes: readNumberishValue(
				mergedDefaults,
				"setupBufferMinutes",
				data.roomBookingDefaults.setupBufferMinutes,
			),
			cleanupBufferMinutes: readNumberishValue(
				mergedDefaults,
				"cleanupBufferMinutes",
				data.roomBookingDefaults.cleanupBufferMinutes,
			),
			equipmentAssetIds: sanitizeEquipmentAssetIds(
				roomId,
				readStringArrayValue(mergedDefaults, "equipmentAssetIds"),
			),
		};
	});

	const roomFormValues = $derived.by(() => {
		if (data.kind !== "room_booking" || !roomBookingDefaults) return null;
		const values = formValues;
		const roomId = readStringValue(values, "roomId", roomBookingDefaults.roomId);
		const equipmentAssetIds = sanitizeEquipmentAssetIds(
			roomId,
			Array.isArray(values.equipmentAssetIds)
				? readStringArrayValue(values, "equipmentAssetIds")
				: roomBookingDefaults.equipmentAssetIds,
		);

		return {
			title: readStringValue(values, "title", roomBookingDefaults.title),
			details: readStringValue(values, "details", roomBookingDefaults.details),
			roomId,
			bookingDate: readStringValue(values, "bookingDate", roomBookingDefaults.bookingDate),
			startTime: readStringValue(values, "startTime", roomBookingDefaults.startTime),
			endTime: readStringValue(values, "endTime", roomBookingDefaults.endTime),
			attendeeCount: readNumberishValue(values, "attendeeCount", roomBookingDefaults.attendeeCount),
			purpose: readStringValue(values, "purpose", roomBookingDefaults.purpose),
			contactName: readStringValue(values, "contactName", roomBookingDefaults.contactName),
			contactEmail: readStringValue(values, "contactEmail", roomBookingDefaults.contactEmail),
			contactPhone: readStringValue(values, "contactPhone", roomBookingDefaults.contactPhone),
			setupBufferMinutes: readNumberishValue(
				values,
				"setupBufferMinutes",
				roomBookingDefaults.setupBufferMinutes,
			),
			cleanupBufferMinutes: readNumberishValue(
				values,
				"cleanupBufferMinutes",
				roomBookingDefaults.cleanupBufferMinutes,
			),
			equipmentAssetIds,
		};
	});

	const pageTitle = $derived(
		data.kind === "room_booking"
			? copy.roomBookingTitle
			: data.kind === "equipment_borrow"
				? copy.newEquipmentRequest
				: copy.newRequest(data.label),
	);

	const submitLabel = $derived(
		data.kind === "room_booking"
			? copy.submitRoomBooking
			: data.kind === "equipment_borrow"
				? copy.requestEquipment
				: copy.validateRequest,
	);

	let savePending = $state(false);
	let titleValue = $state("");
	let detailsValue = $state("");
	let selectedRoomId = $state("");
	let bookingDateValue = $state("");
	let startTimeValue = $state("");
	let endTimeValue = $state("");
	let attendeeCountValue = $state("");
	let purposeValue = $state("");
	let contactNameValue = $state("");
	let contactEmailValue = $state("");
	let contactPhoneValue = $state("");
	let setupBufferMinutesValue = $state("");
	let cleanupBufferMinutesValue = $state("");
	let selectedEquipmentIds = $state<string[]>([]);

	const selectedRoom = $derived(
		data.kind === "room_booking"
			? data.rooms.find((room) => room.id === selectedRoomId) ?? null
			: null,
	);

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success && form?.preview) {
			toast.success(copy.validated(form.summary));
		}
	});

	$effect(() => {
		if (data.kind !== "room_booking" || !roomFormValues) return;
		titleValue = roomFormValues.title;
		detailsValue = roomFormValues.details;
		selectedRoomId = roomFormValues.roomId;
		bookingDateValue = roomFormValues.bookingDate;
		startTimeValue = roomFormValues.startTime;
		endTimeValue = roomFormValues.endTime;
		attendeeCountValue = roomFormValues.attendeeCount;
		purposeValue = roomFormValues.purpose;
		contactNameValue = roomFormValues.contactName;
		contactEmailValue = roomFormValues.contactEmail;
		contactPhoneValue = roomFormValues.contactPhone;
		setupBufferMinutesValue = roomFormValues.setupBufferMinutes;
		cleanupBufferMinutesValue = roomFormValues.cleanupBufferMinutes;
		selectedEquipmentIds = roomFormValues.equipmentAssetIds;
	});

	function withBase(path: string) {
		return `${base}${path}`;
	}

	function samePageEnhance() {
		return pendingEnhance((pending) => {
			savePending = pending;
		}, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: true });
		});
	}

	function fieldError(name: string) {
		return formFieldErrors[name]?.[0] ?? null;
	}

	function roomLabel(room: { roomCode: string; name: string; nameEn: string | null }) {
		return `${room.roomCode} - ${localizedDualField(data.locale, room.name, room.nameEn)}`;
	}

	function assetLabel(asset: { assetNo: string; name: string; nameEn: string | null }) {
		return `${asset.assetNo} - ${localizedDualField(data.locale, asset.name, asset.nameEn)}`;
	}

	function syncRoomBuffers(roomId: string) {
		if (data.kind !== "room_booking") return;
		selectedRoomId = roomId;
		const room = data.rooms.find((item) => item.id === roomId);
		if (!room) return;
		setupBufferMinutesValue = String(room.setupBufferMinutes);
		cleanupBufferMinutesValue = String(room.cleanupBufferMinutes);
		if (!room.allowEquipmentRequest) {
			selectedEquipmentIds = [];
		}
	}
</script>

<svelte:head>
	<title>{pageTitle} - ONE-IL</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href={withBase("/requests")}>
			<ArrowLeftIcon class="size-4" />
			<span class="sr-only">{copy.backToRequests}</span>
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{pageTitle}</h1>
			<p class="text-muted-foreground">{data.description}</p>
		</div>
	</div>

	{#if data.kind === "room_booking"}
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.details}</Card.Title>
				<Card.Description>{data.label}</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" class="space-y-8" use:enhance={samePageEnhance()}>
					<input type="hidden" name="kind" value={data.kind} />

					<div class="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
						<div class="space-y-6">
							<div class="space-y-2">
								<Label for="title">{copy.title}</Label>
								<Input
									id="title"
									name="title"
									required
									minlength={3}
									maxlength={200}
									placeholder={copy.titlePlaceholder}
									aria-invalid={Boolean(fieldError("title"))}
									bind:value={titleValue}
								/>
								{#if fieldError("title")}
									<p class="text-destructive text-sm">{fieldError("title")}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label for="details">{copy.detailsOptional}</Label>
								<Textarea
									id="details"
									name="details"
									maxlength={4000}
									placeholder={copy.detailsPlaceholder}
									rows={4}
									aria-invalid={Boolean(fieldError("details"))}
									bind:value={detailsValue}
								/>
								{#if fieldError("details")}
									<p class="text-destructive text-sm">{fieldError("details")}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label for="roomId">{copy.room}</Label>
								<select
									id="roomId"
									name="roomId"
									required
									class="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
									aria-invalid={Boolean(fieldError("roomId"))}
									bind:value={selectedRoomId}
									onchange={(event) => syncRoomBuffers((event.currentTarget as HTMLSelectElement).value)}
								>
									<option value="">{copy.roomPlaceholder}</option>
									{#each data.rooms as room, i (room.id)}
										<option value={room.id}>{roomLabel(room)}</option>
									{/each}
								</select>
								{#if fieldError("roomId")}
									<p class="text-destructive text-sm">{fieldError("roomId")}</p>
								{/if}
							</div>

							<div class="space-y-3">
								<div>
									<h2 class="text-base font-semibold">{copy.roomSchedule}</h2>
									<p class="text-muted-foreground text-sm">{copy.roomDefaultBufferHint}</p>
								</div>
								<div class="grid gap-4 md:grid-cols-2">
									<div class="space-y-2">
										<Label for="bookingDate">{copy.bookingDate}</Label>
										<Input
											id="bookingDate"
											name="bookingDate"
											type="date"
											required
											aria-invalid={Boolean(fieldError("bookingDate"))}
											bind:value={bookingDateValue}
										/>
										{#if fieldError("bookingDate")}
											<p class="text-destructive text-sm">{fieldError("bookingDate")}</p>
										{/if}
									</div>
									<div class="space-y-2">
										<Label for="attendeeCount">{copy.attendeeCount}</Label>
										<Input
											id="attendeeCount"
											name="attendeeCount"
											type="number"
											min="1"
											max="2000"
											required
											aria-invalid={Boolean(fieldError("attendeeCount"))}
											bind:value={attendeeCountValue}
										/>
										{#if fieldError("attendeeCount")}
											<p class="text-destructive text-sm">{fieldError("attendeeCount")}</p>
										{/if}
									</div>
									<div class="space-y-2">
										<Label for="startTime">{copy.startTime}</Label>
										<Input
											id="startTime"
											name="startTime"
											type="time"
											required
											aria-invalid={Boolean(fieldError("startTime"))}
											bind:value={startTimeValue}
										/>
										{#if fieldError("startTime")}
											<p class="text-destructive text-sm">{fieldError("startTime")}</p>
										{/if}
									</div>
									<div class="space-y-2">
										<Label for="endTime">{copy.endTime}</Label>
										<Input
											id="endTime"
											name="endTime"
											type="time"
											required
											aria-invalid={Boolean(fieldError("endTime"))}
											bind:value={endTimeValue}
										/>
										{#if fieldError("endTime")}
											<p class="text-destructive text-sm">{fieldError("endTime")}</p>
										{/if}
									</div>
									<div class="space-y-2">
										<Label for="setupBufferMinutes">{copy.setupBuffer}</Label>
										<Input
											id="setupBufferMinutes"
											name="setupBufferMinutes"
											type="number"
											min="0"
											max="240"
											required
											aria-invalid={Boolean(fieldError("setupBufferMinutes"))}
											bind:value={setupBufferMinutesValue}
										/>
										{#if fieldError("setupBufferMinutes")}
											<p class="text-destructive text-sm">{fieldError("setupBufferMinutes")}</p>
										{/if}
									</div>
									<div class="space-y-2">
										<Label for="cleanupBufferMinutes">{copy.cleanupBuffer}</Label>
										<Input
											id="cleanupBufferMinutes"
											name="cleanupBufferMinutes"
											type="number"
											min="0"
											max="240"
											required
											aria-invalid={Boolean(fieldError("cleanupBufferMinutes"))}
											bind:value={cleanupBufferMinutesValue}
										/>
										{#if fieldError("cleanupBufferMinutes")}
											<p class="text-destructive text-sm">{fieldError("cleanupBufferMinutes")}</p>
										{/if}
									</div>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="purpose">{copy.purpose}</Label>
								<Textarea
									id="purpose"
									name="purpose"
									rows={4}
									required
									maxlength={1000}
									placeholder={copy.purposePlaceholder}
									aria-invalid={Boolean(fieldError("purpose"))}
									bind:value={purposeValue}
								/>
								{#if fieldError("purpose")}
									<p class="text-destructive text-sm">{fieldError("purpose")}</p>
								{/if}
							</div>

							<div class="space-y-4">
								<div>
									<h2 class="text-base font-semibold">{copy.contactSection}</h2>
								</div>
								<div class="grid gap-4 md:grid-cols-3">
									<div class="space-y-2 md:col-span-3">
										<Label for="contactName">{copy.contactName}</Label>
										<Input
											id="contactName"
											name="contactName"
											maxlength={200}
											aria-invalid={Boolean(fieldError("contactName"))}
											bind:value={contactNameValue}
										/>
										{#if fieldError("contactName")}
											<p class="text-destructive text-sm">{fieldError("contactName")}</p>
										{/if}
									</div>
									<div class="space-y-2 md:col-span-2">
										<Label for="contactEmail">{copy.contactEmail}</Label>
										<Input
											id="contactEmail"
											name="contactEmail"
											type="email"
											maxlength={320}
											aria-invalid={Boolean(fieldError("contactEmail"))}
											bind:value={contactEmailValue}
										/>
										{#if fieldError("contactEmail")}
											<p class="text-destructive text-sm">{fieldError("contactEmail")}</p>
										{/if}
									</div>
									<div class="space-y-2">
										<Label for="contactPhone">{copy.contactPhone}</Label>
										<Input
											id="contactPhone"
											name="contactPhone"
											maxlength={50}
											aria-invalid={Boolean(fieldError("contactPhone"))}
											bind:value={contactPhoneValue}
										/>
										{#if fieldError("contactPhone")}
											<p class="text-destructive text-sm">{fieldError("contactPhone")}</p>
										{/if}
									</div>
								</div>
							</div>

							<div class="space-y-3">
								<div>
									<h2 class="text-base font-semibold">{copy.requestedEquipment}</h2>
									<p class="text-muted-foreground text-sm">
										{selectedRoom?.allowEquipmentRequest ? copy.noAdditionalEquipment : copy.equipmentNotAllowed}
									</p>
								</div>
								{#if selectedRoom?.allowEquipmentRequest}
									{#if data.equipmentCatalog.length === 0}
										<div class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
											{copy.noAdditionalEquipment}
										</div>
									{:else}
										<div class="grid gap-3 md:grid-cols-2">
											{#each data.equipmentCatalog as asset, i (asset.id)}
												<label class="flex items-start gap-3 rounded-lg border p-3 text-sm">
													<input
														type="checkbox"
														name="equipmentAssetIds"
														value={asset.id}
														class="mt-1 size-4 rounded border"
														bind:group={selectedEquipmentIds}
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
									<Card.Title class="text-base">{copy.roomOverview}</Card.Title>
								</Card.Header>
								<Card.Content class="space-y-3 text-sm">
									{#if selectedRoom}
										<div class="space-y-1">
											<p class="font-semibold">{roomLabel(selectedRoom)}</p>
											<p class="text-muted-foreground">
												{copy.roomType}: {getRoomTypeLabel(data.locale, selectedRoom.roomType)}
											</p>
											<p class="text-muted-foreground">{copy.roomCapacity}: {selectedRoom.capacity}</p>
											<p class="text-muted-foreground">
												{copy.roomApprover}: {selectedRoom.approverName ?? copy.notAssigned}
											</p>
										</div>
										<div class="space-y-2">
											<p class="font-medium">{copy.roomNote}</p>
											<p class="text-muted-foreground">
												{selectedRoom.note?.trim() || copy.noRoomNote}
											</p>
										</div>
										<div class="space-y-2">
											<p class="font-medium">{copy.roomAssets}</p>
											{#if selectedRoom.fixedAssets.length === 0}
												<p class="text-muted-foreground">{copy.noRoomAssets}</p>
											{:else}
												<ul class="space-y-2">
													{#each selectedRoom.fixedAssets as asset, i (asset.id)}
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
									{:else}
										<p class="text-muted-foreground">{copy.roomPlaceholder}</p>
									{/if}
								</Card.Content>
							</Card.Root>
						</div>
					</div>

					<div class="flex justify-end">
						<SaveSubmitButton
							pending={savePending}
							idleLabel={submitLabel}
							savingLabel={uiLabels.formSaving}
						/>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>{copy.details}</Card.Title>
				<Card.Description>{data.description}</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" class="space-y-6" use:enhance={samePageEnhance()}>
					<input type="hidden" name="kind" value={data.kind} />

					<div class="space-y-2">
						<Label for="title">{copy.title}</Label>
						<Input
							id="title"
							name="title"
							required
							minlength={3}
							maxlength={200}
							placeholder={copy.titlePlaceholder}
							aria-invalid={Boolean(fieldError("title"))}
							value={genericValues.title}
						/>
						{#if fieldError("title")}
							<p class="text-destructive text-sm">{fieldError("title")}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="details">{copy.detailsOptional}</Label>
						<Textarea
							id="details"
							name="details"
							maxlength={4000}
							placeholder={copy.detailsPlaceholder}
							rows={6}
							aria-invalid={Boolean(fieldError("details"))}
							value={genericValues.details}
						/>
						{#if fieldError("details")}
							<p class="text-destructive text-sm">{fieldError("details")}</p>
						{/if}
					</div>

					<div class="rounded-lg border bg-muted/30 p-4 text-sm">
						{copy.validationPrefix}
						<code class="bg-muted mx-1 rounded px-1 py-0.5 text-xs">faculty_requests</code>
						{copy.validationSuffix}
					</div>

					<SaveSubmitButton pending={savePending} idleLabel={submitLabel} savingLabel={uiLabels.formSaving} />
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
