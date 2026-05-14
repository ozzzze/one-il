<script lang="ts">
	import { enhance } from "$app/forms";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import {
		formatReservationWindow,
		getRoomTypeLabel,
		roomTypes,
		type RoomType,
	} from "$lib/requests/faculty-request.js";
	import { cn } from "$lib/utils.js";
	import { toast } from "svelte-sonner";
	import type { ActionData, PageData } from "./$types.js";

	type BlockRow = {
		id: string;
		room_id: string;
		block_type: string;
		starts_at: string;
		ends_at: string;
		reason: string;
	};
	type ViewData = PageData & {
		blocks: BlockRow[];
	};
	type RoomEntry = ViewData["rooms"][number];
	type StockLocationEntry = ViewData["stockLocations"][number];
	type KnownAsset = {
		id: string;
		assetNo: string;
		name: string;
		nameEn: string | null;
		brand: string | null;
		model: string | null;
		isPortable: boolean;
		source: "asset_module" | "catalog" | "room_default";
	};

	const NEW_ROOM_ID = "__new__";

	let { data: pageData, form }: { data: PageData; form?: ActionData } = $props();
	const data = $derived(pageData as ViewData);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "จัดการห้องจองและอุปกรณ์ - ONE-IL",
					title: "จัดการห้องจองและอุปกรณ์",
					description:
						"จัดการข้อมูลหลักของห้อง ช่วงปิดใช้งาน อุปกรณ์ประจำห้อง และแคตตาล็อกอุปกรณ์ที่จองได้จาก action ฝั่งเซิร์ฟเวอร์ชุดเดียวกัน",
					tabs: {
						rooms: "ห้อง",
						blocks: "ช่วงปิดห้อง",
						defaults: "อุปกรณ์ประจำห้อง",
						catalog: "แคตตาล็อกอุปกรณ์",
					},
					loadError: "บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อความแจ้งเตือน",
					roomFormTitle: "ข้อมูลหลักห้อง",
					roomFormDescription: "สร้างห้องใหม่หรือแก้ไขห้องเดิมจากฟอร์มชุดเดียว",
					roomPicker: "เลือกห้อง",
					newRoomOption: "สร้างห้องใหม่",
					resetRoomForm: "ล้างฟอร์ม",
					createRoom: "สร้างห้อง",
					updateRoom: "บันทึกห้อง",
					roomOverview: "ห้องที่เปิดใช้งาน",
					roomOverviewDescription: "เลือกแถวเพื่อดึงข้อมูลมาแก้ไขในฟอร์ม",
					roomCode: "รหัสห้อง",
					roomNameTh: "ชื่อห้อง (ไทย)",
					roomNameEn: "ชื่อห้อง (อังกฤษ)",
					roomType: "ประเภทห้อง",
					capacity: "ความจุ",
					stockLocation: "คลัง/สถานที่อ้างอิง",
					approver: "ผู้อนุมัติ",
					bookingWindowDays: "เปิดให้จองล่วงหน้า (วัน)",
					minAdvanceHours: "จองล่วงหน้าขั้นต่ำ (ชั่วโมง)",
					setupBuffer: "เวลาเตรียมห้อง (นาที)",
					cleanupBuffer: "เวลาเก็บห้อง (นาที)",
					cancellationCutoff: "ยกเลิกก่อนเริ่มอย่างน้อย (ชั่วโมง)",
					allowEquipmentRequest: "อนุญาตให้แนบคำขออุปกรณ์",
					roomNote: "หมายเหตุ",
					isActive: "เปิดใช้งานห้องนี้",
					active: "ใช้งาน",
					inactive: "ปิดใช้งาน",
					defaultAssets: "อุปกรณ์ประจำห้อง",
					noDefaultAssets: "ยังไม่มีอุปกรณ์ประจำห้อง",
					none: "ไม่มี",
					reviewRoom: "โหลดห้องนี้",
					addBlockTitle: "เพิ่มช่วงปิดใช้งานห้อง",
					addBlockDescription: "ใช้สำหรับกันห้องซ่อมบำรุง สอบ กิจกรรม หรือปิดใช้งานชั่วคราว",
					blockType: "ประเภทการปิดห้อง",
					startDate: "วันเริ่ม",
					startTime: "เวลาเริ่ม",
					endDate: "วันสิ้นสุด",
					endTime: "เวลาสิ้นสุด",
					reason: "เหตุผล",
					addBlock: "บันทึกช่วงปิดห้อง",
					blockListTitle: "ช่วงปิดห้องล่าสุด",
					blockListDescription: "อ้างอิงข้อมูลที่โหลดจาก `room_schedule_blocks`",
					noBlocks: "ยังไม่มีช่วงปิดห้อง",
					defaultRoomTitle: "กำหนดอุปกรณ์ประจำห้อง",
					defaultRoomDescription: "เพิ่มหรือนำอุปกรณ์ประจำห้องออกจากห้องที่เลือก",
					selectSavedRoom: "เลือกห้องที่บันทึกแล้วก่อนจัดการอุปกรณ์ประจำห้อง",
					addDefaultAsset: "เพิ่มอุปกรณ์ประจำห้อง",
					currentDefaults: "รายการอุปกรณ์ที่ผูกอยู่",
					noDefaultAssetOptions: "ไม่มีอุปกรณ์เพิ่มเติมจากทะเบียนครุภัณฑ์ให้เพิ่มในห้องนี้",
					defaultAssetLimit: "นำอุปกรณ์ประจำห้องออกได้จากรายการที่ผูกอยู่ด้านขวา",
					catalogTitle: "แคตตาล็อกอุปกรณ์ที่จองได้",
					catalogDescription:
						"เปิด/ปิดอุปกรณ์สำหรับคำขอจองห้อง และระบุได้ว่าอุปกรณ์นั้นเคลื่อนย้ายได้หรือไม่",
					addCatalogAsset: "เพิ่มเข้าแคตตาล็อก",
					isPortable: "อุปกรณ์เคลื่อนย้ายได้",
					catalogHint:
						"ตัวเลือกสำหรับเพิ่มแคตตาล็อกในหน้านี้อ้างอิงจากทะเบียนครุภัณฑ์ของโมดูล asset module",
					noCatalogCandidates: "ไม่มีอุปกรณ์เพิ่มเติมจากทะเบียนครุภัณฑ์ให้เพิ่มเข้าแคตตาล็อก",
					currentCatalog: "รายการในแคตตาล็อก",
					noCatalogRows: "ยังไม่มีอุปกรณ์ในแคตตาล็อก",
					remove: "นำออก",
					roomSaved: "บันทึกข้อมูลห้องแล้ว",
					blockSaved: "บันทึกช่วงปิดห้องแล้ว",
					defaultSaved: "เพิ่มอุปกรณ์ประจำห้องแล้ว",
					defaultRemoved: "นำอุปกรณ์ประจำห้องออกแล้ว",
					catalogSaved: "เพิ่มอุปกรณ์เข้าแคตตาล็อกแล้ว",
					catalogRemoved: "นำอุปกรณ์ออกจากแคตตาล็อกแล้ว",
				}
			: {
					pageTitle: "Room Booking Admin - ONE-IL",
					title: "Room booking administration",
					description:
						"Manage room masters, blackout windows, room default equipment, and the reservable equipment catalog using the existing server actions.",
					tabs: {
						rooms: "Rooms",
						blocks: "Blackout blocks",
						defaults: "Room defaults",
						catalog: "Equipment catalog",
					},
					loadError: "Save failed. Review the action message above.",
					roomFormTitle: "Room master form",
					roomFormDescription: "Create a new room or update an existing room from the same form.",
					roomPicker: "Select room",
					newRoomOption: "Create new room",
					resetRoomForm: "Reset form",
					createRoom: "Create room",
					updateRoom: "Save room",
					roomOverview: "Reservable rooms",
					roomOverviewDescription: "Pick a row to load it into the editor form.",
					roomCode: "Room code",
					roomNameTh: "Room name (TH)",
					roomNameEn: "Room name (EN)",
					roomType: "Room type",
					capacity: "Capacity",
					stockLocation: "Stock/reference location",
					approver: "Approver",
					bookingWindowDays: "Book ahead window (days)",
					minAdvanceHours: "Minimum advance notice (hours)",
					setupBuffer: "Setup buffer (minutes)",
					cleanupBuffer: "Cleanup buffer (minutes)",
					cancellationCutoff: "Cancellation cutoff (hours)",
					allowEquipmentRequest: "Allow equipment requests",
					roomNote: "Note",
					isActive: "Room is active",
					active: "Active",
					inactive: "Inactive",
					defaultAssets: "Default equipment",
					noDefaultAssets: "No default equipment linked yet",
					none: "None",
					reviewRoom: "Load room",
					addBlockTitle: "Create blackout block",
					addBlockDescription:
						"Use this for maintenance, exam periods, events, or temporary closures.",
					blockType: "Block type",
					startDate: "Start date",
					startTime: "Start time",
					endDate: "End date",
					endTime: "End time",
					reason: "Reason",
					addBlock: "Save block",
					blockListTitle: "Recent blackout blocks",
					blockListDescription: "Directly reflects the latest rows from `room_schedule_blocks`.",
					noBlocks: "No blackout blocks yet.",
					defaultRoomTitle: "Assign room default equipment",
					defaultRoomDescription:
						"Add or remove baseline equipment for the currently selected room.",
					selectSavedRoom: "Select a saved room before managing room defaults.",
					addDefaultAsset: "Add room default",
					currentDefaults: "Currently linked defaults",
					noDefaultAssetOptions:
						"No additional equipment is available from the asset register for this room.",
					defaultAssetLimit: "Remove linked defaults directly from the list on the right.",
					catalogTitle: "Reservable equipment catalog",
					catalogDescription:
						"Enable or disable equipment for room booking requests and mark whether the item is portable.",
					addCatalogAsset: "Add to catalog",
					isPortable: "Portable equipment",
					catalogHint:
						"Candidate assets on this page come from the asset module register, not only from rows already loaded into room defaults or the catalog.",
					noCatalogCandidates: "No additional assets are available from the asset register.",
					currentCatalog: "Current catalog",
					noCatalogRows: "No catalog items yet.",
					remove: "Remove",
					roomSaved: "Room saved",
					blockSaved: "Blackout block saved",
					defaultSaved: "Room default equipment added",
					defaultRemoved: "Room default equipment removed",
					catalogSaved: "Equipment added to catalog",
					catalogRemoved: "Equipment removed from catalog",
				}
	);

	let tab = $state("rooms");
	let saveRoomPending = $state(false);
	let saveBlockPending = $state(false);
	let saveDefaultPending = $state(false);
	let saveCatalogPending = $state(false);
	let removeDefaultPending = $state(false);
	let removeCatalogPending = $state(false);
	let selectedRoomId = $state<string>(NEW_ROOM_ID);
	let roomSnapshot = $state("");
	let defaultAssetId = $state("");
	let catalogAssetId = $state("");
	let catalogPortable = $state(true);

	function todayLocalKey(): string {
		const now = new Date();
		return [
			now.getFullYear(),
			String(now.getMonth() + 1).padStart(2, "0"),
			String(now.getDate()).padStart(2, "0"),
		].join("-");
	}

	let roomForm = $state({
		roomId: "",
		stockLocationId: "",
		roomCode: "",
		name: "",
		nameEn: "",
		roomType: "meeting_room" as RoomType,
		capacity: 1,
		approverEmployeeId: "",
		bookingWindowDays: 180,
		minAdvanceHours: 0,
		setupBufferMinutes: 15,
		cleanupBufferMinutes: 15,
		cancellationCutoffHours: 24,
		allowEquipmentRequest: true,
		note: "",
		isActive: true,
	});

	let blockForm = $state({
		roomId: "",
		blockType: "maintenance",
		startDate: todayLocalKey(),
		startTime: "08:00",
		endDate: todayLocalKey(),
		endTime: "17:00",
		reason: "",
	});

	const selectedRoom = $derived(
		selectedRoomId === NEW_ROOM_ID
			? null
			: (data.rooms.find((room) => room.id === selectedRoomId) ?? null)
	);

	const knownAssets = $derived.by<KnownAsset[]>(() => {
		const record: Record<string, KnownAsset> = {};
		for (const asset of data.assetOptions) {
			record[asset.id] = {
				id: asset.id,
				assetNo: asset.assetNo,
				name: asset.name,
				nameEn: asset.nameEn,
				brand: asset.brand,
				model: asset.model,
				isPortable: true,
				source: "asset_module",
			};
		}

		for (const asset of data.reservableAssets) {
			record[asset.id] = {
				id: asset.id,
				assetNo: asset.assetNo,
				name: asset.name,
				nameEn: asset.nameEn,
				brand: asset.brand,
				model: asset.model,
				isPortable: asset.isPortable,
				source: "catalog",
			};
		}

		for (const room of data.rooms) {
			for (const asset of room.fixedAssets) {
				if (!record[asset.id]) {
					record[asset.id] = {
						id: asset.id,
						assetNo: asset.assetNo,
						name: asset.name,
						nameEn: asset.nameEn,
						brand: asset.brand,
						model: asset.model,
						isPortable: true,
						source: "room_default",
					};
				}
			}
		}

		return Object.values(record).sort((left, right) => left.assetNo.localeCompare(right.assetNo));
	});

	const catalogAssetIds = $derived.by(
		() => new Set(data.reservableAssets.map((asset) => asset.id))
	);
	const availableCatalogCandidates = $derived.by(() =>
		knownAssets.filter((asset) => !catalogAssetIds.has(asset.id))
	);
	const selectedRoomAssetIds = $derived.by(
		() => new Set(selectedRoom?.fixedAssets.map((asset) => asset.id) ?? [])
	);
	const availableDefaultAssets = $derived.by(() =>
		knownAssets.filter((asset) => !selectedRoomAssetIds.has(asset.id))
	);

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}

	function roomLabel(room: RoomEntry): string {
		return `${room.roomCode} — ${localizedDualField(data.locale, room.name, room.nameEn)}`;
	}

	function stockLocationLabel(location: StockLocationEntry): string {
		return `${location.code} — ${localizedDualField(data.locale, location.name, location.nameEn)}`;
	}

	function roomFromId(roomId: string): RoomEntry | null {
		return data.rooms.find((room) => room.id === roomId) ?? null;
	}

	function equipmentLabel(asset: {
		assetNo: string;
		name: string;
		nameEn: string | null;
		brand: string | null;
		model: string | null;
	}): string {
		const parts = [asset.assetNo, localizedDualField(data.locale, asset.name, asset.nameEn)];
		const tail = [asset.brand, asset.model].filter((value): value is string => Boolean(value));
		return tail.length > 0 ? `${parts.join(" — ")} (${tail.join(" / ")})` : parts.join(" — ");
	}

	function blockTypeLabel(blockType: string): string {
		if (data.locale === "th") {
			switch (blockType) {
				case "maintenance":
					return "ซ่อมบำรุง";
				case "event":
					return "กิจกรรม";
				case "exam":
					return "สอบ";
				case "closed":
					return "ปิดใช้งาน";
				default:
					return blockType;
			}
		}

		switch (blockType) {
			case "maintenance":
				return "Maintenance";
			case "event":
				return "Event";
			case "exam":
				return "Exam";
			case "closed":
				return "Closed";
			default:
				return blockType;
		}
	}

	function blockVariant(blockType: string): BadgeVariant {
		return blockType === "maintenance" || blockType === "closed" ? "destructive" : "outline";
	}

	function resetRoomForm() {
		roomForm.roomId = "";
		roomForm.stockLocationId = data.stockLocations[0]?.id ?? "";
		roomForm.roomCode = "";
		roomForm.name = "";
		roomForm.nameEn = "";
		roomForm.roomType = "meeting_room";
		roomForm.capacity = 1;
		roomForm.approverEmployeeId = data.employees[0]?.id ?? "";
		roomForm.bookingWindowDays = 180;
		roomForm.minAdvanceHours = 0;
		roomForm.setupBufferMinutes = 15;
		roomForm.cleanupBufferMinutes = 15;
		roomForm.cancellationCutoffHours = 24;
		roomForm.allowEquipmentRequest = true;
		roomForm.note = "";
		roomForm.isActive = true;
	}

	function applyRoomForm(room: RoomEntry) {
		roomForm.roomId = room.id;
		roomForm.stockLocationId = room.stockLocationId ?? "";
		roomForm.roomCode = room.roomCode;
		roomForm.name = room.name;
		roomForm.nameEn = room.nameEn ?? "";
		roomForm.roomType = room.roomType;
		roomForm.capacity = room.capacity;
		roomForm.approverEmployeeId = room.approverEmployeeId ?? "";
		roomForm.bookingWindowDays = room.bookingWindowDays;
		roomForm.minAdvanceHours = room.minAdvanceHours;
		roomForm.setupBufferMinutes = room.setupBufferMinutes;
		roomForm.cleanupBufferMinutes = room.cleanupBufferMinutes;
		roomForm.cancellationCutoffHours = room.cancellationCutoffHours;
		roomForm.allowEquipmentRequest = room.allowEquipmentRequest;
		roomForm.note = room.note ?? "";
		roomForm.isActive = room.isActive;
	}

	function startNewRoom() {
		selectedRoomId = NEW_ROOM_ID;
		roomSnapshot = "";
	}

	function samePageEnhance(setter: (pending: boolean) => void) {
		return pendingEnhance(setter, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: true });
		});
	}

	const successByAction = $derived.by<Record<string, string>>(() => ({
		upsertRoom: copy.roomSaved,
		addScheduleBlock: copy.blockSaved,
		addDefaultAsset: copy.defaultSaved,
		removeDefaultAsset: copy.defaultRemoved,
		addReservableAsset: copy.catalogSaved,
		removeReservableAsset: copy.catalogRemoved,
	}));

	$effect(() => {
		const snapshot = selectedRoom ? JSON.stringify(selectedRoom) : NEW_ROOM_ID;
		if (snapshot === roomSnapshot) return;
		if (selectedRoom) {
			applyRoomForm(selectedRoom);
			blockForm.roomId = selectedRoom.id;
		} else {
			resetRoomForm();
		}
		roomSnapshot = snapshot;
	});

	$effect(() => {
		if (!availableDefaultAssets.some((asset) => asset.id === defaultAssetId)) {
			defaultAssetId = availableDefaultAssets[0]?.id ?? "";
		}
	});

	$effect(() => {
		if (!availableCatalogCandidates.some((asset) => asset.id === catalogAssetId)) {
			catalogAssetId = availableCatalogCandidates[0]?.id ?? "";
		}
		const selectedAsset = knownAssets.find((asset) => asset.id === catalogAssetId) ?? null;
		catalogPortable = selectedAsset?.isPortable ?? true;
	});

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success && form.action) {
			const message = successByAction[form.action];
			if (message) toast.success(message);
		}
	});
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<section class="space-y-6">
	<header class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground max-w-4xl text-sm">{copy.description}</p>
	</header>

	{#if form?.message}
		<div
			class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
		>
			{form.message}
		</div>
	{/if}

	<Tabs.Root bind:value={tab} class="w-full">
		<Tabs.List class="flex h-auto flex-wrap gap-1">
			<Tabs.Trigger value="rooms" class="text-xs">{copy.tabs.rooms}</Tabs.Trigger>
			<Tabs.Trigger value="blocks" class="text-xs">{copy.tabs.blocks}</Tabs.Trigger>
			<Tabs.Trigger value="defaults" class="text-xs">{copy.tabs.defaults}</Tabs.Trigger>
			<Tabs.Trigger value="catalog" class="text-xs">{copy.tabs.catalog}</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content
			value="rooms"
			class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
		>
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.roomFormTitle}</Card.Title>
					<Card.Description>{copy.roomFormDescription}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="flex flex-wrap items-end gap-2">
						<div class="grid min-w-[260px] flex-1 gap-2">
							<Label for="selected-room">{copy.roomPicker}</Label>
							<select id="selected-room" bind:value={selectedRoomId} class={selectClass()}>
								<option value={NEW_ROOM_ID}>{copy.newRoomOption}</option>
								{#each data.rooms as room, i (room.id)}
									<option value={room.id}>{roomLabel(room)}</option>
								{/each}
							</select>
						</div>
						<Button type="button" variant="outline" size="sm" onclick={startNewRoom}>
							{copy.resetRoomForm}
						</Button>
					</div>

					<form
						method="POST"
						action="?/upsertRoom"
						use:enhance={samePageEnhance((pending) => (saveRoomPending = pending))}
						class="grid gap-4"
					>
						<input type="hidden" name="roomId" value={roomForm.roomId} />

						<div class="grid gap-3 md:grid-cols-2">
							<div class="grid gap-2">
								<Label for="room-code">{copy.roomCode}</Label>
								<Input id="room-code" name="roomCode" bind:value={roomForm.roomCode} required />
							</div>
							<div class="grid gap-2">
								<Label for="room-type">{copy.roomType}</Label>
								<select
									id="room-type"
									name="roomType"
									bind:value={roomForm.roomType}
									class={selectClass()}
								>
									{#each roomTypes as roomType, i (roomType)}
										<option value={roomType}>{getRoomTypeLabel(data.locale, roomType)}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="grid gap-3 md:grid-cols-2">
							<div class="grid gap-2">
								<Label for="room-name">{copy.roomNameTh}</Label>
								<Input id="room-name" name="name" bind:value={roomForm.name} required />
							</div>
							<div class="grid gap-2">
								<Label for="room-name-en">{copy.roomNameEn}</Label>
								<Input id="room-name-en" name="nameEn" bind:value={roomForm.nameEn} />
							</div>
						</div>

						<div class="grid gap-3 md:grid-cols-2">
							<div class="grid gap-2">
								<Label for="room-capacity">{copy.capacity}</Label>
								<Input
									id="room-capacity"
									type="number"
									min="1"
									name="capacity"
									bind:value={roomForm.capacity}
									required
								/>
							</div>
							<div class="grid gap-2">
								<Label for="room-location">{copy.stockLocation}</Label>
								<select
									id="room-location"
									name="stockLocationId"
									bind:value={roomForm.stockLocationId}
									class={selectClass()}
									required
								>
									{#each data.stockLocations as location, i (location.id)}
										<option value={location.id}>{stockLocationLabel(location)}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="grid gap-2">
							<Label for="room-approver">{copy.approver}</Label>
							<select
								id="room-approver"
								name="approverEmployeeId"
								bind:value={roomForm.approverEmployeeId}
								class={selectClass()}
								required
							>
								{#each data.employees as employee, i (employee.id)}
									<option value={employee.id}>{employee.name}</option>
								{/each}
							</select>
						</div>

						<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							<div class="grid gap-2">
								<Label for="booking-window-days">{copy.bookingWindowDays}</Label>
								<Input
									id="booking-window-days"
									type="number"
									min="1"
									name="bookingWindowDays"
									bind:value={roomForm.bookingWindowDays}
									required
								/>
							</div>
							<div class="grid gap-2">
								<Label for="min-advance-hours">{copy.minAdvanceHours}</Label>
								<Input
									id="min-advance-hours"
									type="number"
									min="0"
									name="minAdvanceHours"
									bind:value={roomForm.minAdvanceHours}
									required
								/>
							</div>
							<div class="grid gap-2">
								<Label for="setup-buffer">{copy.setupBuffer}</Label>
								<Input
									id="setup-buffer"
									type="number"
									min="0"
									name="setupBufferMinutes"
									bind:value={roomForm.setupBufferMinutes}
									required
								/>
							</div>
							<div class="grid gap-2">
								<Label for="cleanup-buffer">{copy.cleanupBuffer}</Label>
								<Input
									id="cleanup-buffer"
									type="number"
									min="0"
									name="cleanupBufferMinutes"
									bind:value={roomForm.cleanupBufferMinutes}
									required
								/>
							</div>
						</div>

						<div class="grid gap-3 md:grid-cols-2">
							<div class="grid gap-2">
								<Label for="cancellation-cutoff">{copy.cancellationCutoff}</Label>
								<Input
									id="cancellation-cutoff"
									type="number"
									min="0"
									name="cancellationCutoffHours"
									bind:value={roomForm.cancellationCutoffHours}
									required
								/>
							</div>
							<div class="grid gap-2">
								<Label for="room-note">{copy.roomNote}</Label>
								<Textarea id="room-note" name="note" bind:value={roomForm.note} rows={3} />
							</div>
						</div>

						<div class="grid gap-2">
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									name="allowEquipmentRequest"
									bind:checked={roomForm.allowEquipmentRequest}
									class="size-4 rounded border"
								/>
								{copy.allowEquipmentRequest}
							</label>
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									name="isActive"
									bind:checked={roomForm.isActive}
									class="size-4 rounded border"
								/>
								{copy.isActive}
							</label>
						</div>

						<div class="flex justify-end">
							<SaveSubmitButton
								pending={saveRoomPending}
								idleLabel={selectedRoom ? copy.updateRoom : copy.createRoom}
								savingLabel={selectedRoom ? copy.updateRoom : copy.createRoom}
							/>
						</div>
					</form>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.roomOverview}</Card.Title>
					<Card.Description>{copy.roomOverviewDescription}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="overflow-hidden rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>{copy.roomCode}</Table.Head>
									<Table.Head>{copy.approver}</Table.Head>
									<Table.Head>{copy.capacity}</Table.Head>
									<Table.Head>{copy.defaultAssets}</Table.Head>
									<Table.Head></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each data.rooms as room, i (room.id)}
									<Table.Row class={cn(selectedRoom?.id === room.id ? "bg-muted/40" : "")}>
										<Table.Cell>
											<div class="space-y-1">
												<p class="font-medium">{roomLabel(room)}</p>
												<div class="flex flex-wrap gap-1">
													<Badge variant="secondary">
														{getRoomTypeLabel(data.locale, room.roomType)}
													</Badge>
												</div>
											</div>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground"
											>{room.approverName ?? copy.none}</Table.Cell
										>
										<Table.Cell>{room.capacity}</Table.Cell>
										<Table.Cell class="text-muted-foreground">
											{room.fixedAssets.length > 0 ? room.fixedAssets.length : copy.none}
										</Table.Cell>
										<Table.Cell class="text-right">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onclick={() => {
													selectedRoomId = room.id;
													tab = "rooms";
												}}
											>
												{copy.reviewRoom}
											</Button>
										</Table.Cell>
									</Table.Row>
								{:else}
									<Table.Row>
										<Table.Cell colspan={5} class="text-muted-foreground h-24 text-center">
											{copy.none}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content
			value="blocks"
			class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
		>
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.addBlockTitle}</Card.Title>
					<Card.Description>{copy.addBlockDescription}</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/addScheduleBlock"
						use:enhance={samePageEnhance((pending) => (saveBlockPending = pending))}
						class="grid gap-4"
					>
						<div class="grid gap-2">
							<Label for="block-room">{copy.roomPicker}</Label>
							<select
								id="block-room"
								name="roomId"
								bind:value={blockForm.roomId}
								class={selectClass()}
								required
							>
								{#each data.rooms as room, i (room.id)}
									<option value={room.id}>{roomLabel(room)}</option>
								{/each}
							</select>
						</div>

						<div class="grid gap-2">
							<Label for="block-type">{copy.blockType}</Label>
							<select
								id="block-type"
								name="blockType"
								bind:value={blockForm.blockType}
								class={selectClass()}
								required
							>
								<option value="maintenance">{blockTypeLabel("maintenance")}</option>
								<option value="event">{blockTypeLabel("event")}</option>
								<option value="exam">{blockTypeLabel("exam")}</option>
								<option value="closed">{blockTypeLabel("closed")}</option>
							</select>
						</div>

						<div class="grid gap-3 md:grid-cols-2">
							<div class="grid gap-2">
								<Label for="block-start-date">{copy.startDate}</Label>
								<Input
									id="block-start-date"
									type="date"
									name="startDate"
									bind:value={blockForm.startDate}
									required
								/>
							</div>
							<div class="grid gap-2">
								<Label for="block-start-time">{copy.startTime}</Label>
								<Input
									id="block-start-time"
									type="time"
									name="startTime"
									bind:value={blockForm.startTime}
									required
								/>
							</div>
						</div>

						<div class="grid gap-3 md:grid-cols-2">
							<div class="grid gap-2">
								<Label for="block-end-date">{copy.endDate}</Label>
								<Input
									id="block-end-date"
									type="date"
									name="endDate"
									bind:value={blockForm.endDate}
									required
								/>
							</div>
							<div class="grid gap-2">
								<Label for="block-end-time">{copy.endTime}</Label>
								<Input
									id="block-end-time"
									type="time"
									name="endTime"
									bind:value={blockForm.endTime}
									required
								/>
							</div>
						</div>

						<div class="grid gap-2">
							<Label for="block-reason">{copy.reason}</Label>
							<Textarea
								id="block-reason"
								name="reason"
								bind:value={blockForm.reason}
								rows={4}
								required
							/>
						</div>

						<div class="flex justify-end">
							<SaveSubmitButton
								pending={saveBlockPending}
								idleLabel={copy.addBlock}
								savingLabel={copy.addBlock}
							/>
						</div>
					</form>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.blockListTitle}</Card.Title>
					<Card.Description>{copy.blockListDescription}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#each data.blocks as block, i (block.id)}
						{@const blockRoom = roomFromId(block.room_id)}
						<div class="rounded-lg border p-3">
							<div class="flex flex-wrap items-center gap-2">
								<Badge variant={blockVariant(block.block_type)}
									>{blockTypeLabel(block.block_type)}</Badge
								>
								<p class="font-medium">
									{blockRoom ? roomLabel(blockRoom) : block.room_id}
								</p>
							</div>
							<p class="text-muted-foreground mt-2 text-xs">
								{formatReservationWindow(data.locale, block.starts_at, block.ends_at)}
							</p>
							<p class="mt-2 text-sm">{block.reason}</p>
						</div>
					{:else}
						<p class="text-muted-foreground text-sm">{copy.noBlocks}</p>
					{/each}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="defaults" class="mt-4 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.defaultRoomTitle}</Card.Title>
					<Card.Description>{copy.defaultRoomDescription}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="grid gap-2 md:max-w-lg">
						<Label for="default-room-selector">{copy.roomPicker}</Label>
						<select id="default-room-selector" bind:value={selectedRoomId} class={selectClass()}>
							<option value={NEW_ROOM_ID}>{copy.newRoomOption}</option>
							{#each data.rooms as room, i (room.id)}
								<option value={room.id}>{roomLabel(room)}</option>
							{/each}
						</select>
					</div>

					{#if !selectedRoom}
						<p class="text-muted-foreground text-sm">{copy.selectSavedRoom}</p>
					{:else}
						<div class="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
							<Card.Root class="border-dashed">
								<Card.Header>
									<Card.Title>{roomLabel(selectedRoom)}</Card.Title>
									<Card.Description>
										{getRoomTypeLabel(data.locale, selectedRoom.roomType)} • {copy.capacity}: {selectedRoom.capacity}
									</Card.Description>
								</Card.Header>
								<Card.Content class="space-y-3">
									<form
										method="POST"
										action="?/addDefaultAsset"
										use:enhance={samePageEnhance((pending) => (saveDefaultPending = pending))}
										class="grid gap-3"
									>
										<input type="hidden" name="roomId" value={selectedRoom.id} />
										<div class="grid gap-2">
											<Label for="default-asset">{copy.addDefaultAsset}</Label>
											<select
												id="default-asset"
												name="assetId"
												bind:value={defaultAssetId}
												class={selectClass()}
												disabled={availableDefaultAssets.length === 0}
												required
											>
												{#each availableDefaultAssets as asset, i (asset.id)}
													<option value={asset.id}>{equipmentLabel(asset)}</option>
												{/each}
											</select>
										</div>
										<SaveSubmitButton
											pending={saveDefaultPending}
											idleLabel={copy.addDefaultAsset}
											savingLabel={copy.addDefaultAsset}
											disabled={availableDefaultAssets.length === 0}
										/>
									</form>
									{#if availableDefaultAssets.length === 0}
										<p class="text-muted-foreground text-xs">{copy.noDefaultAssetOptions}</p>
									{/if}
								</Card.Content>
							</Card.Root>

							<Card.Root>
								<Card.Header>
									<Card.Title>{copy.currentDefaults}</Card.Title>
									<Card.Description>{copy.defaultAssetLimit}</Card.Description>
								</Card.Header>
								<Card.Content class="space-y-2">
									{#each selectedRoom.fixedAssets as asset, i (asset.id)}
										<div class="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
											<p class="min-w-0 text-sm font-medium">{equipmentLabel(asset)}</p>
											{#if asset.relationId}
												<form
													method="POST"
													action="?/removeDefaultAsset"
													use:enhance={samePageEnhance(
														(pending) => (removeDefaultPending = pending)
													)}
													class="shrink-0"
												>
													<input type="hidden" name="id" value={asset.relationId} />
													<Button
														type="submit"
														variant="outline"
														size="sm"
														disabled={removeDefaultPending}
													>
														{copy.remove}
													</Button>
												</form>
											{/if}
										</div>
									{:else}
										<p class="text-muted-foreground text-sm">{copy.noDefaultAssets}</p>
									{/each}
								</Card.Content>
							</Card.Root>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content
			value="catalog"
			class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
		>
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.catalogTitle}</Card.Title>
					<Card.Description>{copy.catalogDescription}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<p class="text-muted-foreground text-xs">{copy.catalogHint}</p>
					<form
						method="POST"
						action="?/addReservableAsset"
						use:enhance={samePageEnhance((pending) => (saveCatalogPending = pending))}
						class="grid gap-3"
					>
						<div class="grid gap-2">
							<Label for="catalog-asset">{copy.addCatalogAsset}</Label>
							<select
								id="catalog-asset"
								name="assetId"
								bind:value={catalogAssetId}
								class={selectClass()}
								disabled={availableCatalogCandidates.length === 0}
								required
							>
								{#each availableCatalogCandidates as asset, i (asset.id)}
									<option value={asset.id}>{equipmentLabel(asset)}</option>
								{/each}
							</select>
						</div>
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="isPortable"
								bind:checked={catalogPortable}
								class="size-4 rounded border"
							/>
							{copy.isPortable}
						</label>
						<SaveSubmitButton
							pending={saveCatalogPending}
							idleLabel={copy.addCatalogAsset}
							savingLabel={copy.addCatalogAsset}
							disabled={availableCatalogCandidates.length === 0}
						/>
					</form>
					{#if availableCatalogCandidates.length === 0}
						<p class="text-muted-foreground text-sm">{copy.noCatalogCandidates}</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.currentCatalog}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="overflow-hidden rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>{copy.defaultAssets}</Table.Head>
									<Table.Head>{copy.isPortable}</Table.Head>
									<Table.Head></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each data.reservableAssets as asset, i (asset.id)}
									<Table.Row>
										<Table.Cell>
											<div class="space-y-1">
												<p class="font-medium">{equipmentLabel(asset)}</p>
												<div class="flex flex-wrap gap-1">
													<Badge variant="secondary">{asset.assetNo}</Badge>
													{#if asset.note}
														<Badge variant="outline">{asset.note}</Badge>
													{/if}
												</div>
											</div>
										</Table.Cell>
										<Table.Cell>
											<Badge variant={asset.isPortable ? "default" : "outline"}>
												{asset.isPortable ? copy.isPortable : copy.none}
											</Badge>
										</Table.Cell>
										<Table.Cell class="text-right">
											<form
												method="POST"
												action="?/removeReservableAsset"
												use:enhance={samePageEnhance((pending) => (removeCatalogPending = pending))}
												class="inline-flex"
											>
												<input type="hidden" name="assetId" value={asset.id} />
												<Button
													type="submit"
													variant="outline"
													size="sm"
													disabled={removeCatalogPending}
												>
													{copy.remove}
												</Button>
											</form>
										</Table.Cell>
									</Table.Row>
								{:else}
									<Table.Row>
										<Table.Cell colspan={3} class="text-muted-foreground h-24 text-center">
											{copy.noCatalogRows}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</section>
