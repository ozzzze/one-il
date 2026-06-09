/**
 * Pre-flight checks for room-booking email notifications (VPS + SMTP).
 * Usage: pnpm check:notifications
 */
import { createClient } from "@supabase/supabase-js";
import net from "node:net";

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function add(name: string, ok: boolean, detail: string) {
	checks.push({ name, ok, detail });
	const mark = ok ? "OK" : "FAIL";
	console.log(`[${mark}] ${name}: ${detail}`);
}

function maskSecret(value: string): string {
	return `(set, ${value.length} chars)`;
}

function supabaseHostFromUrl(url: string): string | null {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}

function probeTcp(host: string, port: number, timeoutMs = 6_000): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = net.createConnection({ host, port, timeout: timeoutMs }, () => {
			socket.end();
			resolve(true);
		});
		socket.on("error", () => resolve(false));
		socket.on("timeout", () => {
			socket.destroy();
			resolve(false);
		});
	});
}

async function main() {
	const url = process.env.PUBLIC_SUPABASE_URL?.trim();
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
	const smtpUser = process.env.SMTP_USER?.trim();
	const smtpPass = process.env.SMTP_PASS?.trim();
	const tenantId = process.env.POOLER_TENANT_ID?.trim() || "your-tenant-id";
	const poolerUser = `postgres.${tenantId}`;
	const rawDbUrl = process.env.SELF_HOSTED_DATABASE_URL?.trim();
	let dbUrl =
		rawDbUrl ||
		process.env.DATABASE_URL?.trim() ||
		(process.env.SELF_HOSTED_DB_PASSWORD?.trim() && url
			? `postgresql://${poolerUser}:${process.env.SELF_HOSTED_DB_PASSWORD.trim()}@${supabaseHostFromUrl(url)}:5432/postgres`
			: "");
	const selfHosted = url ? !url.includes("supabase.co") : false;
	if (selfHosted && rawDbUrl) {
		try {
			const parsed = new URL(rawDbUrl);
			if (parsed.username === "postgres") {
				add(
					"Pooler username in SELF_HOSTED_DATABASE_URL",
					false,
					`use postgres.${tenantId} not postgres (Supavisor on VPS)`
				);
			}
		} catch {
			/* ignore */
		}
	}

	add("PUBLIC_SUPABASE_URL", Boolean(url), url ?? "missing");
	add(
		"SUPABASE_SERVICE_ROLE_KEY",
		Boolean(serviceKey),
		serviceKey ? maskSecret(serviceKey) : "missing"
	);
	add(
		"SMTP_USER + SMTP_PASS",
		Boolean(smtpUser && smtpPass),
		smtpUser && smtpPass
			? `${smtpUser} / ${maskSecret(smtpPass)}`
			: "missing — add Gmail App Password (16 chars, no spaces)"
	);
	add(
		"DATABASE_URL or SELF_HOSTED_DB_PASSWORD",
		Boolean(dbUrl),
		dbUrl
			? `can run pnpm db:apply:outbox (${dbUrl.replace(/:[^:@/]+@/, ":***@")})`
			: "missing — Postgres password for migration only (app does not need it at runtime)"
	);

	const host = url ? supabaseHostFromUrl(url) : null;
	if (host) {
		const pgOpen = await probeTcp(host, 5432);
		add("Postgres port 5432 reachable", pgOpen, pgOpen ? host : `${host}:5432 not reachable`);
	}

	if (url && serviceKey) {
		const admin = createClient(url, serviceKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});
		const probe = await admin.from("notifications_outbox").select("id").limit(1);
		const tableOk = !probe.error;
		add(
			"notifications_outbox (PostgREST)",
			tableOk,
			tableOk
				? "table visible to API"
				: (probe.error?.message ?? "unknown error — run pnpm db:apply:outbox")
		);
	}

	const allOk = checks.every((c) => c.ok);
	console.log("\n--- Next steps ---");
	if (!checks.find((c) => c.name.startsWith("SMTP"))?.ok) {
		console.log(
			"1) Google Account → Security → 2-Step Verification → App passwords → create for Mail."
		);
		console.log("   Add SMTP_* to .env (see .env.example), then: pnpm test:email");
	}
	if (!checks.find((c) => c.name.startsWith("notifications_outbox"))?.ok) {
		console.log(
			"2) Add SELF_HOSTED_DB_PASSWORD (or SELF_HOSTED_DATABASE_URL) to .env, then: pnpm db:apply:outbox"
		);
		console.log("   Or SSH to VPS, run migration SQL + NOTIFY pgrst, 'reload schema';");
	}
	if (allOk) {
		console.log("All checks passed. Run: pnpm test:email");
	}

	process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
