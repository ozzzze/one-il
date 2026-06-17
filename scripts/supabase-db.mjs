/**
 * Run Supabase CLI against self-hosted VPS (--db-url from .env).
 *
 * Usage:
 *   node --env-file=.env scripts/supabase-db.mjs migration list
 *   node --env-file=.env scripts/supabase-db.mjs db push
 *   node --env-file=.env scripts/supabase-db.mjs db query "select 1"
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

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

function resolveDbUrl(env) {
  const explicit = env.SUPABASE_DB_URL?.trim();
  if (explicit) return explicit;

  const base = env.SELF_HOSTED_DATABASE_URL?.trim();
  if (!base) return null;
  if (/sslmode=/i.test(base)) return base;
  return `${base}${base.includes("?") ? "&" : "?"}sslmode=disable`;
}

const cliArgs = process.argv.slice(2);
if (cliArgs.length === 0) {
  console.error(
    "Usage: node scripts/supabase-db.mjs <supabase-subcommand...>\n" +
      "Example: node scripts/supabase-db.mjs migration list",
  );
  process.exit(1);
}

const env = { ...process.env, ...loadEnvFile(resolve(root, ".env")) };
const dbUrl = resolveDbUrl(env);
if (!dbUrl) {
  console.error("Set SUPABASE_DB_URL or SELF_HOSTED_DATABASE_URL in .env");
  process.exit(1);
}

env.PGSSLMODE = "disable";

const isWin = process.platform === "win32";
const supabaseCmd = isWin ? "supabase.cmd" : "supabase";
const args = [...cliArgs, "--db-url", dbUrl];

try {
  execFileSync(supabaseCmd, args, {
    stdio: "inherit",
    env,
    cwd: root,
    shell: isWin,
  });
} catch (err) {
  const code = typeof err.status === "number" ? err.status : 1;
  process.exit(code);
}
