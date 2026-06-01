import pg from "pg";
import { env } from "$env/dynamic/private";

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
	pool = new pg.Pool({ connectionString: url, max: 10, ssl: false });
	pool.on("error", (err: Error) => {
		console.error("[gateway pg pool]", err.message);
	});
	return pool;
}
