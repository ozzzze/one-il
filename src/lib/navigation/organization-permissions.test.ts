import { describe, expect, it } from "vitest";
import { hasPermission } from "$lib/auth/roles.js";
import { getAccessibleMenuItemIds, type RawMenuItemRow } from "$lib/navigation/menu.js";

const organizationRow: RawMenuItemRow = {
	id: "office-organization",
	group_id: "office",
	parent_id: null,
	label_th: "โครงสร้างองค์กร",
	label_en: "Organization",
	href: "/organization/positions",
	icon_key: "organization",
	keywords: [],
	required_permission_keys: ["organization:manage"],
	visibility: "standard",
	implementation_status: "live",
	sort_order: 0,
};

describe("Organization permissions and menu visibility", () => {
	it("grants organization management to admin only", () => {
		expect(hasPermission("admin", "organization:manage")).toBe(true);
		expect(hasPermission("editor", "organization:manage")).toBe(false);
		expect(hasPermission("viewer", "organization:manage")).toBe(false);
		expect(hasPermission("user", "organization:manage")).toBe(false);
	});

	it("shows organization menu only for allowed roles", () => {
		const rows = [organizationRow];
		expect(getAccessibleMenuItemIds("admin", rows)).toContain("office-organization");
		expect(getAccessibleMenuItemIds("editor", rows)).not.toContain("office-organization");
		expect(getAccessibleMenuItemIds("user", rows)).not.toContain("office-organization");
	});
});
