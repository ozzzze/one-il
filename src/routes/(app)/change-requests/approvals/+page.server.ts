import { getAuthUser } from '$lib/server/one-leave/auth/bridge.js';
import { canItReview } from '$lib/server/one-leave/change-request/access.js';
import { listItQueue, listSupervisorQueue } from '$lib/server/one-leave/change-request/approvals-queue.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const VALID_TABS = ['supervisor', 'it'] as const;
type ApprovalTab = (typeof VALID_TABS)[number];

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const user = getAuthUser(locals.user);

	const tabParam = url.searchParams.get('tab') ?? 'supervisor';
	const activeTab: ApprovalTab = VALID_TABS.includes(tabParam as ApprovalTab)
		? (tabParam as ApprovalTab)
		: 'supervisor';

	if (activeTab === 'it' && !canItReview(user)) {
		error(403, 'ไม่มีสิทธิดูคิว IT');
	}

	if (activeTab === 'supervisor' && user.employeeId === null) {
		error(403, 'บัญชีไม่ผูกข้อมูลพนักงาน');
	}

	const items =
		activeTab === 'it'
			? await listItQueue(user)
			: await listSupervisorQueue(user);

	return {
		pageTitle: 'คิวอนุมัติคำขอเปลี่ยนแปลงระบบ',
		activeTab,
		items,
		canItTab: canItReview(user),
		authMock: false
	};
};
