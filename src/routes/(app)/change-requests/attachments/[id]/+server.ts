import { readFileSync } from "node:fs";
import { getAuthUser } from "$lib/server/one-leave/auth/bridge.js";
import { canAccessScr } from "$lib/server/one-leave/change-request/access.js";
import { readScrAttachmentPath } from "$lib/server/one-leave/change-request/attachments.js";
import { getChangeRequestById } from "$lib/server/one-leave/change-request/repository.js";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, params, url }) => {
	const user = getAuthUser(locals.user);

	const attachmentId = Number.parseInt(params.id, 10);
	const scrId = Number.parseInt(url.searchParams.get("scrId") ?? "", 10);

	if (!Number.isFinite(attachmentId) || !Number.isFinite(scrId)) {
		error(400, "พารามิเตอร์ไม่ถูกต้อง");
	}

	const record = await getChangeRequestById(scrId);
	if (!record) error(404, "ไม่พบคำขอ");
	if (!canAccessScr(user, record)) {
		error(403, "ไม่มีสิทธิดาวน์โหลดไฟล์นี้");
	}

	const fileInfo = await readScrAttachmentPath(scrId, attachmentId);
	if (!fileInfo) error(404, "ไม่พบไฟล์");

	const buffer = readFileSync(fileInfo.storagePath);

	return new Response(buffer, {
		headers: {
			"Content-Type": fileInfo.mimeType,
			"Content-Disposition": `attachment; filename="${encodeURIComponent(fileInfo.fileName)}"`,
			"Content-Length": String(buffer.byteLength),
		},
	});
};
