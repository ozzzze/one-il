/**
 * Apply notifications_outbox migration via direct Postgres (self-hosted Supavisor or cloud).
 *
 * Env:
 *   SELF_HOSTED_DATABASE_URL — use postgres.your-tenant-id (not plain postgres) on VPS
 *   POOLER_TENANT_ID — default your-tenant-id (see VPS supabase/docker .env)
 *   SELF_HOSTED_DB_PASSWORD + PUBLIC_SUPABASE_URL
 *   DATABASE_URL — Supabase Cloud only (uncommented)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import {
	isSelfHostedSupabaseUrl,
	pgClientConfigFromEnv,
	poolerUsername,
	redactPgConfig,
} from "./lib/self-hosted-pg.mjs";

function loadEnvFile(path) {
	const env = {};
	for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
	}
	return env;
}

function supabaseHostFromUrl(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return url?.replace(/^https?:\/\//, "").split(":")[0] ?? null;
	}
}

const root = resolve(import.meta.dirname, "..");
const env = loadEnvFile(resolve(root, ".env"));
const tenantId = env.POOLER_TENANT_ID;
const selfHosted = isSelfHostedSupabaseUrl(env.PUBLIC_SUPABASE_URL);
const supabaseHost = env.PUBLIC_SUPABASE_URL
	? supabaseHostFromUrl(env.PUBLIC_SUPABASE_URL)
	: null;

/** @type {import('pg').ClientConfig[]} */
const configs = [];

if (env.SELF_HOSTED_DATABASE_URL) {
	configs.push(
		pgClientConfigFromEnv(env.SELF_HOSTED_DATABASE_URL, { tenantId }),
	);
}

if (env.SELF_HOSTED_DB_PASSWORD && supabaseHost) {
	const pass = env.SELF_HOSTED_DB_PASSWORD;
	const user = poolerUsername(tenantId);
	configs.push({
		host: supabaseHost,
		port: 5432,
		database: "postgres",
		user,
		password: pass,
		ssl: false,
		connectionTimeoutMillis: 12_000,
	});
}

if (env.DATABASE_URL && !selfHosted) {
	configs.push(pgClientConfigFromEnv(env.DATABASE_URL, { tenantId }));
}

function readMigrationSql(filePath) {
	const buf = readFileSync(filePath);
	// Guard UTF-16 LE exports (Postgres returns "invalid message format" otherwise).
	if (buf.length >= 2 && buf[0] === 0x2d && buf[1] === 0x00) {
		return buf.toString("utf16le");
	}
	return buf.toString("utf8");
}

const sql = readMigrationSql(
	resolve(root, "supabase/migrations/20260518140000_notifications_outbox.sql"),
);

const seen = new Set();
const failures = [];

for (const config of configs) {
	const key = JSON.stringify({
		host: config.host,
		port: config.port,
		user: config.user,
		database: config.database,
	});
	if (seen.has(key)) continue;
	seen.add(key);

	const client = new pg.Client(config);
	try {
		await client.connect();
		await client.query(sql);
		await client.query("notify pgrst, 'reload schema';");
		const check = await client.query(
			"select to_regclass('public.notifications_outbox') as outbox_table",
		);
		await client.end();
		console.log(
			JSON.stringify(
				{
					ok: true,
					outbox_table: check.rows[0]?.outbox_table,
					used: redactPgConfig(config),
				},
				null,
				2,
			),
		);
		process.exit(0);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		failures.push({ used: redactPgConfig(config), error: message });
		await client.end().catch(() => {});
	}
}

if (configs.length === 0) {
	console.error(
		"No database config. Set SELF_HOSTED_DATABASE_URL (postgres.your-tenant-id:PASSWORD@host:5432/postgres) or SELF_HOSTED_DB_PASSWORD.",
	);
	process.exit(1);
}

console.error(
	JSON.stringify(
		{
			ok: false,
			message: "Could not apply migration",
			hints: selfHosted
				? [
						"Username must be postgres.your-tenant-id (POOLER_TENANT_ID on VPS docker .env).",
						"Password must be POSTGRES_PASSWORD from VPS — not Supabase Cloud pooler password.",
						"If password contains * @ # etc., URL-encode it in SELF_HOSTED_DATABASE_URL (* → %2A).",
						"Or SSH to VPS: bash scripts/vps-apply-outbox-on-server.sh",
					]
				: ["Check DATABASE_URL and network."],
			attempts: failures,
		},
		null,
		2,
	),
);
process.exit(1);
