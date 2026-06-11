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
const url = env.SELF_HOSTED_DATABASE_URL || env.DATABASE_URL;
if (!url) {
	console.error("No DATABASE_URL");
	process.exit(1);
}

const client = new pg.Client(pgClientConfigFromEnv(url, { tenantId: env.POOLER_TENANT_ID }));
await client.connect();
const tables = await client.query(`
  select table_schema, table_name
  from information_schema.tables
  where table_schema not in ('pg_catalog', 'information_schema')
  order by 1, 2
  limit 50
`);
const reg = await client.query(`
  select
    to_regclass('public.users') as public_users,
    to_regclass('public.menu_items') as menu_items,
    to_regclass('public.menu_groups') as menu_groups,
    to_regclass('public.notifications') as notifications,
    to_regclass('public.user_change_requests') as user_change_requests,
    current_database() as db,
    current_user as db_user
`);
const publicTables = await client.query(`
  select table_name from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by 1
`);
const oneLeaveUsers = await client.query(`
  select to_regclass('one_leave.users') as users,
         to_regclass('one_leave.system_change_requests') as scr
`);
const userCols = await client.query(`
  select column_name, data_type
  from information_schema.columns
  where table_schema = 'one_leave' and table_name = 'users'
  order by ordinal_position
`);
const employeesCols = await client.query(`
  select column_name, data_type
  from information_schema.columns
  where table_schema = 'one_leave' and table_name = 'employees'
  order by ordinal_position
`);
const funcs = await client.query(`
  select n.nspname as schema, p.proname as name
  from pg_proc p
  join pg_namespace n on p.pronamespace = n.oid
  where p.proname in ('has_admin_role', 'has_leave_manage_role')
  order by 1, 2
`);
await client.end();
console.log(
	JSON.stringify(
		{
			reg: reg.rows[0],
			oneLeaveUsers: oneLeaveUsers.rows[0],
			userCols: userCols.rows,
			publicTables: publicTables.rows.map((r) => r.table_name),
			employeesCols: employeesCols.rows,
			funcs: funcs.rows,
			sample: tables.rows.slice(0, 15),
		},
		null,
		2
	)
);
