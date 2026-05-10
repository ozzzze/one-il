/** Shared PostgREST select + mapping for employee directory/detail pages */

export const employeeEmbeddedSelect = `
	id, employee_no, first_name, last_name, email, user_id, app_role, status, created_at, updated_at,
	person_title_th, academic_title_th, person_title_en, academic_title_en,
	first_name_en, last_name_en, nickname, address, gender, duty_kind,
	professional_teacher_license, professional_recognition_status, birth_date,
	employment_started_at, employment_ended_at, photo_object_key,
	employment_contract_type_id, personnel_category_id, hr_employment_status_id,
	employment_contract_types(id, code, label_th),
	personnel_categories(id, code, label_th),
	hr_employment_statuses(id, code, label_th),
	employee_emergency_contacts(slot, contact_name, relationship, phone),
	employee_deductions(
		deduction_type_id,
		deduction_types(id, code, label_th)
	),
	users:user_id ( id, email, name ),
	employee_assignments(
		id, starts_at, ends_at, is_primary,
		positions(id, name, name_en, code),
		org_units(id, name, name_en, code)
	),
	employee_supervisors!employee_supervisors_employee_id_fkey(
		id, starts_at, ends_at,
		supervisor:employees!employee_supervisors_supervisor_employee_id_fkey(id, first_name, last_name)
	)
`;

export type LinkedUserRow = { id: string; email: string; name: string };

export type HrLookupEmbed = { id: string; code: string; label_th: string };

export type EmployeeRow = {
	id: string;
	employee_no: string | null;
	first_name: string;
	last_name: string;
	email: string | null;
	user_id: string | null;
	app_role: string | null;
	status: string;
	created_at: string | null;
	updated_at: string | null;
	person_title_th: string | null;
	academic_title_th: string | null;
	person_title_en: string | null;
	academic_title_en: string | null;
	first_name_en: string | null;
	last_name_en: string | null;
	nickname: string | null;
	address: string | null;
	gender: string | null;
	duty_kind: string | null;
	professional_teacher_license: boolean;
	professional_recognition_status: string | null;
	birth_date: string | null;
	employment_started_at: string | null;
	employment_ended_at: string | null;
	photo_object_key: string | null;
	employment_contract_type_id: string | null;
	personnel_category_id: string | null;
	hr_employment_status_id: string | null;
	employment_contract_types: HrLookupEmbed | HrLookupEmbed[] | null;
	personnel_categories: HrLookupEmbed | HrLookupEmbed[] | null;
	hr_employment_statuses: HrLookupEmbed | HrLookupEmbed[] | null;
	employee_emergency_contacts:
		| {
				slot: number;
				contact_name: string | null;
				relationship: string | null;
				phone: string | null;
		  }[]
		| null;
	employee_deductions:
		| {
				deduction_type_id: string;
				deduction_types: HrLookupEmbed | HrLookupEmbed[] | null;
		  }[]
		| null;
	users: LinkedUserRow | LinkedUserRow[] | null;
	employee_assignments:
		| {
				id: string;
				starts_at: string;
				ends_at: string | null;
				is_primary: boolean;
				positions:
					| { id: string; name: string; name_en: string | null; code: string }[]
					| { id: string; name: string; name_en: string | null; code: string }
					| null;
				org_units:
					| { id: string; name: string; name_en: string | null; code: string }[]
					| { id: string; name: string; name_en: string | null; code: string }
					| null;
		  }[]
		| null;
	employee_supervisors:
		| {
				id: string;
				starts_at: string;
				ends_at: string | null;
				supervisor: { id: string; first_name: string; last_name: string } | null;
		  }[]
		| null;
};

export type EmployeeView = {
	id: string;
	employeeNo: string | null;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string | null;
	userId: string | null;
	appRole: string | null;
	linkedAccountEmail: string | null;
	linkedAccountName: string | null;
	status: string;
	createdAt: string | null;
	updatedAt: string | null;
	hrProfile: {
		personTitleTh: string | null;
		academicTitleTh: string | null;
		personTitleEn: string | null;
		academicTitleEn: string | null;
		firstNameEn: string | null;
		lastNameEn: string | null;
		nickname: string | null;
		address: string | null;
		gender: string | null;
		dutyKind: string | null;
		professionalTeacherLicense: boolean;
		professionalRecognitionStatus: string | null;
		birthDate: string | null;
		employmentStartedAt: string | null;
		employmentEndedAt: string | null;
		photoObjectKey: string | null;
		employmentContractTypeId: string | null;
		personnelCategoryId: string | null;
		hrEmploymentStatusId: string | null;
		employmentContractType: { id: string; code: string; labelTh: string } | null;
		personnelCategory: { id: string; code: string; labelTh: string } | null;
		hrEmploymentStatus: { id: string; code: string; labelTh: string } | null;
		emergencyContacts: {
			slot: number;
			contactName: string | null;
			relationship: string | null;
			phone: string | null;
		}[];
		deductions: { deductionTypeId: string; code: string; labelTh: string }[];
	};
	primaryAssignment: {
		id: string;
		starts_at: string;
		ends_at: string | null;
		is_primary: boolean;
		positions: { id: string; name: string; name_en: string | null; code: string } | null;
		org_units: { id: string; name: string; name_en: string | null; code: string } | null;
	} | null;
	activeSupervisor: {
		id: string;
		starts_at: string;
		ends_at: string | null;
		supervisor: { id: string; first_name: string; last_name: string } | null;
	} | null;
};

