import type { AttachmentType, ChangeCategory, ScrStatus } from '$lib/change-request/types.js';

export type { AttachmentType, ChangeCategory, ScrStatus };

export type ScrFormIntent = 'draft' | 'submit';

export interface ItSystemOption {
	id: number;
	code: string;
	nameTh: string;
	nameEn: string | null;
}

export interface ExceptionTypeOption {
	id: number;
	code: string;
	nameTh: string;
}

export interface ChangeRequestWriteInput {
	title: string;
	exceptionTypeId: number;
	itSystemId: number;
	changeCategory: ChangeCategory;
	description: string;
	businessJustification: string;
	riskAssessment: string;
	impactDescription: string | null;
	compensatingControls: string | null;
	exceptionStartDate: string;
	exceptionEndDate: string;
	rollbackPlan: string;
	plannedImplementationAt: string | null;
	intent: ScrFormIntent;
}

export interface ItImplementInput {
	testEnvironment: string;
	testResultSummary: string;
	implementationNotes: string;
}

export interface ChangeRequestListItem {
	id: number;
	requestNumber: string;
	title: string;
	status: ScrStatus;
	statusLabel: string;
	changeCategory: ChangeCategory;
	changeCategoryLabel: string;
	itSystemName: string;
	exceptionTypeName: string;
	requesterEmployeeCode: string | null;
	requesterName: string;
	exceptionStartDate: string;
	exceptionEndDate: string;
	submittedAt: string | null;
}

export interface ChangeRequestDetail {
	id: number;
	requestNumber: string;
	requesterUserId: number;
	requesterEmployeeId: number;
	supervisorEmployeeId: number | null;
	itSystemId: number;
	itSystemCode: string;
	itSystemName: string;
	exceptionTypeId: number;
	exceptionTypeCode: string;
	exceptionTypeName: string;
	changeCategory: ChangeCategory;
	title: string;
	description: string;
	businessJustification: string;
	riskAssessment: string;
	impactDescription: string | null;
	compensatingControls: string | null;
	exceptionStartDate: string;
	exceptionEndDate: string;
	rollbackPlan: string;
	plannedImplementationAt: string | null;
	status: ScrStatus;
	submittedAt: string | null;
	supervisorApprovedAt: string | null;
	implementedAt: string | null;
	closedAt: string | null;
	testEnvironment: string | null;
	testResultSummary: string | null;
	implementationNotes: string | null;
	postReviewRequired: boolean;
	postReviewCompletedAt: string | null;
	requesterEmployeeCode: string | null;
	requesterName: string;
	supervisorEmployeeCode: string | null;
	supervisorName: string | null;
	orgUnitName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ApprovalHistoryItem {
	id: number;
	stepOrder: number;
	actorRole: string;
	actorDisplayName: string | null;
	actionType: string;
	fromStatus: ScrStatus;
	toStatus: ScrStatus;
	fromStatusLabel: string;
	toStatusLabel: string;
	comment: string | null;
	actedAt: string;
}

export interface ChangeRequestListFilter {
	status: string;
	q: string;
	changeCategory: string;
	itSystemId: number | null;
	exceptionTypeId: number | null;
}

export interface ScrAttachmentRow {
	id: number;
	attachmentType: AttachmentType;
	fileName: string;
	mimeType: string;
	fileSizeBytes: number;
	uploadedAt: string;
}

export interface ChangeRequestExportRow {
	requestNumber: string;
	title: string;
	descriptionSummary: string;
	businessJustificationSummary: string;
	riskAssessmentSummary: string;
	compensatingControlsSummary: string;
	status: string;
	statusLabel: string;
	changeCategory: string;
	changeCategoryLabel: string;
	itSystemName: string;
	exceptionTypeName: string;
	requesterEmployeeCode: string;
	requesterName: string;
	supervisorName: string;
	exceptionStartDate: string;
	exceptionEndDate: string;
	submittedAt: string;
	supervisorApprovedAt: string;
	implementedAt: string;
	closedAt: string;
	hasTestEvidence: string;
}

export interface ScrQueueCounts {
	supervisorPending: number;
	itPending: number;
}

export interface ScrQueueItem {
	id: number;
	requestNumber: string;
	title: string;
	status: ScrStatus;
	statusLabel: string;
	changeCategory: ChangeCategory;
	changeCategoryLabel: string;
	itSystemName: string;
	requesterEmployeeCode: string | null;
	requesterName: string;
	exceptionStartDate: string;
	exceptionEndDate: string;
	submittedAt: string | null;
	updatedAt: string | null;
}
