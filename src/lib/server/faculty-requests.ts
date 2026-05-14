import type { Locale } from "$lib/i18n/locales.js";
import {
	canCancelReservation,
	facultyRequestStatuses,
	facultyTimeZoneOffset,
	todayFacultyDate,
	roomTypes,
	type FacultyRequestStatus,
	type RoomType,
} from "$lib/requests/faculty-request.js";
import type { SessionUser } from "$lib/server/auth.js";
import { currentEmployeeId, documentNo, type AppSupabaseClient } from "$lib/server/supply-asset.js";

export type CalendarViewMode = "day" | "week";

type MaybeOneOrMany<T> = T | T[] | null | undefined;

type EmployeeLite = {
	id: string;
	first_name: string;
	last_name: string;
};

type AssetLite = {
	id: string;
	asset_no: string;
	name: string;
	name_en?: string | null;
	brand?: string | null;
	model?: string | null;
};

type RoomLite = {
	id: string;
	room_code: string;
	name: string;
	name_en?: string | null;
	room_type: string;
	capacity: number;
	approver_employee_id?: string | null;
	booking_window_days?: number;
	min_advance_hours?: number;
	setup_buffer_minutes?: number;
	cleanup_buffer_minutes?: number;
	cancellation_cutoff_hours?: number;
	allow_equipment_request?: boolean;
	note?: string | null;
	is_active?: boolean;
	stock_location?: {
		id: string;
		code: string;
		name: string;
		name_en?: string | null;
	} | null;
	approver?: EmployeeLite | EmployeeLite[] | null;
	room_default_assets?: Array<{
		id: string;
		sort_order?: number | null;
		note?: string | null;
		asset_registers?: AssetLite | AssetLite[] | null;
	}> | null;
};

type FacultyRequestLite = {
	id: string;
	request_no: string;
	kind: string;
	requester_employee_id?: string | null;
	created_by_user_id?: string | null;
	title: string;
	details?: string | null;
	status: string;
	requested_at: string;
	updated_at: string;
	approved_at?: string | null;
	rejected_at?: string | null;
	cancelled_at?: string | null;
	cancel_reason?: string | null;
	last_decision_remark?: string | null;
	requester?: EmployeeLite | EmployeeLite[] | null;
	room_booking_requests?: RoomBookingLite | RoomBookingLite[] | null;
};

type RoomBookingLite = {
	request_id: string;
	room_id: string;
	requested_start_at: string;
	requested_end_at: string;
	setup_buffer_minutes: number;
	cleanup_buffer_minutes: number;
	attendee_count: number;
	purpose: string;
	contact_name?: string | null;
	contact_email?: string | null;
	contact_phone?: string | null;
	room?: RoomLite | RoomLite[] | null;
};

export type FixedAssetSummary = {
	id: string;
	relationId: string | null;
	assetNo: string;
	name: string;
	nameEn: string | null;
	brand: string | null;
	model: string | null;
};

export type RoomOption = {
	id: string;
	roomCode: string;
	name: string;
	nameEn: string | null;
	roomType: RoomType;
	capacity: number;
	approverEmployeeId: string | null;
	approverName: string | null;
	bookingWindowDays: number;
	minAdvanceHours: number;
	setupBufferMinutes: number;
	cleanupBufferMinutes: number;
	cancellationCutoffHours: number;
	allowEquipmentRequest: boolean;
	note: string | null;
	isActive: boolean;
	stockLocationId: string | null;
	stockLocationCode: string | null;
	stockLocationName: string | null;
	stockLocationNameEn: string | null;
	fixedAssets: FixedAssetSummary[];
};

export type ReservableAssetOption = FixedAssetSummary & {
	isPortable: boolean;
	sortOrder: number;
	note: string | null;
};

export type CalendarBooking = {
	requestId: string;
	roomId: string;
	title: string;
	status: FacultyRequestStatus;
	startAt: string;
	endAt: string;
	setupBufferMinutes: number;
	cleanupBufferMinutes: number;
	attendeeCount: number;
	purpose: string;
	requesterName: string | null;
};

