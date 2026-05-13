import { describe, expect, it } from "vitest";
import {
	bookingsOverlap,
	canCancelReservation,
	deriveRequestStatusFromSteps,
	getFacultyRequestStatusLabel,
	getRoomTypeLabel,
	toFacultyDateTimeIso,
} from "./faculty-request.js";

describe("faculty request helpers", () => {
	it("detects room booking overlap with setup and cleanup buffers", () => {
		const existing = {
			startAt: "2026-05-20T09:00:00+07:00",
			endAt: "2026-05-20T10:00:00+07:00",
			setupBufferMinutes: 15,
			cleanupBufferMinutes: 15,
		};

		const candidate = {
			startAt: "2026-05-20T10:05:00+07:00",
			endAt: "2026-05-20T11:00:00+07:00",
			setupBufferMinutes: 0,
			cleanupBufferMinutes: 0,
		};

		expect(bookingsOverlap(existing, candidate)).toBe(true);
	});

	it("allows non-overlapping room bookings outside buffer windows", () => {
		const existing = {
			startAt: "2026-05-20T09:00:00+07:00",
			endAt: "2026-05-20T10:00:00+07:00",
			setupBufferMinutes: 15,
			cleanupBufferMinutes: 15,
		};

		const candidate = {
			startAt: "2026-05-20T10:20:00+07:00",
			endAt: "2026-05-20T11:00:00+07:00",
			setupBufferMinutes: 0,
			cleanupBufferMinutes: 0,
		};

		expect(bookingsOverlap(existing, candidate)).toBe(false);
	});

	it("derives approved request status when all steps are approved or skipped", () => {
		expect(deriveRequestStatusFromSteps(["approved", "skipped"])).toBe("approved");
	});

	it("derives rejected request status when any step is rejected", () => {
		expect(deriveRequestStatusFromSteps(["approved", "rejected"])).toBe("rejected");
	});

	it("blocks cancellation once the cutoff window has passed", () => {
		const startAt = "2026-05-20T10:00:00+07:00";
		const now = new Date("2026-05-20T08:30:00+07:00");

		expect(canCancelReservation(startAt, 2, now)).toBe(false);
		expect(canCancelReservation(startAt, 1, now)).toBe(true);
	});

	it("renders bilingual request and room labels", () => {
		expect(getFacultyRequestStatusLabel("th", "pending_approval")).toBe("รออนุมัติ");
		expect(getFacultyRequestStatusLabel("en", "approved")).toBe("Approved");
		expect(getRoomTypeLabel("th", "meeting_room")).toBe("ห้องประชุม");
		expect(getRoomTypeLabel("en", "classroom")).toBe("Classroom");
	});

	it("builds faculty timezone ISO strings", () => {
		expect(toFacultyDateTimeIso("2026-05-20", "09:30")).toBe("2026-05-20T09:30:00+07:00");
	});
});
