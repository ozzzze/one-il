import { db } from "./index.js";
import { appSettings } from "./schema.js";

/**
 * Seed เฉพาะค่าเริ่มต้นใน app_settings
 * ผู้ใช้จริงสร้างผ่าน Register (Supabase Auth) / Admin Users
 */
async function seed() {
	console.log("Upserting app settings...");
	const rows = [
		{ key: "siteName", value: "SvelteForge Admin" },
		{ key: "timezone", value: "UTC" },
		{ key: "defaultRole", value: "viewer" },
		{ key: "maintenanceMode", value: "false" },
	];

	for (const row of rows) {
		await db
			.insert(appSettings)
			.values({ ...row, updatedAt: new Date() })
			.onConflictDoUpdate({
				target: appSettings.key,
				set: { value: row.value, updatedAt: new Date() },
			});
	}

	console.log("Seed complete (app_settings only).");
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
