import { getAuthUser } from "$lib/server/one-leave/auth/bridge.js";
import { auditContextFromUser, getRequestIp } from "$lib/server/one-leave/audit/context.js";
import {
	closeChangeRequest,
	emergencyImplement,
	itDeny,
	itImplement,
	submitChangeRequest,
	supervisorApprove,
	supervisorDeny,
	withdrawChangeRequest,
} from "$lib/server/one-leave/change-request/approval-actions.js";
import {
	canAccessScr,
	canCloseScr,
	canEditScr,
	canEmergencyImplement,
	canItDeny,
	canItImplement,
	canSupervisorApprove,
	canSupervisorDeny,
	canWithdrawScr,
} from "$lib/server/one-leave/change-request/access.js";
import {
	deleteScrAttachment,
	listScrAttachments,
	saveScrAttachment,
} from "$lib/server/one-leave/change-request/attachments.js";
import {
	parseChangeRequestForm,
	parseItImplementForm,
} from "$lib/server/one-leave/change-request/schemas.js";
import {
	getChangeRequestById,
	listApprovalHistory,
	listExceptionTypes,
	listItSystems,
	updateChangeRequest,
} from "$lib/server/one-leave/change-request/repository.js";
import { actionFail, actionSuccess } from "$lib/server/one-leave/org/action-result.js";
import { error, isRedirect, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad, RequestEvent } from "./$types";

export const load: PageServerLoad = async ({ locals, params, parent }) => {
	await parent();
	const user = getAuthUser(locals.user);

	const id = Number.parseInt(params.id, 10);
	if (!Number.isFinite(id)) error(404, "ไม่พบคำขอ");

	const record = await getChangeRequestById(id);
	if (!record) error(404, "ไม่พบคำขอเปลี่ยนแปลงระบบ");
	if (!canAccessScr(user, record)) {
		error(403, "ไม่มีสิทธิดูคำขอนี้");
	}

	const editable = canEditScr(user, record);
	const [itSystems, exceptionTypes, attachments, approvalHistory] = await Promise.all([
		editable ? listItSystems() : Promise.resolve([]),
		editable ? listExceptionTypes() : Promise.resolve([]),
		listScrAttachments(id),
		listApprovalHistory(id),
	]);

	return {
		pageTitle: record.requestNumber,
		record,
		itSystems,
		exceptionTypes,
		attachments,
		approvalHistory,
		editable,
		readonly: !editable,
		canWithdraw: canWithdrawScr(user, record),
		canSupervisorApprove: canSupervisorApprove(user, record),
		canSupervisorDeny: canSupervisorDeny(user, record),
		canItImplement: canItImplement(user, record),
		canItDeny: canItDeny(user, record),
		canEmergencyImplement: canEmergencyImplement(user, record),
		canClose: canCloseScr(user, record),
		canUploadTestEvidence: canItImplement(user, record) || canEmergencyImplement(user, record),
		showItSection:
			record.status === "supervisor_approved" ||
			record.status === "implemented" ||
			record.status === "closed",
		authMock: false,
	};
};

async function handleUpdate(event: RequestEvent, id: number, intent: "draft" | "submit") {
	const { request, locals } = event;
	const user = getAuthUser(locals.user);

	const existing = await getChangeRequestById(id);
	if (!existing) return actionFail(404, "ไม่พบคำขอ");
	if (!canEditScr(user, existing)) {
		return actionFail(403, "แก้ไขได้เฉพาะคำขอร่างของตนเอง");
	}

	const formData = await request.formData();
	formData.set("intent", intent);
	const attachmentFile = formData.get("request_supporting");

	const parsed = parseChangeRequestForm(formData);
	if (!parsed.success) {
		return actionFail(400, parsed.message, "warning");
	}

	try {
		const audit = auditContextFromUser(user, getRequestIp(event));
		await updateChangeRequest(user, id, parsed.data, audit);

		if (attachmentFile instanceof File && attachmentFile.size > 0) {
			await saveScrAttachment(user, id, "request_supporting", attachmentFile);
		}

		if (parsed.data.intent === "submit") {
			await submitChangeRequest(user, id, getRequestIp(event), audit);
		}

		const destination =
			parsed.data.intent === "submit" ? "/change-requests" : `/change-requests/${id}`;
		throw redirect(303, destination);
	} catch (err: unknown) {
		if (isRedirect(err)) throw err;
		const message = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
		return actionFail(400, message);
	}
}

