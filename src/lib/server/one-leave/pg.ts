import pg from "pg";
import type { QueryResult, QueryResultRow } from "pg";
import { env } from "$env/dynamic/private";
import { buildLeavePgPoolConfig } from "$lib/server/one-leave/pg-config.js";
import { isTransientPgError } from "$lib/server/one-leave/pg-errors.js";

let pool: pg.Pool | null = null;

function stripQuotes(value: string): string {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function connectionString(): string {
	const raw = env.DATABASE_URL?.trim() ?? "";
	return raw ? stripQuotes(raw) : "";
}

export function getLeavePgPool(): pg.Pool {
	if (pool) return pool;
	const url = connectionString();
	if (!url) {
		throw new Error("DATABASE_URL is required for one-leave auth (gateway)");
	}
	if (url.includes("your-tenant-id")) {
		console.error(
			"[gateway pg] DATABASE_URL still uses placeholder your-tenant-id — set POOLER_TENANT_ID (VPS supabase/docker/.env) or postgres.<tenant> in the URL",
		);
	}
	pool = new pg.Pool(
		buildLeavePgPoolConfig(url, {
			tenantId: env.POOLER_TENANT_ID,
			host: env.PG_HOST,
			port: env.PG_PORT,
			user: env.PG_USER,
			password: env.SELF_HOSTED_DB_PASSWORD,
		}),
	);
	pool.on("error", (err: Error) => {
		console.error("[gateway pg pool]", err.message);
	});
	return pool;
}

export async function withPgRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
	let last: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn();
		} catch (err) {
			last = err;
			if (i + 1 >= attempts || !isTransientPgError(err)) throw err;
			console.warn(
				"[gateway pg] transient error, retrying",
				err instanceof Error ? err.message : err,
			);
		}
	}
	throw last;
}

export async function leaveQuery<R extends QueryResultRow>(
	text: string,
	params?: unknown[],
): Promise<QueryResult<R>> {
	return withPgRetry(() => getLeavePgPool().query<R>(text, params));
}

/**
 * Run `fn` inside a single transaction with one dedicated client. Commits on
 * success, rolls back on any thrown error. Use for multi-statement admin
 * mutations (user + roles + audit) that must be atomic.
 */
export async function withLeaveTransaction<T>(
	fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
	const client = await getLeavePgPool().connect();
	try {
		await client.query("BEGIN");
		const result = await fn(client);
		await client.query("COMMIT");
		return result;
	} catch (err) {
		await client.query("ROLLBACK").catch(() => {});
		throw err;
	} finally {
		client.release();
	}
}