export type CalendarBlock = {
	id: string;
	roomId: string;
	blockType: string;
	startAt: string;
	endAt: string;
	reason: string;
};

function isCalendarVisibleStatus(status: FacultyRequestStatus): boolean {
	return status === "pending_approval" || status === "approved";
}

export type RequestListEntry = {
	id: string;
	requestNo: string;
	kind: string;
	title: string;
	details: string | null;
	status: FacultyRequestStatus;
	requestedAt: string;
	updatedAt: string;
	startAt: string | null;
	endAt: string | null;
	roomName: string | null;
	roomNameEn: string | null;
	roomCode: string | null;
	cancellationCutoffHours: number;
	canCancel: boolean;
};

export type RequestStepEntry = {
	id: string;
	stepOrder: number;
	actionType: string;
	stepStatus: string;
	actedAt: string | null;
	remark: string | null;
	approverName: string;
	approverId: string;
};

export type RequestEventEntry = {
	id: string;
	eventType: string;
	summary: string;
	createdAt: string;
	actorName: string | null;
};

export type RequestDetail = RequestListEntry & {
	requesterName: string | null;
	attendeeCount: number | null;
	purpose: string | null;
	contactName: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	setupBufferMinutes: number;
	cleanupBufferMinutes: number;
	canDecide: boolean;
	pendingApproverName: string | null;
	fixedAssets: FixedAssetSummary[];
	requestedAssets: FixedAssetSummary[];
	steps: RequestStepEntry[];
	events: RequestEventEntry[];
};

export type ApprovalQueueItem = {
	stepId: string;
	requestId: string;
	requestNo: string;
	title: string;
	status: FacultyRequestStatus;
	requestedAt: string;
	roomName: string | null;
	roomNameEn: string | null;
	roomCode: string | null;
	startAt: string | null;
	endAt: string | null;
	requesterName: string | null;
	stepOrder: number;
};

export type SubmitRoomBookingInput = {
	title: string;
	details: string | null;
	roomId: string;
	startAt: string;
	endAt: string;
	setupBufferMinutes: number;
	cleanupBufferMinutes: number;
	attendeeCount: number;
	purpose: string;
	contactName: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	equipmentAssetIds: string[];
};

export type DecisionInput = {
	requestId: string;
	decision: "approved" | "rejected";
	remark: string | null;
};

