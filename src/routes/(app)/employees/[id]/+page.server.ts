import { error, fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import {
	assignmentSchema,
	mutateAssignPrimary,
	mutateAssignProgramChair,
	mutateSetSupervisor,
	programChairSchema,
	supervisorSchema,
} from "$lib/server/employee-org-mutations.js";
import { employeeEmbeddedSelect, mapEmployeeRowToView, type EmployeeRow } from "$lib/server/employees-load.js";
import type { Actions, PageServerLoad } from "./$types.js";

const PHOTO_BUCKET = "employee-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const titleThEnum = z.enum(["นาย", "นาง", "นางสาว"]);
const titleEnEnum = z.enum(["Mr.", "Mrs.", "Miss"]);
const genderEnum = z.enum(["male", "female"]);
const dutyKindEnum = z.enum(["teacher", "staff"]);

const optionalUuidFk = z
	.string()
	.trim()
	.transform((s) => (s.length === 0 ? null : s))
	.pipe(z.union([z.string().uuid(), z.null()]));

const optionalDate = z
	.string()
	.trim()
	.transform((s) => (s.length === 0 ? null : s))
	.pipe(z.union([z.string().date(), z.null()]));

function nullableTrimmed(max: number) {
	return z
		.string()
		.trim()
		.max(max)
		.optional()
		.or(z.literal(""))
		.transform((s) => (!s || s.length === 0 ? null : s));
}

function toText(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value : "";
}

function toTextList(formData: FormData, key: string): string[] {
	const out: string[] = [];
	for (const v of formData.getAll(key)) {
		if (typeof v === "string" && v.length > 0) out.push(v);
	}
	return out;
}

const updateEmployeeIdentitySchema = z.object({
	employeeId: z.string().uuid(),
	firstName: z.string().trim().min(1).max(100),
	lastName: z.string().trim().min(1).max(100),
	employeeNo: z.string().trim().max(50).optional().or(z.literal("")),
	personTitleTh: z.union([z.literal(""), titleThEnum]).optional(),
	academicTitleTh: nullableTrimmed(200),
	personTitleEn: z.union([z.literal(""), titleEnEnum]).optional(),
	academicTitleEn: nullableTrimmed(200),
	firstNameEn: nullableTrimmed(100),
	lastNameEn: nullableTrimmed(100),
	nickname: nullableTrimmed(100),
	address: nullableTrimmed(4000),
	gender: z.union([z.literal(""), genderEnum]).optional(),
	birthDate: optionalDate,
});

const updateEmployeeEmploymentSchema = z.object({
	employeeId: z.string().uuid(),
	employmentContractTypeId: optionalUuidFk,
	personnelCategoryId: optionalUuidFk,
	hrEmploymentStatusId: optionalUuidFk,
	employmentStartedAt: optionalDate,
	employmentEndedAt: optionalDate,
	dutyKind: z.union([z.literal(""), dutyKindEnum]).optional(),
	professionalRecognitionStatus: z
		.string()
		.optional()
		.transform((s) => {
			const t = (s ?? "").trim();
			return t.length === 0 ? null : t;
		})
		.pipe(z.union([z.string().max(500), z.null()])),
});

const replaceEmergencySchema = z.object({
	employeeId: z.string().uuid(),
	slot1Name: z.string().trim().max(200).optional().or(z.literal("")),
	slot1Relationship: z.string().trim().max(200).optional().or(z.literal("")),
	slot1Phone: z.string().trim().max(50).optional().or(z.literal("")),
	slot2Name: z.string().trim().max(200).optional().or(z.literal("")),
	slot2Relationship: z.string().trim().max(200).optional().or(z.literal("")),
	slot2Phone: z.string().trim().max(50).optional().or(z.literal("")),
});

const replaceDeductionsSchema = z.object({
	employeeId: z.string().uuid(),
	deductionTypeIds: z.array(z.string().uuid()).default([]),
});

const clearPhotoSchema = z.object({
	employeeId: z.string().uuid(),
});

export const load: PageServerLoad = async ({ params, locals }) => {
	assertPermission(locals.user, "employees:manage");
	const admin = getServiceRoleClient();
	const id = params.id;
	if (!z.string().uuid().safeParse(id).success) error(404, "Not found");

	const [
		empRes,
		positionsRes,
		orgUnitsRes,
		programsRes,
		usersRes,
		employmentContractTypesRes,
		personnelCategoriesRes,
		hrEmploymentStatusesRes,
		deductionTypesRes,
	] = await Promise.all([
		admin.from("employees").select(employeeEmbeddedSelect).eq("id", id).maybeSingle(),
		admin.from("positions").select("id,code,name,name_en,role_level").order("role_level", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,unit_type,sort_order").order("sort_order", { ascending: true }),
		admin.from("programs").select("id,code,name,is_active").order("name", { ascending: true }),
		admin.from("users").select("id,email,name,username").order("email", { ascending: true }),
		admin.from("employment_contract_types").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("personnel_categories").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("hr_employment_statuses").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("deduction_types").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
	]);

	if (empRes.error || !empRes.data) error(404, "Not found");

	const row = empRes.data as unknown as EmployeeRow;
	const employee = mapEmployeeRowToView(row);

	const [allEmployeesRes, allLinkedRes] = await Promise.all([
		admin.from("employees").select("id,first_name,last_name").order("first_name", { ascending: true }),
		admin.from("employees").select("user_id").not("user_id", "is", null),
	]);
	const allEmployeesMinimal = (allEmployeesRes.data ?? []).map((r) => ({
		id: r.id,
		fullName: `${r.first_name} ${r.last_name}`,
	}));

	const linkedUserIds = new Set(
		(allLinkedRes.data ?? []).map((r) => r.user_id).filter((id): id is string => typeof id === "string" && id.length > 0),
	);
	const usersAvailableForLink = (usersRes.data ?? []).filter((u) => !linkedUserIds.has(u.id));

	let photoSignedUrl: string | null = null;
	const key = employee.hrProfile.photoObjectKey;
	if (key && key.length > 0) {
		const signed = await admin.storage.from(PHOTO_BUCKET).createSignedUrl(key, 3600);
		if (!signed.error && signed.data?.signedUrl) photoSignedUrl = signed.data.signedUrl;
	}

	return {
		locale: locals.locale,
		employee,
		photoSignedUrl,
		positions: positionsRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		programs: programsRes.data ?? [],
		allEmployeesMinimal,
		usersAvailableForLink,
		hrLookups: {
			employmentContractTypes: employmentContractTypesRes.data ?? [],
			personnelCategories: personnelCategoriesRes.data ?? [],
			hrEmploymentStatuses: hrEmploymentStatusesRes.data ?? [],
			deductionTypes: deductionTypesRes.data ?? [],
		},
		errors: {
			employee: null,
			positions: positionsRes.error?.message ?? null,
			orgUnits: orgUnitsRes.error?.message ?? null,
			programs: programsRes.error?.message ?? null,
			users: usersRes.error?.message ?? null,
			employmentContractTypes: employmentContractTypesRes.error?.message ?? null,
			personnelCategories: personnelCategoriesRes.error?.message ?? null,
			hrEmploymentStatuses: hrEmploymentStatusesRes.error?.message ?? null,
			deductionTypes: deductionTypesRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	updateEmployeeIdentity: async ({ request, locals, params }) => {
		const invalidMsg =
			locals.locale === "th" ? "ข้อมูลตัวตนไม่ถูกต้อง" : "Identity fields are invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = updateEmployeeIdentitySchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			firstName: toText(formData.get("firstName")),
			lastName: toText(formData.get("lastName")),
			employeeNo: toText(formData.get("employeeNo")),
			personTitleTh: toText(formData.get("personTitleTh")),
			academicTitleTh: toText(formData.get("academicTitleTh")),
			personTitleEn: toText(formData.get("personTitleEn")),
			academicTitleEn: toText(formData.get("academicTitleEn")),
			firstNameEn: toText(formData.get("firstNameEn")),
			lastNameEn: toText(formData.get("lastNameEn")),
			nickname: toText(formData.get("nickname")),
			address: toText(formData.get("address")),
			gender: toText(formData.get("gender")),
			birthDate: toText(formData.get("birthDate")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });
		if (parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const personTitleTh = parsed.data.personTitleTh === "" ? null : parsed.data.personTitleTh ?? null;
		const personTitleEn = parsed.data.personTitleEn === "" ? null : parsed.data.personTitleEn ?? null;
		const gender = parsed.data.gender === "" ? null : parsed.data.gender ?? null;

		const { error: upErr } = await admin
			.from("employees")
			.update({
				first_name: parsed.data.firstName,
				last_name: parsed.data.lastName,
				employee_no: parsed.data.employeeNo && parsed.data.employeeNo.length > 0 ? parsed.data.employeeNo : null,
				person_title_th: personTitleTh,
				academic_title_th: parsed.data.academicTitleTh,
				person_title_en: personTitleEn,
				academic_title_en: parsed.data.academicTitleEn,
				first_name_en: parsed.data.firstNameEn,
				last_name_en: parsed.data.lastNameEn,
				nickname: parsed.data.nickname,
				address: parsed.data.address,
				gender,
				birth_date: parsed.data.birthDate,
			})
			.eq("id", parsed.data.employeeId);
		if (upErr) return fail(400, { message: upErr.message });
		return { success: true, action: "updateEmployeeIdentity" };
	},

	updateEmployeeEmployment: async ({ request, locals, params }) => {
		const invalidMsg =
			locals.locale === "th" ? "ข้อมูลการจ้างงานไม่ถูกต้อง" : "Employment fields are invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const licFlags = formData.getAll("professionalTeacherLicense");
		const license = licFlags.includes("true");
		const parsed = updateEmployeeEmploymentSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			employmentContractTypeId: toText(formData.get("employmentContractTypeId")),
			personnelCategoryId: toText(formData.get("personnelCategoryId")),
			hrEmploymentStatusId: toText(formData.get("hrEmploymentStatusId")),
			employmentStartedAt: toText(formData.get("employmentStartedAt")),
			employmentEndedAt: toText(formData.get("employmentEndedAt")),
			dutyKind: toText(formData.get("dutyKind")),
			professionalRecognitionStatus: toText(formData.get("professionalRecognitionStatus")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });
		if (parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const dutyKind = parsed.data.dutyKind === "" ? null : parsed.data.dutyKind ?? null;

		const { error: upErr } = await admin
			.from("employees")
			.update({
				employment_contract_type_id: parsed.data.employmentContractTypeId,
				personnel_category_id: parsed.data.personnelCategoryId,
				hr_employment_status_id: parsed.data.hrEmploymentStatusId,
				employment_started_at: parsed.data.employmentStartedAt,
				employment_ended_at: parsed.data.employmentEndedAt,
				duty_kind: dutyKind,
				professional_teacher_license: license,
				professional_recognition_status: parsed.data.professionalRecognitionStatus,
			})
			.eq("id", parsed.data.employeeId);
		if (upErr) return fail(400, { message: upErr.message });
		return { success: true, action: "updateEmployeeEmployment" };
	},

	replaceEmergencyContacts: async ({ request, locals, params }) => {
		const invalidMsg =
			locals.locale === "th" ? "ข้อมูลผู้ติดต่อฉุกเฉินไม่ถูกต้อง" : "Emergency contact fields are invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = replaceEmergencySchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			slot1Name: toText(formData.get("slot1Name")),
			slot1Relationship: toText(formData.get("slot1Relationship")),
			slot1Phone: toText(formData.get("slot1Phone")),
			slot2Name: toText(formData.get("slot2Name")),
			slot2Relationship: toText(formData.get("slot2Relationship")),
			slot2Phone: toText(formData.get("slot2Phone")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });
		if (parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const { error: delErr } = await admin
			.from("employee_emergency_contacts")
			.delete()
			.eq("employee_id", parsed.data.employeeId);
		if (delErr) return fail(400, { message: delErr.message });

		const rows: {
			employee_id: string;
			slot: number;
			contact_name: string | null;
			relationship: string | null;
			phone: string | null;
		}[] = [];

		const pushSlot = (slot: number, name: string, rel: string, phone: string) => {
			const has = name.length > 0 || rel.length > 0 || phone.length > 0;
			if (has) {
				rows.push({
					employee_id: parsed.data.employeeId,
					slot,
					contact_name: name.length > 0 ? name : null,
					relationship: rel.length > 0 ? rel : null,
					phone: phone.length > 0 ? phone : null,
				});
			}
		};
		pushSlot(1, parsed.data.slot1Name ?? "", parsed.data.slot1Relationship ?? "", parsed.data.slot1Phone ?? "");
		pushSlot(2, parsed.data.slot2Name ?? "", parsed.data.slot2Relationship ?? "", parsed.data.slot2Phone ?? "");

		if (rows.length > 0) {
			const { error: insErr } = await admin.from("employee_emergency_contacts").insert(rows);
			if (insErr) return fail(400, { message: insErr.message });
		}
		return { success: true, action: "replaceEmergencyContacts" };
	},

	replaceDeductions: async ({ request, locals, params }) => {
		const invalidMsg =
			locals.locale === "th" ? "ข้อมูลการหักไม่ถูกต้อง" : "Deduction selection is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const ids = toTextList(formData, "deductionTypeIds");
		const parsed = replaceDeductionsSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			deductionTypeIds: ids,
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });
		if (parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const { error: delErr } = await admin.from("employee_deductions").delete().eq("employee_id", parsed.data.employeeId);
		if (delErr) return fail(400, { message: delErr.message });

		if (parsed.data.deductionTypeIds.length > 0) {
			const { error: insErr } = await admin.from("employee_deductions").insert(
				parsed.data.deductionTypeIds.map((deduction_type_id) => ({
					employee_id: parsed.data.employeeId,
					deduction_type_id,
				})),
			);
			if (insErr) return fail(400, { message: insErr.message });
		}
		return { success: true, action: "replaceDeductions" };
	},

	uploadEmployeePhoto: async ({ request, locals, params }) => {
		const invalidMsg = locals.locale === "th" ? "อัปโหลดรูปไม่สำเร็จ" : "Photo upload failed";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const employeeId = toText(formData.get("employeeId"));
		if (employeeId !== params.id || !z.string().uuid().safeParse(employeeId).success) {
			return fail(400, { message: invalidMsg });
		}
		const file = formData.get("photo");
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: invalidMsg });
		}
		if (file.size > MAX_PHOTO_BYTES) {
			return fail(400, { message: locals.locale === "th" ? "ไฟล์ใหญ่เกิน 5MB" : "File exceeds 5MB" });
		}
		if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
			return fail(400, { message: locals.locale === "th" ? "รองรับเฉพาะ JPEG, PNG, WebP" : "Only JPEG, PNG, or WebP" });
		}
		const ext =
			file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
		const objectPath = `${employeeId}/profile.${ext}`;

		const { error: upErr } = await admin.storage.from(PHOTO_BUCKET).upload(objectPath, file, {
			upsert: true,
			contentType: file.type,
		});
		if (upErr) return fail(400, { message: upErr.message });

		const { error: dbErr } = await admin.from("employees").update({ photo_object_key: objectPath }).eq("id", employeeId);
		if (dbErr) return fail(400, { message: dbErr.message });
		return { success: true, action: "uploadEmployeePhoto" };
	},

	clearEmployeePhoto: async ({ request, locals, params }) => {
		const invalidMsg = locals.locale === "th" ? "ลบรูปไม่สำเร็จ" : "Could not clear photo";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = clearPhotoSchema.safeParse({ employeeId: toText(formData.get("employeeId")) });
		if (!parsed.success || parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const { data: row } = await admin.from("employees").select("photo_object_key").eq("id", params.id).maybeSingle();
		const prevKey = row?.photo_object_key;
		if (prevKey) {
			await admin.storage.from(PHOTO_BUCKET).remove([prevKey]);
		}
		const { error: dbErr } = await admin.from("employees").update({ photo_object_key: null }).eq("id", params.id);
		if (dbErr) return fail(400, { message: dbErr.message });
		return { success: true, action: "clearEmployeePhoto" };
	},

	assignPrimary: async ({ request, locals, params }) => {
		const invalidMsg = locals.locale === "th" ? "ข้อมูลการมอบหมายไม่ถูกต้อง" : "Assignment data is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = assignmentSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			positionId: toText(formData.get("positionId")),
			orgUnitId: toText(formData.get("orgUnitId")),
			startsAt: toText(formData.get("startsAt")),
			isPrimary: toText(formData.get("isPrimary")) || "true",
		});
		if (!parsed.success || parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const result = await mutateAssignPrimary(admin, parsed.data);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true, action: "assignPrimary" };
	},

	setSupervisor: async ({ request, locals, params }) => {
		const invalidMsg = locals.locale === "th" ? "ข้อมูลหัวหน้างานไม่ถูกต้อง" : "Supervisor data is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = supervisorSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			supervisorEmployeeId: toText(formData.get("supervisorEmployeeId")),
			startsAt: toText(formData.get("startsAt")),
		});
		if (!parsed.success || parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const supResult = await mutateSetSupervisor(admin, parsed.data);
		if (!supResult.ok) return fail(400, { message: supResult.message });
		return { success: true, action: "setSupervisor" };
	},

	assignProgramChair: async ({ request, locals, params }) => {
		const invalidMsg =
			locals.locale === "th" ? "ข้อมูลการกำหนดหัวหน้าหลักสูตรไม่ถูกต้อง" : "Program chair data is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = programChairSchema.safeParse({
			programId: toText(formData.get("programId")),
			employeeId: toText(formData.get("employeeId")),
			startsAt: toText(formData.get("startsAt")),
		});
		if (!parsed.success || parsed.data.employeeId !== params.id) return fail(400, { message: invalidMsg });

		const chairResult = await mutateAssignProgramChair(admin, parsed.data);
		if (!chairResult.ok) return fail(400, { message: chairResult.message });
		return { success: true, action: "assignProgramChair" };
	},
};
