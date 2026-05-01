import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";

/**
 * GET /api/supabase/health — ตรวจว่า client ต่อ Supabase API ได้และลองอ่านตัวอย่างจาก `public.users`
 * เปิดแบบไม่บังคับล็อกอิน SQLite เพื่อให้ทดสอบระหว่างตั้งค่าได้
 */
export const GET: RequestHandler = async ({ locals }) => {
	const supabase = locals.supabase;

	const authResult = await supabase.auth.getSession();

	const sample = await supabase.from("users").select("id").limit(1);

	return json({
		status: "ok",
		checks: {
			auth_client: authResult.error
				? { ok: false, message: authResult.error.message }
				: { ok: true, has_session: !!authResult.data.session },
			public_users_sample: sample.error
				? { ok: false, message: sample.error.message, code: sample.error.code }
				: { ok: true, row_count: sample.data?.length ?? 0 },
		},
	});
};
