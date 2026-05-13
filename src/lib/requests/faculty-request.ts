import type { Locale } from "$lib/i18n/locales.js";

export const facultyTimeZoneOffset = "+07:00";

export const facultyRequestStatuses = [
	"draft",
	"pending_approval",
	"approved",
	"rejected",
	"cancelled",
] as const;

export type FacultyRequestStatus = (typeof facultyRequestStatuses)[number];

export const requestStepStatuses = [
	"pending",
	"approved",
	"rejected",
	"skipped",
	"cancelled",
] as const;

export type RequestStepStatus = (typeof requestStepStatuses)[number];

export const roomTypes = ["classroom", "meeting_room", "lab", "shared_space"] as const;

export type RoomType = (typeof roomTypes)[number];

export type BookingWindow = {
	startAt: string;
	endAt: string;
	setupBufferMinutes: number;
	cleanupBufferMinutes: number;
};

export function getFacultyRequestStatusLabel(locale: Locale, status: FacultyRequestStatus): string {
	if (locale === "th") {
		switch (status) {
			case "draft":
				return "ฉบับร่าง";
			case "pending_approval":
				return "รออนุมัติ";
			case "approved":
				return "อนุมัติแล้ว";
			case "rejected":
				return "ไม่อนุมัติ";
			case "cancelled":
				return "ยกเลิกแล้ว";
		}
	}

	switch (status) {
		case "draft":
			return "Draft";
		case "pending_approval":
			return "Pending approval";
		case "approved":
			return "Approved";
		case "rejected":
			return "Rejected";
		case "cancelled":
			return "Cancelled";
	}
}

export function getRoomTypeLabel(locale: Locale, roomType: RoomType): string {
	if (locale === "th") {
		switch (roomType) {
			case "classroom":
				return "ห้องเรียน";
			case "meeting_room":
				return "ห้องประชุม";
			case "lab":
				return "ห้องปฏิบัติการ";
			case "shared_space":
				return "พื้นที่ส่วนกลาง";
		}
	}

	switch (roomType) {
		case "classroom":
			return "Classroom";
		case "meeting_room":
			return "Meeting room";
		case "lab":
			return "Lab";
		case "shared_space":
			return "Shared space";
	}
}

export function toFacultyDateTimeIso(
	dateValue: string,
	timeValue: string,
	offset: string = facultyTimeZoneOffset,
): string {
	const safeTime = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
	return `${dateValue}T${safeTime}${offset}`;
}

export function expandBufferedWindow(window: BookingWindow): { startMs: number; endMs: number } {
	const startMs =
		new Date(window.startAt).getTime() - Math.max(window.setupBufferMinutes, 0) * 60_000;
	const endMs =
		new Date(window.endAt).getTime() + Math.max(window.cleanupBufferMinutes, 0) * 60_000;

	return { startMs, endMs };
}

export function bookingsOverlap(a: BookingWindow, b: BookingWindow): boolean {
	const aw = expandBufferedWindow(a);
	const bw = expandBufferedWindow(b);
	return aw.startMs < bw.endMs && aw.endMs > bw.startMs;
}

export function canCancelReservation(
	startAt: string,
	cutoffHours: number,
	now: Date = new Date(),
): boolean {
	const cutoffMs = Math.max(cutoffHours, 0) * 60 * 60 * 1000;
	return new Date(startAt).getTime() - now.getTime() >= cutoffMs;
}

export function deriveRequestStatusFromSteps(stepStatuses: RequestStepStatus[]): FacultyRequestStatus {
	if (stepStatuses.some((status) => status === "rejected")) {
		return "rejected";
	}

	if (
		stepStatuses.length > 0 &&
		stepStatuses.every((status) => status === "cancelled" || status === "skipped")
	) {
		return "cancelled";
	}

	if (
		stepStatuses.length > 0 &&
		stepStatuses.every((status) => status === "approved" || status === "skipped")
	) {
		return "approved";
	}

	return "pending_approval";
}

export function formatReservationDateTime(locale: Locale, value: string): string {
	return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export function formatReservationWindow(locale: Locale, startAt: string, endAt: string): string {
	const start = new Date(startAt);
	const end = new Date(endAt);
	const sameDay = start.toDateString() === end.toDateString();

	if (sameDay) {
		return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(start)
			+ " - "
			+ new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
				timeStyle: "short",
			}).format(end);
	}

	return `${formatReservationDateTime(locale, startAt)} - ${formatReservationDateTime(locale, endAt)}`;
}
