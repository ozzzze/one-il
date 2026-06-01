import type { AppSupabaseClient } from "$lib/server/supabase-admin.js";
import { sendMail } from "$lib/server/notifications/mailer.js";
import { getSmtpConfig, isSmtpConfigured } from "$lib/server/notifications/smtp-config.js";

const MAX_ATTEMPTS = 5;

type OutboxRow = {
	id: string;
	recipient: string;
	subject: string | null;
	body: string;
	attempts: number;
};

function nextAttemptAt(attempts: number): string {
	const minutes = Math.min(60, 2 ** Math.max(0, attempts));
	return new Date(Date.now() + minutes * 60_000).toISOString();
}

export type ProcessOutboxResult = {
	processed: number;
	sent: number;
	failed: number;
	skipped: boolean;
};

/**
 * Send pending outbox rows via configured SMTP. Safe to call after enqueue or from a cron script.
 */
export async function processPendingOutbox(
	admin: AppSupabaseClient,
	options?: { limit?: number },
): Promise<ProcessOutboxResult> {
	if (!isSmtpConfigured()) {
		return { processed: 0, sent: 0, failed: 0, skipped: true };
	}

	const smtp = getSmtpConfig();
	if (!smtp) {
		return { processed: 0, sent: 0, failed: 0, skipped: true };
	}

	const limit = options?.limit ?? 20;
	const { data: rows, error } = await admin
		.from("notifications_outbox")
		.select("id, recipient, subject, body, attempts")
		.eq("status", "pending")
		.lte("next_attempt_at", new Date().toISOString())
		.order("created_at", { ascending: true })
		.limit(limit);

	if (error) throw error;

	const pending = (rows ?? []) as OutboxRow[];
	let sent = 0;
	let failed = 0;

	for (const row of pending) {
		const claimAttempts = row.attempts + 1;

		const { data: claimed, error: claimError } = await admin
			.from("notifications_outbox")
			.update({
				status: "processing",
				attempts: claimAttempts,
			})
			.eq("id", row.id)
			.eq("status", "pending")
			.select("id")
			.maybeSingle<{ id: string }>();

		if (claimError) throw claimError;
		if (!claimed?.id) continue;

		try {
			await sendMail(smtp, {
				to: row.recipient,
				subject: row.subject ?? "ONE-IL notification",
				text: row.body,
			});

			const { error: sentError } = await admin
				.from("notifications_outbox")
				.update({
					status: "sent",
					processed_at: new Date().toISOString(),
					last_error: null,
				})
				.eq("id", row.id);

			if (sentError) throw sentError;
			sent += 1;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const isFinal = claimAttempts >= MAX_ATTEMPTS;

			const { error: failError } = await admin
				.from("notifications_outbox")
				.update({
					status: isFinal ? "failed" : "pending",
					last_error: message.slice(0, 2000),
					next_attempt_at: isFinal ? new Date().toISOString() : nextAttemptAt(claimAttempts),
					processed_at: isFinal ? new Date().toISOString() : null,
				})
				.eq("id", row.id);

			if (failError) throw failError;
			failed += 1;
		}
	}

	return {
		processed: pending.length,
		sent,
		failed,
		skipped: false,
	};
}