function asOne<T>(value: MaybeOneOrMany<T>): T | null {
	if (value == null) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asArray<T>(value: MaybeOneOrMany<T>): T[] {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}

function employeeName(employee: MaybeOneOrMany<EmployeeLite>): string | null {
	const row = asOne(employee);
	if (!row) return null;
	return `${row.first_name} ${row.last_name}`.trim();
}

function toRequestStatus(status: string): FacultyRequestStatus {
	return facultyRequestStatuses.includes(status as FacultyRequestStatus)
		? (status as FacultyRequestStatus)
		: "draft";
}

function toRoomType(roomType: string): RoomType {
	return roomTypes.includes(roomType as RoomType) ? (roomType as RoomType) : "meeting_room";
}

function assetSummary(asset: MaybeOneOrMany<AssetLite>): FixedAssetSummary | null {
	const row = asOne(asset);
	if (!row) return null;
	return {
		id: row.id,
		relationId: null,
		assetNo: row.asset_no,
		name: row.name,
		nameEn: row.name_en ?? null,
		brand: row.brand ?? null,
		model: row.model ?? null,
	};
}

function isValidDateKey(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [yearText, monthText, dayText] = value.split("-");
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	const parsed = new Date(Date.UTC(year, month - 1, day));

	return (
		parsed.getUTCFullYear() === year &&
		parsed.getUTCMonth() + 1 === month &&
		parsed.getUTCDate() === day
	);
}

export function normalizeSelectedDate(dateValue: string | null | undefined): string {
	if (dateValue && isValidDateKey(dateValue)) return dateValue;
	return todayFacultyDate();
}

function addDays(dateValue: string, days: number): string {
	const date = new Date(`${dateValue}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

export function getCalendarRange(dateValue: string | null | undefined, view: CalendarViewMode) {
	const selectedDate = normalizeSelectedDate(dateValue);
	const endDate = addDays(selectedDate, view === "week" ? 7 : 1);

	return {
		selectedDate,
		rangeStart: `${selectedDate}T00:00:00${facultyTimeZoneOffset}`,
		rangeEnd: `${endDate}T00:00:00${facultyTimeZoneOffset}`,
	};
}

export async function loadRoomOptions(
	admin: AppSupabaseClient,
	options?: { includeInactive?: boolean; onlyWithApprover?: boolean; roomType?: string | null },
): Promise<RoomOption[]> {
	let query = admin
		.from("reservable_rooms")
		.select(
			"id,room_code,name,name_en,room_type,capacity,approver_employee_id,booking_window_days,min_advance_hours,setup_buffer_minutes,cleanup_buffer_minutes,cancellation_cutoff_hours,allow_equipment_request,note,is_active,stock_location:stock_locations(id,code,name,name_en),approver:employees(id,first_name,last_name),room_default_assets(id,sort_order,note,asset_registers(id,asset_no,name,name_en,brand,model))",
		)
		.order("room_code", { ascending: true });

	if (!options?.includeInactive) {
		query = query.eq("is_active", true);
	}

	if (options?.onlyWithApprover) {
		query = query.not("approver_employee_id", "is", null);
	}

	if (options?.roomType) {
		query = query.eq("room_type", options.roomType);
	}

	const { data, error } = await query;
	if (error) throw error;

	const rows = (data ?? []) as unknown as RoomLite[];
	return rows.map((row) => {
		const fixedAssets: FixedAssetSummary[] = [];
		for (const item of asArray(row.room_default_assets)) {
			const summary = assetSummary(item.asset_registers);
			if (!summary) continue;
			fixedAssets.push({ ...summary, relationId: item.id ?? null });
		}

		return {
			id: row.id,
			roomCode: row.room_code,
			name: row.name,
			nameEn: row.name_en ?? null,
			roomType: toRoomType(row.room_type),
			capacity: row.capacity,
			approverEmployeeId: row.approver_employee_id ?? null,
			approverName: employeeName(row.approver),
			bookingWindowDays: row.booking_window_days ?? 180,
			minAdvanceHours: row.min_advance_hours ?? 48,
			setupBufferMinutes: row.setup_buffer_minutes ?? 15,
			cleanupBufferMinutes: row.cleanup_buffer_minutes ?? 15,
			cancellationCutoffHours: row.cancellation_cutoff_hours ?? 24,
			allowEquipmentRequest: row.allow_equipment_request ?? true,
			note: row.note ?? null,
			isActive: row.is_active ?? true,
			stockLocationId: row.stock_location?.id ?? null,
			stockLocationCode: row.stock_location?.code ?? null,
			stockLocationName: row.stock_location?.name ?? null,
			stockLocationNameEn: row.stock_location?.name_en ?? null,
			fixedAssets,
		} satisfies RoomOption;
	});
}

export async function loadReservableAssetCatalog(admin: AppSupabaseClient): Promise<ReservableAssetOption[]> {
	const { data, error } = await admin
		.from("reservable_asset_settings")
		.select(
			"asset_id,is_portable,sort_order,note,asset_registers(id,asset_no,name,name_en,brand,model)",
		)
		.eq("is_requestable", true)
		.order("sort_order", { ascending: true });

	if (error) throw error;

	const rows = (data ?? []) as unknown as Array<{
		asset_id: string;
		is_portable?: boolean;
		sort_order?: number;
		note?: string | null;
		asset_registers?: AssetLite | AssetLite[] | null;
	}>;

	return rows
		.map((row) => {
			const summary = assetSummary(row.asset_registers);
			if (!summary) return null;
			return {
				...summary,
				isPortable: row.is_portable ?? true,
				sortOrder: row.sort_order ?? 0,
				note: row.note ?? null,
			};
		})
		.filter((item): item is ReservableAssetOption => item !== null);
}

export async function loadRoomCalendarData(
	admin: AppSupabaseClient,
	options: { selectedDate: string; view: CalendarViewMode; roomType?: string | null },
): Promise<{ rooms: RoomOption[]; bookings: CalendarBooking[]; blocks: CalendarBlock[] }> {
	const range = getCalendarRange(options.selectedDate, options.view);
	const rooms = await loadRoomOptions(admin, {
		includeInactive: false,
		onlyWithApprover: true,
		roomType: options.roomType ?? null,
	});

	const roomIds = rooms.map((room) => room.id);
	if (roomIds.length === 0) {
		return { rooms, bookings: [], blocks: [] };
	}

	const [bookingsRes, blocksRes] = await Promise.all([
		admin
			.from("room_booking_requests")
			.select(
				"request_id,room_id,requested_start_at,requested_end_at,setup_buffer_minutes,cleanup_buffer_minutes,attendee_count,purpose,faculty_requests!inner(id,title,status,requester:employees(id,first_name,last_name))",
			)
			.in("room_id", roomIds)
			.lt("requested_start_at", range.rangeEnd)
			.gt("requested_end_at", range.rangeStart),
		admin
			.from("room_schedule_blocks")
			.select("id,room_id,block_type,starts_at,ends_at,reason")
			.in("room_id", roomIds)
			.lt("starts_at", range.rangeEnd)
			.gt("ends_at", range.rangeStart),
	]);

	if (bookingsRes.error) throw bookingsRes.error;
	if (blocksRes.error) throw blocksRes.error;

	const bookings = ((bookingsRes.data ?? []) as unknown as Array<
		RoomBookingLite & {
			faculty_requests?: FacultyRequestLite | FacultyRequestLite[] | null;
		}
	>)
		.map((row) => {
			const request = asOne(row.faculty_requests);
			const status = toRequestStatus(request?.status ?? "draft");
			return {
				requestId: row.request_id,
				roomId: row.room_id,
				title: request?.title ?? "Room booking",
				status,
				startAt: row.requested_start_at,
				endAt: row.requested_end_at,
				setupBufferMinutes: row.setup_buffer_minutes,
				cleanupBufferMinutes: row.cleanup_buffer_minutes,
				attendeeCount: row.attendee_count,
				purpose: row.purpose,
				requesterName: employeeName(request?.requester),
			};
		})
		.filter((booking) => isCalendarVisibleStatus(booking.status));

	const blocks = ((blocksRes.data ?? []) as unknown as Array<{
		id: string;
		room_id: string;
		block_type: string;
		starts_at: string;
		ends_at: string;
		reason: string;
	}>).map((row) => ({
		id: row.id,
		roomId: row.room_id,
		blockType: row.block_type,
		startAt: row.starts_at,
		endAt: row.ends_at,
		reason: row.reason,
	}));

	return { rooms, bookings, blocks };
}

export async function submitRoomBookingRequest(
	admin: AppSupabaseClient,
	user: SessionUser,
	input: SubmitRoomBookingInput,
): Promise<string> {
	const requesterEmployeeId = await currentEmployeeId(admin, user);
	if (!requesterEmployeeId) {
		throw new Error("Your account is not linked to an employee profile.");
	}

	if (input.equipmentAssetIds.length > 0) {
		const { data: roomPolicy, error: roomPolicyError } = await admin
			.from("reservable_rooms")
			.select("allow_equipment_request")
			.eq("id", input.roomId)
			.maybeSingle<{ allow_equipment_request?: boolean | null }>();

		if (roomPolicyError) throw roomPolicyError;
		if (roomPolicy && roomPolicy.allow_equipment_request === false) {
			throw new Error("Equipment requests are not allowed for this room");
		}
	}

	const requestNo = documentNo("RB");
	const { data, error } = await admin.rpc("submit_room_booking_request", {
		p_request_no: requestNo,
		p_requester_employee_id: requesterEmployeeId,
		p_created_by_user_id: user.id,
		p_title: input.title,
		p_details: input.details,
		p_room_id: input.roomId,
		p_requested_start_at: input.startAt,
		p_requested_end_at: input.endAt,
		p_setup_buffer_minutes: input.setupBufferMinutes,
		p_cleanup_buffer_minutes: input.cleanupBufferMinutes,
		p_attendee_count: input.attendeeCount,
		p_purpose: input.purpose,
		p_contact_name: input.contactName,
		p_contact_email: input.contactEmail,
		p_contact_phone: input.contactPhone,
		p_equipment_asset_ids: input.equipmentAssetIds,
	});

	if (error) throw error;
	return String(data);
}

export async function cancelRequest(
	admin: AppSupabaseClient,
	user: SessionUser,
	requestId: string,
	cancelReason: string | null,
): Promise<void> {
	const actorEmployeeId = await currentEmployeeId(admin, user);
	if (!actorEmployeeId) {
		throw new Error("Your account is not linked to an employee profile.");
	}

	const { error } = await admin.rpc("cancel_faculty_request", {
		p_request_id: requestId,
		p_actor_user_id: user.id,
		p_actor_employee_id: actorEmployeeId,
		p_cancel_reason: cancelReason,
	});

	if (error) throw error;
}

export async function decideRequest(
	admin: AppSupabaseClient,
	user: SessionUser,
	input: DecisionInput,
): Promise<void> {
	const actorEmployeeId = await currentEmployeeId(admin, user);
	if (!actorEmployeeId) {
		throw new Error("Your account is not linked to an employee profile.");
	}

	const { error } = await admin.rpc("decide_room_booking_request", {
		p_request_id: input.requestId,
		p_approver_employee_id: actorEmployeeId,
		p_actor_user_id: user.id,
		p_decision: input.decision,
		p_remark: input.remark,
	});

	if (error) throw error;
}

export async function loadUserRequestList(
	admin: AppSupabaseClient,
	userId: string,
): Promise<RequestListEntry[]> {
	const { data, error } = await admin
		.from("faculty_requests")
		.select(
			"id,request_no,kind,title,details,status,requested_at,updated_at,room_booking_requests(request_id,requested_start_at,requested_end_at,setup_buffer_minutes,cleanup_buffer_minutes,attendee_count,purpose,room:reservable_rooms(id,room_code,name,name_en,cancellation_cutoff_hours))",
		)
		.eq("created_by_user_id", userId)
		.order("requested_at", { ascending: false });

	if (error) throw error;

	const rows = (data ?? []) as unknown as FacultyRequestLite[];
	return rows.map((row) => {
		const booking = asOne(row.room_booking_requests);
		const room = booking ? asOne(booking.room) : null;
		const status = toRequestStatus(row.status);
		return {
			id: row.id,
			requestNo: row.request_no,
			kind: row.kind,
			title: row.title,
			details: row.details ?? null,
			status,
			requestedAt: row.requested_at,
			updatedAt: row.updated_at,
			startAt: booking?.requested_start_at ?? null,
			endAt: booking?.requested_end_at ?? null,
			roomName: room?.name ?? null,
			roomNameEn: room?.name_en ?? null,
			roomCode: room?.room_code ?? null,
			cancellationCutoffHours: room?.cancellation_cutoff_hours ?? 24,
			canCancel:
				booking != null &&
				(status === "pending_approval" || status === "approved") &&
				canCancelReservation(booking.requested_start_at, room?.cancellation_cutoff_hours ?? 24),
		};
	});
}

export async function loadRequestDetail(
	admin: AppSupabaseClient,
	requestId: string,
	user: SessionUser,
): Promise<RequestDetail | null> {
	const employeeId = await currentEmployeeId(admin, user);
	const [requestRes, stepRes, eventRes, equipmentRes] = await Promise.all([
		admin
			.from("faculty_requests")
			.select(
				"id,request_no,kind,requester_employee_id,created_by_user_id,title,details,status,requested_at,updated_at,approved_at,rejected_at,cancelled_at,cancel_reason,last_decision_remark,requester:employees(id,first_name,last_name),room_booking_requests(request_id,room_id,requested_start_at,requested_end_at,setup_buffer_minutes,cleanup_buffer_minutes,attendee_count,purpose,contact_name,contact_email,contact_phone,room:reservable_rooms(id,room_code,name,name_en,cancellation_cutoff_hours,room_default_assets(id,sort_order,asset_registers(id,asset_no,name,name_en,brand,model))))",
			)
			.eq("id", requestId)
			.maybeSingle(),
		admin
			.from("faculty_request_steps")
			.select("id,step_order,action_type,step_status,acted_at,remark,approver:employees(id,first_name,last_name)")
			.eq("request_id", requestId)
			.order("step_order", { ascending: true }),
		admin
			.from("faculty_request_events")
			.select("id,event_type,summary,created_at,actor:employees(id,first_name,last_name)")
			.eq("request_id", requestId)
			.order("created_at", { ascending: false }),
		admin
			.from("room_booking_equipment_lines")
			.select("id,asset_registers(id,asset_no,name,name_en,brand,model)")
			.eq("request_id", requestId),
	]);

	if (requestRes.error) throw requestRes.error;
	if (stepRes.error) throw stepRes.error;
	if (eventRes.error) throw eventRes.error;
	if (equipmentRes.error) throw equipmentRes.error;

	const row = (requestRes.data ?? null) as FacultyRequestLite | null;
	if (!row) return null;

	const canManage = user.role === "admin" || user.role === "editor";
	const canApprove = employeeId
		? ((stepRes.data ?? []) as unknown as Array<{ approver?: EmployeeLite | EmployeeLite[] | null }>).some(
				(item) => asOne(item.approver)?.id === employeeId,
			)
		: false;
	const canViewOwn =
		row.created_by_user_id === user.id ||
		(employeeId != null && row.requester_employee_id === employeeId);

	if (!canManage && !canApprove && !canViewOwn) {
		return null;
	}

	const booking = asOne(row.room_booking_requests);
	const room = booking ? asOne(booking.room) : null;

	const steps = ((stepRes.data ?? []) as unknown as Array<{
		id: string;
		step_order: number;
		action_type: string;
		step_status: string;
		acted_at?: string | null;
		remark?: string | null;
		approver?: EmployeeLite | EmployeeLite[] | null;
	}>).map((item) => ({
		id: item.id,
		stepOrder: item.step_order,
		actionType: item.action_type,
		stepStatus: item.step_status,
		actedAt: item.acted_at ?? null,
		remark: item.remark ?? null,
		approverName: employeeName(item.approver) ?? "—",
		approverId: asOne(item.approver)?.id ?? "",
	}));
	const pendingStep = steps.find((step) => step.stepStatus === "pending") ?? null;
	const canDecide =
		canManage && employeeId != null && pendingStep != null && pendingStep.approverId === employeeId;
	const pendingApproverName =
		pendingStep != null && pendingStep.approverId.length > 0 ? pendingStep.approverName : null;

	const events = ((eventRes.data ?? []) as unknown as Array<{
		id: string;
		event_type: string;
		summary: string;
		created_at: string;
		actor?: EmployeeLite | EmployeeLite[] | null;
	}>).map((item) => ({
		id: item.id,
		eventType: item.event_type,
		summary: item.summary,
		createdAt: item.created_at,
		actorName: employeeName(item.actor),
	}));

	const requestedAssets = ((equipmentRes.data ?? []) as unknown as Array<{
		id: string;
		asset_registers?: AssetLite | AssetLite[] | null;
	}>)
		.map((item) => assetSummary(item.asset_registers))
		.filter((item): item is FixedAssetSummary => item !== null);

	const fixedAssets =
		room == null
			? []
			: asArray(room.room_default_assets)
					.map((item) => assetSummary(item.asset_registers))
					.filter((item): item is FixedAssetSummary => item !== null);

	const status = toRequestStatus(row.status);
	return {
		id: row.id,
		requestNo: row.request_no,
		kind: row.kind,
		title: row.title,
		details: row.details ?? null,
		status,
		requestedAt: row.requested_at,
		updatedAt: row.updated_at,
		startAt: booking?.requested_start_at ?? null,
		endAt: booking?.requested_end_at ?? null,
		roomName: room?.name ?? null,
		roomNameEn: room?.name_en ?? null,
		roomCode: room?.room_code ?? null,
		cancellationCutoffHours: room?.cancellation_cutoff_hours ?? 24,
		canCancel:
			booking != null &&
			(status === "pending_approval" || status === "approved") &&
			canCancelReservation(booking.requested_start_at, room?.cancellation_cutoff_hours ?? 24),
		requesterName: employeeName(row.requester),
		attendeeCount: booking?.attendee_count ?? null,
		purpose: booking?.purpose ?? null,
		contactName: booking?.contact_name ?? null,
		contactEmail: booking?.contact_email ?? null,
		contactPhone: booking?.contact_phone ?? null,
		setupBufferMinutes: booking?.setup_buffer_minutes ?? 0,
		cleanupBufferMinutes: booking?.cleanup_buffer_minutes ?? 0,
		canDecide,
		pendingApproverName,
		fixedAssets,
		requestedAssets,
		steps,
		events,
	};
}

export async function loadApprovalQueue(
	admin: AppSupabaseClient,
	user: SessionUser,
): Promise<ApprovalQueueItem[]> {
	const employeeId = await currentEmployeeId(admin, user);
	if (!employeeId && user.role !== "admin" && user.role !== "editor") {
		return [];
	}

	let query = admin
		.from("faculty_request_steps")
		.select(
			"id,request_id,step_order,step_status,faculty_requests!inner(id,request_no,title,status,requested_at,requester:employees(id,first_name,last_name),room_booking_requests(request_id,requested_start_at,requested_end_at,room:reservable_rooms(id,room_code,name,name_en)))",
		)
		.eq("step_status", "pending")
		.order("created_at", { ascending: true });

	if (user.role !== "admin" && user.role !== "editor" && employeeId) {
		query = query.eq("approver_employee_id", employeeId);
	}

	const { data, error } = await query;
	if (error) throw error;

	const rows = (data ?? []) as unknown as Array<{
		id: string;
		request_id: string;
		step_order: number;
		faculty_requests?: FacultyRequestLite | FacultyRequestLite[] | null;
	}>;

	return rows
		.map((row) => {
			const request = asOne(row.faculty_requests);
			if (!request) return null;
			const booking = asOne(request.room_booking_requests);
			const room = booking ? asOne(booking.room) : null;
			return {
				stepId: row.id,
				requestId: row.request_id,
				requestNo: request.request_no,
				title: request.title,
				status: toRequestStatus(request.status),
				requestedAt: request.requested_at,
				roomName: room?.name ?? null,
				roomNameEn: room?.name_en ?? null,
				roomCode: room?.room_code ?? null,
				startAt: booking?.requested_start_at ?? null,
				endAt: booking?.requested_end_at ?? null,
				requesterName: employeeName(request.requester),
				stepOrder: row.step_order,
			};
		})
		.filter((item): item is ApprovalQueueItem => item !== null);
}

export async function loadEmployeeOptions(admin: AppSupabaseClient): Promise<Array<{ id: string; name: string }>> {
	const { data, error } = await admin
		.from("employees")
		.select("id,first_name,last_name")
		.order("first_name", { ascending: true });

	if (error) throw error;

	return ((data ?? []) as EmployeeLite[]).map((row) => ({
		id: row.id,
		name: employeeName(row) ?? row.id,
	}));
}

export async function loadAssetRegisterOptions(admin: AppSupabaseClient): Promise<FixedAssetSummary[]> {
	const { data, error } = await admin
		.from("asset_registers")
		.select("id,asset_no,name,name_en,brand,model")
		.order("asset_no", { ascending: true });

	if (error) throw error;

	return ((data ?? []) as unknown as AssetLite[]).map((row) => ({
		id: row.id,
		relationId: null,
		assetNo: row.asset_no,
		name: row.name,
		nameEn: row.name_en ?? null,
		brand: row.brand ?? null,
		model: row.model ?? null,
	}));
}

export async function loadStockLocationOptions(
	admin: AppSupabaseClient,
): Promise<Array<{ id: string; code: string; name: string; nameEn: string | null }>> {
	const { data, error } = await admin
		.from("stock_locations")
		.select("id,code,name,name_en,is_active")
		.eq("is_active", true)
		.order("sort_order", { ascending: true });

	if (error) throw error;

	return ((data ?? []) as Array<{
		id: string;
		code: string;
		name: string;
		name_en?: string | null;
	}>).map((row) => ({
		id: row.id,
		code: row.code,
		name: row.name,
		nameEn: row.name_en ?? null,
	}));
}

export function requestActionMessage(locale: Locale, en: string, th: string): string {
	return locale === "th" ? th : en;
}

export function roomBookingActionErrorMessage(locale: Locale, error: unknown): string {
	if (!(error instanceof Error)) {
		return requestActionMessage(
			locale,
			"Room booking could not be submitted.",
			"ไม่สามารถส่งคำขอจองห้องได้",
		);
	}

	const message = error.message;

	if (message === "Attendee count exceeds room capacity") {
		return requestActionMessage(
			locale,
			"Attendee count exceeds the room capacity.",
			"จำนวนผู้เข้าร่วมเกินความจุของห้อง",
		);
	}

	if (message === "Room booking does not satisfy minimum advance notice") {
		return requestActionMessage(
			locale,
			"This booking does not meet the room's minimum advance notice.",
			"ช่วงเวลานี้ไม่เป็นไปตามกฎแจ้งล่วงหน้าขั้นต่ำของห้อง",
		);
	}

	if (message === "Room booking exceeds booking window") {
		return requestActionMessage(
			locale,
			"This booking falls outside the room booking window.",
			"ช่วงเวลานี้อยู่นอกช่วงวันที่ห้องเปิดให้จอง",
		);
	}

	if (message === "Room is blocked during the requested period") {
		return requestActionMessage(
			locale,
			"The room is blocked during the requested period.",
			"ห้องถูกปิดใช้งานในช่วงเวลาที่เลือก",
		);
	}

	if (message === "Room is already reserved for the requested period") {
		return requestActionMessage(
			locale,
			"The room is already reserved during the requested period.",
			"ห้องถูกจองแล้วในช่วงเวลาที่เลือก",
		);
	}

	if (message === "One or more equipment items are not requestable") {
		return requestActionMessage(
			locale,
			"One or more selected equipment items cannot be requested.",
			"มีอุปกรณ์อย่างน้อยหนึ่งรายการที่ไม่สามารถแนบคำขอได้",
		);
	}

	if (message === "Equipment requests are not allowed for this room") {
		return requestActionMessage(
			locale,
			"This room does not allow additional equipment requests.",
			"ห้องนี้ไม่เปิดให้แนบคำขออุปกรณ์เพิ่มเติม",
		);
	}

	if (message.startsWith("Reservable room ") && message.endsWith(" not found")) {
		return requestActionMessage(
			locale,
			"This room could not be found anymore.",
			"ไม่พบข้อมูลห้องนี้แล้ว",
		);
	}

	if (message.startsWith("Room ") && message.endsWith(" is inactive")) {
		return requestActionMessage(
			locale,
			"This room is no longer active for booking.",
			"ห้องนี้ไม่พร้อมให้จองแล้ว",
		);
	}

	if (message.startsWith("Room ") && message.includes(" is not configured with an approver")) {
		return requestActionMessage(
			locale,
			"This room is not fully configured for booking approval.",
			"ห้องนี้ยังตั้งค่าผู้อนุมัติไม่ครบ จึงยังไม่พร้อมให้จอง",
		);
	}

	return requestActionMessage(
		locale,
		"Room booking could not be submitted.",
		"ไม่สามารถส่งคำขอจองห้องได้",
	);
}