export const actions: Actions = {
	saveDraft: (event) => {
		const id = Number.parseInt(event.params.id, 10);
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		return handleUpdate(event, id, "draft");
	},
	submit: (event) => {
		const id = Number.parseInt(event.params.id, 10);
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		return handleUpdate(event, id, "submit");
	},
	withdraw: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		try {
			const audit = auditContextFromUser(user, getRequestIp(event));
			await withdrawChangeRequest(user, id, getRequestIp(event), audit);
			throw redirect(303, "/change-requests");
		} catch (err: unknown) {
			if (isRedirect(err)) throw err;
			return actionFail(400, err instanceof Error ? err.message : "ถอนไม่สำเร็จ");
		}
	},
	supervisorApprove: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		const formData = await event.request.formData();
		const comment = String(formData.get("comment") ?? "");
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		try {
			const audit = auditContextFromUser(user, getRequestIp(event));
			await supervisorApprove(user, id, comment || null, getRequestIp(event), audit);
			return actionSuccess("หัวหน้าอนุมัติแล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
		}
	},
	supervisorDeny: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		const formData = await event.request.formData();
		const reason = String(formData.get("reason") ?? "");
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		try {
			const audit = auditContextFromUser(user, getRequestIp(event));
			await supervisorDeny(user, id, reason, getRequestIp(event), audit);
			return actionSuccess("ไม่อนุมัติแล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
		}
	},
	itImplement: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		const formData = await event.request.formData();
		const parsed = parseItImplementForm(formData);
		if (!parsed.success) return actionFail(400, parsed.message, "warning");
		try {
			const audit = auditContextFromUser(user, getRequestIp(event));
			await itImplement(user, id, parsed.data, getRequestIp(event), audit);
			return actionSuccess("IT ดำเนินการแล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
		}
	},
	itDeny: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		const formData = await event.request.formData();
		const reason = String(formData.get("reason") ?? "");
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		try {
			const audit = auditContextFromUser(user, getRequestIp(event));
			await itDeny(user, id, reason, getRequestIp(event), audit);
			return actionSuccess("IT ไม่อนุมัติแล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
		}
	},
	emergencyImplement: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		const formData = await event.request.formData();
		const parsed = parseItImplementForm(formData);
		if (!parsed.success) return actionFail(400, parsed.message, "warning");
		try {
			const audit = auditContextFromUser(user, getRequestIp(event));
			await emergencyImplement(user, id, parsed.data, getRequestIp(event), audit);
			return actionSuccess("ดำเนินการฉุกเฉินแล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
		}
	},
	close: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");
		try {
			const audit = auditContextFromUser(user, getRequestIp(event));
			await closeChangeRequest(user, id, getRequestIp(event), audit);
			return actionSuccess("ปิดเรื่องแล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
		}
	},
	uploadAttachment: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		if (!Number.isFinite(id)) return actionFail(400, "รหัสไม่ถูกต้อง");

		const record = await getChangeRequestById(id);
		if (!record) return actionFail(404, "ไม่พบคำขอ");

		const formData = await event.request.formData();
		const file = formData.get("file");
		const attachmentType = String(formData.get("attachmentType") ?? "request_supporting");

		if (!(file instanceof File)) return actionFail(400, "เลือกไฟล์");

		const canUploadDraft = canEditScr(user, record) && attachmentType === "request_supporting";
		const canUploadTest =
			(canItImplement(user, record) || canEmergencyImplement(user, record)) &&
			attachmentType === "test_evidence";

		if (!canUploadDraft && !canUploadTest) {
			return actionFail(403, "ไม่มีสิทธิแนบไฟล์ประเภทนี้");
		}

		try {
			await saveScrAttachment(
				user,
				id,
				attachmentType as "request_supporting" | "test_evidence",
				file
			);
			return actionSuccess("แนบไฟล์แล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
		}
	},
	deleteAttachment: async (event) => {
		const user = getAuthUser(event.locals.user);
		const id = Number.parseInt(event.params.id, 10);
		const formData = await event.request.formData();
		const attachmentId = Number.parseInt(String(formData.get("attachmentId") ?? ""), 10);
		if (!Number.isFinite(id) || !Number.isFinite(attachmentId)) {
			return actionFail(400, "ข้อมูลไม่ถูกต้อง");
		}

		const record = await getChangeRequestById(id);
		if (!record || !canEditScr(user, record)) {
			return actionFail(403, "ลบไฟล์ได้เฉพาะคำขอร่าง");
		}

		try {
			await deleteScrAttachment(user, id, attachmentId);
			return actionSuccess("ลบไฟล์แล้ว");
		} catch (err: unknown) {
			return actionFail(400, err instanceof Error ? err.message : "ลบไม่สำเร็จ");
		}
	},
};
