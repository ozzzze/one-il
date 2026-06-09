/**
 * Reset one_leave.users password (bcrypt). Usage:
 *   node --env-file=.env scripts/reset-user-password.mjs nopparat.jap@mahidol.ac.th Demo@2569
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import bcrypt from "bcryptjs";
import { buildLeavePgPoolConfig } from "../src/lib/server/one-leave/pg-config.ts";

const BCRYPT_ROUNDS = 12;

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
const newPassword = process.argv[3];

if (!username || !newPassword) {
	console.error(
		"Usage: node --env-file=.env scripts/reset-user-password.mjs <username> <password>"
	);
	process.exit(1);
}

const env = loadEnvFile(new URL("../.env", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
if (!env.DATABASE_URL) {
	console.error("DATABASE_URL missing in .env");
	process.exit(1);
}

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
	const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
	const { rows } = await pool.query(
		`
		UPDATE one_leave.users
		SET
			password_hash = $2,
			must_change_password = false,
			password_changed_at = NOW(),
			updated_at = NOW()
		WHERE LOWER(username) = $1 AND is_active = true
		RETURNING id, username
		`,
		[username, hash]
	);

	if (rows.length === 0) {
		console.error("No active user found for:", username);
		process.exit(1);
	}

	const verify = await bcrypt.compare(newPassword, hash);
	console.log("Updated:", rows[0]);
	console.log("Verify bcrypt:", verify);
} catch (err) {
	console.error(err);
	process.exit(1);
} finally {
	await pool.end();
}
