import { test, expect } from "@playwright/test";
import { login } from "./helpers.js";

test.describe("Sidebar submenu toggles", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test("Employees toggle shows and hides HR submenu on /employees", async ({ page }) => {
		await page.goto("/employees");

		const toggle = page.getByTestId("sidebar-hr-toggle");
		const submenu = page.getByTestId("sidebar-hr-submenu");

		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(submenu).toBeVisible();

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(submenu).toBeHidden();

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(submenu).toBeVisible();
	});

	test("Room booking toggle shows and hides room booking submenu", async ({ page }) => {
		await page.goto("/room-booking");

		const toggle = page.getByTestId("sidebar-branch-toggle-shared-booking-room");
		const submenu = page.getByTestId("sidebar-branch-submenu-shared-booking-room");

		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(submenu).toBeVisible();

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(submenu).toBeHidden();

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(submenu).toBeVisible();
	});

	test("Leave toggle shows and hides leave submenu", async ({ page }) => {
		await page.goto("/leave");

		const toggle = page.getByTestId("sidebar-branch-toggle-office-leave");
		const submenu = page.getByTestId("sidebar-branch-submenu-office-leave");

		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(submenu).toBeVisible();

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(submenu).toBeHidden();

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(submenu).toBeVisible();
	});
});
