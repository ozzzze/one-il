import { describe, expect, it } from "vitest";
import { buildLeavePgPoolConfig } from "./pg-config.js";

describe("buildLeavePgPoolConfig", () => {
	it("rewrites bare postgres user to pooler tenant", () => {
		const config = buildLeavePgPoolConfig(
			"postgresql://postgres:secret@187.77.137.14:5432/postgres",
			{ tenantId: "abc123" }
		);
		expect(config.user).toBe("postgres.abc123");
		expect(config.host).toBe("187.77.137.14");
		expect(config.ssl).toBe(false);
		expect(config.keepAlive).toBe(true);
	});

	it("enables ssl for Supabase Cloud", () => {
		const config = buildLeavePgPoolConfig(
			"postgresql://postgres:secret@db.foo.supabase.co:5432/postgres"
		);
		expect(config.ssl).toEqual({ rejectUnauthorized: false });
	});
});
