<script lang="ts">
	import BookingDrawerForm from "$lib/components/room-booking/booking-drawer-form.svelte";
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import type { Locale } from "$lib/i18n/locales.js";
	import type { RoomType } from "$lib/requests/faculty-request.js";

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

	type SlotSelection = {
		roomId: string;
		date: string;
		startTime: string;
		endTime: string;
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
		room: RoomEntry | null;
		equipmentCatalog: EquipmentEntry[];
		form?: ActionForm;
		open?: boolean;
		selection?: SlotSelection | null;
	};

	let {
		locale,
		room,
		equipmentCatalog,
		form,
		open = $bindable(false),
		selection = $bindable<SlotSelection | null>(null),
	}: Props = $props();

	const copy = $derived.by(() =>
		locale === "th"
			? {
					title: "จองห้องจากปฏิทิน",
					description: "ตรวจสอบข้อมูลสรุป แล้วส่งคำขอแบบย่อจากช่วงเวลาที่เลือกได้ทันที",
				}
			: {
					title: "Book from calendar",
					description: "Review the room summary and submit a streamlined booking request from the selected slot.",
				},
	);

	function setOpen(nextOpen: boolean) {
		open = nextOpen;
		if (!nextOpen) {
			submittedSelectionKey = "";
			selection = null;
		}
	}

	function selectionKeyValue(value: SlotSelection | null): string {
		return value ? `${value.roomId}:${value.date}:${value.startTime}:${value.endTime}` : "";
	}

	function rememberSubmittedSelection(key: string) {
		submittedSelectionKey = key;
	}

	let submittedSelectionKey = $state("");

	const currentSelectionKey = $derived(selectionKeyValue(selection));
	const formValues = $derived.by<Record<string, unknown>>(() => {
		if (form?.action !== "createBooking" || !form.values) {
			return {};
		}
		return form.values;
	});
	const useFormSeed = $derived(
		form?.action === "createBooking" &&
			currentSelectionKey.length > 0 &&
			submittedSelectionKey === currentSelectionKey,
	);
	const visibleForm = $derived.by<ActionForm | undefined>(() => {
		if (!form) {
			return undefined;
		}
		if (form.action !== "createBooking") {
			return form;
		}
		return useFormSeed ? form : undefined;
	});
	const seed = $derived.by<BookingSeed | null>(() => {
		if (!room || !selection) return null;

		const values = useFormSeed ? formValues : {};
		return {
			title: typeof values.title === "string" ? values.title : "",
			purpose: typeof values.purpose === "string" ? values.purpose : "",
			attendeeCount:
				typeof values.attendeeCount === "string" && values.attendeeCount.length > 0
					? values.attendeeCount
					: "1",
			bookingDate:
				typeof values.bookingDate === "string" && values.bookingDate.length > 0
					? values.bookingDate
					: selection.date,
			startTime:
				typeof values.startTime === "string" && values.startTime.length > 0
					? values.startTime
					: selection.startTime,
			endTime:
				typeof values.endTime === "string" && values.endTime.length > 0
					? values.endTime
					: selection.endTime,
			setupBufferMinutes:
				typeof values.setupBufferMinutes === "string" && values.setupBufferMinutes.length > 0
					? values.setupBufferMinutes
					: String(room.setupBufferMinutes),
			cleanupBufferMinutes:
				typeof values.cleanupBufferMinutes === "string" && values.cleanupBufferMinutes.length > 0
					? values.cleanupBufferMinutes
					: String(room.cleanupBufferMinutes),
			details: typeof values.details === "string" ? values.details : "",
			contactName: typeof values.contactName === "string" ? values.contactName : "",
			contactEmail: typeof values.contactEmail === "string" ? values.contactEmail : "",
			contactPhone: typeof values.contactPhone === "string" ? values.contactPhone : "",
			equipmentAssetIds: Array.isArray(values.equipmentAssetIds)
				? values.equipmentAssetIds.filter((value: unknown): value is string => typeof value === "string")
				: [],
		};
	});
	const seedKey = $derived(
		useFormSeed ? `form:${currentSelectionKey}:${JSON.stringify(formValues)}` : `slot:${currentSelectionKey}`,
	);
</script>

<Sheet.Root bind:open={() => open, setOpen}>
	<Sheet.Content side="right" class="flex w-full flex-col gap-0 sm:max-w-2xl">
		<Sheet.Header class="border-b px-6 py-5">
			<Sheet.Title>{copy.title}</Sheet.Title>
			<Sheet.Description>{copy.description}</Sheet.Description>
		</Sheet.Header>

		<div class="flex-1 overflow-y-auto px-6 py-5">
			{#if room && selection && seed}
				{#key seedKey}
					<BookingDrawerForm
						locale={locale}
						{room}
						{equipmentCatalog}
						form={visibleForm}
						{seed}
						selectionKey={currentSelectionKey}
						onClose={() => setOpen(false)}
						onSubmittingSelection={rememberSubmittedSelection}
					/>
				{/key}
			{:else}
				<div class="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
					{copy.description}
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
