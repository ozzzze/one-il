/**
 * pool.ts — PostgreSQL adapter ที่ใช้ API เดิมของ mssql
 *
 * Compatibility layer: ให้ caller ใช้ pattern เดิม
 *   const pool = await getDbPool();
 *   const result = await pool.request().input('id', 42).query<Row>(sql);
 *   result.recordset  // Row[]
 *
 *   const tx = new sql.Transaction(pool);
 *   await tx.begin();
 *   await new sql.Request(tx).input('k', v).query(sql);
 *   await tx.commit();  /  await tx.rollback();
 *
 *   SQL translation (auto):
 *   [schema].[table]   →  schema.table
 *   @param             →  $N  (positional)
 *   TOP (N)            →  LIMIT N
 *   OUTPUT INSERTED.[col] → RETURNING col
 *   N'text'            →  'text'
 *   LIKE @p            →  LIKE $N
 *   SYSUTCDATETIME()   →  NOW()
 */

import pg from 'pg';
pg.types.setTypeParser(1082, (value) => value); // return DATE (OID 1082) as plain string to prevent timezone offset shifts
import { env } from '$env/dynamic/private';
import { buildLeavePgPoolConfig } from '$lib/server/one-leave/pg-config.js';

// ─── connection pool ──────────────────────────────────────────────────────────

let pgPool: pg.Pool | null = null;

function getPgPool(): pg.Pool {
	if (pgPool) return pgPool;

	const url = env.DATABASE_URL?.trim() ?? '';

	if (url.startsWith('sqlserver://') || !url) {
		const host = env.PG_HOST ?? '187.77.137.14';
		const port = env.PG_PORT ?? '5432';
		const syntheticUrl = `postgresql://postgres@${host}:${port}/postgres`;
		pgPool = new pg.Pool(
			buildLeavePgPoolConfig(syntheticUrl, {
				tenantId: env.POOLER_TENANT_ID,
				host: env.PG_HOST,
				port: env.PG_PORT,
				user: env.PG_USER,
				password: env.SELF_HOSTED_DB_PASSWORD ?? env.PG_PASSWORD
			})
		);
	} else {
		if (url.includes('your-tenant-id')) {
			console.error(
				'[one-leave pg] DATABASE_URL uses placeholder your-tenant-id — set POOLER_TENANT_ID in .env (root) or postgres.<tenant> in the URL'
			);
		}
		pgPool = new pg.Pool(
			buildLeavePgPoolConfig(url, {
				tenantId: env.POOLER_TENANT_ID,
				host: env.PG_HOST,
				port: env.PG_PORT,
				user: env.PG_USER,
				password: env.SELF_HOSTED_DB_PASSWORD ?? env.PG_PASSWORD
			})
		);
	}

	pgPool.on('error', (err) => {
		console.error('[pg pool error]', err.message);
	});

	return pgPool;
}

// ─── SQL translation ──────────────────────────────────────────────────────────

