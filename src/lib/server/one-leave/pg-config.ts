import type { PoolConfig } from "pg";

const DEFAULT_POOLER_TENANT = "your-tenant-id";

function poolerUsername(tenantId: string | undefined): string {
	const tenant = tenantId?.trim() || DEFAULT_POOLER_TENANT;
	return `postgres.${tenant}`;
}

function requiresSsl(connectionString: string, hostname: string): boolean {
	return (
		/\.supabase\.co$/i.test(hostname) ||
		/sslmode=require|verify-full|verify-ca/i.test(connectionString)
	);
}

export type LeavePgPoolOptions = {
	tenantId?: string;
	/** Override pooler user (skip postgres → postgres.tenant rewrite). */
	user?: string;
	host?: string;
	port?: string | number;
	/** Used when DATABASE_URL has no password segment. */
	password?: string;
};

/** Pool options aligned with scripts/lib/self-hosted-pg.mjs (Supavisor / Supabase). */
export function buildLeavePgPoolConfig(
	connectionString: string,
	options: LeavePgPoolOptions = {}
): PoolConfig {
	const url = new URL(connectionString);
	let user = options.user?.trim() || decodeURIComponent(url.username);
	if (!options.user && (user === "postgres" || user === `postgres.${DEFAULT_POOLER_TENANT}`)) {
		user = poolerUsername(options.tenantId);
	}
	const ssl = requiresSsl(connectionString, url.hostname) ? { rejectUnauthorized: false } : false;

	const password =
		options.password?.trim() || (url.password ? decodeURIComponent(url.password) : "");

	return {
		host: options.host?.trim() || url.hostname,
		port: Number(options.port ?? (url.port || "5432")),
		database: url.pathname.replace(/^\//, "") || "postgres",
		user,
		password,
		ssl,
		max: 10,
		keepAlive: true,
		idleTimeoutMillis: 30_000,
		connectionTimeoutMillis: 12_000,
	};
}
