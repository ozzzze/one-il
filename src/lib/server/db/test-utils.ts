import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema.js";
import { randomUUID } from "node:crypto";
import { vi } from "vitest";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

const BOOTSTRAP_SQL = `
CREATE TABLE users (
	id UUID PRIMARY KEY NOT NULL,
	email TEXT NOT NULL UNIQUE,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT,
	name TEXT NOT NULL,
	avatar_url TEXT,
	role TEXT NOT NULL DEFAULT 'viewer',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE sessions (
	id TEXT PRIMARY KEY NOT NULL,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at BIGINT NOT NULL,
	user_agent TEXT,
	ip_address TEXT,
	created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE pages (
	id TEXT PRIMARY KEY NOT NULL,
	title TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	content TEXT NOT NULL DEFAULT '',
	template TEXT NOT NULL DEFAULT 'default',
	status TEXT NOT NULL DEFAULT 'draft',
	author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	published_at TIMESTAMPTZ
);
CREATE TABLE notifications (
	id TEXT PRIMARY KEY NOT NULL,
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	message TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'info',
	"read" BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE password_reset_tokens (
	id TEXT PRIMARY KEY NOT NULL,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token_hash TEXT NOT NULL,
	expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE oauth_accounts (
	id TEXT PRIMARY KEY NOT NULL,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	provider TEXT NOT NULL,
	provider_user_id TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE(provider, provider_user_id)
);
CREATE TABLE app_settings (
	key TEXT PRIMARY KEY NOT NULL,
	value TEXT NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function createTestDb() {
	const client = new PGlite();
	await client.exec(BOOTSTRAP_SQL);
	return drizzle(client, { schema });
}

export async function createTestUser(
	db: Awaited<ReturnType<typeof createTestDb>>,
	overrides: Partial<{
		id: string;
		name: string;
		email: string;
		username: string;
		role: "admin" | "editor" | "viewer";
	}> = {}
) {
	const id = overrides.id ?? randomUUID();

	await db.insert(schema.users).values({
		id,
		name: overrides.name ?? "Test User",
		email: overrides.email ?? `${id.slice(0, 8)}@test.com`,
		username: overrides.username ?? `user_${id.slice(0, 8)}`,
		passwordHash: null,
		role: overrides.role ?? "viewer",
	});

	return id;
}

export function createMockLocals(userId: string, role: string = "admin") {
	const session = {
		access_token: "test-access-token",
		refresh_token: "",
		expires_in: 3600,
		expires_at: Math.floor(Date.now() / 1000) + 3600,
		token_type: "bearer",
		user: { id: userId },
	} as Session;

	return {
		supabase: {
			auth: {
				getSession: vi.fn(async () => ({ data: { session }, error: null })),
				getUser: vi.fn(async () => ({
					data: { user: { id: userId, email: "test@test.com" } },
					error: null,
				})),
				signInWithPassword: vi.fn(async () => ({ error: null })),
				updateUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })),
			},
		} as unknown as SupabaseClient,
		user: {
			id: userId,
			name: "Test User",
			email: "test@test.com",
			username: "testuser",
			role,
			avatarUrl: null as string | null,
		},
		session,
	};
}

export function createFormData(entries: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(entries)) {
		fd.set(key, value);
	}
	return fd;
}

export function createMockRequest(formData: FormData): Request {
	return new Request("http://localhost", {
		method: "POST",
		body: formData,
	});
}
