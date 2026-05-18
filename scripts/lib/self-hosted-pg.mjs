/**
 * Build pg.Client options for self-hosted Supabase (Supavisor on 5432/6543).
 * @see https://supabase.com/docs/guides/self-hosting/docker#accessing-postgres
 */

const DEFAULT_POOLER_TENANT = "your-tenant-id";

export function isSelfHostedSupabaseUrl(url) {
	if (!url) return false;
	try {
		const host = new URL(url).hostname;
		return !/\.supabase\.co$/i.test(host);
	} catch {
		return true;
	}
}

export function poolerUsername(tenantId) {
	const tenant = tenantId?.trim() || DEFAULT_POOLER_TENANT;
	return `postgres.${tenant}`;
}

/**
 * @param {string} connectionString
 * @param {{ tenantId?: string }} [options]
 * @returns {import('pg').ClientConfig}
 */
export function pgClientConfigFromEnv(connectionString, options = {}) {
	const url = new URL(connectionString);
	const tenantId = options.tenantId?.trim() || DEFAULT_POOLER_TENANT;
	let user = decodeURIComponent(url.username);
	if (user === "postgres") {
		user = poolerUsername(tenantId);
	}
	const cloud =
		/\.supabase\.co/i.test(url.hostname) ||
		/sslmode=require|verify-full|verify-ca/i.test(connectionString);

	return {
		host: url.hostname,
		port: Number(url.port || "5432"),
		database: url.pathname.replace(/^\//, "") || "postgres",
		user,
		password: decodeURIComponent(url.password),
		ssl: cloud ? { rejectUnauthorized: false } : false,
		connectionTimeoutMillis: 12_000,
	};
}

export function redactPgConfig(config) {
	return `postgresql://${config.user}:***@${config.host}:${config.port}/${config.database}`;
}
