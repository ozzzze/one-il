import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { hasPermission } from "$lib/auth/roles.js";
import { institutionalHolidayFormSchema } from "$lib/leave/holiday-schema.js";
import { localizedDualField } from "$lib/i18n/display.js";
import { assertPermission } from "$lib/server/guards.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import type { Actions, PageServerLoad } from "./$types.js";

type HolidayRow = {
	id: string;
	holiday_date: string;
	name_th: string;
	name_en: string | null;
	notes: string | null;
};

function toText(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value : "";
}

function holidayCopy(locale: "en" | "th") {
	return locale === "th"
		? {
				invalid: "ข้อมูลวันหยุดไม่ถูกต้อง",
				saveFailed: "บันทึกวันหยุดไม่สำเร็จ",
				deleteFailed: "ลบวันหยุดไม่สำเร็จ",
				dateTaken: "มีวันหยุดในวันนี้แล้ว",
			}
		: {
				invalid: "Holiday data is invalid",
				saveFailed: "Could not save the holiday",
				deleteFailed: "Could not delete the holiday",
				dateTaken: "A holiday already exists on this date",
			};
}

const deleteSchema = z.object({
	id: z.string().uuid(),
});

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	depends("leave:holidays");
	assertPermission(locals.user, "leave:view");
	const admin = getServiceRoleClient();
	const locale = locals.locale;

	const yearParam = url.searchParams.get("year");
	const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : new Date().getFullYear();
	const from = `${year}-01-01`;
	const to = `${year}-12-31`;

	const { data, error } = await admin
		.from("institutional_holidays")
		.select("id,holiday_date,name_th,name_en,notes")
		.gte("holiday_date", from)
		.lte("holiday_date", to)
		.order("holiday_date", { ascending: true });

	if (error) throw error;

	const holidays = (data ?? []).map((row: HolidayRow) => ({
		id: row.id,
		holidayDate: row.holiday_date,
		name: localizedDualField(locale, row.name_th, row.name_en),
		nameTh: row.name_th,
		nameEn: row.name_en ?? "",
		notes: row.notes ?? "",
	}));

	return {
		locale,
		year,
		holidays,
		canManage: hasPermission(locals.user!.role, "leave:manage"),
	};
};

export const actions: Actions = {
	saveHoliday: async ({ request, locals }) => {
		assertPermission(locals.user, "leave:manage");
		const copy = holidayCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();

		const parsed = institutionalHolidayFormSchema.safeParse({
			id: toText(formData.get("id")) || undefined,
			holidayDate: toText(formData.get("holidayDate")),
			nameTh: toText(formData.get("nameTh")),
			nameEn: toText(formData.get("nameEn")),
			notes: toText(formData.get("notes")),
		});

		if (!parsed.success) {
			return fail(400, { action: "saveHoliday", message: copy.invalid });
		}

		const { data: creatorRow } = await admin
			.from("users")
			.select("id")
			.eq("id", locals.user!.id)
			.maybeSingle();

		const payload = {
			holiday_date: parsed.data.holidayDate,
			name_th: parsed.data.nameTh,
			name_en: parsed.data.nameEn?.trim() ? parsed.data.nameEn.trim() : null,
			notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
			created_by_user_id: creatorRow?.id ?? null,
		};

		if (parsed.data.id) {
			const { error } = await admin
				.from("institutional_holidays")
				.update({
					holiday_date: payload.holiday_date,
					name_th: payload.name_th,
					name_en: payload.name_en,
					notes: payload.notes,
				})
				.eq("id", parsed.data.id);

			if (error) {
				if (error.code === "23505") return fail(400, { action: "saveHoliday", message: copy.dateTaken });
				return fail(400, { action: "saveHoliday", message: copy.saveFailed });
			}
		} else {
			const { error } = await admin.from("institutional_holidays").insert(payload);
			if (error) {
				if (error.code === "23505") return fail(400, { action: "saveHoliday", message: copy.dateTaken });
				return fail(400, { action: "saveHoliday", message: copy.saveFailed });
			}
		}

		return { success: true, action: "saveHoliday" };
	},

	deleteHoliday: async ({ request, locals }) => {
		assertPermission(locals.user, "leave:manage");
		const copy = holidayCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = deleteSchema.safeParse({ id: toText(formData.get("id")) });

		if (!parsed.success) {
			return fail(400, { action: "deleteHoliday", message: copy.invalid });
		}

		const { error } = await admin.from("institutional_holidays").delete().eq("id", parsed.data.id);
		if (error) {
			return fail(400, { action: "deleteHoliday", message: copy.deleteFailed });
		}

		return { success: true, action: "deleteHoliday" };
	},
};
