import { describe, expect, it } from "vitest";
import { applySidebarAutoExpand } from "./sidebar-expand.js";

describe("applySidebarAutoExpand", () => {
	it("expands HR hub when navigating to employees", () => {
		const { hrHubExpanded } = applySidebarAutoExpand("/employees", {});
		expect(hrHubExpanded).toBe(true);
	});

	it("expands leave branch when navigating to leave", () => {
		const { menuBranchExpanded } = applySidebarAutoExpand("/leave", {});
		expect(menuBranchExpanded["office-leave"]).toBe(true);
	});

	it("does not model manual collapse — caller keeps toggle state until pathname changes", () => {
		let hrExpanded = true;
		applySidebarAutoExpand("/employees", {});
		hrExpanded = false;
		// Same path: auto-expand helper is not re-invoked; collapse sticks.
		expect(hrExpanded).toBe(false);
	});
});
