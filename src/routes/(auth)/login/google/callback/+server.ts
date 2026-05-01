import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";

/** Arctic/Google OAuth ปิดการใช้งาน — ใช้ Supabase Dashboard เพื่อเปิด Google provider + redirect URLs แทน */
export const GET: RequestHandler = async () => {
	redirect(
		302,
		"/login?notice=" + encodeURIComponent("GitHub/Google OAuth ผ่าน template นี้ปิดไว้ — ตั้งค่าที่ Supabase Auth แทน")
	);
};
