import type { ChangeCategory, ScrStatus } from '$lib/change-request/types.js';

export const SCR_STATUS_LABELS: Record<ScrStatus, string> = {
	draft: 'ร่าง',
	submitted: 'ส่งเรื่องแล้ว',
	supervisor_approved: 'หัวหน้าอนุมัติแล้ว',
	denied: 'ไม้อนุมัติ',
	implemented: 'ดำเนินการแล้ว',
	closed: 'ปิดเรื่องแล้ว',
	withdrawn: 'ถอนคำขอ'
};

export const CHANGE_CATEGORY_LABELS: Record<ChangeCategory, string> = {
	standard: 'มาตรฐาน (Standard)',
	normal: 'ปกติ (Normal)',
	emergency: 'ฉุกเฉิน (Emergency)'
};

export const ATTACHMENT_TYPE_LABELS: Record<string, string> = {
	request_supporting: 'เอกสารประกอบคำขอ',
	test_evidence: 'หลักฐานการทดสอบ',
	implementation_evidence: 'หลักฐานการดำเนินการ',
	approval_document: 'เอกสารอนุมัติ'
};

export function labelScrStatus(code: string): string {
	return SCR_STATUS_LABELS[code as ScrStatus] ?? code;
}

export function labelChangeCategory(code: string): string {
	return CHANGE_CATEGORY_LABELS[code as ChangeCategory] ?? code;
}

export function labelAttachmentType(code: string): string {
	return ATTACHMENT_TYPE_LABELS[code] ?? code;
}

export const SCR_APPROVAL_ACTION_LABELS: Record<string, string> = {
	submit: 'ส่งเรื่อง',
	withdraw: 'ถอนคำขอ',
	approve: 'อนุมัติ',
	deny: 'ไม้อนุมัติ',
	implement: 'ดำเนินการ',
	emergency_implement: 'ดำเนินการฉุกเฉิน',
	close: 'ปิดเรื่อง'
};

export function labelScrApprovalAction(actionType: string): string {
	return SCR_APPROVAL_ACTION_LABELS[actionType] ?? actionType;
}
