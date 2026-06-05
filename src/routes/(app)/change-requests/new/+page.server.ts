import { getAuthUser } from '$lib/server/one-leave/auth/bridge.js';
import { auditContextFromUser, getRequestIp } from '$lib/server/one-leave/audit/context.js';
import { assertCanCreateScr } from '$lib/server/one-leave/change-request/access.js';
import { saveScrAttachment } from '$lib/server/one-leave/change-request/attachments.js';
import { parseChangeRequestForm } from '$lib/server/one-leave/change-request/schemas.js';
import { formatDbError } from '$lib/server/one-leave/change-request/db-helpers.js';
import {
	createChangeRequest,
	listExceptionTypes,
	listItSystems
} from '$lib/server/one-leave/change-request/repository.js';
import { actionFail } from '$lib/server/one-leave/org/action-result.js';
import { getEmployeeById } from '$lib/server/one-leave/org/repository.js';
import { error, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = getAuthUser(locals.user);

	try {
		await assertCanCreateScr(user);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ไม่สามารถยื่นคำขอได้';
		error(403, message);
	}

	if (user.employeeId === null) {
		error(403, 'บัญชีไม่ผูกข้อมูลพนักงาน');
	}

	const employee = await getEmployeeById(user.employeeId);
	if (!employee) error(404, 'ไม่พบข้อมูลพนักงาน');

	const [itSystems, exceptionTypes] = await Promise.all([listItSystems(), listExceptionTypes()]);

	return {
		pageTitle: 'ยื่นคำขอเปลี่ยนแปลงระบบ',
		employee,
		itSystems,
		exceptionTypes,
		authMock: false
	};
};

async function handleCreateAction(event: RequestEvent, intent: 'draft' | 'submit') {
	const { request, locals } = event;
	const user = getAuthUser(locals.user);

	const formData = await request.formData();
	formData.set('intent', intent);

	const parsed = parseChangeRequestForm(formData);
	if (!parsed.success) {
		return actionFail(400, parsed.message, 'warning');
	}

	const attachmentFile = formData.get('request_supporting');

	try {
		const audit = auditContextFromUser(user, getRequestIp(event));
		const result = await createChangeRequest(user, parsed.data, audit);

		if (attachmentFile instanceof File && attachmentFile.size > 0) {
			await saveScrAttachment(user, result.id, 'request_supporting', attachmentFile);
		}

		const destination =
			parsed.data.intent === 'submit' ? '/change-requests' : `/change-requests/${result.id}`;
		throw redirect(303, destination);
	} catch (err: unknown) {
		if (isRedirect(err)) throw err;
		return actionFail(400, formatDbError(err));
	}
}

export const actions: Actions = {
	saveDraft: (event) => handleCreateAction(event, 'draft'),
	submit: (event) => handleCreateAction(event, 'submit')
};
