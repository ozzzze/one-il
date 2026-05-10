import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "$lib/database.types.js";

type AdminClient = SupabaseClient<Database>;

export const assignmentSchema = z.object({
	employeeId: z.string().uuid(),
	positionId: z.string().uuid(),
	orgUnitId: z.string().uuid(),
	startsAt: z.string().date(),
	isPrimary: z.enum(["true", "false"]).default("true"),
});

export const supervisorSchema = z.object({
	employeeId: z.string().uuid(),
	supervisorEmployeeId: z.string().uuid(),
	startsAt: z.string().date(),
});

export const programChairSchema = z.object({
	programId: z.string().uuid(),
	employeeId: z.string().uuid(),
	startsAt: z.string().date(),
});

export async function mutateAssignPrimary(
	admin: AdminClient,
	parsed: z.infer<typeof assignmentSchema>,
): Promise<{ ok: true } | { ok: false; message: string }> {
	const isPrimary = parsed.isPrimary === "true";

	const { data: existing, error: selErr } = await admin
		.from("employee_assignments")
		.select("id")
		.eq("employee_id", parsed.employeeId)
		.eq("is_primary", isPrimary)
		.is("ends_at", null)
		.maybeSingle();

	if (selErr) return { ok: false, message: selErr.message };

	if (existing?.id) {
		const { error } = await admin
			.from("employee_assignments")
			.update({
				position_id: parsed.positionId,
				org_unit_id: parsed.orgUnitId,
				starts_at: parsed.startsAt,
			})
			.eq("id", existing.id);
		if (error) return { ok: false, message: error.message };
	} else {
		const { error } = await admin.from("employee_assignments").insert({
			employee_id: parsed.employeeId,
			position_id: parsed.positionId,
			org_unit_id: parsed.orgUnitId,
			starts_at: parsed.startsAt,
			is_primary: isPrimary,
		});
		if (error) return { ok: false, message: error.message };
	}
	return { ok: true };
}

export async function mutateSetSupervisor(
	admin: AdminClient,
	parsed: z.infer<typeof supervisorSchema>,
): Promise<{ ok: true } | { ok: false; message: string }> {
	const { error } = await admin.from("employee_supervisors").insert({
		employee_id: parsed.employeeId,
		supervisor_employee_id: parsed.supervisorEmployeeId,
		starts_at: parsed.startsAt,
		relation_type: "LINE",
	});
	if (error) return { ok: false, message: error.message };
	return { ok: true };
}

export async function mutateAssignProgramChair(
	admin: AdminClient,
	parsed: z.infer<typeof programChairSchema>,
): Promise<{ ok: true } | { ok: false; message: string }> {
	const { error } = await admin.from("program_chairs").insert({
		program_id: parsed.programId,
		employee_id: parsed.employeeId,
		starts_at: parsed.startsAt,
	});
	if (error) return { ok: false, message: error.message };
	return { ok: true };
}
