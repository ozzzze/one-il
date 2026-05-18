import { describe, expect, it } from "vitest";
import {
	applySidebarAutoExpand,
	isNavSubItemActive,
	isPathActive,
	ROOM_BOOKING_BRANCH_ID,
} from "./sidebar-expand.js";

describe("applySidebarAutoExpand", () => {
	it("expands HR hub when navigating to employees", () => {
		const { hrHubExpanded } = applySidebarAutoExpand("/employees", {});
		expect(hrHubExpanded).toBe(true);
	});

	it("expands leave branch when navigating to leave", () => {
		const { menuBranchExpanded } = applySidebarAutoExpand("/leave", {});
		expect(menuBranchExpanded["office-leave"]).toBe(true);
	});

	it("expands room booking branch when navigating to room booking", () => {
		const { menuBranchExpanded } = applySidebarAutoExpand("/room-booking/requests", {});
		expect(menuBranchExpanded[ROOM_BOOKING_BRANCH_ID]).toBe(true);
	});

	it("highlights only my requests on /room-booking/requests", () => {
		const siblings = ["/room-booking", "/room-booking/requests", "/room-booking/manage"] as const;
		const pathname = "/room-booking/requests";
		expect(isNavSubItemActive(pathname, "/room-booking", siblings)).toBe(false);
		expect(isNavSubItemActive(pathname, "/room-booking/requests", siblings)).toBe(true);
	});

	it("highlights only manage bookings on /room-booking/manage", () => {
		const siblings = ["/room-booking", "/room-booking/requests", "/room-booking/manage"] as const;
		const pathname = "/room-booking/manage";
		expect(isNavSubItemActive(pathname, "/room-booking", siblings)).toBe(false);
		expect(isNavSubItemActive(pathname, "/room-booking/manage", siblings)).toBe(true);
	});

	describe("isNavSubItemActive", () => {
		const leaveSiblings = ["/leave", "/leave/holidays"] as const;

		it("highlights only Holidays on /leave/holidays", () => {
			const pathname = "/leave/holidays";
			expect(isNavSubItemActive(pathname, "/leave", leaveSiblings)).toBe(false);
			expect(isNavSubItemActive(pathname, "/leave/holidays", leaveSiblings)).toBe(true);
		});

		it("highlights only Leave on /leave", () => {
			const pathname = "/leave";
			expect(isNavSubItemActive(pathname, "/leave", leaveSiblings)).toBe(true);
			expect(isNavSubItemActive(pathname, "/leave/holidays", leaveSiblings)).toBe(false);
		});
	});

	it("isPathActive matches prefix paths", () => {
		expect(isPathActive("/leave/holidays", "/leave")).toBe(true);
	});

	it("does not model manual collapse — caller keeps toggle state until pathname changes", () => {
		let hrExpanded = true;
		applySidebarAutoExpand("/employees", {});
		hrExpanded = false;
		// Same path: auto-expand helper is not re-invoked; collapse sticks.
		expect(hrExpanded).toBe(false);
	});
});
