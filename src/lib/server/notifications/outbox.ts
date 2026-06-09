import type { AppSupabaseClient } from "$lib/server/supabase-admin.js";

export type NotificationChannel = "email" | "line" | "internal";

export interface EnqueueNotificationInput {
	channel?: NotificationChannel;
	recipient: string;
	subject?: string;
	body: string;
	payload?: Record<string, unknown>;
	domain: string;
	correlationId?: string;
}

type OutboxRow = {
	id: string;
};

/**
 * Insert a notification row. Call only from server code with service-role client.
 */
export async function enqueueNotification(
	admin: AppSupabaseClient,
	input: EnqueueNotificationInput
): Promise<{ id: string; skipped: boolean }> {
	if (input.correlationId) {
		const { data: existing } = await admin
			.from("notifications_outbox")
			.select("id")
			.eq("domain", input.domain)
			.eq("correlation_id", input.correlationId)
			.maybeSingle<OutboxRow>();

		if (existing?.id) {
			return { id: existing.id, skipped: true };
		}
	}

	const row = {
		channel: input.channel ?? "email",
		recipient: input.recipient,
		subject: input.subject ?? null,
		body: input.body,
		payload: input.payload ?? null,
		domain: input.domain,
		correlation_id: input.correlationId ?? null,
	};

	const { data, error } = await admin
		.from("notifications_outbox")
		.insert(row)
		.select("id")
		.single<OutboxRow>();

	if (error) throw error;
	if (!data?.id) throw new Error("enqueueNotification: missing id");

	return { id: data.id, skipped: false };
}
