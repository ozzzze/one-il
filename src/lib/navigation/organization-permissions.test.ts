import { describe, expect, it } from "vitest";
import { hasPermission } from "$lib/auth/roles.js";
import { getAllowedMenuIds } from "$lib/navigation/menu.js";

describe("Organization permissions and menu visibility", () => {
	it("grants organization management to admin only", () => {
		expect(hasPermission("admin", "organization:manage")).toBe(true);
		expect(hasPermission("editor", "organization:manage")).toBe(false);
		expect(hasPermission("viewer", "organization:manage")).toBe(false);
		expect(hasPermission("user", "organization:manage")).toBe(false);
	});

	it("shows organization menu only for allowed roles", () => {
		const adminMenus = getAllowedMenuIds("admin");
		const editorMenus = getAllowedMenuIds("editor");
		const userMenus = getAllowedMenuIds("user");

		expect(adminMenus).toContain("organization");
		expect(editorMenus).not.toContain("organization");
		expect(userMenus).not.toContain("organization");
	});
});
