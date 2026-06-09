/**
 * Verify gateway Postgres (Supavisor) from .env — run: node scripts/verify-vps-pg.mjs
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { buildLeavePgPoolConfig } from "../src/lib/server/one-leave/pg-config.ts";

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

const env = loadEnvFile(new URL("../.env", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const url = env.DATABASE_URL?.trim();

console.log("=== one-il VPS Postgres check ===\n");
console.log("POOLER_TENANT_ID:", env.POOLER_TENANT_ID || "(missing)");
console.log("PG_HOST:", env.PG_HOST || "(missing)");
console.log("PG_PORT:", env.PG_PORT || "(missing)");
console.log("SELF_HOSTED_DB_PASSWORD:", env.SELF_HOSTED_DB_PASSWORD ? "set" : "MISSING");
console.log("AUTH_MOCK:", env.AUTH_MOCK ?? "(not set)");

if (!url || !env.POOLER_TENANT_ID || !env.SELF_HOSTED_DB_PASSWORD) {
	console.error("\nMissing DATABASE_URL, POOLER_TENANT_ID, or SELF_HOSTED_DB_PASSWORD");
	process.exit(1);
}

if (url.includes("your-tenant-id") || env.POOLER_TENANT_ID.includes("your-tenant-id")) {
	console.error("\nPOOLER_TENANT_ID still looks like a placeholder.");
	process.exit(1);
}

const cfg = buildLeavePgPoolConfig(url, {
	tenantId: env.POOLER_TENANT_ID,
	host: env.PG_HOST,
	port: env.PG_PORT,
	password: env.SELF_HOSTED_DB_PASSWORD,
});

console.log("\nConnecting as:", `${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);

const pool = new pg.Pool(cfg);
try {
	await pool.query("SELECT 1 AS ok");
	const users = await pool.query(
		`SELECT id, username, is_active FROM one_leave.users
		 WHERE lower(username) = ANY($1::text[])`,
		[["nopparat.jap@mahidol.ac.th", "nopparat.jap@mahidol.edu"]]
	);
	console.log("\n✓ Connected");
	console.log("nopparat rows:", users.rows);
	if (users.rows.length === 0) {
		console.warn("User nopparat.jap@mahidol.ac.th not found in one_leave.users");
	}
	const roles = users.rows[0]
		? await pool.query(`SELECT role_code FROM one_leave.user_roles WHERE user_id = $1`, [
				users.rows[0].id,
			])
		: { rows: [] };
	if (roles.rows.length) console.log("roles:", roles.rows.map((r) => r.role_code).join(", "));
	console.log(
		"\nNext: set AUTH_MOCK=false in .env, restart pnpm dev, login with your real password."
	);
	process.exitCode = users.rows.length ? 0 : 2;
} catch (err) {
	const msg = err instanceof Error ? err.message : String(err);
	console.error("\n✗ Connection failed:", msg);
	if (msg.includes("Tenant or user not found")) {
		console.error(`
Likely fix on VPS (SSH):
  grep '^POOLER_TENANT_ID=' supabase/docker/.env
  grep '^POSTGRES_PASSWORD=' supabase/docker/.env

Copy EXACT values into .env:
  POOLER_TENANT_ID=<same string>
  SELF_HOSTED_DB_PASSWORD=<POSTGRES_PASSWORD>  (not JWT_SECRET / not service_role key)

Test ON the VPS:
  psql "postgresql://postgres.<POOLER_TENANT_ID>:<POSTGRES_PASSWORD>@127.0.0.1:6543/postgres" -c "select 1"

From dev PC use PG_PORT=6543 and PG_HOST=187.77.137.14 (or your VPS IP).
`);
	}
	process.exitCode = 1;
} finally {
	await pool.end();
}
