import { describe, expect, it } from "vitest";
import { getAllowedMenuIds } from "$lib/navigation/menu.js";
import { hasPermission } from "$lib/auth/roles.js";

describe("Employees permissions and menu visibility", () => {
	it("grants employees management to admin only", () => {
		expect(hasPermission("admin", "employees:manage")).toBe(true);
		expect(hasPermission("editor", "employees:manage")).toBe(false);
		expect(hasPermission("viewer", "employees:manage")).toBe(false);
		expect(hasPermission("user", "employees:manage")).toBe(false);
	});

	it("shows employees menu only for allowed roles", () => {
		const adminMenus = getAllowedMenuIds("admin");
		const userMenus = getAllowedMenuIds("user");

		expect(adminMenus).toContain("employees");
		expect(userMenus).not.toContain("employees");
		expect(userMenus).toContain("room-booking");
	});
});

