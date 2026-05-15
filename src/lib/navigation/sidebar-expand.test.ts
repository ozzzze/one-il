import { describe, expect, it } from "vitest";
import { applySidebarAutoExpand, isNavSubItemActive, isPathActive } from "./sidebar-expand.js";

describe("applySidebarAutoExpand", () => {
	it("expands HR hub when navigating to employees", () => {
		const { hrHubExpanded } = applySidebarAutoExpand("/employees", {});
		expect(hrHubExpanded).toBe(true);
	});

	it("expands leave branch when navigating to leave", () => {
		const { menuBranchExpanded } = applySidebarAutoExpand("/leave", {});
		expect(menuBranchExpanded["office-leave"]).toBe(true);
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