function firstRelation<T>(value: T[] | T | null | undefined): T | null {
	if (Array.isArray(value)) return value[0] ?? null;
	return value ?? null;
}

export function embedOne<T>(value: T | T[] | null | undefined): T | null {
	if (value == null) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

function firstLinkedUser(users: LinkedUserRow | LinkedUserRow[] | null): LinkedUserRow | null {
	if (users == null) return null;
	return Array.isArray(users) ? users[0] ?? null : users;
}

export function mapLookupEmbed(value: HrLookupEmbed | HrLookupEmbed[] | null): {
	id: string;
	code: string;
	labelTh: string;
} | null {
	const row = embedOne(value);
	if (!row) return null;
	return { id: row.id, code: row.code, labelTh: row.label_th };
}

export function mapEmployeeRowToView(row: EmployeeRow): EmployeeView {
	const activeAssignment =
		row.employee_assignments?.find((assignment) => assignment.is_primary && assignment.ends_at === null) ?? null;
	const linkedUser = firstLinkedUser(row.users);
	return {
		id: row.id,
		employeeNo: row.employee_no,
		firstName: row.first_name,
		lastName: row.last_name,
		fullName: `${row.first_name} ${row.last_name}`,
		email: row.email,
		userId: row.user_id,
		appRole: row.app_role,
		linkedAccountEmail: linkedUser?.email ?? null,
		linkedAccountName: linkedUser?.name ?? null,
		status: row.status,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		hrProfile: {
			personTitleTh: row.person_title_th,
			academicTitleTh: row.academic_title_th,
			personTitleEn: row.person_title_en,
			academicTitleEn: row.academic_title_en,
			firstNameEn: row.first_name_en,
			lastNameEn: row.last_name_en,
			nickname: row.nickname,
			address: row.address,
			gender: row.gender,
			dutyKind: row.duty_kind,
			professionalTeacherLicense: row.professional_teacher_license,
			professionalRecognitionStatus: row.professional_recognition_status,
			birthDate: row.birth_date,
			employmentStartedAt: row.employment_started_at,
			employmentEndedAt: row.employment_ended_at,
			photoObjectKey: row.photo_object_key,
			employmentContractTypeId: row.employment_contract_type_id,
			personnelCategoryId: row.personnel_category_id,
			hrEmploymentStatusId: row.hr_employment_status_id,
			employmentContractType: mapLookupEmbed(row.employment_contract_types),
			personnelCategory: mapLookupEmbed(row.personnel_categories),
			hrEmploymentStatus: mapLookupEmbed(row.hr_employment_statuses),
			emergencyContacts: [...(row.employee_emergency_contacts ?? [])]
				.sort((a, b) => a.slot - b.slot)
				.map((c) => ({
					slot: c.slot,
					contactName: c.contact_name,
					relationship: c.relationship,
					phone: c.phone,
				})),
			deductions: (row.employee_deductions ?? [])
				.map((d) => {
					const dt = embedOne(d.deduction_types);
					return {
						deductionTypeId: d.deduction_type_id,
						code: dt?.code ?? "",
						labelTh: dt?.label_th ?? "",
					};
				})
				.sort((a, b) => a.code.localeCompare(b.code)),
		},
		primaryAssignment: activeAssignment
			? {
					id: activeAssignment.id,
					starts_at: activeAssignment.starts_at,
					ends_at: activeAssignment.ends_at,
					is_primary: activeAssignment.is_primary,
					positions: firstRelation(activeAssignment.positions),
					org_units: firstRelation(activeAssignment.org_units),
				}
			: null,
		activeSupervisor:
			row.employee_supervisors?.find((supervisor) => supervisor.ends_at === null && supervisor.supervisor) ?? null,
	};
}
