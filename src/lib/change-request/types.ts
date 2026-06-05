export type ScrStatus =
	| 'draft'
	| 'submitted'
	| 'supervisor_approved'
	| 'denied'
	| 'implemented'
	| 'closed'
	| 'withdrawn';

export type ChangeCategory = 'standard' | 'normal' | 'emergency';

export type AttachmentType =
	| 'request_supporting'
	| 'test_evidence'
	| 'implementation_evidence'
	| 'approval_document';
