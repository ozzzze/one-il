import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "$lib/database.types.js";
import type { SessionUser } from "$lib/server/auth.js";

export type AppSupabaseClient = SupabaseClient<Database>;

export function toText(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value.trim() : "";
}

export function optionalText(value: FormDataEntryValue | null): string | null {
	const text = toText(value);
	return text.length > 0 ? text : null;
}

export function documentNo(prefix: string): string {
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	const token = crypto.randomUUID().slice(0, 8).toUpperCase();
	return `${prefix}-${yyyy}${mm}${dd}-${token}`;
}

export async function currentEmployeeId(admin: AppSupabaseClient, user: SessionUser | null): Promise<string | null> {
	if (!user) return null;
	const { data } = await admin.from("employees").select("id").eq("user_id", user.id).maybeSingle();
	const row = data as { id?: string } | null;
	return row?.id ?? null;
}

type AuditEventInput = {
	entityType: string;
	entityId: string;
	eventType: string;
	actorUserId: string | null;
	actorEmployeeId: string | null;
	summary: string;
	metadata?: Json;
};

export async function writeSupplyAudit(admin: AppSupabaseClient, input: AuditEventInput): Promise<void> {
	await admin.from("supply_audit_events").insert({
		entity_type: input.entityType,
		entity_id: input.entityId,
		event_type: input.eventType,
		actor_user_id: input.actorUserId,
		actor_employee_id: input.actorEmployeeId,
		summary: input.summary,
		metadata: input.metadata ?? {},
	});
}

export function localizedActionMessage(locale: "en" | "th", en: string, th: string): string {
	return locale === "th" ? th : en;
}
