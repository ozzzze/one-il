import { describe, expect, it } from "vitest";
import { isRoomBookingWeekday, shiftAcrossWeekdays } from "./room-booking-dates.js";

describe("room booking weekday helpers", () => {
	it("identifies Monday through Friday as bookable", () => {
		expect(isRoomBookingWeekday("2026-05-11")).toBe(true);
		expect(isRoomBookingWeekday("2026-05-15")).toBe(true);
		expect(isRoomBookingWeekday("2026-05-16")).toBe(false);
		expect(isRoomBookingWeekday("2026-05-17")).toBe(false);
	});

	it("skips weekends when shifting across weekdays", () => {
		expect(shiftAcrossWeekdays("2026-05-15", 1)).toBe("2026-05-18");
		expect(shiftAcrossWeekdays("2026-05-18", -1)).toBe("2026-05-15");
	});
});
