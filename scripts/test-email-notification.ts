/**
 * Smoke test: outbox table, SMTP verify, send test mail to SMTP_USER.
 * Usage: node --env-file=.env ./node_modules/tsx/dist/cli.mjs scripts/test-email-notification.ts
 */
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

function requireEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} is missing`);
	return value;
}

function getSmtpConfig() {
	const user = process.env.SMTP_USER?.trim();
	const pass = process.env.SMTP_PASS?.trim();
	if (!user || !pass) return null;
	const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
	const port = Number(process.env.SMTP_PORT ?? "587");
	const secure = process.env.SMTP_SECURE === "true" || port === 465;
	const from = process.env.SMTP_FROM?.trim() || `ONE-IL <${user}>`;
	return { host, port: Number.isFinite(port) ? port : 587, secure, user, pass, from };
}

const url = requireEnv("PUBLIC_SUPABASE_URL");
const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(url, serviceKey, {
	auth: { autoRefreshToken: false, persistSession: false },
});

const report: Record<string, unknown> = { ok: true, steps: [] as string[] };

function step(message: string) {
	(report.steps as string[]).push(message);
	console.log(message);
}

async function main() {
	const smtp = getSmtpConfig();
	step("1) SMTP configured: " + (smtp ? "yes" : "no"));
	if (!smtp) {
		report.ok = false;
		console.log(JSON.stringify(report, null, 2));
		process.exit(1);
	}

	step("2) Verify SMTP connection (Gmail)...");
	const transport = nodemailer.createTransport({
		host: smtp.host,
		port: smtp.port,
		secure: smtp.secure,
		auth: { user: smtp.user, pass: smtp.pass },
	});
	await transport.verify();
	step("   SMTP verify OK");

	step("3) Check notifications_outbox table...");
	const probe = await admin.from("notifications_outbox").select("id").limit(1);
	if (probe.error) {
		report.ok = false;
		step(`   FAIL: ${probe.error.message}`);
		step("   Apply migration: supabase/migrations/20260518140000_notifications_outbox.sql");
		console.log(JSON.stringify(report, null, 2));
		process.exit(1);
	}
	step("   Table exists");

	const testId = crypto.randomUUID();
	step("4) Enqueue + send smoke test to SMTP_USER...");
	const { error: insertError } = await admin.from("notifications_outbox").insert({
		channel: "email",
		recipient: smtp.user,
		subject: "[ONE-IL] SMTP smoke test",
		body: `Smoke test at ${new Date().toISOString()}\nIf you received this, Gmail SMTP works.`,
		domain: "room_booking_test",
		correlation_id: testId,
	});
	if (insertError) {
		report.ok = false;
		step(`   Enqueue FAIL: ${insertError.message}`);
		console.log(JSON.stringify(report, null, 2));
		process.exit(1);
	}

	const { data: pending } = await admin
		.from("notifications_outbox")
		.select("id, recipient, subject, body")
		.eq("status", "pending")
		.eq("domain", "room_booking_test")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!pending) {
		step("   No pending row to send");
	} else {
		try {
			await transport.sendMail({
				from: smtp.from,
				to: pending.recipient,
				subject: pending.subject ?? "[ONE-IL]",
				text: pending.body,
			});
			await admin
				.from("notifications_outbox")
				.update({ status: "sent", processed_at: new Date().toISOString(), last_error: null })
				.eq("id", pending.id);
			step("   Sent OK — check inbox for " + smtp.user);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			await admin
				.from("notifications_outbox")
				.update({ status: "failed", last_error: message, processed_at: new Date().toISOString() })
				.eq("id", pending.id);
			report.ok = false;
			step(`   Send FAIL: ${message}`);
		}
	}

	step("5) Recent room_booking outbox rows...");
	const { data: recent } = await admin
		.from("notifications_outbox")
		.select("id, status, domain, recipient, subject, last_error, created_at")
		.in("domain", ["room_booking", "room_booking_test"])
		.order("created_at", { ascending: false })
		.limit(5);
	report.recentOutbox = recent;

	console.log("\n" + JSON.stringify(report, null, 2));
	process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
