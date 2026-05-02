import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as schema from "./schema.js";

function readEnvFileValue(key: string): string | undefined {
	const envPath = resolve(process.cwd(), ".env");
	if (!existsSync(envPath)) return undefined;

	const contents = readFileSync(envPath, "utf8");
	for (const rawLine of contents.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;

		const index = line.indexOf("=");
		if (index === -1) continue;

		const name = line.slice(0, index).trim();
		if (name !== key) continue;

		let value = line.slice(index + 1).trim();
		const quoted =
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"));
		if (quoted) {
			value = value.slice(1, -1);
		}

		return value;
	}

	return undefined;
}

function resolveRawDatabaseUrl(): string {
	const fromEnv = process.env.DATABASE_URL?.trim() || readEnvFileValue("DATABASE_URL")?.trim();
	if (fromEnv) return fromEnv;

	const publicUrl = (
		process.env.PUBLIC_SUPABASE_URL ??
		readEnvFileValue("PUBLIC_SUPABASE_URL") ??
		""
	).replace(/\/$/, "");

	if (/supabase\.co/i.test(publicUrl)) {
		console.warn(
			"[db] DATABASE_URL is not set but PUBLIC_SUPABASE_URL looks like Supabase Cloud. " +
				"Add DATABASE_URL to .env. Falling back to local Supabase at 127.0.0.1:54322."
		);
	}

	return "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
}

function resolveTlsConnection(raw: string): { url: string; tls: boolean } {
	const trimmed = raw.trim();
	const sslEnv = process.env.DATABASE_SSL?.toLowerCase() ?? readEnvFileValue("DATABASE_SSL")?.toLowerCase();

	if (sslEnv === "disable") {
		return { url: trimmed, tls: false };
	}

	const hasSslModeParam = /(?:^|[?&])sslmode\s*=/i.test(trimmed);
	const sslModeRequiresTls =
		/(?:^|[?&])sslmode\s*=\s*(require|verify-full|verify-ca)/i.test(trimmed);

	if (sslEnv === "require" || sslModeRequiresTls) {
		let url = trimmed;
		if (!hasSslModeParam) {
			url += trimmed.includes("?") ? "&sslmode=require" : "?sslmode=require";
		}
		return { url, tls: true };
	}

	const looksLikeTlsHost = /supabase\.co|pooler\.supabase\.com|supabase\.net/i.test(trimmed);
	if (!looksLikeTlsHost) {
		return { url: trimmed, tls: false };
	}

	let url = trimmed;
	if (!hasSslModeParam) {
		url += trimmed.includes("?") ? "&sslmode=require" : "?sslmode=require";
	}

	return { url, tls: true };
}

const { url: connectionString, tls: useTls } = resolveTlsConnection(resolveRawDatabaseUrl());

const client = postgres(connectionString, {
	prepare: false,
	...(useTls ? { ssl: "require" as const } : {}),
});

export const db = drizzle(client, { schema });
