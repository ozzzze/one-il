/**
 * Generate TypeScript types from self-hosted Postgres (VPS).
 *
 * Usage:
 *   node --env-file=.env scripts/gen-db-types.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
const outPath = resolve(root, "src/lib/database.types.ts");

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

const env = loadEnvFile(envPath);
const dbUrl = env.SELF_HOSTED_DATABASE_URL?.trim() || env.DATABASE_URL?.trim() || "";

if (!dbUrl) {
	console.error("Set DATABASE_URL or SELF_HOSTED_DATABASE_URL in .env");
	process.exit(1);
}

const output = execFileSync(
	"npx",
	["supabase", "gen", "types", "typescript", "--db-url", dbUrl, "--schema", "one_il"],
	{ encoding: "utf8", env: process.env, shell: true }
);

writeFileSync(outPath, output, "utf8");
console.log(`Wrote ${outPath}`);
