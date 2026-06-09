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
const url = env.DATABASE_URL;
const secret = env.SESSION_SECRET?.trim();

console.log("DATABASE_URL:", url ? "set" : "MISSING");
console.log("SESSION_SECRET:", secret ? `set (${secret.length} chars)` : "MISSING");
console.log("POOLER_TENANT_ID:", env.POOLER_TENANT_ID?.trim() || "(not set)");

if (!url) process.exit(1);

try {
	const u = new URL(url);
	console.log("DATABASE_URL user:", decodeURIComponent(u.username));
} catch {
	console.error("DATABASE_URL is not a valid URL");
	process.exit(1);
}

if (url.includes("your-tenant-id")) {
	console.error(
		"\nFix .env: replace your-tenant-id with POOLER_TENANT_ID from VPS supabase/docker/.env"
	);
	process.exit(1);
}

const poolConfig = buildLeavePgPoolConfig(url, {
	tenantId: env.POOLER_TENANT_ID,
	host: env.PG_HOST,
	port: env.PG_PORT,
	user: env.PG_USER,
	password: env.SELF_HOSTED_DB_PASSWORD,
});
console.log("AUTH_MOCK:", env.AUTH_MOCK ?? "(not set)");
console.log("pool user:", poolConfig.user, `@`, poolConfig.host + ":" + poolConfig.port);
console.log("pool password:", poolConfig.password ? "set" : "MISSING");

const pool = new pg.Pool(poolConfig);
try {
	const cols = await pool.query(`
		select column_name, data_type
		from information_schema.columns
		where table_schema = 'one_leave' and table_name = 'users'
		order by ordinal_position
	`);
	console.log("\none_leave.users columns:", cols.rows.map((r) => r.column_name).join(", "));

	const sample = await pool.query(`
		select u.id, u.username, left(u.password_hash, 20) as hash_prefix, u.is_active
		from one_leave.users u
		where u.is_active = true
		limit 3
	`);
	console.log("\nactive users sample:", sample.rows);

	const roles = await pool.query(`
		select ur.user_id, ur.role_code from one_leave.user_roles ur limit 5
	`);
	console.log("roles sample:", roles.rows);

	const nopparat = await pool.query(
		`
		select u.id, u.username, u.is_active
		from one_leave.users u
		where lower(u.username) = any($1::text[])
		`,
		[["nopparat.jap@mahidol.ac.th", "nopparat.jap@mahidol.edu"]]
	);
	console.log("\nnopparat user:", nopparat.rows);

	if (nopparat.rows[0]) {
		const roleRows = await pool.query(
			`select role_code from one_leave.user_roles where user_id = $1`,
			[nopparat.rows[0].id]
		);
		console.log(
			"nopparat roles:",
			roleRows.rows.map((r) => r.role_code)
		);
	}

	if (sample.rows[0]) {
		const row = await pool.query(`select password_hash from one_leave.users where id = $1`, [
			sample.rows[0].id,
		]);
		const hash = row.rows[0]?.password_hash;
		console.log("\nhash starts with $2:", hash?.startsWith("$2"));
	}
} catch (err) {
	console.error("\nDB error:", err.message);
	console.error(err);
} finally {
	await pool.end();
}
