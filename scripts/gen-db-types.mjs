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
const dbUrl =
  env.SUPABASE_DB_URL?.trim() ||
  env.SELF_HOSTED_DATABASE_URL?.trim() ||
  env.DATABASE_URL?.trim() ||
  "";

if (!dbUrl) {
  console.error("Set SUPABASE_DB_URL, SELF_HOSTED_DATABASE_URL, or DATABASE_URL in .env");
  process.exit(1);
}

const supabaseArgs = [
  "gen",
  "types",
  "--lang",
  "typescript",
  "--db-url",
  dbUrl,
  "--schema",
  "public",
  "--schema",
  "one_il",
  "--schema",
  "one_leave",
];

let output;
const isWin = process.platform === "win32";
const supabaseCmd = isWin ? "supabase.cmd" : "supabase";
const runEnv = { ...process.env, PGSSLMODE: "disable" };

try {
  output = execFileSync(supabaseCmd, supabaseArgs, {
    encoding: "utf8",
    env: runEnv,
    shell: isWin,
  });
} catch (err) {
  const stderr =
    err instanceof Error && "stderr" in err
      ? String(/** @type {{ stderr?: Buffer }} */ (err).stderr ?? "")
      : "";
  const stdout =
    err instanceof Error && "stdout" in err
      ? String(/** @type {{ stdout?: Buffer }} */ (err).stdout ?? "")
      : "";
  const message = `${stderr}\n${stdout}`;
  if (/LegacyPlatformAuthRequiredError|Access token not provided/i.test(message)) {
    console.error(
      "Supabase gen types ต้องการ Docker Desktop บน PC\n" +
        "ใช้: pnpm db:types:remote (gen ผ่าน VPS SSH)\n",
    );
  }
  throw err;
}

writeFileSync(outPath, output, "utf8");
console.log(`Wrote ${outPath}`);
