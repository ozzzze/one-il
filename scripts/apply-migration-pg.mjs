/**
 * Apply a SQL migration file via direct Postgres (self-hosted VPS or Supabase Cloud).
 *
 * Usage:
 *   node --env-file=.env scripts/apply-migration-pg.mjs supabase/migrations/20260601120000_user_change_requests.sql
 *
 * Env (same as apply-outbox-migration-pg.mjs):
 *   SELF_HOSTED_DATABASE_URL
 *   SELF_HOSTED_DB_PASSWORD + PUBLIC_SUPABASE_URL (+ POOLER_TENANT_ID)
 *   DATABASE_URL (Supabase Cloud)
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
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		env[trimmed.slice(0, eq).trim()] = value;
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

function readMigrationSql(filePath) {
	const buf = readFileSync(filePath);
	if (buf.length >= 2 && buf[0] === 0x2d && buf[1] === 0x00) {
		return buf.toString("utf16le");
	}
	return buf.toString("utf8");
}

const migrationArg = process.argv[2];
if (!migrationArg) {
	console.error("Usage: node scripts/apply-migration-pg.mjs <path-to-migration.sql>");
	process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const migrationPath = resolve(root, migrationArg);
const env = loadEnvFile(resolve(root, ".env"));
const tenantId = env.POOLER_TENANT_ID;
const selfHosted = isSelfHostedSupabaseUrl(env.PUBLIC_SUPABASE_URL);
const supabaseHost = env.PUBLIC_SUPABASE_URL ? supabaseHostFromUrl(env.PUBLIC_SUPABASE_URL) : null;

/** @type {import('pg').ClientConfig[]} */
const configs = [];

if (env.SELF_HOSTED_DATABASE_URL) {
	configs.push(pgClientConfigFromEnv(env.SELF_HOSTED_DATABASE_URL, { tenantId }));
}

if (env.DATABASE_URL) {
	configs.push(pgClientConfigFromEnv(env.DATABASE_URL, { tenantId }));
}

if (env.SELF_HOSTED_DB_PASSWORD && supabaseHost && !env.DATABASE_URL && !env.SELF_HOSTED_DATABASE_URL) {
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

const sql = readMigrationSql(migrationPath);
const tableCheck = "select to_regclass('public.user_change_requests') as tbl";

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
		const check = await client.query(tableCheck).catch(() => ({ rows: [{ tbl: null }] }));
		await client.end();
		console.log(
			JSON.stringify(
				{
					ok: true,
					migration: migrationArg,
					user_change_requests: check.rows[0]?.tbl ?? "(check skipped)",
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
		"No database config. Set SELF_HOSTED_DATABASE_URL or SELF_HOSTED_DB_PASSWORD (+ PUBLIC_SUPABASE_URL) in .env",
	);
	process.exit(1);
}

console.error(
	JSON.stringify(
		{
			ok: false,
			message: "Could not apply migration",
			migration: migrationArg,
			attempts: failures,
		},
		null,
		2,
	),
);
process.exit(1);
