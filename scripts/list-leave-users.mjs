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
const pool = new pg.Pool(
	buildLeavePgPoolConfig(env.DATABASE_URL, {
		tenantId: env.POOLER_TENANT_ID,
		host: env.PG_HOST,
		port: env.PG_PORT,
		user: env.PG_USER,
		password: env.SELF_HOSTED_DB_PASSWORD,
	}),
);

try {
	const { rows } = await pool.query(`
		SELECT
			u.id,
			u.username,
			u.employee_id,
			u.must_change_password,
			COALESCE(array_agg(ur.role_code ORDER BY ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL), '{}') AS roles
		FROM one_leave.users AS u
		LEFT JOIN one_leave.user_roles AS ur ON ur.user_id = u.id
		WHERE u.is_active = true
		GROUP BY u.id
		ORDER BY u.id
	`);
	console.log(JSON.stringify(rows, null, 2));
} finally {
	await pool.end();
}
