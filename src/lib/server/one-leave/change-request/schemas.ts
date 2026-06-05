import type {
	ChangeCategory,
	ChangeRequestListFilter,
	ChangeRequestWriteInput,
	ItImplementInput
} from '$lib/server/one-leave/change-request/types.js';
import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)');

const optionalDateTime = z
	.string()
	.trim()
	.optional()
	.transform((v) => (v && v.length > 0 ? v : null));

const CHANGE_CATEGORIES = ['standard', 'normal', 'emergency'] as const;

const changeRequestFormBaseSchema = z.object({
	title: z.string().trim().min(1, 'กรุณาระบุหัวข้อคำขอ').max(300),
	exceptionTypeId: z.coerce.number().int().positive('เลือกประเภทข้อยกเว้น'),
	itSystemId: z.coerce.number().int().positive('เลือกระบบ IT'),
	changeCategory: z.enum(CHANGE_CATEGORIES, { message: 'เลือกหมวดการเปลี่ยนแปลง' }),
	description: z.string().trim().min(1, 'กรุณาระบุรายละเอียดการเปลี่ยนแปลง').max(8000),
	businessJustification: z.string().trim().min(1, 'กรุณาระบุเหตุผลทางธุรกิจ').max(8000),
	riskAssessment: z.string().trim().min(1, 'กรุณาระบุการประเมินความเสี่ยง').max(8000),
	impactDescription: z.string().max(8000).optional().default(''),
	compensatingControls: z.string().max(8000).optional().default(''),
	exceptionStartDate: dateString,
	exceptionEndDate: dateString,
	rollbackPlan: z.string().trim().min(1, 'กรุณาระบุแผน Rollback').max(8000),
	plannedImplementationAt: optionalDateTime,
	intent: z.enum(['draft', 'submit'])
});

function buildWriteInput(
	data: z.infer<typeof changeRequestFormBaseSchema>
): ChangeRequestWriteInput | string {
	if (data.exceptionEndDate < data.exceptionStartDate) {
		return 'วันสิ้นสุดข้อยกเว้นต้องไม่ก่อนวันเริ่ม';
	}

	const impactDescription = data.impactDescription?.trim() || null;
	const compensatingControls = data.compensatingControls?.trim() || null;

	if (data.intent === 'submit') {
		if (!data.title.trim()) return 'กรุณาระบุหัวข้อคำขอ';
		if (!data.description.trim()) return 'กรุณาระบุรายละเอียดการเปลี่ยนแปลง';
		if (!data.businessJustification.trim()) return 'กรุณาระบุเหตุผลทางธุรกิจ';
		if (!data.riskAssessment.trim()) return 'กรุณาระบุการประเมินความเสี่ยง';
		if (!data.rollbackPlan.trim()) return 'กรุณาระบุแผน Rollback';
	}

	return {
		title: data.title.trim(),
		exceptionTypeId: data.exceptionTypeId,
		itSystemId: data.itSystemId,
		changeCategory: data.changeCategory as ChangeCategory,
		description: data.description.trim(),
		businessJustification: data.businessJustification.trim(),
		riskAssessment: data.riskAssessment.trim(),
		impactDescription,
		compensatingControls,
		exceptionStartDate: data.exceptionStartDate,
		exceptionEndDate: data.exceptionEndDate,
		rollbackPlan: data.rollbackPlan.trim(),
		plannedImplementationAt: data.plannedImplementationAt,
		intent: data.intent
	};
}

export function parseChangeRequestForm(
	formData: FormData
): { success: true; data: ChangeRequestWriteInput } | { success: false; message: string } {
	const parsed = changeRequestFormBaseSchema.safeParse({
		title: formData.get('title') ?? '',
		exceptionTypeId: formData.get('exceptionTypeId'),
		itSystemId: formData.get('itSystemId'),
		changeCategory: formData.get('changeCategory'),
		description: formData.get('description') ?? '',
		businessJustification: formData.get('businessJustification') ?? '',
		riskAssessment: formData.get('riskAssessment') ?? '',
		impactDescription: formData.get('impactDescription') ?? '',
		compensatingControls: formData.get('compensatingControls') ?? '',
		exceptionStartDate: formData.get('exceptionStartDate'),
		exceptionEndDate: formData.get('exceptionEndDate'),
		rollbackPlan: formData.get('rollbackPlan') ?? '',
		plannedImplementationAt: formData.get('plannedImplementationAt') ?? '',
		intent: formData.get('intent')
	});

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง'
		};
	}

	const built = buildWriteInput(parsed.data);
	if (typeof built === 'string') {
		return { success: false, message: built };
	}

	return { success: true, data: built };
}

export const scrFilterSchema = z.object({
	status: z.string().trim().max(30).default(''),
	q: z.string().trim().max(100).default(''),
	changeCategory: z.enum(['', ...CHANGE_CATEGORIES]).default(''),
	itSystemId: z
		.string()
		.optional()
		.transform((v) => {
			if (!v || v === '') return null;
			const n = Number.parseInt(v, 10);
			return Number.isFinite(n) && n > 0 ? n : null;
		}),
	exceptionTypeId: z
		.string()
		.optional()
		.transform((v) => {
			if (!v || v === '') return null;
			const n = Number.parseInt(v, 10);
			return Number.isFinite(n) && n > 0 ? n : null;
		})
});

export function parseScrFilter(
	params: URLSearchParams | Record<string, string | undefined>
): ChangeRequestListFilter {
	const source =
		params instanceof URLSearchParams
			? {
					status: params.get('status') ?? '',
					q: params.get('q') ?? '',
					changeCategory: params.get('changeCategory') ?? '',
					itSystemId: params.get('itSystemId') ?? undefined,
					exceptionTypeId: params.get('exceptionTypeId') ?? undefined
				}
			: {
					status: params.status ?? '',
					q: params.q ?? '',
					changeCategory: params.changeCategory ?? '',
					itSystemId: params.itSystemId,
					exceptionTypeId: params.exceptionTypeId
				};

	const parsed = scrFilterSchema.safeParse(source);
	if (!parsed.success) {
		return { status: '', q: '', changeCategory: '', itSystemId: null, exceptionTypeId: null };
	}
	return parsed.data;
}

const itImplementFormSchema = z.object({
	testEnvironment: z.string().trim().min(1, 'กรุณาระบุสภาพแวดล้อมทดสอบ').max(200),
	testResultSummary: z.string().trim().min(1, 'กรุณาระบุสรุปผลการทดสอบ').max(8000),
	implementationNotes: z.string().trim().min(1, 'กรุณาระบุบันทึกการดำเนินการ').max(8000)
});

export function parseItImplementForm(
	formData: FormData
): { success: true; data: ItImplementInput } | { success: false; message: string } {
	const parsed = itImplementFormSchema.safeParse({
		testEnvironment: formData.get('testEnvironment') ?? '',
		testResultSummary: formData.get('testResultSummary') ?? '',
		implementationNotes: formData.get('implementationNotes') ?? ''
	});

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง'
		};
	}

	return { success: true, data: parsed.data };
}
