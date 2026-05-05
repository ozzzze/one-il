/**
 * ทดสอบว่าโปรเจกต์เชื่อม Supabase ได้ — รัน: node --env-file=.env scripts/check-supabase-connection.mjs
 * ไม่พิมพ์คีย์ลง stdout
 */
import { createClient } from "@supabase/supabase-js";

function mask(s) {
	if (!s) return "(ว่าง)";
	const t = String(s).trim();
	if (t.length <= 12) return "***";
	return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

async function main() {
	const url = process.env.PUBLIC_SUPABASE_URL?.trim();
	const publishable = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
	const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
	console.log("ตัวแปรที่โหลดได้ (ไม่แสดงคีย์เต็ม):");
	console.log(`  PUBLIC_SUPABASE_URL: ${url || "(ว่าง)"}`);
	console.log(`  PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${mask(publishable)}`);
	console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${mask(secret)}`);
	console.log("");

	let supabaseOk = true;

	if (!url || !publishable) {
		console.error("❌ ขาด PUBLIC_SUPABASE_URL หรือ PUBLIC_SUPABASE_PUBLISHABLE_KEY");
		process.exit(1);
	}

	const base = url.replace(/\/$/, "");

	// Auth API (ไม่ต้องมีคีย์บาง endpoint — แต่ลองพร้อม apikey)
	try {
		const r = await fetch(`${base}/auth/v1/health`, {
			headers: {
				apikey: publishable,
			},
		});
		const body = await r.text();
		console.log(`Auth /auth/v1/health → HTTP ${r.status}`);
		if (!r.ok) {
			console.log(`  body (ตัด): ${body.slice(0, 120)}`);
			supabaseOk = false;
		}
	} catch (e) {
		console.error("❌ Auth health fetch ล้มเหลว:", e.message);
		supabaseOk = false;
	}

	// REST — root บางโปรเจกต์คืน 401 (“secret key required”); ทดสอจจริงที่ตาราง public.users
	try {
		const rRoot = await fetch(`${base}/rest/v1/`, {
			headers: {
				apikey: publishable,
				Authorization: `Bearer ${publishable}`,
				Accept: "application/json",
			},
		});
		console.log(`REST /rest/v1/ (root) → HTTP ${rRoot.status} (ไม่ต้องกังวลถ้าเป็น 401)`);

		const rUsers = await fetch(`${base}/rest/v1/users?select=id&limit=1`, {
			headers: {
				apikey: publishable,
				Authorization: `Bearer ${publishable}`,
				Accept: "application/json",
				Prefer: "count=exact",
			},
		});
		const usersBody = await rUsers.text();
		console.log(
			`REST /rest/v1/users (publishable) → HTTP ${rUsers.status}`,
			rUsers.ok ? "(โอเค — ตารางว่างได้ถ้ายังไม่มีข้อมูล)" : usersBody.slice(0, 120),
		);
		if (!rUsers.ok && rUsers.status !== 404) supabaseOk = false;
	} catch (e) {
		console.error("❌ REST fetch ล้มเหลว:", e.message);
		supabaseOk = false;
	}

	// supabase-js client
	try {
		const sb = createClient(url, publishable);
		const {
			data: { session },
			error,
		} = await sb.auth.getSession();
		console.log(`supabase-js getSession → error: ${error?.message ?? "(ไม่มี)"} session: ${session ? "มี" : "ไม่มี (ปกติถ้ายังไม่ล็อกอิน)"}`);
	} catch (e) {
		console.error("❌ createClient/getSession ล้มเหลว:", e.message);
		supabaseOk = false;
	}

	// Service role (ถ้ามี)
	if (secret) {
		try {
			const sbAdmin = createClient(url, secret, {
				auth: { autoRefreshToken: false, persistSession: false },
			});
			const r = await fetch(`${base}/rest/v1/`, {
				headers: {
					apikey: secret,
					Authorization: `Bearer ${secret}`,
					Accept: "application/json",
				},
			});
			console.log(`REST ด้วย service/secret key → HTTP ${r.status}`);
			if (r.status === 401 || r.status === 403) supabaseOk = false;
			void sbAdmin;
		} catch (e) {
			console.error("❌ ทดสอบ secret key ล้มเหลว:", e.message);
			supabaseOk = false;
		}
	} else {
		console.log("ข้ามทดสอบ SUPABASE_SERVICE_ROLE_KEY (ยังไม่ตั้ง)");
	}

	console.log("");
	console.log(
		supabaseOk
			? "✅ Supabase API + คีย์ (publishable / secret) ใช้งานได้"
			: "❌ Supabase มีปัญหา — ดู HTTP และข้อความด้านบน",
	);
	process.exit(supabaseOk ? 0 : 1);
}

main();
