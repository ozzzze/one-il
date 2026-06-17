/**
 * Mark all local supabase/migrations as applied on remote (self-hosted VPS).
 *
 * Usage: node --env-file=.env scripts/supabase-repair-all.mjs
 */
import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migrationsDir = resolve(root, "supabase/migrations");

const versions = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => f.split("_")[0])
  .sort();

const isWin = process.platform === "win32";
const supabaseCmd = isWin ? "supabase.cmd" : "supabase";

for (const version of versions) {
  console.log(`repair ${version} ...`);
  try {
    execFileSync(
      "node",
      [
        "--env-file=.env",
        "scripts/supabase-db.mjs",
        "migration",
        "repair",
        "--status",
        "applied",
        version,
      ],
      { cwd: root, stdio: "inherit", shell: isWin },
    );
  } catch {
    console.error(`Failed on ${version}`);
    process.exit(1);
  }
}

console.log(`Repaired ${versions.length} migration(s).`);
