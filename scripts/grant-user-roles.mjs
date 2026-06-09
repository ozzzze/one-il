/**
 * Grant one_leave.user_roles. Usage:
 *   node --env-file=.env scripts/grant-user-roles.mjs <username> admin hr_verifier
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

const username = process.argv[2]?.trim().toLowerCase();
const roles = process.argv
	.slice(3)
	.map((r) => r.trim())
	.filter(Boolean);

if (!username || roles.length === 0) {
	console.error("Usage: node --env-file=.env scripts/grant-user-roles.mjs <username> <role>...");
	process.exit(1);
}

const env = loadEnvFile(new URL("../.env", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const pool = new pg.Pool(
	buildLeavePgPoolConfig(env.DATABASE_URL, {
		tenantId: env.POOLER_TENANT_ID,
		host: env.PG_HOST,
		port: env.PG_PORT,
		user: env.PG_USER,
		password: env.SELF_HOSTED_DB_PASSWORD,
	})
);

try {
	const userRes = await pool.query(
		`SELECT id FROM one_leave.users WHERE LOWER(username) = $1 AND is_active = true`,
		[username]
	);
	const userId = userRes.rows[0]?.id;
	if (!userId) {
		console.error("User not found:", username);
		process.exit(1);
	}

	for (const role of roles) {
		await pool.query(
			`
			INSERT INTO one_leave.user_roles (user_id, role_code)
			VALUES ($1, $2)
			ON CONFLICT (user_id, role_code) DO NOTHING
			`,
			[userId, role]
		);
	}

	const { rows } = await pool.query(
		`SELECT role_code FROM one_leave.user_roles WHERE user_id = $1 ORDER BY role_code`,
		[userId]
	);
	console.log("Updated roles for", username, ":", rows.map((r) => r.role_code).join(", "));
} finally {
	await pool.end();
}
