import { describe, expect, it } from "vitest";
import { getAccessibleMenuItemIds, type RawMenuItemRow } from "$lib/navigation/menu.js";
import { hasPermission } from "$lib/auth/roles.js";

const hrRow: RawMenuItemRow = {
	id: "office-hr",
	group_id: "office",
	parent_id: null,
	label_th: "ทรัพยากรบุคคล",
	label_en: "Human Resources",
	href: "/employees",
	icon_key: "employees",
	keywords: [],
	required_permission_keys: ["employees:manage"],
	visibility: "standard",
	implementation_status: "live",
	sort_order: 0,
};

const roomBookingRow: RawMenuItemRow = {
	id: "shared-booking-room",
	group_id: "office_academic",
	parent_id: null,
	label_th: "จองห้อง",
	label_en: "Room booking",
	href: "/room-booking",
	icon_key: "room",
	keywords: [],
	required_permission_keys: ["requests:create"],
	visibility: "standard",
	implementation_status: "live",
	sort_order: 0,
};

describe("Employees permissions and menu visibility", () => {
	it("grants employees management to admin only", () => {
		expect(hasPermission("admin", "employees:manage")).toBe(true);
		expect(hasPermission("editor", "employees:manage")).toBe(false);
		expect(hasPermission("viewer", "employees:manage")).toBe(false);
		expect(hasPermission("user", "employees:manage")).toBe(false);
	});

	it("shows employees menu only for allowed roles", () => {
		const rows = [hrRow, roomBookingRow];
		expect(getAccessibleMenuItemIds("admin", rows)).toContain("office-hr");
		expect(getAccessibleMenuItemIds("user", rows)).not.toContain("office-hr");
		expect(getAccessibleMenuItemIds("user", rows)).toContain("shared-booking-room");
	});
});
