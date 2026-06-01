import { readFileSync } from "node:fs";
import pg from "pg";
import { pgClientConfigFromEnv } from "./lib/self-hosted-pg.mjs";

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
const client = new pg.Client(pgClientConfigFromEnv(env.DATABASE_URL));
await client.connect();
const cols = await client.query(`
  select column_name from information_schema.columns
  where table_schema = 'auth' and table_name = 'users'
  order by ordinal_position
`);
const userCols = await client.query(`
  select column_name, data_type from information_schema.columns
  where table_schema = 'one_leave' and table_name = 'users'
  order by ordinal_position
`);
const roleCols = await client.query(`
  select column_name, data_type from information_schema.columns
  where table_schema = 'one_leave' and table_name = 'user_roles'
  order by ordinal_position
`);
const roleCodes = await client.query(`
  select distinct role_code from one_leave.user_roles order by 1 limit 20
`);
await client.end();
console.log({
	authUserCols: cols.rows.map((r) => r.column_name),
	userCols: userCols.rows,
	roleCols: roleCols.rows,
	roleCodes: roleCodes.rows,
});
