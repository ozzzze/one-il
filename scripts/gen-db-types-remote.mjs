/**
 * Generate database.types.ts via SSH on VPS (no Docker Desktop on PC).
 *
 * Usage: node --env-file=.env scripts/gen-db-types-remote.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outPath = resolve(root, "src/lib/database.types.ts");
const scriptPath = resolve(import.meta.dirname, "gen-db-types-vps.sh");

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

const env = loadEnvFile(resolve(root, ".env"));
const host = env.SSH_VPS_HOST;
const user = env.SSH_VPS_USER ?? "root";
const key = env.SSH_KEY_PATH;
const tenant = env.POOLER_TENANT_ID ?? "srv1663763";

if (!host || !key) {
  console.error("Set SSH_VPS_HOST and SSH_KEY_PATH in .env");
  process.exit(1);
}

const remoteScript = readFileSync(scriptPath, "utf8");
const remoteCmd = `POOLER_TENANT_ID=${tenant} bash -s`;

const output = execFileSync(
  "ssh",
  [
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=20",
    "-i",
    key,
    `${user}@${host}`,
    remoteCmd,
  ],
  {
    input: remoteScript,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  },
);

if (!output.includes("export type Json")) {
  console.error("Unexpected output from remote gen types:\n", output.slice(0, 500));
  process.exit(1);
}

writeFileSync(outPath, output, "utf8");
console.log(`Wrote ${outPath} (via VPS SSH)`);
