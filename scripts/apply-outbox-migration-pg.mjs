/**
 * Apply notifications_outbox migration via direct Postgres.
 * Uses DATABASE_URL, SELF_HOSTED_DATABASE_URL, or commented DATABASE_URL in .env
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function loadEnvFile(path) {
	const env = {};
	const candidates = [];
	for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
		const trimmed = line.trim();
		const dbMatch = trimmed.match(/^#?\s*DATABASE_URL=(.+)$/);
		if (dbMatch) candidates.push(dbMatch[1].trim());
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
	}
	return { env, candidates };
}

const root = resolve(import.meta.dirname, "..");
const { env, candidates } = loadEnvFile(resolve(root, ".env"));

const connectionStrings = [
	env.SELF_HOSTED_DATABASE_URL,
	env.DATABASE_URL,
	...candidates,
].filter(Boolean);

const supabaseHost = env.PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split(":")[0];
if (supabaseHost && candidates.length > 0) {
	const parsed = candidates[0].match(/postgresql:\/\/([^:]+):([^@]+)@/);
	if (parsed) {
		const [, user, pass] = parsed;
		connectionStrings.push(
			`postgresql://${user}:${pass}@${supabaseHost}:5432/postgres`,
			`postgresql://postgres:${pass}@${supabaseHost}:5432/postgres`,
		);
	}
}

const unique = [...new Set(connectionStrings)];
if (unique.length === 0) {
	console.error("No DATABASE_URL found in .env");
	process.exit(1);
}

const sql = readFileSync(
	resolve(root, "supabase/migrations/20260518140000_notifications_outbox.sql"),
	"utf8",
);

let connected = false;
for (const connectionString of unique) {
	const client = new pg.Client({ connectionString, connectionTimeoutMillis: 8_000 });
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
					usedHost: connectionString.replace(/:[^:@/]+@/, ":***@"),
				},
				null,
				2,
			),
		);
		connected = true;
		break;
	} catch {
		await client.end().catch(() => {});
	}
}

if (!connected) {
	console.error("Could not connect with any DATABASE_URL candidate");
	process.exit(1);
}
