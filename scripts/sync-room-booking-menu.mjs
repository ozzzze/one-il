/**
 * Sync Room booking sidebar menu (parent + children) to the Supabase instance
 * configured in .env (PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *
 * Usage: node scripts/sync-room-booking-menu.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
	const env = {};
	for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
	}
	return env;
}

const root = resolve(import.meta.dirname, "..");
const env = { ...process.env, ...loadEnvFile(resolve(root, ".env")) };
const url = env.PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
	console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
	process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const children = [
	{
		id: "room-booking-calendar",
		group_id: "office_academic",
		parent_id: "shared-booking-room",
		label_th: "จองห้อง",
		label_en: "Room booking",
		href: "/room-booking",
		icon_key: "room",
		keywords: ["room", "booking", "calendar", "availability", "จองห้อง", "ปฏิทิน"],
		required_permission_keys: ["requests:create"],
		visibility: "standard",
		implementation_status: "live",
		sort_order: 0,
	},
	{
		id: "room-booking-my-requests",
		group_id: "office_academic",
		parent_id: "shared-booking-room",
		label_th: "คำขอของฉัน",
		label_en: "My requests",
		href: "/room-booking/requests",
		icon_key: "requests",
		keywords: ["my requests", "room booking", "คำขอ", "request"],
		required_permission_keys: ["requests:view_own"],
		visibility: "standard",
		implementation_status: "live",
		sort_order: 10,
	},
	{
		id: "room-booking-manage",
		group_id: "office_academic",
		parent_id: "shared-booking-room",
		label_th: "จัดการการจองห้อง",
		label_en: "Manage bookings",
		href: "/room-booking/manage",
		icon_key: "settings",
		keywords: ["manage", "booking", "room", "admin", "schedule", "block", "จัดการ", "จองห้อง"],
		required_permission_keys: ["requests:manage"],
		visibility: "admin_only",
		implementation_status: "live",
		sort_order: 20,
	},
];

const parentUpdate = await sb
	.from("menu_items")
	.update({
		href: null,
		implementation_status: "live",
		sort_order: 20,
	})
	.eq("id", "shared-booking-room")
	.select("id, href");

if (parentUpdate.error) {
	console.error("Parent update failed:", parentUpdate.error.message);
	process.exit(1);
}

if (!parentUpdate.data?.length) {
	console.error('Menu item "shared-booking-room" not found. Run menu_catalog migration first.');
	process.exit(1);
}

const upsert = await sb.from("menu_items").upsert(children, { onConflict: "id" }).select("id, label_en, href, visibility");

if (upsert.error) {
	console.error("Children upsert failed:", upsert.error.message);
	process.exit(1);
}

const verify = await sb
	.from("menu_items")
	.select("id, parent_id, label_en, href, visibility, sort_order")
	.or("id.eq.shared-booking-room,parent_id.eq.shared-booking-room")
	.order("sort_order");

console.log(`Synced to ${url}`);
console.log(JSON.stringify(verify.data, null, 2));