function translateSql(
	mssql: string,
	inputs: Map<string, unknown>
): { text: string; values: unknown[]; rowCountAlias: string | null } {
	let text = mssql;

	// Strip N'...' prefix
	text = text.replace(/\bN'((?:[^']|'')*)'/g, "'$1'");

	// [schema].[table] → schema.table, [col] → "col"
	text = text.replace(/\[(\w+)\]\.\[(\w+)\]/g, '$1.$2');
	text = text.replace(/\[(\w+)\]/g, '"$1"');

	// TOP (N) / TOP N → mark for later
	text = text.replace(/\bTOP\s*\(\s*(\d+)\s*\)/gi, '/*TOP:$1*/');
	text = text.replace(/\bTOP\s+(\d+)\b/gi, '/*TOP:$1*/');

	// OUTPUT INSERTED.[col] or OUTPUT INSERTED.col → extract and append to end
	const outputMatch = text.match(/\bOUTPUT\s+INSERTED\.(?:"?(\w+)"?)/i);
	if (outputMatch) {
		const col = outputMatch[1];
		text = text.replace(/\bOUTPUT\s+INSERTED\.(?:"?\w+"?)/gi, '');
		text = text.trimEnd().replace(/;?\s*$/, '') + ` RETURNING "${col}"`;
	}

	// SYSUTCDATETIME() → NOW()
	text = text.replace(/\bSYSUTCDATETIME\(\)/gi, 'NOW()');

	// ISNULL(x, y) → COALESCE(x, y)
	text = text.replace(/\bISNULL\s*\(/gi, 'COALESCE(');

	// LTRIM(RTRIM(...)) → TRIM(...)
	text = text.replace(/\bLTRIM\s*\(\s*RTRIM\s*\(([^)]+)\)\s*\)/gi, 'TRIM($1)');

	// LEN(str) → LENGTH(str)
	text = text.replace(/\bLEN\s*\(/gi, 'LENGTH(');

	// OFFSET ... ROWS FETCH NEXT ... ROWS ONLY → LIMIT ... OFFSET ...
	text = text.replace(
		/OFFSET\s+\$(\d+)\s+ROWS?\s+FETCH\s+NEXT\s+\$(\d+)\s+ROWS?\s+ONLY/gi,
		'LIMIT $$2 OFFSET $$1'
	);

	// Replace @param with $N
	const values: unknown[] = [];
	const paramIndex = new Map<string, number>();

	text = text.replace(/@(\w+)/g, (_match, name: string) => {
		const key = name.toLowerCase();
		if (!paramIndex.has(key)) {
			let val: unknown = undefined;
			for (const [k, v] of inputs) {
				if (k.toLowerCase() === key) {
					val = v;
					break;
				}
			}
			values.push(val ?? null);
			paramIndex.set(key, values.length);
		}
		return `$${paramIndex.get(key)}`;
	});

	// Handle /*TOP:N*/
	const topMatch = [...text.matchAll(/\/\*TOP:(\d+)\*\//g)];
	if (topMatch.length > 0) {
		const n = topMatch[topMatch.length - 1][1];
		text = text.replace(/\/\*TOP:\d+\*\//g, '');
		text = text.trimEnd().replace(/;?\s*$/, '') + ` LIMIT ${n}`;
	}

	// @@ROWCOUNT → handled via special marker
	const hasRowCount = /SELECT\s+@@ROWCOUNT\s+AS\s+(\w+)/i.test(text);
	const rowCountAlias = hasRowCount
		? (text.match(/SELECT\s+@@ROWCOUNT\s+AS\s+(\w+)/i)?.[1] ?? 'n')
		: null;
	if (hasRowCount) {
		text = text.replace(/;?\s*SELECT\s+@@ROWCOUNT\s+AS\s+\w+\s*;?/gi, '');
	}

	// ─── Boolean column auto-translation ─────────────────────────────────────
	const BOOL_COLS = new Set([
		'enabled', 'send_empty_batch', 'skip_non_working_days',
		'is_active', 'secure',
		'has_teacher_license', 'is_office_unit_head',
		'is_closed', 'is_current',
		'health_data_consent', 'is_half_day', 'urgent_flag',
		'deducts_quota', 'mvp_enabled', 'requires_reason',
		'success',
		'post_review_required',
		'must_change_password',
	]);

	text = text.replace(/"(\w+)"\s*=\s*(0|1)\b/g, (_m, col: string, val: string) => {
		if (BOOL_COLS.has(col)) {
			return `"${col}" = ${val === '1' ? 'true' : 'false'}`;
		}
		return _m;
	});

	text = text.replace(/\b(\w+)\s*=\s*(0|1)\b/g, (_m, col: string, val: string) => {
		if (BOOL_COLS.has(col)) {
			return `${col} = ${val === '1' ? 'true' : 'false'}`;
		}
		return _m;
	});

	return { text, values, rowCountAlias };
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface RecordSet<T> extends Array<T> {}

export interface IResult<T> {
	recordset: RecordSet<T>;
	rowsAffected: number[];
}

// ─── PgTransaction ──────────────────────────────────────────────────────────

export class PgTransaction {
	private client: pg.PoolClient | null = null;
	private _pool: PgConnectionPool;

	constructor(pool: PgConnectionPool) {
		this._pool = pool;
	}

	async begin(): Promise<void> {
		this.client = await this._pool._pgPool.connect();
		await this.client.query('BEGIN');
	}

	async commit(): Promise<void> {
		if (!this.client) throw new Error('Transaction not started');
		await this.client.query('COMMIT');
		this.client.release();
		this.client = null;
	}

	async rollback(): Promise<void> {
		if (!this.client) return;
		try {
			await this.client.query('ROLLBACK');
		} finally {
			this.client?.release();
			this.client = null;
		}
	}

	get _client(): pg.PoolClient {
		if (!this.client) throw new Error('Transaction not started — call begin() first');
		return this.client;
	}
}

// ─── PgConnectionPool ────────────────────────────────────────────────────────

export class PgConnectionPool {
	readonly _pgPool: pg.Pool;

	constructor(pool: pg.Pool) {
		this._pgPool = pool;
	}

	get connected(): boolean {
		return true;
	}

	request(): PgRequest {
		return new PgRequest(this._pgPool);
	}

	async close(): Promise<void> {
		await this._pgPool.end();
	}
}

// ─── PgRequest ──────────────────────────────────────────────────────────────

export class PgRequest {
	private inputs = new Map<string, unknown>();
	private _client: pg.PoolClient | pg.Pool;

	constructor(client: pg.PoolClient | pg.Pool | PgTransaction | PgConnectionPool) {
		if (client instanceof PgTransaction) {
			this._client = client._client;
		} else if (client instanceof PgConnectionPool) {
			this._client = client._pgPool;
		} else {
			this._client = client;
		}
	}

	input(name: string, typeOrValue?: unknown, value?: unknown): this {
		const actualValue = value !== undefined ? value : typeOrValue;
		this.inputs.set(name, actualValue);
		return this;
	}

	async query<T = Record<string, unknown>>(mssqlSql: string): Promise<IResult<T>> {
		const { text, values, rowCountAlias } = translateSql(mssqlSql, this.inputs);
		try {
			const res = await (this._client as pg.Pool | pg.PoolClient).query(text, values);
			const rowCount = res.rowCount ?? 0;
			let rows = (res.rows ?? []) as unknown as RecordSet<T>;
			if (rowCountAlias && rows.length === 0) {
				rows = [{ [rowCountAlias]: rowCount } as unknown as T] as unknown as RecordSet<T>;
			}
			return {
				recordset: rows,
				rowsAffected: [rowCount],
			};
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`[pg query error] ${msg}\n  SQL: ${text.slice(0, 400)}`);
		}
	}
}

// ─── sql namespace shim ──────────────────────────────────────────────────────

export const sql = {
	Transaction: PgTransaction,
	Request: PgRequest,
	DateTime2: 'datetime2' as const,
	NVarChar: 'nvarchar' as const,
	Int: 'int' as const,
	BigInt: 'bigint' as const,
	Bit: 'bit' as const,
	Decimal: 'decimal' as const,
	Date: 'date' as const,
	VarChar: 'varchar' as const,
	RequestError: class RequestError extends Error {
		precedingErrors?: Array<{ message?: string }>;
	},
};

export type Transaction = PgTransaction;
export type ConnectionPool = PgConnectionPool;
export type Request = PgRequest;

// ─── Public API ───────────────────────────────────────────────────────────────

let _pool: PgConnectionPool | null = null;

export async function getDbPool(): Promise<PgConnectionPool> {
	if (_pool) return _pool;
	const raw = getPgPool();
	const client = await raw.connect();
	client.release();
	_pool = new PgConnectionPool(raw);
	return _pool;
}

export async function closeDbPool(): Promise<void> {
	if (_pool) {
		await _pool.close();
		_pool = null;
		pgPool = null;
	}
}

export default sql;
