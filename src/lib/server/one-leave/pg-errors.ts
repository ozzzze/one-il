const TRANSIENT_NODE_CODES = new Set([
	"ECONNRESET",
	"ETIMEDOUT",
	"ECONNREFUSED",
	"EPIPE",
	"ENOTFOUND",
]);

const TRANSIENT_PG_CODES = new Set(["57P01", "08006", "08003", "08001", "53300"]);

function errorCode(err: unknown): string | undefined {
	if (!(err instanceof Error)) return undefined;
	const code = (err as Error & { code?: string }).code;
	return typeof code === "string" ? code : undefined;
}

export function isTransientPgError(err: unknown): boolean {
	const code = errorCode(err);
	if (code && (TRANSIENT_NODE_CODES.has(code) || TRANSIENT_PG_CODES.has(code))) {
		return true;
	}
	if (!(err instanceof Error)) return false;
	const msg = err.message.toLowerCase();
	return (
		msg.includes("econnreset") ||
		msg.includes("connection terminated") ||
		msg.includes("connection error") ||
		msg.includes("socket hang up")
	);
}

/** Map low-level DB/network errors to a safe user-facing message. */
export function userFacingDbError(err: unknown, fallback: string): string {
	if (isTransientPgError(err)) return fallback;
	console.error("[gateway pg]", err);
	return fallback;
}
